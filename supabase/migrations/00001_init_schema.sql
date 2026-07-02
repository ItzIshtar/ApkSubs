-- =====================================================
-- SCHEMA: Plataforma de gestión de suscripciones
-- Motor: Supabase (Postgres)
-- =====================================================

-- ---------------------------------------------------
-- 1. PROFILES (extiende auth.users de Supabase)
-- ---------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  currency_preference text not null default 'MXN',
  notification_lead_days int not null default 3, -- días antes de un cobro para avisar
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger: crear profile automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------
-- 2. SUBSCRIPTIONS
-- ---------------------------------------------------
create type billing_cycle as enum ('weekly', 'monthly', 'quarterly', 'yearly');
create type subscription_status as enum ('active', 'paused', 'cancelled');
create type subscription_category as enum (
  'streaming', 'software', 'meal_kit', 'fitness', 'gaming',
  'news_media', 'cloud_storage', 'music', 'education', 'other'
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service_name text not null,
  category subscription_category not null default 'other',
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'MXN',
  billing_cycle billing_cycle not null default 'monthly',
  next_billing_date date not null,
  status subscription_status not null default 'active',
  payment_method_label text, -- ej. "Tarjeta terminación 4321" (nunca datos reales de tarjeta)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_next_billing on public.subscriptions(next_billing_date);
create index idx_subscriptions_status on public.subscriptions(user_id, status);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on public.subscriptions for delete
  using (auth.uid() = user_id);


-- ---------------------------------------------------
-- 3. NOTIFICATIONS
-- ---------------------------------------------------
create type notification_type as enum (
  'upcoming_payment', 'duplicate_service', 'price_increase', 'savings_opportunity'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  type notification_type not null,
  message text not null,
  is_read boolean not null default false,
  scheduled_for timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index idx_notifications_user_id on public.notifications(user_id, is_read);
create index idx_notifications_scheduled on public.notifications(scheduled_for);

alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Insert lo hace el backend (Edge Function con service role), no el cliente directamente.


-- ---------------------------------------------------
-- 4. RECOMMENDATIONS (planes alternativos / ahorro potencial)
-- ---------------------------------------------------
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete cascade,
  suggested_action text not null, -- ej. "Cambiar a plan anual: ahorras $240/año"
  estimated_savings numeric(10,2),
  currency text not null default 'MXN',
  is_dismissed boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_recommendations_user_id on public.recommendations(user_id, is_dismissed);

alter table public.recommendations enable row level security;

create policy "Users can view own recommendations"
  on public.recommendations for select
  using (auth.uid() = user_id);

create policy "Users can dismiss own recommendations"
  on public.recommendations for update
  using (auth.uid() = user_id);


-- ---------------------------------------------------
-- 5. TRIGGER GENÉRICO: updated_at automático
-- ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_profiles
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_updated_at_subscriptions
  before update on public.subscriptions
  for each row execute function public.set_updated_at();


-- ---------------------------------------------------
-- 6. VISTA: resumen mensual de gasto por usuario
-- ---------------------------------------------------
create view public.monthly_spend_summary as
select
  user_id,
  currency,
  sum(
    case billing_cycle
      when 'weekly' then amount * 4.33
      when 'monthly' then amount
      when 'quarterly' then amount / 3
      when 'yearly' then amount / 12
    end
  ) as estimated_monthly_spend
from public.subscriptions
where status = 'active'
group by user_id, currency;

-- Nota: las vistas heredan RLS de las tablas base solo si se crean con
-- "security_invoker = true" (Postgres 15+). Verifícalo en Supabase antes de exponerla en la API.
alter view public.monthly_spend_summary set (security_invoker = true);
