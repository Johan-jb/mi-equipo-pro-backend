const express = require('express');
const router = express.Router();
const { generarInformeJugador } = require('../controllers/informes.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/jugador/:id_jugador/pdf', generarInformeJugador);

module.exports = router;