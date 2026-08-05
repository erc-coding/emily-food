"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateStoreLocation(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const location = (formData.get("location") as string).trim() || null;
  const website_url = (formData.get("website_url") as string).trim() || null;

  const { error } = await supabase
    .from("stores")
    .update({ location, website_url })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/stores");
}

export async function setKrogerLocation(formData: FormData) {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const kroger_location_id = (formData.get("kroger_location_id") as string) || null;

  const { error } = await supabase
    .from("stores")
    .update({ kroger_location_id })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/stores");
}
