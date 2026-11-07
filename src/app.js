const express = require('express');
const cors = require('cors');
const path = require('path');
const mascotasRouter = require('./routes/mascotas');
const usuariosRouter = require('./routes/usuarios');
const solicitudesRouter = require('./routes/solicitudes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'adopcion-de-mascotas' });
});

app.use('/api/mascotas', mascotasRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/solicitudes', solicitudesRouter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/catalogo', (req, res) => res.sendFile(path.join(__dirname, '../catalogo.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin.html')));

module.exports = app;
