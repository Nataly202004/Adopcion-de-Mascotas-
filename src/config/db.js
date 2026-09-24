const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Crea el archivo base_datos.db en la raíz de tu proyecto
const dbPath = path.resolve(__dirname, '../../base_datos.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a SQLite:', err.message);
    } else {
        console.log('Conexión establecida con la base de datos local (SQLite)');
        
        // Crear las tablas necesarias si no existen
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS usuario (
                id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre_completo TEXT,
                correo TEXT UNIQUE,
                contrasena TEXT,
                rol TEXT DEFAULT 'usuario'
            )`);
            
            db.run(`CREATE TABLE IF NOT EXISTS mascota (
                id_mascota INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT,
                especie TEXT,
                raza TEXT,
                edad INTEGER,
                descripcion TEXT,
                estado TEXT DEFAULT 'disponible'
            )`);
        });
    }
});

// Simulamos el método query de postgres para no romper tus rutas existentes
db.query = function (sql, params = []) {
    return new Promise((resolve, reject) => {
        // Cambiar la sintaxis de \$1, \$2 a ? que usa SQLite
        const sqlCorregida = sql.replace(/\$\d+/g, '?');
        
        if (sqlCorregida.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sqlCorregida, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        } else {
            db.run(sqlCorregida, params, function (err) {
                if (err) reject(err);
                else resolve({ rows: [{ id_usuario: this.lastID, id_mascota: this.lastID }] });
            });
        }
    });
};

module.exports = db;

