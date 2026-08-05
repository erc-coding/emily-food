import { getStores } from "@/lib/data";
import FoodForm from "../FoodForm";
import { createFood } from "../actions";

export default async function NewFoodPage() {
  const stores = await getStores();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add a safe food</h1>
      <FoodForm action={createFood} stores={stores} />
    </div>
  );
}
