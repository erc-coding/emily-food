-- Store the specific Kroger location ID (from Kroger's Locations API) so
-- price lookups can call Kroger's real Products API directly instead of
-- relying on AI web search for this chain.
alter table stores add column if not exists kroger_location_id text;
