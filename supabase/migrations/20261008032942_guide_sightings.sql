-- Originais privados; a publicação contém somente dados escolhidos para divulgação.
create table public.guide_sightings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id),
  guide_id uuid not null references public.guides(id),
  local_id uuid not null,
  species text not null check (length(btrim(species)) between 1 and 200),
  notes text not null default '' check (length(notes) <= 10000),
  observed_at timestamptz not null,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  photo_path text not null,
  audio_path text,
  received_at timestamptz not null default now(),
  unique (user_id, local_id),
  unique (id, guide_id),
  check ((latitude is null) = (longitude is null))
);
create index guide_sightings_guide_date on public.guide_sightings (guide_id, observed_at desc);

create table public.guide_sighting_publications (
  sighting_id uuid primary key,
  guide_id uuid not null,
  species text not null check (length(btrim(species)) between 1 and 200),
  public_notes text not null default '' check (length(public_notes) <= 10000),
  observed_at timestamptz not null,
  public_latitude double precision not null check (public_latitude between -90 and 90),
  public_longitude double precision not null check (public_longitude between -180 and 180),
  published_at timestamptz not null default now(),
  foreign key (sighting_id, guide_id) references public.guide_sightings(id, guide_id) on delete cascade
);
create index guide_sighting_publications_guide_date on public.guide_sighting_publications (guide_id, observed_at desc);
alter table public.guide_sightings enable row level security;
alter table public.guide_sighting_publications enable row level security;
revoke all on public.guide_sightings, public.guide_sighting_publications from anon, authenticated;
grant select, insert, update on public.guide_sightings to authenticated;
grant select on public.guide_sighting_publications to anon, authenticated;
grant insert, update, delete on public.guide_sighting_publications to authenticated;

create policy sightings_owner_read on public.guide_sightings for select to authenticated
using (user_id = (select auth.uid()));
create policy sightings_vip_insert on public.guide_sightings for insert to authenticated
with check (user_id = (select auth.uid()) and exists (
 select 1 from public.guides g where g.id = guide_id and g.user_id = (select auth.uid())
 and g.vip and g.status = 'approved' and g.cadastur_verificado));
create policy sightings_vip_update on public.guide_sightings for update to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists (
 select 1 from public.guides g where g.id = guide_id and g.user_id = (select auth.uid())
 and g.vip and g.status = 'approved' and g.cadastur_verificado));

create policy publications_public_read on public.guide_sighting_publications for select to anon, authenticated
using (exists (select 1 from public.public_guide_profiles g where g.id = guide_id and g.vip));
create policy publications_owner_insert on public.guide_sighting_publications for insert to authenticated
with check (exists (select 1 from public.guide_sightings s join public.guides g on g.id = s.guide_id
 where s.id = sighting_id and s.guide_id = guide_sighting_publications.guide_id
 and s.user_id = (select auth.uid()) and g.vip and g.status = 'approved' and g.cadastur_verificado));
create policy publications_owner_update on public.guide_sighting_publications for update to authenticated
using (exists (select 1 from public.guide_sightings s where s.id = sighting_id and s.user_id = (select auth.uid())))
with check (exists (select 1 from public.guide_sightings s join public.guides g on g.id = s.guide_id
 where s.id = sighting_id and s.guide_id = guide_sighting_publications.guide_id
 and s.user_id = (select auth.uid()) and g.vip and g.status = 'approved' and g.cadastur_verificado));
create policy publications_owner_delete on public.guide_sighting_publications for delete to authenticated
using (exists (select 1 from public.guide_sightings s where s.id = sighting_id and s.user_id = (select auth.uid())));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('guide-sightings', 'guide-sightings', false, 52428800,
 array['image/jpeg','image/png','image/webp','image/heic','image/heif','audio/mp4','audio/x-m4a','audio/mpeg','audio/ogg','audio/webm','audio/wav']);
create policy sightings_media_owner_read on storage.objects for select to authenticated
using (bucket_id = 'guide-sightings' and (storage.foldername(name))[1] = (select auth.uid())::text);
-- Sem UPDATE/DELETE: não substituir originais já recebidos. Upload repetido usa upsert:false.
create policy sightings_media_vip_upload on storage.objects for insert to authenticated
with check (bucket_id = 'guide-sightings' and (storage.foldername(name))[1] = (select auth.uid())::text
 and exists (select 1 from public.guides g where g.user_id = (select auth.uid())
 and g.vip and g.status = 'approved' and g.cadastur_verificado));

create function public.bind_guide_sighting() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare resolved_guide uuid; expected_prefix text;
begin
 if auth.uid() is null then raise exception 'Faça login para sincronizar.'; end if;
 select g.id into strict resolved_guide from public.guides g
 where g.user_id = auth.uid() and g.vip and g.status = 'approved' and g.cadastur_verificado;
 if tg_op = 'UPDATE' then
   if new.local_id is distinct from old.local_id or new.photo_path is distinct from old.photo_path
     or new.audio_path is distinct from old.audio_path then
     raise exception 'Identificador e mídias originais não podem ser substituídos.';
   end if;
   new.id := old.id;
   new.received_at := old.received_at;
 else new.received_at := now(); end if;
 new.user_id := auth.uid(); new.guide_id := resolved_guide;
 expected_prefix := new.user_id::text || '/' || new.local_id::text || '/';
 if new.photo_path not like expected_prefix || '%' or not exists (
   select 1 from storage.objects o where o.bucket_id = 'guide-sightings' and o.name = new.photo_path
   and o.metadata->>'mimetype' like 'image/%'
 ) then raise exception 'Envie a foto original antes de confirmar o registro.'; end if;
 if new.audio_path is not null and (new.audio_path not like expected_prefix || '%' or not exists (
   select 1 from storage.objects o where o.bucket_id = 'guide-sightings' and o.name = new.audio_path
   and o.metadata->>'mimetype' like 'audio/%'
 )) then raise exception 'Envie o áudio original antes de confirmar o registro.'; end if;
 return new;
end $$;
revoke all on function public.bind_guide_sighting() from public, anon, authenticated;
create trigger bind_guide_sighting before insert or update on public.guide_sightings
for each row execute function public.bind_guide_sighting();
