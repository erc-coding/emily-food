import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import { searchKrogerProductPrice } from "@/lib/kroger";

type Food = { name: string; brand: string | null };
type Store = {
  name: string;
  location: string | null;
  website_url: string | null;
  kroger_location_id: string | null;
};

type PriceResult = { price: number | null; notes: string; aisle?: string | null };

async function lookupPriceViaKroger(food: Food, store: Store): Promise<PriceResult | null> {
  if (!store.kroger_location_id) return null;

  const term = food.brand ? `${food.brand} ${food.name}` : food.name;
  const result = await searchKrogerProductPrice(term, store.kroger_location_id);

  if (!result) {
    return {
      price: null,
      notes: `No match found in Kroger's catalog for "${term}" at this store.`,
      aisle: null,
    };
  }

  return {
    price: result.price,
    notes: result.price !== null ? `Kroger catalog: ${result.description}` : `Found "${result.description}" but no price listed.`,
    aisle: result.aisle,
  };
}

async function lookupPriceViaAI(food: Food, store: Store): Promise<PriceResult> {
  const prompt = store.website_url
    ? `Look up the current price of this product at this store using its own website:

Product: ${food.name}${food.brand ? ` (brand: ${food.brand})` : ""}
Store: ${store.name}${store.location ? ` — ${store.location}` : ""}
Store URL: ${store.website_url}

Fetch the store URL above first (it's this specific store's own page/catalog), then look for this product on that site — follow links or search within the site if needed. Only use general web search as a fallback if the store's own site doesn't have a findable price. Do not use a price from a different store's listing.

If price is null, "notes" must briefly explain what you tried and why it didn't work — never leave it as a placeholder or single character.`
    : `Look up the current price of this product at this specific store location using web search:

Product: ${food.name}${food.brand ? ` (brand: ${food.brand})` : ""}
Store: ${store.name}${store.location ? ` — ${store.location}` : " (no specific location on file — general lookup only)"}

Many grocery chains (Kroger, Tom Thumb, Sprouts, etc.) only show prices once you're browsing a specific store's online catalog. If a store location is given above, try to find that store's own site/app catalog page for this product (search e.g. "${store.name} ${store.location ?? ""} weekly ad ${food.name}" or check if the chain's site lets you set a store by zip/address and view the product page), or check a delivery service like Instacart that shows per-store pricing. If you still can't find a store-specific price, it's fine to report null — do not guess or use a price found for a different store's listing.

If price is null, "notes" must briefly explain what you tried and why it didn't work (e.g. "Kroger's site requires a store login to show pricing" or "no product page found for this brand at this store") — never leave it as a placeholder or single character.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: {
      effort: "low",
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            price: {
              anyOf: [{ type: "number" }, { type: "null" }],
              description: "The price in USD, or null if no store-specific price was found",
            },
            notes: {
              type: "string",
              description: "If price was found: a short note like 'on sale' or 'seasonal', or empty string. If price is null: a brief explanation (at least one full sentence) of what was searched and why no store-specific price was found.",
            },
          },
          required: ["price", "notes"],
          additionalProperties: false,
        },
      },
    },
    tools: [
      { type: "web_search_20260209", name: "web_search", max_uses: 3 },
      { type: "web_fetch_20260209", name: "web_fetch", max_uses: 3 },
    ],
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const rawText = textBlock && textBlock.type === "text" ? textBlock.text : "";

  try {
    const parsed = JSON.parse(rawText);
    return {
      price: typeof parsed.price === "number" ? parsed.price : null,
      notes: typeof parsed.notes === "string" ? parsed.notes : "",
    };
  } catch {
    return { price: null, notes: "Could not parse price lookup result." };
  }
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
    .select("id, food_id, store_id, foods(name, brand), stores(name, location, website_url, kroger_location_id)")
    .eq("id", food_store_id)
    .single();

  if (fsError || !foodStore) {
    return NextResponse.json({ error: "food_store not found" }, { status: 404 });
  }

  const food = foodStore.foods as unknown as Food;
  const store = foodStore.stores as unknown as Store;

  let result: PriceResult | null = null;

  if (store.kroger_location_id) {
    try {
      result = await lookupPriceViaKroger(food, store);
    } catch (err) {
      // Kroger API failed (bad credentials, rate limit, etc.) — fall back to AI lookup below.
      console.error("Kroger API lookup failed, falling back to AI:", err);
    }
  }

  if (!result) {
    result = await lookupPriceViaAI(food, store);
  }

  // AI-based lookups don't know the physical aisle, so `aisle` stays
  // undefined for them — only include it in the update when a Kroger
  // lookup actually ran, leaving any previously-known aisle untouched.
  const updatePayload: Record<string, unknown> = {
    last_known_price: result.price,
    last_checked_at: new Date().toISOString(),
    notes: result.notes,
  };
  if (result.aisle !== undefined) {
    updatePayload.aisle = result.aisle;
  }

  const { error: updateError } = await supabase
    .from("food_stores")
    .update(updatePayload)
    .eq("id", food_store_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json(result);
}
