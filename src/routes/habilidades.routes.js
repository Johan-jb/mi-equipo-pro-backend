const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

// Obtener última habilidad de un jugador
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

// Crear o actualizar habilidades
router.post('/', async (req, res) => {
    try {
        const { id_jugador, reaccion, equilibrio, velocidad, fuerza } = req.body;
        const userId = req.user.id;

        const result = await pool.query(
            `INSERT INTO rendimiento.habilidades 
             (id_jugador, reaccion, equilibrio, velocidad, fuerza, creado_por) 
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [id_jugador, reaccion, equilibrio, velocidad, fuerza, userId]
        );

        res.status(201).json({
            success: true,
            habilidad: result.rows[0]
        });
    } catch (error) {
        console.error('Error guardando habilidades:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar habilidades',
            error: error.message
        });
    }
});

module.exports = router;