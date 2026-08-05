import Link from "next/link";
import { getFoodsWithRelations, getStores } from "@/lib/data";
import RefreshPriceButton from "@/components/RefreshPriceButton";
import PriceEditor from "@/components/PriceEditor";
import { formatDateTime } from "@/lib/format";
import KrogerLocationPicker from "./KrogerLocationPicker";

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
            <h2 className="text-lg font-medium">{store.name}</h2>
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
                        {store.kroger_location_id ? (
                          <RefreshPriceButton foodStoreId={fs.id} />
                        ) : null}
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
