-- Execute este arquivo somente depois de criar a conta administrativa
-- em https://pantanal.bento.host/guias/login/
--
-- Troque o texto ADMIN@EXEMPLO.COM pelo e-mail correto antes de executar.

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('ADMIN@EXEMPLO.COM')
on conflict (user_id) do nothing;

-- Confirma se a conta foi cadastrada como administradora.
select au.email, adm.user_id
from public.admin_users adm
join auth.users au on au.id = adm.user_id
order by au.email;
