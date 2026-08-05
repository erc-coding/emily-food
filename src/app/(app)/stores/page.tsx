import Link from "next/link";
import { getFoodsWithRelations, getStores } from "@/lib/data";
import RefreshPriceButton from "@/components/RefreshPriceButton";
import PriceEditor from "@/components/PriceEditor";
import { formatDateTime } from "@/lib/format";
import KrogerLocationPicker from "./KrogerLocationPicker";
import { updateStoreLocation } from "./actions";

function formatPrice(price: number | null) {
  if (price === null) return "No price yet";
  return `$${price.toFixed(2)}`;
}

function formatTimestamp(ts: string | null) {
  if (!ts) return "Never checked";
  return `Checked ${formatDateTime(ts)}`;
}

export default async function StoresPage() {
  const [stores, foods] = await Promise.all([getStores(), getFoodsWithRelations()]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Stores</h1>

      {stores.map((store) => {
        const items = foods
          .flatMap((food) =>
            food.food_stores
              .filter((fs) => fs.store_id === store.id)
              .map((fs) => ({ food, fs }))
          )
          .sort((a, b) => a.food.name.localeCompare(b.food.name));
        const isKroger = store.name.toLowerCase() === "kroger";

        return (
          <section key={store.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-medium">{store.name}</h2>
              <form action={updateStoreLocation} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={store.id} />
                <input
                  type="text"
                  name="location"
                  defaultValue={store.location ?? ""}
                  placeholder="Address, for price lookups"
                  className="w-48 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                />
                {isKroger ? (
                  <input type="hidden" name="website_url" value={store.website_url ?? ""} />
                ) : (
                  <input
                    type="url"
                    name="website_url"
                    defaultValue={store.website_url ?? ""}
                    placeholder="This store's own URL (optional, speeds up lookups)"
                    className="w-72 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                  />
                )}
                <button
                  type="submit"
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                >
                  Save
                </button>
              </form>
            </div>
            {isKroger ? (
              <div className="mt-2">
                <KrogerLocationPicker
                  storeId={store.id}
                  currentLocationId={store.kroger_location_id}
                />
              </div>
            ) : null}
            {items.length === 0 ? (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                No foods linked to this store yet.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
                {items.map(({ food, fs }) => (
                  <li key={fs.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <Link href={`/foods/${food.id}`} className="font-medium hover:underline">
                          {food.name}
                        </Link>
                        {fs.aisle ? (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                            {fs.aisle}
                          </span>
                        ) : null}
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {formatTimestamp(fs.last_checked_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium">
                          {formatPrice(fs.last_known_price)}
                        </span>
                        <PriceEditor
                          foodStoreId={fs.id}
                          currentPrice={fs.last_known_price}
                          currentNotes={fs.notes}
                          currentAisle={fs.aisle}
                        />
                        <RefreshPriceButton foodStoreId={fs.id} />
                      </div>
                    </div>
                    {fs.notes ? (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{fs.notes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
