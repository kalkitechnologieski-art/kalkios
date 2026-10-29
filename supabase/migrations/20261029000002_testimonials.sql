-- ═══ KALKI OS — Client testimonials ═══
-- Public proof layer. Rows are entered by the team only after a project has
-- closed, and nothing reaches the site until is_approved is true.
-- No rows ship pre-seeded: an empty, honest section beats an invented one.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  author_name   text not null,
  author_role   text,
  author_company text,
  city          text,
  quote         text not null check (char_length(quote) between 20 and 900),
  rating        smallint not null default 5 check (rating between 1 and 5),
  service_id    uuid references public.services (id) on delete set null,
  project_ref   text,
  is_approved   boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists testimonials_approved_idx
  on public.testimonials (is_approved, sort_order, created_at desc);

alter table public.testimonials enable row level security;

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read"
  on public.testimonials
  for select
  using (is_approved = true);

revoke all on public.testimonials from public, anon, authenticated;
grant select on public.testimonials to anon, authenticated;
grant all on public.testimonials to service_role;
