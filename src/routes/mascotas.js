const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM mascota ORDER BY id_mascota DESC');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        res.status(500).json({ error: 'Error al obtener las mascotas' });
    }
});

router.post('/registro', async (req, res) => {
    const { nombre, especie, raza, edad, descripcion } = req.body || {};
    if (![nombre, especie, raza, descripcion].every((value) => typeof value === 'string' && value.trim())) {
        return res.status(400).json({ error: 'Completa el nombre, especie, raza y descripción.' });
    }
    const edadNumero = Number(edad);
    if (!Number.isInteger(edadNumero) || edadNumero < 0) {
        return res.status(400).json({ error: 'La edad debe ser un número entero igual o mayor que cero.' });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO mascota (nombre, especie, raza, edad, descripcion, estado)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id_mascota, nombre, especie, raza, edad, descripcion, estado`,
            [nombre.trim(), especie.trim(), raza.trim(), edadNumero, descripcion.trim(), 'disponible']
        );
        res.status(201).json({ mensaje: 'Mascota registrada con éxito', mascota: resultado.rows[0] });
    } catch (error) {
        console.error('Error al registrar la mascota:', error);
        res.status(500).json({ error: 'Error al registrar la mascota en el sistema' });
    }
});

module.exports = router;
