import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchKrogerLocations } from "@/lib/kroger";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");
  if (!zip) {
    return NextResponse.json({ error: "zip is required" }, { status: 400 });
  }

  try {
    const locations = await searchKrogerLocations(zip);
    return NextResponse.json({ locations });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kroger location search failed" },
      { status: 500 }
    );
  }
}
