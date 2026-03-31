-- =============================================
-- AMBERTAP — Schema SQL
-- Pegar en Supabase > SQL Editor > New query
-- =============================================

create table vivos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  hora_inicio timestamptz,
  hora_fin timestamptz,
  plataforma text check (plataforma in ('tiktok', 'facebook', 'ambas')),
  created_at timestamptz default now()
);

create table prendas_vivo (
  id uuid primary key default gen_random_uuid(),
  vivo_id uuid references vivos(id) on delete cascade,
  nombre text not null,
  precio_unitario int,
  orden int default 0,
  activa boolean default false,
  created_at timestamptz default now()
);

create table variantes_prenda (
  id uuid primary key default gen_random_uuid(),
  prenda_vivo_id uuid references prendas_vivo(id) on delete cascade,
  color text,
  talle text,
  disponible boolean default true
);

create table clientas (
  id uuid primary key default gen_random_uuid(),
  nombre_display text not null,
  whatsapp text,
  compras_count int default 0,
  primera_compra timestamptz,
  ultima_compra timestamptz,
  created_at timestamptz default now()
);

create table perfiles_clienta (
  id uuid primary key default gen_random_uuid(),
  clienta_id uuid references clientas(id) on delete cascade,
  plataforma text check (plataforma in ('tiktok', 'facebook')),
  nombre_perfil text
);

create table pedidos (
  id uuid primary key default gen_random_uuid(),
  vivo_id uuid references vivos(id) on delete cascade,
  prenda_vivo_id uuid references prendas_vivo(id),
  clienta_id uuid references clientas(id),
  color text,
  talle text,
  incompleto boolean default false,
  hora timestamptz default now(),
  notas text,
  estado text default 'pendiente' check (estado in ('pendiente', 'preparado', 'enviado', 'cancelado'))
);

create table pagos (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  estado text default 'pendiente' check (estado in ('pendiente', 'confirmado', 'problema')),
  medio text check (medio in ('mercadopago', 'midinero', 'prex', 'credito', 'otro')),
  fecha_confirmacion timestamptz,
  notas text
);

-- =============================================
-- RLS: permitir todo a usuarios anónimos por ahora
-- (app interna, sin login en v1)
-- =============================================

alter table vivos enable row level security;
alter table prendas_vivo enable row level security;
alter table variantes_prenda enable row level security;
alter table clientas enable row level security;
alter table perfiles_clienta enable row level security;
alter table pedidos enable row level security;
alter table pagos enable row level security;

create policy "acceso total anon" on vivos for all using (true) with check (true);
create policy "acceso total anon" on prendas_vivo for all using (true) with check (true);
create policy "acceso total anon" on variantes_prenda for all using (true) with check (true);
create policy "acceso total anon" on clientas for all using (true) with check (true);
create policy "acceso total anon" on perfiles_clienta for all using (true) with check (true);
create policy "acceso total anon" on pedidos for all using (true) with check (true);
create policy "acceso total anon" on pagos for all using (true) with check (true);

-- =============================================
-- Real-time: habilitar para sincronización
-- =============================================

alter publication supabase_realtime add table pedidos;
alter publication supabase_realtime add table prendas_vivo;
