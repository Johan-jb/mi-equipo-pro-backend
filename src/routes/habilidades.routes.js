const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/ultima/:id_jugador', async (req, res) => {
    try {
        const { id_jugador } = req.params;
        const result = await pool.query(
            `SELECT * FROM rendimiento.habilidades 
             WHERE id_jugador = $1 
             ORDER BY fecha_diagnostico DESC 
             LIMIT 1`,
            [id_jugador]
        );
        res.json({
            success: true,
            habilidad: result.rows[0] || null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;