-- =====================================================
-- HARDENING: mover pg_net fuera del schema public
-- Resuelve el advisor de seguridad "extension_in_public" para pg_net.
-- pg_net no soporta "ALTER EXTENSION ... SET SCHEMA" (rechazado por Postgres),
-- así que se recrea especificando el schema. Las funciones de pg_net
-- (net.http_post, etc.) siguen viviendo en el schema "net" que la propia
-- extensión crea, así que el cron job (00004) no se ve afectado.
-- =====================================================
drop extension if exists pg_net;
create extension if not exists pg_net schema extensions;
