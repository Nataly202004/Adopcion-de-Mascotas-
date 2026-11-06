require('dotenv').config();
const { Pool } = require('pg');

// Configuración del Pool de conexión para PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requisito obligatorio para conectar plataformas como Supabase con Vercel de forma segura
  }
});

// Prueba de conexión inicial al arrancar el servidor
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Error crítico al conectar con PostgreSQL en Supabase:', err.stack);
  } else {
    console.log('🚀 Conexión exitosa a PostgreSQL en Supabase establecida a las:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};

