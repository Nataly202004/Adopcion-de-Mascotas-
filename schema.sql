-- Esquema PostgreSQL para Huellas Felices.
-- Puede ejecutarse más de una vez; los ALTER permiten actualizar instalaciones existentes.

CREATE TABLE IF NOT EXISTS usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'usuario',
    fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mascota (
    id_mascota SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    raza VARCHAR(100),
    edad INTEGER,
    sexo VARCHAR(20),
    tamano VARCHAR(20),
    descripcion TEXT,
    foto_url TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible',
    id_admin_registro INTEGER REFERENCES usuario(id_usuario)
);

-- Compatibilidad con bases creadas antes de que raza estuviera en el formulario admin.
ALTER TABLE mascota ADD COLUMN IF NOT EXISTS raza VARCHAR(100);

CREATE TABLE IF NOT EXISTS solicitud_adopcion (
    id_solicitud SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuario(id_usuario),
    id_mascota INTEGER REFERENCES mascota(id_mascota),
    mascota VARCHAR(100),
    nombre VARCHAR(150),
    celular VARCHAR(50),
    direccion TEXT,
    correo VARCHAR(150),
    mensaje TEXT,
    fecha_solicitud TIMESTAMP DEFAULT NOW(),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    comentario TEXT
);

-- La API actual guarda los datos de contacto directamente con la solicitud.
-- Se agregan las columnas para actualizar tablas existentes sin borrar registros.
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS mascota VARCHAR(100);
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS nombre VARCHAR(150);
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS celular VARCHAR(50);
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS correo VARCHAR(150);
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS mensaje TEXT;
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS fecha_solicitud TIMESTAMP DEFAULT NOW();
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'pendiente';
ALTER TABLE solicitud_adopcion ADD COLUMN IF NOT EXISTS comentario TEXT;
