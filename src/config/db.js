require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const pool = databaseUrl
    ? new Pool({
        connectionString: databaseUrl,
        // Supabase requiere TLS; DB_SSL=false permite PostgreSQL local sin TLS.
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    })
    : null;
const supabaseConfigured = Boolean(!pool && supabaseUrl && supabaseKey);

if (pool) {
    pool.on('error', (error) => {
        console.error('Error inesperado en el pool de PostgreSQL:', error.message);
    });
} else {
    console.warn('DATABASE_URL no está configurada; se intentará usar la API de Supabase.');
}

function missingConfiguration() {
    const error = new Error('Falta configurar DATABASE_URL o las variables de Supabase.');
    error.code = 'DATABASE_URL_MISSING';
    return error;
}

async function supabaseRequest(table, { method = 'GET', params, body, returnRows = false } = {}) {
    if (!supabaseConfigured) throw missingConfiguration();
    const query = params ? `?${params.toString()}` : '';
    const response = await fetch(`${supabaseUrl}/rest/v1/${table}${query}`, {
        method,
        headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            Prefer: returnRows ? 'return=representation' : 'return=minimal'
        },
        body: body ? JSON.stringify(body) : undefined
    });
    if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        const error = new Error(details.message || `Supabase respondió ${response.status}`);
        error.code = details.code || 'SUPABASE_API_ERROR';
        throw error;
    }
    return response.status === 204 ? null : response.json();
}

async function query(text, params) {
    if (!pool) {
        throw missingConfiguration();
    }
    return pool.query(text, params);
}

async function health() {
    if (pool) return query('SELECT 1');
    const params = new URLSearchParams({ select: 'id_mascota', limit: '1' });
    await supabaseRequest('mascota', { params });
}

async function listMascotas() {
    if (pool) return (await query('SELECT * FROM mascota ORDER BY id_mascota DESC')).rows;
    const params = new URLSearchParams({ select: '*', order: 'id_mascota.desc' });
    return supabaseRequest('mascota', { params });
}

async function createMascota(mascota) {
    if (pool) {
        return (await query(
            `INSERT INTO mascota (nombre, especie, raza, edad, descripcion, estado)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id_mascota, nombre, especie, raza, edad, descripcion, estado`,
            [mascota.nombre, mascota.especie, mascota.raza, mascota.edad, mascota.descripcion, mascota.estado]
        )).rows[0];
    }
    return (await supabaseRequest('mascota', { method: 'POST', body: mascota, returnRows: true }))[0];
}

async function createUsuario(usuario) {
    if (pool) {
        return (await query(
            `INSERT INTO usuario (nombre_completo, correo, contrasena, rol)
             VALUES ($1, $2, $3, 'usuario')
             RETURNING id_usuario, nombre_completo, correo, rol`,
            [usuario.nombre_completo, usuario.correo, usuario.contrasena]
        )).rows[0];
    }
    const rows = await supabaseRequest('usuario', { method: 'POST', body: usuario, returnRows: true });
    const { contrasena, ...safeUser } = rows[0];
    return safeUser;
}

async function findUsuarioByCorreo(correo) {
    if (pool) return (await query('SELECT * FROM usuario WHERE correo = $1', [correo])).rows[0] || null;
    const params = new URLSearchParams({ select: '*', correo: `eq.${correo}`, limit: '1' });
    return (await supabaseRequest('usuario', { params }))[0] || null;
}

async function createSolicitud(solicitud) {
    if (pool) {
        await query(
            `INSERT INTO solicitud_adopcion (mascota, nombre, celular, direccion, correo, mensaje)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [solicitud.mascota, solicitud.nombre, solicitud.celular, solicitud.direccion, solicitud.correo, solicitud.mensaje]
        );
        return;
    }
    await supabaseRequest('solicitud_adopcion', { method: 'POST', body: solicitud });
}

module.exports = {
    query, pool, health, listMascotas, createMascota,
    createUsuario, findUsuarioByCorreo, createSolicitud
};
