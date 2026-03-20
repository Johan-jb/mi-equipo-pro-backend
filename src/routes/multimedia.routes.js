const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
    getEventos,
    createEvento,
    uploadArchivo,
    getArchivosByEvento,
    createEtiqueta,
    eliminarArchivo   // 👈 Importamos la nueva función
} = require('../controllers/multimedia.controller');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas de eventos
router.get('/eventos', getEventos);
router.post('/eventos', createEvento);

// Rutas de archivos
router.get('/eventos/:id_evento/archivos', getArchivosByEvento);
router.post('/archivos', upload.single('archivo'), uploadArchivo);
router.delete('/archivos/:id', eliminarArchivo);   // 👈 NUEVA RUTA PARA ELIMINAR

// Rutas de etiquetas
router.post('/etiquetas', createEtiqueta);

module.exports = router;