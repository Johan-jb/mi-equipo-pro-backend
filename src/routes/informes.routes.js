const express = require('express');
const router = express.Router();
const { generarInformePDF } = require('../controllers/informes.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

// Todas las rutas de informes requieren autenticación
router.use(authMiddleware);

router.get('/jugador/:id_jugador/pdf', generarInformePDF);

module.exports = router;