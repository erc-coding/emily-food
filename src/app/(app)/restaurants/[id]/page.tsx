import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { googleMapsSearchUrl } from "@/lib/maps";
import type { Restaurant } from "@/types/database";
import RestaurantForm from "../RestaurantForm";
import { updateRestaurant, deleteRestaurant } from "../actions";

export default async function EditRestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("restaurants").select("*").eq("id", id).single();
  const restaurant = data as Restaurant | null;

  if (!restaurant) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{restaurant.name}</h1>
          <a
            href={googleMapsSearchUrl(restaurant.name)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Find nearby
          </a>
        </div>
        <form action={deleteRestaurant}>
          <input type="hidden" name="id" value={restaurant.id} />
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete
          </button>
        </form>
      </div>

      <RestaurantForm action={updateRestaurant} restaurant={restaurant} />
    </div>
  );
}
