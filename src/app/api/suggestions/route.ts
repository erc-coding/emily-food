import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic } from "@/lib/anthropic";
import type { AiSuggestionKind } from "@/types/database";

const KIND_LABELS: Record<AiSuggestionKind, string> = {
  recipe: "recipes using what's currently on hand",
  meal_plan: "a meal plan for the week",
  snacks: "snack ideas",
  shopping_list: "a shopping list for what's low or out of stock",
  other: "a suggestion",
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { kind, prompt } = (await request.json()) as {
    kind: AiSuggestionKind;
    prompt?: string;
  };

  if (!kind || !(kind in KIND_LABELS)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const [foodsRes, inventoryRes] = await Promise.all([
    supabase.from("foods").select("id, name, brand, category, safety_notes, dietary_tags"),
    supabase.from("inventory").select("food_id, quantity, unit"),
  ]);

  if (foodsRes.error) {
    return NextResponse.json({ error: foodsRes.error.message }, { status: 500 });
  }
  if (inventoryRes.error) {
    return NextResponse.json({ error: inventoryRes.error.message }, { status: 500 });
  }

  const foods = foodsRes.data ?? [];
  const inventoryByFoodId = new Map(
    (inventoryRes.data ?? []).map((i) => [i.food_id, i])
  );

  const foodsSummary = foods
    .map((f) => {
      const tags = f.dietary_tags.length ? ` [${f.dietary_tags.join(", ")}]` : "";
      const notes = f.safety_notes ? ` — safety: ${f.safety_notes}` : "";
      const inv = inventoryByFoodId.get(f.id);
      const stock = inv ? ` — in stock: ${inv.quantity} ${inv.unit}` : " — not in stock";
      return `- ${f.name}${f.brand ? ` (${f.brand})` : ""}${tags}${notes}${stock}`;
    })
    .join("\n");

  const contextBlock = `Household dietary restrictions: tree nut allergy (avoid all tree nuts and cross-contamination-labeled products) and alpha-gal syndrome (avoid all mammalian meat and hidden mammal-derived ingredients like gelatin, lard, tallow, whey, casein).

Known safe foods:
${foodsSummary || "(none recorded yet)"}`;

  const userPrompt = prompt?.trim()
    ? prompt.trim()
    : `Give us ${KIND_LABELS[kind]}.`;

  const message = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 4096,
    output_config: { effort: "medium" },
    system: `You are a meal-planning assistant for a household with a tree nut allergy and alpha-gal syndrome (mammalian meat/product allergy). Only ever suggest foods from the household's known-safe foods list below — treat it as already vetted, don't second-guess or re-verify individual ingredients. If a suggestion needs something not on the list, say so explicitly rather than assuming it's safe.\n\n${contextBlock}`,
    messages: [{ role: "user", content: userPrompt }],
  });

  const content = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n\n")
    .trim();

  const { data: saved, error: saveError } = await supabase
    .from("ai_suggestions")
    .insert({ kind, prompt: userPrompt, content })
    .select()
    .single();

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ suggestion: saved });
}
