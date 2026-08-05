# Project Brief: Household Food Safety, Inventory & Meal Planning App

## Purpose
Build a private web app for a two-person household (me and my husband) to track foods that are safe to eat given our dietary restrictions, which stores carry them, current prices (checked on request), what we currently have in stock, and to generate recipes/meal plans/snack ideas/shopping lists from that inventory.

## Dietary Restrictions (critical - both users share these)
- **Tree nut allergy** — must avoid all tree nuts and products processed in facilities with tree nuts if labeled as such (almond, cashew, walnut, pecan, pistachio, hazelnut, macadamia, brazil nut, etc.)
- **Alpha-gal syndrome** — allergic to galactose-alpha-1,3-galactose, found in all mammalian meat (beef, pork, lamb, venison, etc.) AND hidden mammalian-derived ingredients: gelatin, lard, tallow, whey, casein, and some dairy products. Poultry, fish, and shellfish are generally fine; ingredient lists need to be checked carefully for hidden mammal-derived additives.

## Tech Stack
- **Frontend/backend:** Next.js (App Router), deployed on Vercel
- **Database + auth:** Supabase (Postgres + built-in auth), 2 user accounts (me + husband), shared data with equal edit rights for both — no view-only restrictions
- **AI features:** Anthropic API (Claude), called from backend routes, with web search tool enabled for price lookups and general knowledge for recipe/meal generation

## Data Model

### `foods`
- id
- name
- brand
- category (e.g., snack, pantry, dairy alternative, etc.)
- safety_notes (free text - e.g., "check for gelatin in ingredients", "may contain tree nuts - cross contamination warning")
- dietary_tags (array: e.g., "tree-nut-free", "alpha-gal-safe")
- created_at / updated_at

### `stores`
- id
- name (seed with: Kroger, Tom Thumb, Sprouts)
- location (optional, for a specific store address if relevant)

### `food_stores`
- id
- food_id (FK)
- store_id (FK)
- last_known_price
- last_checked_at (timestamp)
- notes (e.g., "on sale," "seasonal")

### `inventory`
- id
- food_id (FK)
- quantity
- unit (e.g., count, oz, bags)
- last_updated_at

## Core App Flows
1. **Add a safe food** — name, brand, category, safety notes, dietary tags, and which store(s) carry it
2. **Refresh prices** — button next to a food (or store) that triggers a backend call to Claude with web search enabled, looks up current price at the linked store(s), and updates `food_stores` with price + timestamp
3. **Manage inventory** — simple form to add/update/remove quantities as items are bought or used up (manual entry, no barcode scanning for now)
4. **Generate suggestions** — button/prompt box to ask Claude (given current `inventory` + `foods` safety data) for:
   - Recipes using what's on hand
   - Meal plans for the week
   - Snack ideas
   - Shopping lists (what's low/out, cross-referenced with safe foods and preferred stores)
   - These are generated on demand and displayed/saved as text output, not rigid database records

## Auth & Access
- Two Supabase auth accounts only (me + husband)
- Both accounts have full, equal edit rights across all data — no roles or permission tiers needed
- Data is shared/household-wide, not siloed per user

## Environment Variables Needed
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `ANTHROPIC_API_KEY`

## Notes for Claude Code
- Prioritize a clean, simple dashboard UI — this is a household tool, not a commercial product
- Since both allergies (tree nut, alpha-gal) often hide in ingredient lists rather than obvious product names, make `safety_notes` prominent and easy to edit/reference — this app is a safety tool first
- Price refresh should always show a timestamp so we know how stale the info is
- Seed `stores` table with Kroger, Tom Thumb, and Sprouts on initial setup
