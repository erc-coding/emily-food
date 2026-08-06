"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The drive-through select carries three states: "" (not known yet, stored
// as null), "yes", and "no".
function parseDriveThrough(raw: FormDataEntryValue | null): boolean | null {
  if (raw === "yes") return true;
  if (raw === "no") return false;
  return null;
}

function parseVisitStatus(raw: FormDataEntryValue | null): "tried" | "want_to_try" {
  return raw === "tried" ? "tried" : "want_to_try";
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createRestaurant(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const allergen_menu_url = (formData.get("allergen_menu_url") as string)?.trim() || null;
  const safety_notes = (formData.get("safety_notes") as string) || null;
  const has_drive_through = parseDriveThrough(formData.get("has_drive_through"));
  const visit_status = parseVisitStatus(formData.get("visit_status"));
  const tags = parseTags((formData.get("tags") as string) || "");

  if (!name?.trim()) {
    return { error: "Name is required." };
  }

  const { error } = await supabase
    .from("restaurants")
    .insert({ name, allergen_menu_url, safety_notes, has_drive_through, visit_status, tags });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/restaurants");
  redirect("/restaurants");
}

export async function updateRestaurant(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const allergen_menu_url = (formData.get("allergen_menu_url") as string)?.trim() || null;
  const safety_notes = (formData.get("safety_notes") as string) || null;
  const has_drive_through = parseDriveThrough(formData.get("has_drive_through"));
  const visit_status = parseVisitStatus(formData.get("visit_status"));
  const tags = parseTags((formData.get("tags") as string) || "");

  if (!name?.trim()) {
    return { error: "Name is required." };
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ name, allergen_menu_url, safety_notes, has_drive_through, visit_status, tags })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/restaurants");
  revalidatePath(`/restaurants/${id}`);
  redirect("/restaurants");
}

export async function deleteRestaurant(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("restaurants").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/restaurants");
  redirect("/restaurants");
}
