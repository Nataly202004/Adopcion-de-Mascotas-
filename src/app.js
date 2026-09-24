const express = require('express');
const cors = require('cors');
const mascotasRouter = require('./routes/mascotas');
const usuariosRouter = require('./routes/usuarios');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/mascotas', mascotasRouter);
app.use('/api/usuarios', usuariosRouter);

app.get('/', (req, res) => {
    res.json({ mensaje: 'API de Adopción de Mascotas funcionando correctamente' });
});

module.exports = app;
