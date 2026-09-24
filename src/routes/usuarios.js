const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

// 1. REGISTRO DE USUARIO
// 1. REGISTRO DE USUARIO
router.post('/registro', async (req, res) => {
    // Añadimos "rol" aquí:
    const { nombre_completo, correo, contrasena, rol } = req.body;
    try {
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);

        // Añadimos "rol || 'usuario'" al insertar en la base de datos:
        const nuevoUsuario = await pool.query(
            'INSERT INTO usuario (nombre_completo, correo, contrasena, rol) VALUES ($1, $2, $3, $4) RETURNING id_usuario, nombre_completo, correo, rol',
            [nombre_completo, correo, contrasenaEncriptada, rol || 'usuario']
        );

        res.status(201).json(nuevoUsuario.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});


// 2. INICIO DE SESIÓN (LOGIN)
router.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body;
    try {
        // Buscar al usuario por correo
        const usuarioDb = await pool.query('SELECT * FROM usuario WHERE correo = $1', [correo]);

        if (usuarioDb.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Comparar la contraseña ingresada con la encriptada en la BD
        const usuario = usuarioDb.rows[0];
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);

        if (!contrasenaValida) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        // Login exitoso (enviamos los datos del usuario sin la contraseña)
        res.json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
});

module.exports = router;
