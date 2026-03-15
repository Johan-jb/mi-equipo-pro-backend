const express = require('express');
const router = express.Router();
const { 
    getJugadores, 
    getJugadorById, 
    createJugador, 
    updateJugador, 
    deleteJugador 
} = require('../controllers/jugadores.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { verificarSuscripcion, verificarLimiteJugadores } = require('../middleware/suscripcion.middleware');

// Todas las rutas de jugadores son PRIVADAS (requieren token)
router.use(authMiddleware);

// CRUD de jugadores
router.get('/', getJugadores);
router.get('/:id', getJugadorById);
router.post('/', verificarSuscripcion, verificarLimiteJugadores, createJugador);
router.put('/:id', verificarSuscripcion, updateJugador);
router.delete('/:id', verificarSuscripcion, deleteJugador);

module.exports = router;