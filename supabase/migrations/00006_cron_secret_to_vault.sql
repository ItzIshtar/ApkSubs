-- =====================================================
-- HARDENING: mover el secreto del cron a Supabase Vault
-- El valor ya no vive en texto plano en esta migración ni en el código de
-- la Edge Function; se guarda cifrado en vault.secrets y el cron job lo
-- resuelve en tiempo de ejecución vía vault.decrypted_secrets.
-- =====================================================

-- El secreto se crea una sola vez fuera de esta migración (vault.create_secret
-- no es idempotente vía "if not exists"), con:
--   select vault.create_secret(
--     '<valor>', 'cron_shared_secret',
--     'Shared secret sent as x-cron-secret when pg_cron invokes the generate-insights Edge Function'
--   );

select cron.unschedule('daily-generate-insights');

select cron.schedule(
  'daily-generate-insights',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://plqenboobrzixidpqzks.supabase.co/functions/v1/generate-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'cron_shared_secret'
      )
    ),
    body := jsonb_build_object('trigger', 'cron')
  ) as request_id;
  $$
);
