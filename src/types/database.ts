export type VisitStatus = "tried" | "want_to_try";

export type Food = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  safety_notes: string | null;
  dietary_tags: string[];
  photo_url: string | null;
  visit_status: VisitStatus;
  created_at: string;
  updated_at: string;
};

export type Store = {
  id: string;
  name: string;
  location: string | null;
  website_url: string | null;
  kroger_location_id: string | null;
};

export type FoodStore = {
  id: string;
  food_id: string;
  store_id: string;
  last_known_price: number | null;
  last_checked_at: string | null;
  notes: string | null;
  aisle: string | null;
};

export type Inventory = {
  id: string;
  food_id: string;
  quantity: number;
  unit: string;
  last_updated_at: string;
};

export type AiSuggestionKind =
  | "recipe"
  | "meal_plan"
  | "snacks"
  | "shopping_list"
  | "other";

export type AiSuggestion = {
  id: string;
  kind: AiSuggestionKind;
  prompt: string | null;
  content: string;
  created_at: string;
};

export type FoodWithRelations = Food & {
  food_stores: (FoodStore & { store: Store })[];
  inventory: Inventory | null;
};

export type Restaurant = {
  id: string;
  name: string;
  allergen_menu_url: string | null;
  safety_notes: string | null;
  /** null means "not known yet", which is distinct from a confirmed "no". */
  has_drive_through: boolean | null;
  visit_status: VisitStatus;
  created_at: string;
  updated_at: string;
};

export type KrogerLocation = {
  locationId: string;
  name: string;
  address: string;
};
