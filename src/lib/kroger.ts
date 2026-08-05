import type { KrogerLocation } from "@/types/database";

const KROGER_BASE_URL = "https://api.kroger.com/v1";

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("KROGER_CLIENT_ID / KROGER_CLIENT_SECRET not configured");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${KROGER_BASE_URL}/connect/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: "grant_type=client_credentials&scope=product.compact",
  });

  if (!res.ok) {
    throw new Error(`Kroger auth failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // refresh a little early to avoid edge-of-expiry failures
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export async function searchKrogerLocations(zip: string): Promise<KrogerLocation[]> {
  const token = await getAccessToken();

  const url = new URL(`${KROGER_BASE_URL}/locations`);
  url.searchParams.set("filter.zipCode.near", zip);
  url.searchParams.set("filter.limit", "5");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Kroger locations search failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    data: {
      locationId: string;
      name: string;
      address: {
        addressLine1: string;
        city: string;
        state: string;
        zipCode: string;
      };
    }[];
  };

  return data.data.map((loc) => ({
    locationId: loc.locationId,
    name: loc.name,
    address: `${loc.address.addressLine1}, ${loc.address.city}, ${loc.address.state} ${loc.address.zipCode}`,
  }));
}

export type KrogerProductPrice = {
  price: number | null;
  description: string;
  aisle: string | null;
};

function formatAisle(
  aisleLocations?: {
    description?: string;
    shelfNumber?: string;
    side?: string;
  }[]
): string | null {
  const loc = aisleLocations?.[0];
  if (!loc?.description) return null;

  const parts = [loc.description];
  if (loc.shelfNumber) parts.push(`Shelf ${loc.shelfNumber}`);
  if (loc.side) parts.push(loc.side === "L" ? "Left side" : loc.side === "R" ? "Right side" : loc.side);
  return parts.join(", ");
}

export async function searchKrogerProductPrice(
  term: string,
  locationId: string
): Promise<KrogerProductPrice | null> {
  const token = await getAccessToken();

  const url = new URL(`${KROGER_BASE_URL}/products`);
  url.searchParams.set("filter.term", term);
  url.searchParams.set("filter.locationId", locationId);
  url.searchParams.set("filter.limit", "5");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Kroger product search failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as {
    data: {
      description: string;
      aisleLocations?: { description?: string; shelfNumber?: string; side?: string }[];
      items?: { size?: string; price?: { regular?: number; promo?: number } }[];
    }[];
  };

  const candidates = data.data.filter((p) => p.items?.[0]?.price);
  if (candidates.length === 0) return null;

  // The search is fuzzy and can return size variants (e.g. "Giant Size",
  // "Family Size") the user didn't ask for. Prefer a candidate that doesn't
  // carry one of those qualifiers unless the search term itself mentions it,
  // since the plain/standard size is the more useful default match.
  const sizeVariantWords = ["giant", "family", "value", "jumbo", "party", "club", "bulk"];
  const termLower = term.toLowerCase();
  const isPlainMatch = (description: string) => {
    const descLower = description.toLowerCase();
    return sizeVariantWords.every((word) => termLower.includes(word) || !descLower.includes(word));
  };

  const match = candidates.find((p) => isPlainMatch(p.description)) ?? candidates[0];

  const item = match.items![0];
  const priceInfo = item.price!;
  const price = priceInfo.promo && priceInfo.promo > 0 ? priceInfo.promo : priceInfo.regular ?? null;
  const description = item.size ? `${match.description} (${item.size})` : match.description;
  const aisle = formatAisle(match.aisleLocations);

  return { price: price ?? null, description, aisle };
}
