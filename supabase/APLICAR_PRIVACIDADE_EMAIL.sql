-- Execute uma vez no SQL Editor do projeto Bento-Pantanal.
-- Evita que o e-mail usado no login do guia seja exposto na consulta pública.

begin;

drop view if exists public.public_guide_profiles;
create view public.public_guide_profiles
with (security_barrier = true)
as
select
  id,
  slug,
  nome,
  nome_profissional,
  bio,
  foto_perfil,
  foto_capa,
  whatsapp,
  instagram,
  facebook,
  site,
  regioes,
  idiomas,
  especialidades,
  cadastur_verificado,
  vip,
  vip_position,
  personal_domain,
  expedition_leader,
  created_at,
  updated_at
from public.guides
where status = 'approved' and cadastur_verificado = true;

revoke all on table public.public_guide_profiles from public, anon, authenticated;
grant select on table public.public_guide_profiles to anon, authenticated;

commit;
