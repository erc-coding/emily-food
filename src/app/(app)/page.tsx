import Link from "next/link";
import { getFoodsWithRelations } from "@/lib/data";

const LOW_STOCK_THRESHOLD = 1;

export default async function DashboardPage() {
  const foods = await getFoodsWithRelations();

  const lowStock = foods.filter(
    (f) => !f.inventory || f.inventory.quantity <= LOW_STOCK_THRESHOLD
  );
  const inStock = foods.filter(
    (f) => f.inventory && f.inventory.quantity > LOW_STOCK_THRESHOLD
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {foods.length} safe foods tracked &middot; {inStock.length} in stock &middot;{" "}
          {lowStock.length} low or out
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <QuickLink href="/foods" label="Add a safe food" />
        <QuickLink href="/inventory" label="Update inventory" />
        <QuickLink href="/restaurants" label="Safe restaurants" />
        <QuickLink href="/suggestions" label="Get meal ideas" />
      </div>

      <section>
        <h2 className="text-lg font-medium">Low or out of stock</h2>
        {lowStock.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Nothing is low right now.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {lowStock.map((food) => (
              <li key={food.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-medium">{food.name}</p>
                  {food.brand ? (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{food.brand}</p>
                  ) : null}
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {food.inventory
                    ? `${food.inventory.quantity} ${food.inventory.unit}`
                    : "Not tracked"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-neutral-200 bg-white px-4 py-4 text-sm font-medium text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:border-neutral-700 dark:hover:bg-neutral-800"
    >
      {label}
    </Link>
  );
}
