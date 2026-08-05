"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createFood(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const brand = (formData.get("brand") as string) || null;
  const category = (formData.get("category") as string) || null;
  const safety_notes = (formData.get("safety_notes") as string) || null;
  const dietary_tags = parseTags((formData.get("dietary_tags") as string) || "");
  const photo_url = (formData.get("photo_url") as string)?.trim() || null;
  const storeIds = formData.getAll("store_ids") as string[];

  if (!name?.trim()) {
    return { error: "Name is required." };
  }

  const { data: food, error } = await supabase
    .from("foods")
    .insert({ name, brand, category, safety_notes, dietary_tags, photo_url })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  if (storeIds.length > 0) {
    const rows = storeIds.map((store_id) => {
      const priceRaw = (formData.get(`price_${store_id}`) as string)?.trim();
      const aisle = (formData.get(`aisle_${store_id}`) as string)?.trim() || null;
      const last_known_price = priceRaw ? Number(priceRaw) : null;
      return {
        food_id: food.id,
        store_id,
        last_known_price,
        aisle,
        last_checked_at: last_known_price !== null || aisle !== null ? new Date().toISOString() : null,
      };
    });
    const { error: fsError } = await supabase.from("food_stores").insert(rows);
    if (fsError) {
      return { error: fsError.message };
    }
  }

  const quantityRaw = (formData.get("quantity") as string)?.trim();
  if (quantityRaw) {
    const unit = (formData.get("unit") as string) || "count";
    const { error: invError } = await supabase
      .from("inventory")
      .insert({ food_id: food.id, quantity: Number(quantityRaw), unit });
    if (invError) {
      return { error: invError.message };
    }
  }

  revalidatePath("/foods");
  revalidatePath("/inventory");
  revalidatePath("/stores");
  revalidatePath("/");
  redirect("/foods");
}

export async function updateFood(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const brand = (formData.get("brand") as string) || null;
  const category = (formData.get("category") as string) || null;
  const safety_notes = (formData.get("safety_notes") as string) || null;
  const dietary_tags = parseTags((formData.get("dietary_tags") as string) || "");
  const photo_url = (formData.get("photo_url") as string)?.trim() || null;
  const storeIds = formData.getAll("store_ids") as string[];

  if (!name?.trim()) {
    return { error: "Name is required." };
  }

  const { error } = await supabase
    .from("foods")
    .update({ name, brand, category, safety_notes, dietary_tags, photo_url })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Only add/remove the stores that actually changed, so existing
  // food_stores rows (and their fetched price/notes/timestamp) for stores
  // that stay checked are left untouched.
  const { data: existing, error: existingError } = await supabase
    .from("food_stores")
    .select("store_id")
    .eq("food_id", id);
  if (existingError) {
    return { error: existingError.message };
  }

  const existingStoreIds = new Set((existing ?? []).map((row) => row.store_id));
  const nextStoreIds = new Set(storeIds);

  const toRemove = [...existingStoreIds].filter((sid) => !nextStoreIds.has(sid));
  const toAdd = [...nextStoreIds].filter((sid) => !existingStoreIds.has(sid));

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("food_stores")
      .delete()
      .eq("food_id", id)
      .in("store_id", toRemove);
    if (deleteError) {
      return { error: deleteError.message };
    }
  }

  if (toAdd.length > 0) {
    const rows = toAdd.map((store_id) => ({ food_id: id, store_id }));
    const { error: fsError } = await supabase.from("food_stores").insert(rows);
    if (fsError) {
      return { error: fsError.message };
    }
  }

  revalidatePath("/foods");
  revalidatePath(`/foods/${id}`);
  revalidatePath("/");
  redirect("/foods");
}

export async function deleteFood(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("foods").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/foods");
  revalidatePath("/");
  redirect("/foods");
}
