import { getFoodsWithRelations } from "@/lib/data";
import { upsertInventory, removeInventory } from "./actions";

export default async function InventoryPage() {
  const foods = await getFoodsWithRelations();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Inventory</h1>

      {foods.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Add some safe foods first, then track quantities here.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
          {foods.map((food) => (
            <li key={food.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-medium">{food.name}</p>
                {food.brand ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{food.brand}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <form action={upsertInventory} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="food_id" value={food.id} />
                  <input
                    type="number"
                    name="quantity"
                    step="0.01"
                    min="0"
                    defaultValue={food.inventory?.quantity ?? 0}
                    className="w-20 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <input
                    type="text"
                    name="unit"
                    defaultValue={food.inventory?.unit ?? "count"}
                    className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-neutral-900 px-3 py-1 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
                  >
                    Save
                  </button>
                </form>

                {food.inventory ? (
                  <form action={removeInventory}>
                    <input type="hidden" name="food_id" value={food.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Clear
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
