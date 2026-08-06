import Link from "next/link";
import { getFoodsWithRelations } from "@/lib/data";

export default async function FoodsPage() {
  const foods = await getFoodsWithRelations();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Safe Foods</h1>
        <Link
          href="/foods/new"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
        >
          Add food
        </Link>
      </div>

      {foods.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No foods yet. Add the first one your household knows is safe.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {foods.map((food) => (
            <li
              key={food.id}
              className="flex gap-4 rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            >
              {food.photo_url ? (
                <a
                  href={food.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={food.photo_url}
                    alt={food.name}
                    className="h-16 w-16 rounded-md border border-neutral-200 object-cover dark:border-neutral-800"
                  />
                </a>
              ) : null}
              <Link href={`/foods/${food.id}`} className="block flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {food.name}{" "}
                      {food.brand ? (
                        <span className="font-normal text-neutral-500 dark:text-neutral-400">
                          &middot; {food.brand}
                        </span>
                      ) : null}
                      {food.visit_status === "want_to_try" ? (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                          Want to try
                        </span>
                      ) : null}
                    </p>
                    {food.category ? (
                      <p className="text-xs uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                        {food.category}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {food.inventory
                      ? `${food.inventory.quantity} ${food.inventory.unit}`
                      : "Not tracked"}
                  </span>
                </div>
                {food.safety_notes ? (
                  <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    {food.safety_notes}
                  </p>
                ) : null}
                {food.dietary_tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {food.dietary_tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                {food.food_stores.length > 0 ? (
                  <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    Carried at:{" "}
                    {food.food_stores.map((fs) => fs.store.name).join(", ")}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
