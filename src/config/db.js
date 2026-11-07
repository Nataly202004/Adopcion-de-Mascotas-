require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const url = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
}) : null;
if (pool) pool.on('error', error => console.error('Error del pool:', error.message));

function missing() {
  const error = new Error('No se ha configurado la conexión a la base de datos.');
  error.code = 'DATABASE_URL_MISSING';
  return error;
}
async function api(table, { method='GET', params, body, returnRows=false }={}) {
  if (!url || !key) throw missing();
  const query = params ? `?${params}` : '';
  const response = await fetch(`${url}/rest/v1/${table}${query}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(returnRows ? {Prefer: 'return=representation'} : {Prefer: 'return=minimal'})
    },
    body: body == null ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) {
    let details = {};
    try { details = await response.json(); } catch {}
    const error = new Error(details.message || details.error || `Supabase HTTP ${response.status}`);
    error.code = details.code || 'SUPABASE_API_ERROR';
    throw error;
  }
  if (response.status === 204 || !returnRows && method !== 'GET') return null;
  return response.json();
}
async function query(text, params=[]) {
  if (!pool) throw missing();
  return pool.query(text,params);
}
async function health() {
  if (pool) return query('SELECT 1');
  await api('mascota',{params: new URLSearchParams({select:'id_mascota',limit:'1'})});
}
async function listMascotas() {
  if (pool) return (await query('SELECT * FROM mascota ORDER BY id_mascota DESC')).rows;
  return api('mascota',{params:new URLSearchParams({select:'*',order:'id_mascota.desc'})});
}
async function findUsuarioByCorreo(correo) {
  if (pool) return (await query('SELECT * FROM usuario WHERE lower(correo) = lower($1) LIMIT 1',[correo])).rows[0]||null;
  return (await api('usuario',{params:new URLSearchParams({select:'*',correo:`eq.${correo}`,limit:'1'})}))[0]||null;
}
async function findUsuarioById(id) {
  if (pool) return (await query('SELECT * FROM usuario WHERE id_usuario=$1',[id])).rows[0]||null;
  return (await api('usuario',{params:new URLSearchParams({select:'*',id_usuario:`eq.${id}`,limit:'1'})}))[0]||null;
}
async function createUsuario(u) {
  if (pool) return (await query('INSERT INTO usuario(nombre_completo,correo,contrasena,rol) VALUES($1,$2,$3,$4) RETURNING id_usuario,nombre_completo,correo,rol',[u.nombre_completo,u.correo,u.contrasena,'usuario'])).rows[0];
  const [record] = await api('usuario',{method:'POST',body:{...u,rol:'usuario'},returnRows:true});
  if (!record) throw new Error('No se recibió el usuario registrado.');
  const {contrasena,...safe} = record;
  return safe;
}
async function createMascota(m) {
  // Se adapta al esquema original: no se utiliza columna "raza".
  const record = {nombre:m.nombre,especie:m.especie,edad:m.edad,descripcion:m.descripcion,
    foto_url:m.foto_url||null,estado:'disponible',id_admin_registro:m.id_admin_registro};
  if (pool) return (await query(`INSERT INTO mascota(nombre,especie,edad,descripcion,foto_url,estado,id_admin_registro)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,Object.values(record))).rows[0];
  return (await api('mascota',{method:'POST',body:record,returnRows:true}))[0];
}
async function createSolicitud(s) {
  // En el esquema original el único campo libre para detalles es comentario.
  const record = {id_usuario:s.id_usuario,id_mascota:s.id_mascota,comentario:s.comentario,estado:'pendiente'};
  if (pool) return (await query(`INSERT INTO solicitud_adopcion(id_usuario,id_mascota,comentario,estado)
    VALUES($1,$2,$3,$4) RETURNING id_solicitud`,Object.values(record))).rows[0];
  return (await api('solicitud_adopcion',{method:'POST',body:record,returnRows:true}))[0];
}
module.exports={pool,query,health,listMascotas,findUsuarioByCorreo,findUsuarioById,createUsuario,createMascota,createSolicitud};
