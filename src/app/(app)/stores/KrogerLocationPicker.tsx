"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setKrogerLocation } from "./actions";
import type { KrogerLocation } from "@/types/database";

export default function KrogerLocationPicker({
  storeId,
  currentLocationId,
}: {
  storeId: string;
  currentLocationId: string | null;
}) {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [results, setResults] = useState<KrogerLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!zip.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kroger/locations?zip=${encodeURIComponent(zip.trim())}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Search failed");
      }
      const { locations } = await res.json();
      setResults(locations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect(locationId: string) {
    const formData = new FormData();
    formData.set("id", storeId);
    formData.set("kroger_location_id", locationId);
    await setKrogerLocation(formData);
    setResults([]);
    router.refresh();
  }

  async function handleClear() {
    const formData = new FormData();
    formData.set("id", storeId);
    formData.set("kroger_location_id", "");
    await setKrogerLocation(formData);
    router.refresh();
  }

  if (currentLocationId) {
    return (
      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
        <span>Kroger store linked (ID: {currentLocationId})</span>
        <button onClick={handleClear} className="font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100">
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="ZIP code"
          className="w-24 rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          {loading ? "Searching..." : "Find my Kroger store"}
        </button>
      </div>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {results.map((loc) => (
            <li key={loc.locationId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span>
                {loc.name} — {loc.address}
              </span>
              <button
                type="button"
                onClick={() => handleSelect(loc.locationId)}
                className="font-medium text-neutral-900 underline dark:text-neutral-100"
              >
                Use this store
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
