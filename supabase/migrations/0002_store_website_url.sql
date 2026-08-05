-- Add a direct store URL (e.g. the store's own page for this specific
-- location) so price lookups can fetch it directly instead of searching
-- the web from scratch each time.
alter table stores add column if not exists website_url text;
