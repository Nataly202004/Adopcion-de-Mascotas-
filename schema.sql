-- Tabla usuario
create table usuario (
  id_usuario serial primary key,
  nombre_completo varchar(150) not null,
  correo varchar(150) unique not null,
  contrasena varchar(255) not null,
  rol varchar(20) not null default 'usuario', -- visitante / usuario / admin
  fecha_registro timestamp default now()
);

-- Tabla mascota
create table mascota (
  id_mascota serial primary key,
  nombre varchar(100) not null,
  especie varchar(50) not null,
  raza varchar(100),
  edad integer,
  sexo varchar(20),
  tamano varchar(20),
  descripcion text,
  foto_url text,
  estado varchar(20) default 'disponible', -- disponible / adoptada
  id_admin_registro integer references usuario(id_usuario)
);

-- Tabla solicitud_adopcion
-- El formulario del catálogo envía los datos de contacto directamente
-- (src/routes/solicitudes.js), sin requerir una cuenta de usuario.
create table solicitud_adopcion (
  id_solicitud serial primary key,
  id_usuario integer references usuario(id_usuario),
  id_mascota integer references mascota(id_mascota),
  mascota varchar(100) not null,   -- nombre de la mascota elegida en el catálogo
  nombre varchar(150) not null,
  celular varchar(30) not null,
  direccion text not null,
  correo varchar(150) not null,
  mensaje text not null,
  fecha_solicitud timestamp default now(),
  estado varchar(20) default 'pendiente', -- pendiente / aprobada / rechazada
  comentario text
);