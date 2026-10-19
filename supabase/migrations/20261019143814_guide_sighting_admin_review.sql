-- Toda proposta existente passa a pendente; os originais não são alterados.
alter table public.guide_sighting_publications
  add column review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  add column submitted_at timestamptz not null default now(),
  add column reviewed_at timestamptz,
  add column submission_version bigint not null default 1 check (submission_version > 0);

alter table public.guide_sighting_publications add constraint publication_review_timestamp
  check ((review_status = 'pending' and reviewed_at is null)
      or (review_status in ('approved','rejected') and reviewed_at is not null));

create index guide_sighting_publications_review_queue_idx
  on public.guide_sighting_publications (review_status, submitted_at desc, sighting_id);

create function public.enforce_sighting_publication_review()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  content_changed boolean;
  administrator boolean := coalesce(public.is_admin(), false);
begin
  if tg_op = 'INSERT' then
    new.review_status := 'pending';
    new.reviewed_at := null;
    new.submitted_at := clock_timestamp();
    new.submission_version := 1;
    new.published_at := clock_timestamp();
    return new;
  end if;
  if new.sighting_id is distinct from old.sighting_id or new.guide_id is distinct from old.guide_id then
    raise exception 'Não é permitido alterar a autoria da solicitação.' using errcode = '42501';
  end if;
  content_changed := row(new.species, new.public_notes, new.observed_at, new.public_latitude, new.public_longitude)
    is distinct from row(old.species, old.public_notes, old.observed_at, old.public_latitude, old.public_longitude);
  new.published_at := old.published_at;
  if not administrator or content_changed or (new.review_status = 'pending' and old.review_status <> 'pending') then
    -- Também vale para alterações feitas após uma aprovação anterior.
    new.review_status := 'pending';
    new.reviewed_at := null;
    new.submitted_at := clock_timestamp();
    new.submission_version := old.submission_version + 1;
  else
    new.submitted_at := old.submitted_at;
    new.submission_version := old.submission_version;
    if new.review_status in ('approved','rejected') then
      if new.review_status = 'approved' and not exists (
        select 1 from public.public_guide_profiles g where g.id = new.guide_id and g.vip
      ) then
        raise exception 'A publicação exige um guia VIP aprovado e verificado.' using errcode = '42501';
      end if;
      new.reviewed_at := clock_timestamp();
      if new.review_status = 'approved' then new.published_at := new.reviewed_at; end if;
    else
      new.reviewed_at := null;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_sighting_publication_review() from public, anon, authenticated;
create trigger enforce_sighting_publication_review
before insert or update on public.guide_sighting_publications
for each row execute function public.enforce_sighting_publication_review();

drop policy publications_public_read on public.guide_sighting_publications;
create policy publications_public_read on public.guide_sighting_publications
for select to anon, authenticated
using (review_status = 'approved' and exists (
  select 1 from public.public_guide_profiles g
  where g.id = guide_sighting_publications.guide_id and g.vip
));

create policy publications_owner_read on public.guide_sighting_publications
for select to authenticated
using (exists (
  select 1 from public.guide_sightings s
  where s.id = guide_sighting_publications.sighting_id
    and s.user_id = (select auth.uid())
));

create policy publications_admin_read on public.guide_sighting_publications
for select to authenticated using ((select public.is_admin()));

create policy publications_admin_review on public.guide_sighting_publications
for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

alter table public.guide_sighting_publications enable row level security;
