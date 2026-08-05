import { createClient } from "@/lib/supabase/server";
import SuggestionsClient from "./SuggestionsClient";

export default async function SuggestionsPage() {
  const supabase = await createClient();
  const { data: suggestions } = await supabase
    .from("ai_suggestions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Suggestions</h1>
      <SuggestionsClient initialSuggestions={suggestions ?? []} />
    </div>
  );
}
