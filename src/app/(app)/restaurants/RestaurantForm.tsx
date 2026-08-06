"use client";

import { useActionState } from "react";
import type { Restaurant } from "@/types/database";
import MenuField from "./MenuField";

const initialState = { error: "" };

export default function RestaurantForm({
  action,
  restaurant,
}: {
  action: (prevState: unknown, formData: FormData) => Promise<{ error: string } | void>;
  restaurant?: Restaurant;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      {restaurant ? <input type="hidden" name="id" value={restaurant.id} /> : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={restaurant?.name}
          placeholder="e.g. Chipotle"
          className="input bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="visit_status"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Status
          </label>
          <select
            id="visit_status"
            name="visit_status"
            defaultValue={restaurant?.visit_status ?? "want_to_try"}
            className="input bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="want_to_try">Want to try</option>
            <option value="tried">Tried it</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="has_drive_through"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Drive-through
          </label>
          <select
            id="has_drive_through"
            name="has_drive_through"
            defaultValue={
              restaurant?.has_drive_through === true
                ? "yes"
                : restaurant?.has_drive_through === false
                  ? "no"
                  : ""
            }
            className="input bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          >
            <option value="">Not sure</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="safety_notes"
          className="text-sm font-semibold text-amber-900 dark:text-amber-300"
        >
          Safety notes
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          What&rsquo;s safe to order, what to ask for, and how well staff understand the
          allergies.
        </p>
        <textarea
          id="safety_notes"
          name="safety_notes"
          rows={4}
          placeholder={'e.g. "Ask for the allergen binder. Steak/barbacoa are out (beef) - chicken bowl is safe. Fryer is shared."'}
          defaultValue={restaurant?.safety_notes ?? ""}
          className="input border-amber-300 bg-amber-50 focus:ring-amber-500 dark:border-amber-800 dark:bg-amber-950/40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Allergen menu
        </label>
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          Link to the restaurant&rsquo;s published allergen menu, or upload a PDF or photo of
          one.
        </p>
        <MenuField defaultUrl={restaurant?.allergen_menu_url} />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
      >
        {pending ? "Saving..." : restaurant ? "Save changes" : "Add restaurant"}
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
        @media (prefers-color-scheme: dark) {
          .input:focus {
            box-shadow: 0 0 0 2px #ededed;
          }
        }
      `}</style>
    </form>
  );
}
