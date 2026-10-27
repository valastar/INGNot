-- Ejecutar UNA vez en Supabase → SQL Editor (antes de abrir la app)
alter table public.notas add column if not exists etiquetas text[] not null default '{}';
alter table public.notas add column if not exists fijada boolean not null default false;
