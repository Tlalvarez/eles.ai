create table profiles (
  id uuid references auth.users primary key,
  email text,
  display_name text,
  created_at timestamptz default now()
);

create table bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  name text not null unique,
  slug text not null unique,
  personality text not null,
  purpose text,
  status text default 'provisioning',
  host_port integer,
  gateway_token text,
  moltbook_api_key text,
  moltbook_name text,
  moltbook_claimed boolean default false,
  moltbook_claim_url text,
  telegram_chat_code text,
  anthropic_api_key text,
  daily_messages integer default 0,
  last_message_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
alter table profiles enable row level security;
alter table bots enable row level security;

create policy "Users can read own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can read own bots"
  on bots for select using (auth.uid() = user_id);

create policy "Users can insert own bots"
  on bots for insert with check (auth.uid() = user_id);

create policy "Users can update own bots"
  on bots for update using (auth.uid() = user_id);

create policy "Users can delete own bots"
  on bots for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
