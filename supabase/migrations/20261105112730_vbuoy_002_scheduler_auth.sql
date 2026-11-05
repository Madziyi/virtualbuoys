create function public.validate_vbuoy_scheduler_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select p_token is not null
     and octet_length(p_token) >= 64
     and exists (
       select 1
       from vault.decrypted_secrets s
       where s.name = 'vbuoy_scheduler_token'
         and extensions.digest(s.decrypted_secret, 'sha256') = extensions.digest(p_token, 'sha256')
     );
$$;

revoke all on function public.validate_vbuoy_scheduler_token(text) from public, anon, authenticated;
grant execute on function public.validate_vbuoy_scheduler_token(text) to service_role;

comment on function public.validate_vbuoy_scheduler_token(text) is 'Server-only validator for the dedicated Vault-backed pg_cron to Edge Function token.';
