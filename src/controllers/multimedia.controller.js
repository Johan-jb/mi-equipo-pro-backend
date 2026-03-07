const pool = require('../config/database');
const { upload } = require('../config/cloudinary');

// Obtener todos los eventos
const getEventos = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, 
                    COUNT(a.id_archivo) FILTER (WHERE a.tipo = 'foto') as fotos,
                    COUNT(a.id_archivo) FILTER (WHERE a.tipo = 'video') as videos
             FROM multimedia.eventos e
             LEFT JOIN multimedia.archivos a ON e.id_evento = a.id_evento
             GROUP BY e.id_evento
             ORDER BY e.fecha DESC`
        );
        res.json({
            success: true,
            eventos: result.rows
        });
    } catch (error) {
        console.error('Error obteniendo eventos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener eventos',
            error: error.message
        });
    }
};

// Crear un nuevo evento
const createEvento = async (req, res) => {
    try {
        const { nombre, tipo, fecha, lugar, descripcion } = req.body;

        const result = await pool.query(
            `INSERT INTO multimedia.eventos (nombre, tipo, fecha, lugar, descripcion)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [nombre, tipo, fecha, lugar, descripcion]
        );

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente',
            evento: result.rows[0]
        });
    } catch (error) {
        console.error('Error creando evento:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear evento',
            error: error.message
        });
    }
};

// Subir un archivo a Cloudinary y guardar en BD
const uploadArchivo = async (req, res) => {
    try {
        console.log('📦 Recibiendo archivo...');
        console.log('Body recibido:', req.body);
        console.log('Archivo recibido:', req.file);
        console.log('Headers:', req.headers);

        const { id_evento, tipo, titulo, visibilidad } = req.body;
        const userId = req.user.id;

        // Verificar que se haya subido un archivo
        if (!req.file) {
            console.log('❌ No se recibió ningún archivo');
            return res.status(400).json({
                success: false,
                message: 'No se ha subido ningún archivo'
            });
        }

        // Verificar campos requeridos
        if (!id_evento) {
            console.log('❌ Falta id_evento');
            return res.status(400).json({
                success: false,
                message: 'Falta el ID del evento'
            });
        }

        if (!tipo) {
            console.log('❌ Falta tipo');
            return res.status(400).json({
                success: false,
                message: 'Falta el tipo de archivo'
            });
        }

        console.log('✅ Archivo recibido correctamente');
        console.log('URL generada por Cloudinary:', req.file.path);

        // Obtener la URL de Cloudinary
        const url_archivo = req.file.path;
        
        // Generar thumbnail para videos
        let url_thumbnail = null;
        if (tipo === 'video') {
            try {
                const baseUrl = url_archivo.split('/upload/')[0];
                const pathPart = url_archivo.split('/upload/')[1];
                const publicId = pathPart.split('.')[0];
                url_thumbnail = `${baseUrl}/upload/w_300,h_200,c_fill/${publicId}.jpg`;
                console.log('🎬 Thumbnail generado correctamente:', url_thumbnail);
            } catch (thumbnailError) {
                console.error('Error generando thumbnail:', thumbnailError);
            }
        }

        // Guardar en la base de datos
        const result = await pool.query(
            `INSERT INTO multimedia.archivos 
             (id_evento, tipo, titulo, url_archivo, url_thumbnail, visibilidad, subido_por) 
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id_evento, tipo, titulo, url_archivo, url_thumbnail, visibilidad || 'publico', userId]
        );

        console.log('✅ Archivo guardado en BD con ID:', result.rows[0].id_archivo);

        res.status(201).json({
            success: true,
            message: 'Archivo subido exitosamente',
            archivo: result.rows[0]
        });

    } catch (error) {
        console.error('❌ Error subiendo archivo - Mensaje:', error.message);
        console.error('❌ Error completo:', error);
        console.error('❌ Stack:', error.stack);
        
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'El archivo excede el tamaño permitido'
            });
        }
        
        if (error.message && error.message.includes('cloudinary')) {
            return res.status(400).json({
                success: false,
                message: 'Error con Cloudinary: ' + error.message
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al subir archivo',
            error: error.message
        });
    }
};

// ========== FUNCIÓN SIMPLIFICADA (SIN JSON) ==========
// Obtener archivos de un evento (VERSIÓN SIMPLIFICADA SIN JSON)
const getArchivosByEvento = async (req, res) => {
    try {
        const { id_evento } = req.params;
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;

        console.log('📦 Buscando archivos para evento:', id_evento);
        console.log('🆔 ID Usuario:', usuarioId);
        console.log('🎭 Rol detectado:', usuarioRol);

        let query = '';
        let queryParams = [];

        // Admin, DT y Preparador ven TODOS los archivos del evento
        if (usuarioRol === 'admin' || usuarioRol === 'dt' || usuarioRol === 'preparador') {
            console.log('✅ Usuario con permisos totales');
            query = `
                SELECT a.*
                FROM multimedia.archivos a
                WHERE a.id_evento = $1
                ORDER BY a.fecha_subida DESC
            `;
            queryParams = [id_evento];
        } 
        // Padre ve archivos públicos + privados donde su hijo está etiquetado
        else {
            console.log('👤 Usuario con rol padre');
            query = `
                SELECT DISTINCT a.*
                FROM multimedia.archivos a
                LEFT JOIN multimedia.etiquetas_jugadores ej ON a.id_archivo = ej.id_archivo
                LEFT JOIN rendimiento.jugadores j ON ej.id_jugador = j.id_jugador
                WHERE a.id_evento = $1
                  AND (
                      a.visibilidad = 'publico' 
                      OR (a.visibilidad = 'privado' AND j.id_usuario = $2)
                  )
                ORDER BY a.fecha_subida DESC
            `;
            queryParams = [id_evento, usuarioId];
        }

        console.log('🔍 Ejecutando query');
        const result = await pool.query(query, queryParams);
        
        console.log(`✅ Encontrados ${result.rows.length} archivos`);

        res.json({
            success: true,
            archivos: result.rows
        });

    } catch (error) {
        console.error('❌ Error obteniendo archivos:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error al obtener archivos',
            error: error.message
        });
    }
};

// Crear una etiqueta (asociar archivo con jugador)
const createEtiqueta = async (req, res) => {
    try {
        const { id_archivo, id_jugador } = req.body;
        const usuarioId = req.user.id;

        // Verificar que el archivo existe
        const archivoCheck = await pool.query(
            'SELECT id_archivo FROM multimedia.archivos WHERE id_archivo = $1',
            [id_archivo]
        );

        if (archivoCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El archivo no existe'
            });
        }

        // Verificar que el jugador existe
        const jugadorCheck = await pool.query(
            'SELECT id_jugador FROM rendimiento.jugadores WHERE id_jugador = $1',
            [id_jugador]
        );

        if (jugadorCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'El jugador no existe'
            });
        }

        // Insertar la etiqueta
        const result = await pool.query(
            `INSERT INTO multimedia.etiquetas_jugadores (id_archivo, id_jugador)
             VALUES ($1, $2)
             RETURNING *`,
            [id_archivo, id_jugador]
        );

        res.status(201).json({
            success: true,
            message: 'Jugador etiquetado exitosamente',
            etiqueta: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando etiqueta:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'El jugador ya está etiquetado en este archivo'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al etiquetar jugador',
            error: error.message
        });
    }
};

module.exports = {
    getEventos,
    createEvento,
    uploadArchivo,
    getArchivosByEvento,
    createEtiqueta
};