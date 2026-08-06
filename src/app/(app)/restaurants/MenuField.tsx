"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function MenuField({ defaultUrl }: { defaultUrl?: string | null }) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("restaurant-menus")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("restaurant-menus").getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="allergen_menu_url" value={url} />
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link to their allergen menu"
          className="input min-w-48 flex-1 bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
          {uploading ? "Uploading..." : "Upload file"}
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {url ? (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Remove
          </button>
        ) : null}
      </div>
      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start text-xs font-medium text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          Open current menu
        </a>
      ) : null}
    </div>
  );
}
