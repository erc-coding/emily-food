import { createClient } from "@/lib/supabase/server";
import type {
  Food,
  Store,
  FoodStore,
  Inventory,
  FoodWithRelations,
} from "@/types/database";

export async function getStores(): Promise<Store[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("stores").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getFoodsWithRelations(): Promise<FoodWithRelations[]> {
  const supabase = await createClient();

  const [foodsRes, foodStoresRes, inventoryRes, storesRes] = await Promise.all([
    supabase.from("foods").select("*").order("name"),
    supabase.from("food_stores").select("*"),
    supabase.from("inventory").select("*"),
    supabase.from("stores").select("*"),
  ]);

  if (foodsRes.error) throw foodsRes.error;
  if (foodStoresRes.error) throw foodStoresRes.error;
  if (inventoryRes.error) throw inventoryRes.error;
  if (storesRes.error) throw storesRes.error;

  const foods = (foodsRes.data ?? []) as Food[];
  const foodStores = (foodStoresRes.data ?? []) as FoodStore[];
  const inventory = (inventoryRes.data ?? []) as Inventory[];
  const stores = (storesRes.data ?? []) as Store[];

  const storeById = new Map(stores.map((s) => [s.id, s]));
  const inventoryByFoodId = new Map(inventory.map((i) => [i.food_id, i]));
  const foodStoresByFoodId = new Map<string, (FoodStore & { store: Store })[]>();

  for (const fs of foodStores) {
    const store = storeById.get(fs.store_id);
    if (!store) continue;
    const list = foodStoresByFoodId.get(fs.food_id) ?? [];
    list.push({ ...fs, store });
    foodStoresByFoodId.set(fs.food_id, list);
  }

  return foods.map((food) => ({
    ...food,
    food_stores: foodStoresByFoodId.get(food.id) ?? [],
    inventory: inventoryByFoodId.get(food.id) ?? null,
  }));
}
