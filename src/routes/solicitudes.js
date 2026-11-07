const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { createMailer } = require('../config/mailer');

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

router.post('/adopcion', async (req, res) => {
    const { mascota, nombre, celular, direccion, correo, mensaje } = req.body || {};
    const solicitud = { mascota, nombre, celular, direccion, correo, mensaje };

    if (Object.values(solicitud).some((value) => typeof value !== 'string' || !value.trim())) {
        return res.status(400).json({ error: 'Completa todos los campos de la solicitud.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
        return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
    }

    try {
        await db.createSolicitud(Object.fromEntries(
            Object.entries(solicitud).map(([key, value]) => [key, value.trim()])
        ));
    } catch (error) {
        console.error('Error al guardar la solicitud:', error);
        if (error.code === 'DATABASE_URL_MISSING') {
            return res.status(503).json({ error: 'La base de datos no está configurada.' });
        }
        return res.status(500).json({ error: 'No se pudo guardar la solicitud. Intenta nuevamente.' });
    }

    // La solicitud ya está guardada. Un fallo de SMTP no debe hacer que el usuario
    // la reenvíe y genere duplicados.
    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',').map((email) => email.trim()).filter(Boolean);
    const transporter = createMailer();
    if (!adminEmails.length || !transporter) {
        console.warn('Solicitud guardada, pero faltan configurar ADMIN_EMAILS o las variables SMTP.');
        return res.status(201).json({ mensaje: 'Solicitud guardada. La notificación por correo no está configurada.' });
    }

    const fields = Object.entries(solicitud)
        .map(([label, value]) => `<p><strong>${label}:</strong> ${escapeHtml(value.trim())}</p>`)
        .join('');
    try {
        await transporter.sendMail({
            from: `"Huellas Felices" <${process.env.SMTP_USER}>`,
            to: adminEmails,
            replyTo: correo.trim(),
            subject: `Nueva solicitud de adopción: ${mascota.trim()}`,
            html: `<h2>Nueva solicitud de adopción</h2>${fields}`
        });
    } catch (error) {
        console.error('La solicitud se guardó, pero no se pudo enviar el correo:', error);
    }

    return res.status(201).json({ mensaje: 'Solicitud enviada correctamente. ¡Gracias!' });
});

module.exports = router;
