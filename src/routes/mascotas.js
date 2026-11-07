const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        res.json(await db.listMascotas());
    } catch (error) {
        console.error('Error al obtener las mascotas:', error);
        const status = error.code === 'DATABASE_URL_MISSING' ? 503 : 500;
        res.status(status).json({
            error: error.code === 'DATABASE_URL_MISSING'
                ? 'La base de datos no está configurada.'
                : 'Error al obtener las mascotas'
        });
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
        const mascotaCreada = await db.createMascota({
            nombre: nombre.trim(), especie: especie.trim(), raza: raza.trim(),
            edad: edadNumero, descripcion: descripcion.trim(), estado: 'disponible'
        });
        res.status(201).json({ mensaje: 'Mascota registrada con éxito', mascota: mascotaCreada });
    } catch (error) {
        console.error('Error al registrar la mascota:', error);
        const status = error.code === 'DATABASE_URL_MISSING' ? 503 : 500;
        res.status(status).json({
            error: error.code === 'DATABASE_URL_MISSING'
                ? 'La base de datos no está configurada.'
                : 'Error al registrar la mascota en el sistema'
        });
    }
});

module.exports = router;
