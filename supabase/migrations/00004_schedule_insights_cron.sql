-- =====================================================
-- CRON: invocación diaria de la Edge Function generate-insights
-- Detecta duplicados, próximos cobros y oportunidades de ahorro.
-- =====================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'daily-generate-insights',
  '0 8 * * *', -- 08:00 UTC todos los días
  $$
  select net.http_post(
    url := 'https://plqenboobrzixidpqzks.supabase.co/functions/v1/generate-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '46e90f6d387de56a361c1e86ea4ec5aa0fda911a1d15fe54'
    ),
    body := jsonb_build_object('trigger', 'cron')
  ) as request_id;
  $$
);
