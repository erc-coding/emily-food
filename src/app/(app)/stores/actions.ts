"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
