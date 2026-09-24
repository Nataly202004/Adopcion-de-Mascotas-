const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Obtener todas las mascotas
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM mascota');
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las mascotas' });
    }
});

module.exports = router;
