-- Ejecuta SOLO el bloque nuevo en el SQL Editor de Supabase (las demás tablas ya existen).
create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  titulo text not null,
  fecha date not null,
  tipo text not null default 'pendiente' check (tipo in ('examen','entrega','pendiente')),
  hecho boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.eventos enable row level security;

create policy "eventos: solo el dueño" on public.eventos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
