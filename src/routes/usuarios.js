const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../config/db');

router.post('/registro', async (req, res) => {
    const { nombre_completo, correo, contrasena } = req.body || {};
    if (![nombre_completo, correo, contrasena].every((value) => typeof value === 'string' && value.trim())) {
        return res.status(400).json({ error: 'Completa el nombre, correo y contraseña.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
        return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }
    if (contrasena.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    try {
        const contrasenaEncriptada = await bcrypt.hash(contrasena, 10);
        // El rol siempre se asigna en el servidor: el cliente no puede registrarse como admin.
        const nuevoUsuario = await pool.query(
            `INSERT INTO usuario (nombre_completo, correo, contrasena, rol)
             VALUES ($1, $2, $3, 'usuario')
             RETURNING id_usuario, nombre_completo, correo, rol`,
            [nombre_completo.trim(), correo.trim().toLowerCase(), contrasenaEncriptada]
        );
        return res.status(201).json(nuevoUsuario.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
        }
        console.error('Error al registrar el usuario:', error);
        return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

router.post('/login', async (req, res) => {
    const { correo, contrasena } = req.body || {};
    if (typeof correo !== 'string' || typeof contrasena !== 'string' || !correo.trim() || !contrasena) {
        return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
    }

    try {
        const usuarioDb = await pool.query(
            'SELECT * FROM usuario WHERE correo = $1',
            [correo.trim().toLowerCase()]
        );
        if (usuarioDb.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        const usuario = usuarioDb.rows[0];
        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!contrasenaValida) {
            return res.status(400).json({ error: 'Credenciales incorrectas' });
        }

        return res.json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre_completo: usuario.nombre_completo,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
    }
});

module.exports = router;
