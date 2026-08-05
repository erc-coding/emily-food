"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function upsertInventory(formData: FormData) {
  const supabase = await createClient();

  const food_id = formData.get("food_id") as string;
  const quantity = Number(formData.get("quantity"));
  const unit = (formData.get("unit") as string) || "count";

  if (!food_id || Number.isNaN(quantity)) {
    throw new Error("Invalid inventory update.");
  }

  const { error } = await supabase
    .from("inventory")
    .upsert(
      { food_id, quantity, unit, last_updated_at: new Date().toISOString() },
      { onConflict: "food_id" }
    );

  if (error) throw new Error(error.message);

  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/foods");
}

export async function removeInventory(formData: FormData) {
  const supabase = await createClient();
  const food_id = formData.get("food_id") as string;

  const { error } = await supabase.from("inventory").delete().eq("food_id", food_id);
  if (error) throw new Error(error.message);

  revalidatePath("/inventory");
  revalidatePath("/");
  revalidatePath("/foods");
}
