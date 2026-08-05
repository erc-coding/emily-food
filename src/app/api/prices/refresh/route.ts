import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchKrogerProductPrice } from "@/lib/kroger";

type Food = { name: string; brand: string | null };
type Store = {
  name: string;
  location: string | null;
  kroger_location_id: string | null;
};

type PriceResult = { price: number | null; notes: string; aisle: string | null };

// Only Kroger publishes a real public pricing API. Tom Thumb (Albertsons) and
// Sprouts have no public equivalent and block automated access to their own
// sites, so prices for those stores are entered by hand via the price editor
// rather than guessed at from web search.
async function lookupPriceViaKroger(food: Food, store: Store): Promise<PriceResult> {
  const term = food.brand ? `${food.brand} ${food.name}` : food.name;
  const result = await searchKrogerProductPrice(term, store.kroger_location_id!);

  if (!result) {
    return {
      price: null,
      notes: `No match found in Kroger's catalog for "${term}" at this store.`,
      aisle: null,
    };
  }

  return {
    price: result.price,
    notes:
      result.price !== null
        ? `Kroger catalog: ${result.description}`
        : `Found "${result.description}" but no price listed.`,
    aisle: result.aisle,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { food_store_id } = await request.json();
  if (!food_store_id) {
    return NextResponse.json({ error: "food_store_id is required" }, { status: 400 });
  }

  const { data: foodStore, error: fsError } = await supabase
    .from("food_stores")
    .select("id, food_id, store_id, foods(name, brand), stores(name, location, kroger_location_id)")
    .eq("id", food_store_id)
    .single();

  if (fsError || !foodStore) {
    return NextResponse.json({ error: "food_store not found" }, { status: 404 });
  }

  const food = foodStore.foods as unknown as Food;
  const store = foodStore.stores as unknown as Store;

  if (!store.kroger_location_id) {
    return NextResponse.json(
      {
        error: `${store.name} has no automated price source — enter the price with Edit instead.`,
      },
      { status: 400 }
    );
  }

  let result: PriceResult;
  try {
    result = await lookupPriceViaKroger(food, store);
  } catch (err) {
    console.error("Kroger API lookup failed:", err);
    return NextResponse.json(
      { error: "Kroger price lookup failed. Try again, or enter the price with Edit." },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from("food_stores")
    .update({
      last_known_price: result.price,
      last_checked_at: new Date().toISOString(),
      notes: result.notes,
      aisle: result.aisle,
    })
    .eq("id", food_store_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(result);
}
