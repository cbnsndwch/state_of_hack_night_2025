-- 4. ATTENDANCE
-- Tracks event participation
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.profiles(id) on delete cascade not null,
  luma_event_id text not null,
  status text not null check (status in ('registered', 'checked-in')),
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(member_id, luma_event_id)
);

-- Enable RLS
alter table public.attendance enable row level security;

-- Policies
create policy "Attendance is viewable by everyone." 
  on public.attendance for select using ( true );

create policy "Users can check themselves in." 
  on public.attendance for insert 
  with check ( auth.uid() = member_id );

create policy "Users can update their own attendance." 
  on public.attendance for update 
  using ( auth.uid() = member_id );
