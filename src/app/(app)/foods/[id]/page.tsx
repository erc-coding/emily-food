import { notFound } from "next/navigation";
import { getFoodsWithRelations, getStores } from "@/lib/data";
import RefreshPriceButton from "@/components/RefreshPriceButton";
import PriceEditor from "@/components/PriceEditor";
import FoodForm from "../FoodForm";
import { updateFood, deleteFood } from "../actions";

function formatPrice(price: number | null) {
  if (price === null) return "No price yet";
  return `$${price.toFixed(2)}`;
}

function formatTimestamp(ts: string | null) {
  if (!ts) return "Never checked";
  return `Checked ${new Date(ts).toLocaleString()}`;
}

export default async function EditFoodPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [foods, stores] = await Promise.all([getFoodsWithRelations(), getStores()]);
  const food = foods.find((f) => f.id === id);

  if (!food) notFound();

  const cheapest = food.food_stores.reduce<string | null>((min, fs) => {
    if (fs.last_known_price === null) return min;
    if (min === null) return fs.id;
    const minPrice = food.food_stores.find((x) => x.id === min)?.last_known_price;
    return minPrice !== null && minPrice !== undefined && fs.last_known_price < minPrice ? fs.id : min;
  }, null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{food.name}</h1>
          {food.photo_url ? (
            <a
              href={food.photo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              View photo
            </a>
          ) : null}
        </div>
        <form action={deleteFood}>
          <input type="hidden" name="id" value={food.id} />
          <button
            type="submit"
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Delete
          </button>
        </form>
      </div>

      {food.food_stores.length > 0 ? (
        <section>
          <h2 className="text-sm font-medium text-neutral-700">Price comparison</h2>
          <ul className="mt-2 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {[...food.food_stores]
              .sort((a, b) => a.store.name.localeCompare(b.store.name))
              .map((fs) => (
                <li key={fs.id} className="flex flex-col gap-2 px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {fs.store.name}
                        {fs.id === cheapest ? (
                          <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                            Cheapest
                          </span>
                        ) : null}
                        {fs.aisle ? (
                          <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                            {fs.aisle}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-neutral-500">{formatTimestamp(fs.last_checked_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">{formatPrice(fs.last_known_price)}</span>
                      <PriceEditor
                        foodStoreId={fs.id}
                        currentPrice={fs.last_known_price}
                        currentNotes={fs.notes}
                        currentAisle={fs.aisle}
                      />
                      <RefreshPriceButton foodStoreId={fs.id} />
                    </div>
                  </div>
                  {fs.notes ? <p className="text-xs text-neutral-500">{fs.notes}</p> : null}
                </li>
              ))}
          </ul>
        </section>
      ) : null}

      <FoodForm action={updateFood} stores={stores} food={food} />
    </div>
  );
}
