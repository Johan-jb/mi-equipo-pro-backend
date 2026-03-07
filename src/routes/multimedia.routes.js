const express = require('express');
const router = express.Router();
const {
    getEventos,
    createEvento,
    uploadArchivo,
    getArchivosByEvento,
    createEtiqueta  // <-- NUEVA FUNCIÓN IMPORTADA
} = require('../controllers/multimedia.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');

// Todas las rutas de multimedia son privadas (requieren login)
router.use(authMiddleware);

router.get('/eventos', getEventos);
router.post('/eventos', createEvento);
router.post('/archivos', upload.single('archivo'), uploadArchivo);
router.get('/eventos/:id_evento/archivos', getArchivosByEvento);
router.post('/etiquetas', createEtiqueta);  // <-- NUEVA RUTA PARA ETIQUETAR

module.exports = router;