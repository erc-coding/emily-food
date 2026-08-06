import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { googleMapsSearchUrl } from "@/lib/maps";
import type { Restaurant } from "@/types/database";

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("restaurants").select("*").order("name");
  const restaurants = (data ?? []) as Restaurant[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Safe Restaurants</h1>
        <Link
          href="/restaurants/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Add restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No restaurants yet. Add the first place you know is safe to eat.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {restaurants.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/restaurants/${r.id}`}
                    className="font-medium hover:underline"
                  >
                    {r.name}
                  </Link>
                  {r.visit_status === "tried" ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                      Tried
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                      Want to try
                    </span>
                  )}
                  {r.has_drive_through === true ? (
                    <span className="rounded-full bg-violet-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-violet-400 dark:text-neutral-300">
                      Drive-through
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {r.allergen_menu_url ? (
                    <a
                      href={r.allergen_menu_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      Allergen menu
                    </a>
                  ) : null}
                  <a
                    href={googleMapsSearchUrl(r.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Find nearby
                  </a>
                </div>
              </div>

              {r.safety_notes ? (
                <p className="mt-2 whitespace-pre-wrap rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  {r.safety_notes}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
