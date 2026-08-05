"use client";

import { useActionState } from "react";
import type { FoodWithRelations } from "@/types/database";
import type { Store } from "@/types/database";
import PhotoField from "./PhotoField";

const initialState = { error: "" };

export default function FoodForm({
  action,
  stores,
  food,
}: {
  action: (prevState: unknown, formData: FormData) => Promise<{ error: string } | void>;
  stores: Store[];
  food?: FoodWithRelations;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const selectedStoreIds = new Set(food?.food_stores.map((fs) => fs.store_id) ?? []);

  return (
    <form action={formAction} className="flex flex-col gap-5 max-w-xl">
      {food ? <input type="hidden" name="id" value={food.id} /> : null}

      <Field label="Name" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          defaultValue={food?.name}
          className="input"
        />
      </Field>

      <Field label="Brand" htmlFor="brand">
        <input id="brand" name="brand" defaultValue={food?.brand ?? ""} className="input" />
      </Field>

      <Field label="Category" htmlFor="category">
        <input
          id="category"
          name="category"
          placeholder="e.g. snack, pantry, dairy alternative"
          defaultValue={food?.category ?? ""}
          className="input"
        />
      </Field>

      <Field
        label="Safety notes"
        htmlFor="safety_notes"
        hint="Check ingredient lists carefully - allergens often hide here (gelatin, whey, lard, tallow, cross-contamination warnings, etc.)"
        prominent
      >
        <textarea
          id="safety_notes"
          name="safety_notes"
          rows={4}
          placeholder='e.g. "Check for gelatin in ingredients" or "May contain tree nuts - cross contamination warning"'
          defaultValue={food?.safety_notes ?? ""}
          className="input border-amber-300 bg-amber-50 focus:ring-amber-500"
        />
      </Field>

      <Field
        label="Dietary tags"
        htmlFor="dietary_tags"
        hint="Comma-separated, e.g. tree-nut-free, alpha-gal-safe"
      >
        <input
          id="dietary_tags"
          name="dietary_tags"
          defaultValue={food?.dietary_tags.join(", ") ?? ""}
          className="input"
        />
      </Field>

      <Field label="Photo" htmlFor="photo_url_input">
        <PhotoField defaultUrl={food?.photo_url} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-neutral-700">
          Carried at
        </legend>
        {food ? (
          <div className="flex flex-wrap gap-3">
            {stores.map((store) => (
              <label
                key={store.id}
                className="flex items-center gap-2 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              >
                <input
                  type="checkbox"
                  name="store_ids"
                  value={store.id}
                  defaultChecked={selectedStoreIds.has(store.id)}
                />
                {store.name}
              </label>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-neutral-500">
              Optionally add a known price and aisle for each store you check.
            </p>
            {stores.map((store) => (
              <div
                key={store.id}
                className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              >
                <label className="flex min-w-32 items-center gap-2">
                  <input type="checkbox" name="store_ids" value={store.id} />
                  {store.name}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name={`price_${store.id}`}
                  placeholder="Price"
                  className="input w-24"
                />
                <input
                  type="text"
                  name={`aisle_${store.id}`}
                  placeholder="Aisle"
                  className="input w-32"
                />
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {!food ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-neutral-700">
            Inventory (optional)
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              name="quantity"
              placeholder="Quantity"
              className="input w-24"
            />
            <input
              type="text"
              name="unit"
              placeholder="Unit (e.g. count, oz, bags)"
              defaultValue="count"
              className="input w-48"
            />
          </div>
        </fieldset>
      ) : null}

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : food ? "Save changes" : "Add food"}
      </button>

      <style jsx global>{`
        .input {
          border-radius: 0.375rem;
          border: 1px solid #d4d4d4;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #171717;
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  prominent,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  prominent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={htmlFor}
        className={
          prominent
            ? "text-sm font-semibold text-amber-900"
            : "text-sm font-medium text-neutral-700"
        }
      >
        {label}
      </label>
      {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
      {children}
    </div>
  );
}
