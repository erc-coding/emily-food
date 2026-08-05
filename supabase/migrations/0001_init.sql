-- Household Food Safety, Inventory & Meal Planning App
-- Initial schema: foods, stores, food_stores, inventory, ai_suggestions
-- Both household accounts share all data with equal edit rights (no roles/tiers).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- foods
-- ---------------------------------------------------------------------------
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  category text,
  safety_notes text,
  dietary_tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------
create table if not exists stores (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  location text
);

-- ---------------------------------------------------------------------------
-- food_stores (which stores carry which foods, with last known price)
-- ---------------------------------------------------------------------------
create table if not exists food_stores (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade,
  store_id uuid not null references stores(id) on delete cascade,
  last_known_price numeric(10, 2),
  last_checked_at timestamptz,
  notes text,
  unique (food_id, store_id)
);

-- ---------------------------------------------------------------------------
-- inventory (current quantity on hand for a food)
-- ---------------------------------------------------------------------------
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references foods(id) on delete cascade unique,
  quantity numeric(10, 2) not null default 0,
  unit text not null default 'count',
  last_updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ai_suggestions (optional saved output from Claude - recipes, meal plans,
-- snack ideas, shopping lists; free text, not structured records)
-- ---------------------------------------------------------------------------
create table if not exists ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('recipe', 'meal_plan', 'snacks', 'shopping_list', 'other')),
  prompt text,
  content text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- updated_at trigger for foods
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists foods_set_updated_at on foods;
create trigger foods_set_updated_at
  before update on foods
  for each row
  execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Any authenticated household member (both accounts) has full read/write
-- access to all tables. No per-user siloing, no roles.
-- ---------------------------------------------------------------------------
alter table foods enable row level security;
alter table stores enable row level security;
alter table food_stores enable row level security;
alter table inventory enable row level security;
alter table ai_suggestions enable row level security;

create policy "household full access" on foods
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "household full access" on stores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "household full access" on food_stores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "household full access" on inventory
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "household full access" on ai_suggestions
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- Seed stores
-- ---------------------------------------------------------------------------
insert into stores (name) values
  ('Kroger'),
  ('Tom Thumb'),
  ('Sprouts')
on conflict (name) do nothing;
