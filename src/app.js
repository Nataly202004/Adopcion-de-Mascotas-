const express = require('express');
const cors = require('cors');
const path = require('path');
const mascotasRouter = require('./routes/mascotas');
const usuariosRouter = require('./routes/usuarios');
const solicitudesRouter = require('./routes/solicitudes');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
    try {
        await db.health();
        return res.json({ ok: true, service: 'adopcion-de-mascotas', database: 'connected' });
    } catch (error) {
        const missingConfiguration = error.code === 'DATABASE_URL_MISSING';
        return res.status(503).json({
            ok: false,
            service: 'adopcion-de-mascotas',
            database: missingConfiguration ? 'not_configured' : 'unavailable',
            code: missingConfiguration ? error.code : 'DATABASE_UNAVAILABLE'
        });
    }
});

app.use('/api/mascotas', mascotasRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/solicitudes', solicitudesRouter);

app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));
app.get('/catalogo', (req, res) => res.sendFile(path.join(__dirname, '../catalogo.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin.html')));

module.exports = app;
