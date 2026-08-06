import RestaurantForm from "../RestaurantForm";
import { createRestaurant } from "../actions";

export default function NewRestaurantPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add a safe restaurant</h1>
      <RestaurantForm action={createRestaurant} />
    </div>
  );
}
