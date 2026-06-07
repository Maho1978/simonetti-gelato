-- Migration: Watermark-Config Singleton-Tabelle
-- Datum: 2026-06-08
-- Manuell im Supabase SQL Editor ausführen.
-- Zweck: Speichert Wasserzeichen-Einstellungen (ein Datensatz, id=1).

create table if not exists watermark_config (
  id               int primary key default 1 check (id = 1),
  text             text        not null default 'Eiscafé Simonetti',
  font_size_percent numeric     not null default 7,
  opacity          numeric     not null default 0.3,
  position         text        not null default 'center'
                               check (position in ('center','bottom-right','top-left','tile')),
  rotation         int         not null default -30,
  color            text        not null default '#FFFFFF',
  shadow_enabled   boolean     not null default true,
  shadow_color     text        not null default '#000000',
  font_weight      text        not null default 'bold'
                               check (font_weight in ('normal','bold')),
  updated_at       timestamptz not null default now()
);

insert into watermark_config (id)
  values (1)
  on conflict do nothing;

alter table watermark_config enable row level security;

-- Neue Supabase-Pflicht-GRANTs (ab 30.5.2026)
grant select on watermark_config to anon, authenticated;
grant update on watermark_config to authenticated;
grant all    on watermark_config to service_role;

-- RLS: Lesen für alle, Schreiben nur für authentifizierte
create policy if not exists "select_watermark_config"
  on watermark_config for select using (true);

create policy if not exists "update_watermark_config"
  on watermark_config for update using (auth.role() = 'authenticated');
