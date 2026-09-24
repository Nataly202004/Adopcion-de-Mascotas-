const express = require('express');
const cors = require('cors');
const mascotasRouter = require('./routes/mascotas'); // 1. Importamos la ruta

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/mascotas', mascotasRouter); // 2. Enlazamos la ruta

// Ruta de prueba inicial
app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Adopción de Mascotas funcionando correctamente' });
});

module.exports = app;
