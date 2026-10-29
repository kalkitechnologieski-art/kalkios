-- ═══ KALKI OS — Inbound enquiries (lead capture) ═══
-- Every "talk to us" surface (contact form, quote request, WhatsApp fallback)
-- writes here. Visitors must never get table-level write access, so intake goes
-- through a SECURITY DEFINER function that inserts exactly the allowed columns.
-- Reads are admin-only: the table has no select policy for anon/authenticated.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.inquiries (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 2 and 120),
  email            text not null check (char_length(email) between 5 and 254),
  phone            text,
  company          text,
  service_interest text,
  budget_range     text,
  timeline         text,
  message          text not null check (char_length(message) between 10 and 4000),
  source           text not null default 'contact_page',
  status           text not null default 'new'
                     check (status in ('new', 'contacted', 'quoted', 'won', 'lost', 'spam')),
  admin_notes      text,
  ref_code         text unique not null default ('INQ-' || upper(substr(md5(random()::text), 1, 8))),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists inquiries_status_created_idx
  on public.inquiries (status, created_at desc);
create index if not exists inquiries_created_idx
  on public.inquiries (created_at desc);

alter table public.inquiries enable row level security;

revoke all on public.inquiries from public, anon, authenticated;
grant select on public.inquiries to authenticated;
grant all on public.inquiries to service_role;

create or replace function capture_inquiry(
  p_name             text,
  p_email            text,
  p_phone            text,
  p_company          text,
  p_service_interest text,
  p_budget_range     text,
  p_timeline         text,
  p_message          text,
  p_source           text
) returns table (id uuid, ref_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.inquiries;
begin
  if coalesce(trim(p_name), '') = '' or char_length(trim(p_name)) > 120 then
    raise exception 'A name between 2 and 120 characters is required' using errcode = '22023';
  end if;

  if coalesce(trim(p_email), '') = ''
     or char_length(trim(p_email)) > 254
     or trim(p_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  if coalesce(trim(p_message), '') = '' or char_length(trim(p_message)) < 10 then
    raise exception 'Tell us a little more — at least 10 characters' using errcode = '22023';
  end if;

  insert into public.inquiries (
    name, email, phone, company, service_interest, budget_range, timeline, message, source
  ) values (
    trim(p_name),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_phone, '')), ''),
    nullif(trim(coalesce(p_company, '')), ''),
    nullif(trim(coalesce(p_service_interest, '')), ''),
    nullif(trim(coalesce(p_budget_range, '')), ''),
    nullif(trim(coalesce(p_timeline, '')), ''),
    trim(p_message),
    case
      when coalesce(trim(p_source), '') in ('contact_page','quote_page','product_page','whatsapp','footer')
      then trim(p_source)
      else 'contact_page'
    end
  )
  returning * into v_row;

  return query select v_row.id, v_row.ref_code;
end;
$$;

revoke all on function capture_inquiry(text, text, text, text, text, text, text, text, text) from public;
grant execute on function capture_inquiry(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- Admin status updates (staff edits run through the API, which validates first).
-- Sales inbox: restricted to ceo/admin/manager, not every staff role.
drop policy if exists "inquiries_admin_write" on public.inquiries;
create policy "inquiries_admin_write"
  on public.inquiries
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "inquiries_admin_read" on public.inquiries;
create policy "inquiries_admin_read"
  on public.inquiries
  for select
  to authenticated
  using (public.is_admin());
