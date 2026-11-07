-- Agrega a una base ya creada con la versión anterior de schema.sql las
-- columnas que usa el código (src/config/db.js). Ejecutar una vez en
-- Supabase: SQL Editor > New query > pegar y Run. Es seguro repetirlo.
-- Las columnas quedan opcionales para no fallar si ya existen filas.

alter table mascota add column if not exists raza varchar(100);

alter table solicitud_adopcion add column if not exists mascota varchar(100);
alter table solicitud_adopcion add column if not exists nombre varchar(150);
alter table solicitud_adopcion add column if not exists celular varchar(30);
alter table solicitud_adopcion add column if not exists direccion text;
alter table solicitud_adopcion add column if not exists correo varchar(150);
alter table solicitud_adopcion add column if not exists mensaje text;
