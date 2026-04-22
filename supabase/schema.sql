-- ============================================================
-- ChanchitoEscolar - Schema completo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ============================================================
-- APODERADOS (tabla principal de usuarios)
-- Login solo por RUT, sin contraseña
-- ============================================================
create table apoderados (
  id uuid primary key default uuid_generate_v4(),
  rut text not null unique,
  nombre text not null,
  telefono text,
  created_at timestamptz default now()
);

-- ============================================================
-- CURSOS
-- ============================================================
create table cursos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  colegio text not null,
  codigo_unico text not null unique,
  anio integer not null default extract(year from now()),
  tesorero_id uuid not null references apoderados(id),
  created_at timestamptz default now()
);

-- ============================================================
-- CUENTA BANCARIA DEL CURSO
-- ============================================================
create table cuentas_bancarias (
  id uuid primary key default uuid_generate_v4(),
  curso_id uuid not null references cursos(id) on delete cascade,
  banco text not null,
  tipo_cuenta text not null check (tipo_cuenta in ('corriente', 'vista', 'ahorro')),
  numero_cuenta text not null,
  rut_titular text not null,
  nombre_titular text not null,
  email_notificacion text,
  created_at timestamptz default now()
);

-- ============================================================
-- ALUMNOS
-- ============================================================
create table alumnos (
  id uuid primary key default uuid_generate_v4(),
  curso_id uuid not null references cursos(id) on delete cascade,
  nombre text not null,
  apellido text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- RELACION ALUMNO-APODERADO (muchos a muchos)
-- ============================================================
create table alumno_apoderado (
  alumno_id uuid not null references alumnos(id) on delete cascade,
  apoderado_id uuid not null references apoderados(id) on delete cascade,
  relacion text,
  primary key (alumno_id, apoderado_id)
);

-- ============================================================
-- COLECTAS (mensualidad + eventos especiales)
-- ============================================================
create table colectas (
  id uuid primary key default uuid_generate_v4(),
  curso_id uuid not null references cursos(id) on delete cascade,
  nombre text not null,
  descripcion text,
  tipo text not null check (tipo in ('mensualidad', 'evento', 'cuotas')),
  monto_por_alumno integer not null,
  fecha_limite date,
  meses_activos integer[],  -- para tipo mensualidad: [3,4,5,6,7,8,9,10,11,12]
  estado text not null default 'activa' check (estado in ('activa', 'cerrada', 'archivada')),
  created_at timestamptz default now()
);

-- ============================================================
-- PAGOS
-- ============================================================
create table pagos (
  id uuid primary key default uuid_generate_v4(),
  alumno_id uuid not null references alumnos(id) on delete cascade,
  colecta_id uuid not null references colectas(id) on delete cascade,
  mes integer,  -- solo para colectas tipo mensualidad (3=marzo, 4=abril, etc.)
  monto integer not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'comprobante_enviado', 'verificado_ia', 'aprobado', 'rechazado')),
  comprobante_url text,
  ia_resultado jsonb,  -- { monto_detectado, fecha_detectada, cuenta_destino, confianza }
  aprobado_por uuid references apoderados(id),
  motivo_rechazo text,
  created_at timestamptz default now(),
  unique(alumno_id, colecta_id, mes)
);

-- ============================================================
-- GASTOS
-- ============================================================
create table gastos (
  id uuid primary key default uuid_generate_v4(),
  curso_id uuid not null references cursos(id) on delete cascade,
  descripcion text not null,
  monto integer not null,
  categoria text not null check (categoria in ('actividades', 'materiales', 'celebraciones', 'otros')),
  fecha date not null,
  comercio text,
  numero_boleta text,
  boleta_url text,
  created_at timestamptz default now()
);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
insert into storage.buckets (id, name, public) values ('boletas', 'boletas', false);
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table apoderados enable row level security;
alter table cursos enable row level security;
alter table cuentas_bancarias enable row level security;
alter table alumnos enable row level security;
alter table alumno_apoderado enable row level security;
alter table colectas enable row level security;
alter table pagos enable row level security;
alter table gastos enable row level security;

-- Apoderados: solo pueden ver y editar su propio perfil
create policy "apoderado_own" on apoderados
  for all using (id = auth.uid());

-- Cursos: tesorero puede hacer todo, apoderado solo leer los suyos
create policy "curso_tesorero" on cursos
  for all using (tesorero_id = auth.uid());

create policy "curso_apoderado_read" on cursos
  for select using (
    exists (
      select 1 from alumno_apoderado aa
      join alumnos a on a.id = aa.alumno_id
      where a.curso_id = cursos.id and aa.apoderado_id = auth.uid()
    )
  );

-- Cuenta bancaria: tesorero edita, apoderado lee
create policy "cuenta_tesorero" on cuentas_bancarias
  for all using (
    exists (select 1 from cursos where id = cuentas_bancarias.curso_id and tesorero_id = auth.uid())
  );

create policy "cuenta_apoderado_read" on cuentas_bancarias
  for select using (
    exists (
      select 1 from alumno_apoderado aa
      join alumnos a on a.id = aa.alumno_id
      where a.curso_id = cuentas_bancarias.curso_id and aa.apoderado_id = auth.uid()
    )
  );

-- Alumnos: tesorero edita, apoderado lee solo sus hijos
create policy "alumno_tesorero" on alumnos
  for all using (
    exists (select 1 from cursos where id = alumnos.curso_id and tesorero_id = auth.uid())
  );

create policy "alumno_apoderado_read" on alumnos
  for select using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id = alumnos.id and aa.apoderado_id = auth.uid()
    )
  );

-- Colectas: tesorero edita, apoderado lee
create policy "colecta_tesorero" on colectas
  for all using (
    exists (select 1 from cursos where id = colectas.curso_id and tesorero_id = auth.uid())
  );

create policy "colecta_apoderado_read" on colectas
  for select using (
    exists (
      select 1 from alumno_apoderado aa
      join alumnos a on a.id = aa.alumno_id
      where a.curso_id = colectas.curso_id and aa.apoderado_id = auth.uid()
    )
  );

-- Pagos: tesorero edita/aprueba, apoderado puede insertar comprobante de sus hijos
create policy "pago_tesorero" on pagos
  for all using (
    exists (
      select 1 from alumnos a
      join cursos c on c.id = a.curso_id
      where a.id = pagos.alumno_id and c.tesorero_id = auth.uid()
    )
  );

create policy "pago_apoderado_read" on pagos
  for select using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id = pagos.alumno_id and aa.apoderado_id = auth.uid()
    )
  );

create policy "pago_apoderado_comprobante" on pagos
  for update using (
    exists (
      select 1 from alumno_apoderado aa
      where aa.alumno_id = pagos.alumno_id and aa.apoderado_id = auth.uid()
    )
  )
  with check (estado = 'comprobante_enviado');

-- Gastos: tesorero edita, apoderado lee
create policy "gasto_tesorero" on gastos
  for all using (
    exists (select 1 from cursos where id = gastos.curso_id and tesorero_id = auth.uid())
  );

create policy "gasto_apoderado_read" on gastos
  for select using (
    exists (
      select 1 from alumno_apoderado aa
      join alumnos a on a.id = aa.alumno_id
      where a.curso_id = gastos.curso_id and aa.apoderado_id = auth.uid()
    )
  );

-- ============================================================
-- INDICES para performance
-- ============================================================
create index idx_alumnos_curso on alumnos(curso_id);
create index idx_pagos_alumno on pagos(alumno_id);
create index idx_pagos_colecta on pagos(colecta_id);
create index idx_pagos_estado on pagos(estado);
create index idx_gastos_curso on gastos(curso_id);
create index idx_colectas_curso on colectas(curso_id);
create index idx_alumno_apoderado_apoderado on alumno_apoderado(apoderado_id);
