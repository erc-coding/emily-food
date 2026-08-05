-- Store the in-store aisle location, populated from Kroger's Products API
-- (aisleLocations) when available. Not touched by AI-based lookups for
-- stores without a real API (Tom Thumb, Sprouts).
alter table food_stores add column if not exists aisle text;
