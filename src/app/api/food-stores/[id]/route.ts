import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const { price, notes, aisle } = (await request.json()) as {
    price: number | null;
    notes: string;
    aisle: string | null;
  };

  const { error } = await supabase
    .from("food_stores")
    .update({
      last_known_price: price,
      notes,
      aisle,
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ price, notes, aisle });
}
