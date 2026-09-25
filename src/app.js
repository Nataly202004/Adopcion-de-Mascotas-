const express = require('express');
const cors = require('cors');
const mascotasRouter = require('./routes/mascotas');
const usuariosRouter = require('./routes/usuarios');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/mascotas', mascotasRouter);
app.use('/api/usuarios', usuariosRouter);

const path = require('path');
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});


module.exports = app;

app.get('/catalogo', (req, res) => {
    res.sendFile(path.join(__dirname, '../catalogo.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

