const pool = require('../config/database');

// Crear una nueva evaluación
const createEvaluacion = async (req, res) => {
    try {
        const padreId = req.user.id;
        const {
            id_jugador,
            fecha_evaluacion,
            peso_kg,
            altura_cm,
            goles,
            asistencias,
            minutos_jugados,
            precision_pases,
            precision_remates,
            duelos_ganados,
            duelos_perdidos,
            distancia_recorrida_km,
            velocidad_maxima_kmh,
            observaciones
        } = req.body;

        // Verificar que el jugador pertenezca al padre autenticado
        const checkJugador = await pool.query(
            'SELECT id_jugador FROM rendimiento.jugadores WHERE id_jugador = $1 AND id_usuario = $2',
            [id_jugador, padreId]
        );

        if (checkJugador.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para evaluar este jugador'
            });
        }

        // Insertar evaluación
        const result = await pool.query(
            `INSERT INTO rendimiento.evaluaciones (
                id_jugador, fecha_evaluacion, peso_kg, altura_cm, goles, asistencias,
                minutos_jugados, precision_pases, precision_remates, duelos_ganados,
                duelos_perdidos, distancia_recorrida_km, velocidad_maxima_kmh,
                observaciones, creado_por
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                id_jugador, fecha_evaluacion || new Date(), peso_kg, altura_cm, goles || 0,
                asistencias || 0, minutos_jugados, precision_pases, precision_remates,
                duelos_ganados || 0, duelos_perdidos || 0, distancia_recorrida_km,
                velocidad_maxima_kmh, observaciones, padreId
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Evaluación guardada exitosamente',
            evaluacion: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando evaluación:', error);
        
        if (error.code === '23505') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una evaluación para este jugador en esta fecha'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al guardar evaluación',
            error: error.message
        });
    }
};

// Obtener todas las evaluaciones de un jugador
const getEvaluacionesByJugador = async (req, res) => {
    try {
        const padreId = req.user.id;
        const jugadorId = req.params.id_jugador;

        // Verificar que el jugador pertenezca al padre
        const checkJugador = await pool.query(
            'SELECT id_jugador FROM rendimiento.jugadores WHERE id_jugador = $1 AND id_usuario = $2',
            [jugadorId, padreId]
        );

        if (checkJugador.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para ver evaluaciones de este jugador'
            });
        }

        const result = await pool.query(
            `SELECT e.*, 
                    EXTRACT(YEAR FROM AGE(e.fecha_evaluacion)) as temporada
             FROM rendimiento.evaluaciones e
             WHERE e.id_jugador = $1
             ORDER BY e.fecha_evaluacion DESC`,
            [jugadorId]
        );

        res.json({
            success: true,
            count: result.rows.length,
            evaluaciones: result.rows
        });

    } catch (error) {
        console.error('Error obteniendo evaluaciones:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluaciones',
            error: error.message
        });
    }
};

// Obtener una evaluación específica
const getEvaluacionById = async (req, res) => {
    try {
        const padreId = req.user.id;
        const evaluacionId = req.params.id;

        const result = await pool.query(
            `SELECT e.*, j.nombre, j.apellido
             FROM rendimiento.evaluaciones e
             JOIN rendimiento.jugadores j ON e.id_jugador = j.id_jugador
             WHERE e.id_evaluacion = $1 AND j.id_usuario = $2`,
            [evaluacionId, padreId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada'
            });
        }

        res.json({
            success: true,
            evaluacion: result.rows[0]
        });

    } catch (error) {
        console.error('Error obteniendo evaluación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener evaluación',
            error: error.message
        });
    }
};

// Actualizar una evaluación
const updateEvaluacion = async (req, res) => {
    try {
        const padreId = req.user.id;
        const evaluacionId = req.params.id;
        const {
            fecha_evaluacion,
            peso_kg,
            altura_cm,
            goles,
            asistencias,
            minutos_jugados,
            precision_pases,
            precision_remates,
            duelos_ganados,
            duelos_perdidos,
            distancia_recorrida_km,
            velocidad_maxima_kmh,
            observaciones
        } = req.body;

        // Verificar que la evaluación pertenezca a un jugador del padre
        const checkEvaluacion = await pool.query(
            `SELECT e.id_evaluacion 
             FROM rendimiento.evaluaciones e
             JOIN rendimiento.jugadores j ON e.id_jugador = j.id_jugador
             WHERE e.id_evaluacion = $1 AND j.id_usuario = $2`,
            [evaluacionId, padreId]
        );

        if (checkEvaluacion.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada o no autorizada'
            });
        }

        const result = await pool.query(
            `UPDATE rendimiento.evaluaciones SET
                fecha_evaluacion = $1,
                peso_kg = $2,
                altura_cm = $3,
                goles = $4,
                asistencias = $5,
                minutos_jugados = $6,
                precision_pases = $7,
                precision_remates = $8,
                duelos_ganados = $9,
                duelos_perdidos = $10,
                distancia_recorrida_km = $11,
                velocidad_maxima_kmh = $12,
                observaciones = $13
             WHERE id_evaluacion = $14
             RETURNING *`,
            [
                fecha_evaluacion, peso_kg, altura_cm, goles, asistencias,
                minutos_jugados, precision_pases, precision_remates,
                duelos_ganados, duelos_perdidos, distancia_recorrida_km,
                velocidad_maxima_kmh, observaciones, evaluacionId
            ]
        );

        res.json({
            success: true,
            message: 'Evaluación actualizada exitosamente',
            evaluacion: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando evaluación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar evaluación',
            error: error.message
        });
    }
};

// Eliminar una evaluación
const deleteEvaluacion = async (req, res) => {
    try {
        const padreId = req.user.id;
        const evaluacionId = req.params.id;

        // Verificar que la evaluación pertenezca a un jugador del padre
        const checkEvaluacion = await pool.query(
            `SELECT e.id_evaluacion 
             FROM rendimiento.evaluaciones e
             JOIN rendimiento.jugadores j ON e.id_jugador = j.id_jugador
             WHERE e.id_evaluacion = $1 AND j.id_usuario = $2`,
            [evaluacionId, padreId]
        );

        if (checkEvaluacion.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Evaluación no encontrada o no autorizada'
            });
        }

        await pool.query(
            'DELETE FROM rendimiento.evaluaciones WHERE id_evaluacion = $1',
            [evaluacionId]
        );

        res.json({
            success: true,
            message: 'Evaluación eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando evaluación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar evaluación',
            error: error.message
        });
    }
};

module.exports = {
    createEvaluacion,
    getEvaluacionesByJugador,
    getEvaluacionById,
    updateEvaluacion,
    deleteEvaluacion
};