require('dotenv').config();
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
    ? new Pool({
        connectionString: databaseUrl,
        // Supabase requiere TLS; DB_SSL=false permite PostgreSQL local sin TLS.
        ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
    })
    : null;

if (pool) {
    pool.on('error', (error) => {
        console.error('Error inesperado en el pool de PostgreSQL:', error.message);
    });
} else {
    console.warn('DATABASE_URL no está configurada. La web abrirá, pero las rutas de base de datos no funcionarán.');
}

async function query(text, params) {
    if (!pool) {
        const error = new Error('Falta configurar DATABASE_URL en las variables de entorno.');
        error.code = 'DATABASE_URL_MISSING';
        throw error;
    }
    return pool.query(text, params);
}

module.exports = { query, pool };
