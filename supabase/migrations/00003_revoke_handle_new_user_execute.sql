-- =====================================================
-- HARDENING (cont.): revocar EXECUTE directo de anon/authenticated
-- Supabase otorga EXECUTE a estos roles por defecto en el schema public
-- expuesto, además del grant heredado de PUBLIC. La revocación de 00002
-- solo cubrió PUBLIC; este paso cierra el acceso directo restante.
-- =====================================================
revoke execute on function public.handle_new_user() from anon, authenticated;
