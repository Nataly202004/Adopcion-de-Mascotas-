# Huellas Felices — puesta en marcha

## Requisitos
- Node.js 22 o superior
- PostgreSQL (por ejemplo, una base de datos de Supabase)

## Base de datos
En Supabase abre **SQL Editor**, copia y ejecuta el contenido de `schema.sql` de este repositorio. El script crea/actualiza las tablas necesarias; no borra los datos existentes.

## Configuración local
1. Copia `.env.example` como `.env`.
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
2. Edita `.env` y define `DATABASE_URL` con la cadena PostgreSQL de tu proveedor.
3. Configura SMTP solo si deseas que las solicitudes de adopción envíen correo. Para Gmail usa una contraseña de aplicación, no la contraseña normal.
4. No publiques ni compartas `.env`; ya está excluido en `.gitignore`.
5. En una terminal, desde la carpeta que contiene `package.json`, ejecuta:

   ```bash
   npm install
   npm run dev
   ```

6. Abre `http://localhost:3000`. Comprueba que el servidor responde en `http://localhost:3000/api/health`.

Si el navegador muestra `ERR_CONNECTION_REFUSED`, el servidor no está ejecutándose o se abrió otra dirección/puerto. Deja la terminal abierta mientras pruebas la página.

## Vercel
Agrega las variables de entorno necesarias en **Project → Settings → Environment Variables** y vuelve a desplegar. La base de datos debe estar inicializada con `schema.sql`. El endpoint `/api/health` permite verificar que el backend desplegado responde.

## Errores habituales
- `DATABASE_URL_MISSING`: falta la variable `DATABASE_URL`.
- Error de autenticación/conexión PostgreSQL: revisa la cadena de conexión y la contraseña en el proveedor.
- Error de tabla/columna: ejecuta el `schema.sql` actualizado en la misma base que indica `DATABASE_URL`.
- Solicitud guardada sin notificación: completa las variables SMTP; la solicitud se guarda aunque el correo no se pueda enviar.
