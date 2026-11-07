-- =====================================================================
-- Huellas Felices: configuración de un proyecto NUEVO de Supabase para
-- que el frontend (GitHub Pages) hable directo con Supabase.
--
-- Cómo usarlo: Supabase > SQL Editor > New query > pegar todo > Run.
-- Se puede volver a ejecutar sin duplicar nada.
--
-- Seguridad: el navegador usa la clave pública (anon/publishable). Lo que
-- cada visitante puede hacer lo deciden las políticas RLS de abajo.
-- Nunca pongas la service_role key en el HTML.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Perfiles: datos extra de cada cuenta de Supabase Auth.
--    El login y las contraseñas los gestiona Supabase Auth (auth.users).
-- ---------------------------------------------------------------------
create table if not exists public.perfil (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null default '',
  rol text not null default 'usuario' check (rol in ('usuario', 'admin')),
  fecha_registro timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse. El nombre llega en
-- options.data.nombre_completo de supabase.auth.signUp().
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfil (id, nombre_completo)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre_completo', ''));
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ¿El usuario que hace la petición es administrador?
-- security definer evita que las políticas de perfil se llamen a sí mismas.
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfil
    where id = (select auth.uid()) and rol = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 2. Mascotas
-- ---------------------------------------------------------------------
create table if not exists public.mascota (
  id_mascota integer generated always as identity primary key,
  nombre varchar(100) not null,
  especie varchar(50) not null,
  raza varchar(100),
  edad integer check (edad >= 0),
  sexo varchar(20),
  tamano varchar(20),
  descripcion text,
  foto_url text,
  estado varchar(20) not null default 'disponible' check (estado in ('disponible', 'adoptada')),
  registrada_por uuid references auth.users (id) on delete set null default auth.uid(),
  fecha_registro timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Solicitudes de adopción (se pueden enviar sin iniciar sesión)
-- ---------------------------------------------------------------------
create table if not exists public.solicitud_adopcion (
  id_solicitud integer generated always as identity primary key,
  id_usuario uuid references auth.users (id) on delete set null default auth.uid(),
  id_mascota integer references public.mascota (id_mascota) on delete set null,
  mascota varchar(100) not null,
  nombre varchar(150) not null,
  celular varchar(30) not null,
  direccion text not null,
  correo varchar(150) not null,
  mensaje text not null,
  estado varchar(20) not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  comentario text,
  fecha_solicitud timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Permisos y políticas RLS
-- ---------------------------------------------------------------------
alter table public.perfil enable row level security;
alter table public.mascota enable row level security;
alter table public.solicitud_adopcion enable row level security;

grant select on public.perfil to authenticated;
grant select on public.mascota to anon, authenticated;
grant insert, update, delete on public.mascota to authenticated;
grant insert on public.solicitud_adopcion to anon, authenticated;
grant select, update on public.solicitud_adopcion to authenticated;
grant execute on function public.es_admin() to anon, authenticated;

-- Perfil: cada quien ve el suyo; el admin ve todos. Nadie puede cambiarse
-- el rol desde el navegador (no hay política de update).
drop policy if exists "perfil: ver el propio o admin" on public.perfil;
create policy "perfil: ver el propio o admin" on public.perfil
  for select to authenticated
  using (id = (select auth.uid()) or (select public.es_admin()));

-- Mascotas: el catálogo es público; solo el admin agrega, edita o borra.
drop policy if exists "mascota: lectura publica" on public.mascota;
create policy "mascota: lectura publica" on public.mascota
  for select to anon, authenticated
  using (true);

drop policy if exists "mascota: admin inserta" on public.mascota;
create policy "mascota: admin inserta" on public.mascota
  for insert to authenticated
  with check ((select public.es_admin()));

drop policy if exists "mascota: admin edita" on public.mascota;
create policy "mascota: admin edita" on public.mascota
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

drop policy if exists "mascota: admin borra" on public.mascota;
create policy "mascota: admin borra" on public.mascota
  for delete to authenticated
  using ((select public.es_admin()));

-- Solicitudes: cualquiera puede enviar una (siempre "pendiente" y sin
-- hacerse pasar por otro usuario). El solicitante ve las suyas; el admin
-- ve y actualiza todas.
drop policy if exists "solicitud: cualquiera envia" on public.solicitud_adopcion;
create policy "solicitud: cualquiera envia" on public.solicitud_adopcion
  for insert to anon, authenticated
  with check (
    estado = 'pendiente'
    and comentario is null
    and (id_usuario is null or id_usuario = (select auth.uid()))
  );

drop policy if exists "solicitud: ver propias o admin" on public.solicitud_adopcion;
create policy "solicitud: ver propias o admin" on public.solicitud_adopcion
  for select to authenticated
  using (id_usuario = (select auth.uid()) or (select public.es_admin()));

drop policy if exists "solicitud: admin actualiza" on public.solicitud_adopcion;
create policy "solicitud: admin actualiza" on public.solicitud_adopcion
  for update to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- ---------------------------------------------------------------------
-- 5. Datos iniciales: las mascotas que hoy muestra catalogo.html.
--    Solo se insertan si la tabla está vacía.
-- ---------------------------------------------------------------------
insert into public.mascota (nombre, especie, raza, edad, foto_url, registrada_por)
select v.nombre, v.especie, v.raza, v.edad, v.foto_url, null
from (values
  ('Luna',   'perro', 'Labrador',         2, 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600'),
  ('Max',    'perro', 'Pastor alemán',    3, 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=600'),
  ('Coco',   'perro', 'Beagle',           1, 'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600'),
  ('Rocky',  'perro', 'Boxer',            4, 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
  ('Nala',   'perro', 'Golden retriever', 2, 'https://images.unsplash.com/photo-1558788353-f76d92427f16?w=600'),
  ('Toby',   'perro', 'Mestizo',          5, 'https://images.unsplash.com/photo-1735989967755-706e5edcb44b?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'),
  ('Maya',   'perro', 'Husky',            3, 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600'),
  ('Bruno',  'perro', 'Bulldog',          4, 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600'),
  ('Simba',  'perro', 'Cocker spaniel',   2, 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600'),
  ('Daisy',  'perro', 'Poodle',           1, 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600'),
  ('Michi',  'gato',  'Gato doméstico',   2, 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600'),
  ('Pelusa', 'gato',  'Persa',            3, 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600'),
  ('Oliver', 'gato',  'Atigrado',         1, 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=600'),
  ('Milo',   'gato',  'Siamés',           2, 'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600'),
  ('Canela', 'gato',  'Carey',            4, 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=600'),
  ('Tom',    'gato',  'Mestizo',          5, 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600'),
  ('Lola',   'gato',  'Angora',           2, 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600'),
  ('Nina',   'gato',  'Gato blanco',      1, 'https://images.unsplash.com/photo-1495366822987-7c75f0fcbab4?w=600'),
  ('Simón',  'gato',  'Gato negro',       3, 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=600'),
  ('Cleo',   'gato',  'Gato tricolor',    2, 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=600')
) as v (nombre, especie, raza, edad, foto_url)
where not exists (select 1 from public.mascota);

-- ---------------------------------------------------------------------
-- 6. Convertir una cuenta en administrador (hacerlo DESPUÉS de que esa
--    persona se registre en la página). Cambia el correo y ejecuta solo
--    estas líneas:
--
-- update public.perfil set rol = 'admin'
-- where id = (select id from auth.users where email = 'correo-del-admin@ejemplo.com');
-- ---------------------------------------------------------------------
