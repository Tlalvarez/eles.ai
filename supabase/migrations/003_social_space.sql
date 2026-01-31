-- Social Space tables

-- Spaces
create table spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table spaces enable row level security;
create policy "spaces_read" on spaces for select using (true);
create policy "spaces_insert" on spaces for insert with check (auth.uid() = created_by);
create policy "spaces_update" on spaces for update using (auth.uid() = created_by);

-- Space members (polymorphic: user or bot)
create table space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  bot_id uuid references bots(id) on delete cascade,
  joined_at timestamptz not null default now(),
  constraint space_members_one_actor check (
    (user_id is not null and bot_id is null) or
    (user_id is null and bot_id is not null)
  ),
  constraint space_members_unique_user unique (space_id, user_id),
  constraint space_members_unique_bot unique (space_id, bot_id)
);

alter table space_members enable row level security;
create policy "space_members_read" on space_members for select using (true);
create policy "space_members_insert" on space_members for insert with check (auth.uid() = user_id);
create policy "space_members_delete" on space_members for delete using (auth.uid() = user_id);

-- Author type enum
create type author_type as enum ('user', 'bot');

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces(id) on delete cascade,
  author_type author_type not null,
  user_id uuid references profiles(id) on delete set null,
  bot_id uuid references bots(id) on delete set null,
  title text not null,
  body text,
  score integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint posts_one_author check (
    (author_type = 'user' and user_id is not null and bot_id is null) or
    (author_type = 'bot' and bot_id is not null and user_id is null)
  )
);

alter table posts enable row level security;
create policy "posts_read" on posts for select using (true);
create policy "posts_insert_user" on posts for insert with check (auth.uid() = user_id and author_type = 'user');

create index posts_space_created on posts(space_id, created_at desc);
create index posts_space_score on posts(space_id, score desc);

-- Comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  author_type author_type not null,
  user_id uuid references profiles(id) on delete set null,
  bot_id uuid references bots(id) on delete set null,
  body text not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  constraint comments_one_author check (
    (author_type = 'user' and user_id is not null and bot_id is null) or
    (author_type = 'bot' and bot_id is not null and user_id is null)
  )
);

alter table comments enable row level security;
create policy "comments_read" on comments for select using (true);
create policy "comments_insert_user" on comments for insert with check (auth.uid() = user_id and author_type = 'user');

create index comments_post on comments(post_id, created_at);

-- Votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  constraint votes_one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  ),
  constraint votes_unique_post unique (user_id, post_id),
  constraint votes_unique_comment unique (user_id, comment_id)
);

alter table votes enable row level security;
create policy "votes_read" on votes for select using (auth.uid() = user_id);
create policy "votes_insert" on votes for insert with check (auth.uid() = user_id);
create policy "votes_update" on votes for update using (auth.uid() = user_id);
create policy "votes_delete" on votes for delete using (auth.uid() = user_id);

-- Bot API tokens
create table bot_api_tokens (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid not null references bots(id) on delete cascade unique,
  token text not null unique,
  rate_limit_per_min integer not null default 10,
  created_at timestamptz not null default now()
);

alter table bot_api_tokens enable row level security;
create policy "bot_tokens_owner_read" on bot_api_tokens for select
  using (exists (select 1 from bots where bots.id = bot_api_tokens.bot_id and bots.user_id = auth.uid()));

-- Add last_social_check to bots
alter table bots add column last_social_check timestamptz;

-- Triggers: auto-update post score on vote change
create or replace function update_post_score() returns trigger as $$
begin
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    if NEW.post_id is not null then
      update posts set score = coalesce((select sum(value) from votes where votes.post_id = NEW.post_id), 0) where id = NEW.post_id;
    end if;
  end if;
  if TG_OP = 'DELETE' then
    if OLD.post_id is not null then
      update posts set score = coalesce((select sum(value) from votes where votes.post_id = OLD.post_id), 0) where id = OLD.post_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_vote_post_score
after insert or update or delete on votes
for each row execute function update_post_score();

-- Triggers: auto-update comment score on vote change
create or replace function update_comment_score() returns trigger as $$
begin
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    if NEW.comment_id is not null then
      update comments set score = coalesce((select sum(value) from votes where votes.comment_id = NEW.comment_id), 0) where id = NEW.comment_id;
    end if;
  end if;
  if TG_OP = 'DELETE' then
    if OLD.comment_id is not null then
      update comments set score = coalesce((select sum(value) from votes where votes.comment_id = OLD.comment_id), 0) where id = OLD.comment_id;
    end if;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_vote_comment_score
after insert or update or delete on votes
for each row execute function update_comment_score();

-- Triggers: auto-update post comment_count
create or replace function update_comment_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger trg_comment_count
after insert or delete on comments
for each row execute function update_comment_count();

-- Enable Realtime
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table comments;
