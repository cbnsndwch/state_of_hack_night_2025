-- 1. PROFILES
-- Links to auth.users and stores community-specific data
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  github_uid text,
  luma_attendee_id text,
  bio text,
  streak_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );


-- 2. PROJECTS
-- Showcase of hacks built by members
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  tags text[],
  image_urls text[],
  github_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Policies
create policy "Projects are viewable by everyone."
  on public.projects for select
  using ( true );

create policy "Authenticated users can create projects."
  on public.projects for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can update their own projects."
  on public.projects for update
  using ( auth.uid() = member_id );


-- 3. BADGES & ASSIGNMENTS
-- Definitions for ASCII badges and their assignment to members
create table public.badges (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon_ascii text not null,
  criteria text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.member_badges (
  member_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (member_id, badge_id)
);

-- Enable RLS
alter table public.badges enable row level security;
alter table public.member_badges enable row level security;

-- Policies
create policy "Badges are viewable by everyone." 
  on public.badges for select using ( true );

create policy "Member badges are viewable by everyone." 
  on public.member_badges for select using ( true );
