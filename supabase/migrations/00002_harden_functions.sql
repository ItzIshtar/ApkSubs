-- =====================================================
-- HARDENING: search_path fijo y revocación de EXECUTE público
-- Resuelve los advisors de seguridad:
--   - function_search_path_mutable (handle_new_user, set_updated_at)
--   - anon/authenticated_security_definer_function_executable (handle_new_user)
-- =====================================================

-- Todas las referencias dentro de ambas funciones están calificadas por
-- esquema (public.profiles) o son funciones de pg_catalog (now()), que
-- siempre se resuelven sin importar el search_path. Por eso es seguro
-- fijarlo vacío en vez de solo a "public".
alter function public.handle_new_user() set search_path = '';
alter function public.set_updated_at() set search_path = '';

-- handle_new_user solo debe ser invocada por el trigger on_auth_user_created
-- (que no depende de privilegios EXECUTE del rol), no por clientes vía
-- /rest/v1/rpc/handle_new_user. anon/authenticated heredan EXECUTE de PUBLIC
-- por defecto, así que revocarlo de PUBLIC cierra el acceso para ambos.
revoke execute on function public.handle_new_user() from public;
