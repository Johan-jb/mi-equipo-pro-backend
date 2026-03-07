const express = require('express');
const router = express.Router();
const {
    createEvaluacion,
    getEvaluacionesByJugador,
    getEvaluacionById,
    updateEvaluacion,
    deleteEvaluacion
} = require('../controllers/evaluaciones.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Todas las rutas de evaluaciones son PRIVADAS
router.use(authMiddleware);

// Rutas
router.post('/', createEvaluacion);
router.get('/jugador/:id_jugador', getEvaluacionesByJugador);
router.get('/:id', getEvaluacionById);
router.put('/:id', updateEvaluacion);
router.delete('/:id', deleteEvaluacion);

module.exports = router;