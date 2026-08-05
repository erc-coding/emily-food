"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AiSuggestion, AiSuggestionKind } from "@/types/database";

const KIND_OPTIONS: { value: AiSuggestionKind; label: string }[] = [
  { value: "recipe", label: "Recipes from what's on hand" },
  { value: "meal_plan", label: "Meal plan for the week" },
  { value: "snacks", label: "Snack ideas" },
  { value: "shopping_list", label: "Shopping list" },
];

export default function SuggestionsClient({
  initialSuggestions,
}: {
  initialSuggestions: AiSuggestion[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<AiSuggestionKind>("recipe");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState(initialSuggestions);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, prompt }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to generate suggestion");
      }
      const { suggestion } = await res.json();
      setSuggestions((prev) => [suggestion, ...prev]);
      setPrompt("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate suggestion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {KIND_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setKind(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                kind === opt.value
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Optional: add specifics, e.g. 'quick weeknight dinners' or 'nothing with rice'"
          rows={3}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="self-start rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Generate"}
        </button>
      </form>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Saved suggestions</h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing generated yet.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                  <span className="uppercase tracking-wide">{s.kind.replace("_", " ")}</span>
                  <span>{new Date(s.created_at).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-neutral-800">
                  {s.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
