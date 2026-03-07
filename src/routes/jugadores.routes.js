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

// Todas las rutas de jugadores son PRIVADAS (requieren token)
router.use(authMiddleware);

// CRUD de jugadores
router.get('/', getJugadores);
router.get('/:id', getJugadorById);
router.post('/', createJugador);
router.put('/:id', updateJugador);
router.delete('/:id', deleteJugador);

module.exports = router;