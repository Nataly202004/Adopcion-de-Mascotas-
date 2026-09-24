const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// 1. OBTENER TODAS LAS MASCOTAS (Vista de la Página)
router.get('/', async (req, res) => {
    try {
        // En SQLite el método simulado ya nos da un objeto con la propiedad .rows
        const resultado = await pool.query('SELECT * FROM mascota');
        
        // CORRECCIÓN: Si por alguna razón rows no viene envuelto, mandamos el resultado directo o un arreglo vacío
        const listaMascotas = resultado.rows || resultado || [];
        res.json(listaMascotas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener las mascotas' });
    }
});

// 2. REGISTRAR UNA NUEVA MASCOTA (Acción de Administrador)
router.post('/registro', async (req, res) => {
    const { nombre, especie, raza, edad, descripcion } = req.body;
    
    try {
        await pool.query(
            'INSERT INTO mascota (nombre, especie, raza, edad, descripcion, estado) VALUES ($1, $2, $3, $4, $5, $6)',
            [nombre, especie, raza, edad, descripcion, 'Disponible']
        );
        res.status(201).json({ mensaje: 'Mascota registrada con éxito', nombre });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al registrar la mascota en el sistema' });
    }
});

module.exports = router;
