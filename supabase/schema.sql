create table if not exists public.exam_progress (
 user_id uuid not null references auth.users(id) on delete cascade,
 exam_id text not null,
 payload jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now(),
 primary key (user_id,exam_id)
);
alter table public.exam_progress enable row level security;
create policy "Users read own progress" on public.exam_progress for select to authenticated using ((select auth.uid())=user_id);
create policy "Users insert own progress" on public.exam_progress for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users update own progress" on public.exam_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
