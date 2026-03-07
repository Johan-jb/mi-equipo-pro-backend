const pool = require('../config/database');

// Obtener todos los jugadores (segun rol y club)
const getJugadores = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;

        console.log('📦 Buscando jugadores - Usuario:', usuarioId, 'Rol:', usuarioRol, 'Club:', usuarioClub);

        let query = '';
        let queryParams = [];

        // Admin, DT y Preparador ven TODOS los jugadores del club
        if (usuarioRol === 'admin' || usuarioRol === 'dt' || usuarioRol === 'preparador') {
            query = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad,
                       u.nombre_completo as tutor_nombre,
                       u.email as tutor_email
                FROM rendimiento.jugadores j
                JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
                WHERE j.activo = true AND j.id_club = $1
                ORDER BY j.fecha_creacion DESC
            `;
            queryParams = [usuarioClub];
        } 
        // Padre ve SOLO sus hijos (del mismo club)
        else {
            query = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad
                FROM rendimiento.jugadores j
                WHERE j.id_usuario = $1 AND j.activo = true AND j.id_club = $2
                ORDER BY j.fecha_creacion DESC
            `;
            queryParams = [usuarioId, usuarioClub];
        }

        const jugadoresResult = await pool.query(query, queryParams);
        const jugadores = jugadoresResult.rows;

        // Para cada jugador, obtener su última evaluación y habilidades
        for (let jugador of jugadores) {
            // Última evaluación
            const ultimaEvalResult = await pool.query(
                `SELECT fecha_evaluacion, goles, asistencias 
                 FROM rendimiento.evaluaciones 
                 WHERE id_jugador = $1 
                 ORDER BY fecha_evaluacion DESC 
                 LIMIT 1`,
                [jugador.id_jugador]
            );

            if (ultimaEvalResult.rows.length > 0) {
                jugador.ultima_evaluacion = ultimaEvalResult.rows[0];
            } else {
                jugador.ultima_evaluacion = null;
            }

            // Habilidades
            const habilidadesResult = await pool.query(
                `SELECT reaccion, equilibrio, velocidad, fuerza, fecha_diagnostico
                 FROM rendimiento.habilidades 
                 WHERE id_jugador = $1 
                 ORDER BY fecha_diagnostico DESC 
                 LIMIT 1`,
                [jugador.id_jugador]
            );

            if (habilidadesResult.rows.length > 0) {
                jugador.habilidades = habilidadesResult.rows[0];
            } else {
                jugador.habilidades = null;
            }
        }

        res.json({
            success: true,
            count: jugadores.length,
            jugadores: jugadores
        });

    } catch (error) {
        console.error('Error obteniendo jugadores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener jugadores',
            error: error.message
        });
    }
};

// Obtener un jugador específico
const getJugadorById = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;
        const jugadorId = req.params.id;

        let query = '';
        let queryParams = [];

        // Admin y DT pueden ver cualquier jugador del club
        if (usuarioRol === 'admin' || usuarioRol === 'dt' || usuarioRol === 'preparador') {
            query = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad,
                       u.nombre_completo as tutor_nombre,
                       u.email as tutor_email
                FROM rendimiento.jugadores j
                JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
                WHERE j.id_jugador = $1 AND j.activo = true AND j.id_club = $2
            `;
            queryParams = [jugadorId, usuarioClub];
        } 
        // Padre ve solo si es su hijo
        else {
            query = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad
                FROM rendimiento.jugadores j
                WHERE j.id_jugador = $1 AND j.id_usuario = $2 AND j.activo = true AND j.id_club = $3
            `;
            queryParams = [jugadorId, usuarioId, usuarioClub];
        }

        const result = await pool.query(query, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jugador no encontrado'
            });
        }

        res.json({
            success: true,
            jugador: result.rows[0]
        });

    } catch (error) {
        console.error('Error obteniendo jugador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener jugador',
            error: error.message
        });
    }
};

// Crear un nuevo jugador (solo admin y dt)
const createJugador = async (req, res) => {
    try {
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;
        
        if (usuarioRol !== 'admin' && usuarioRol !== 'dt') {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores y directores técnicos pueden crear jugadores'
            });
        }

        const padreId = req.body.id_usuario || req.user.id;
        const { 
            nombre, 
            apellido, 
            fecha_nacimiento, 
            dni, 
            posicion_principal, 
            pierna_habil,
            foto_perfil_url 
        } = req.body;

        if (!nombre || !apellido || !fecha_nacimiento) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, apellido y fecha de nacimiento son obligatorios'
            });
        }

        const result = await pool.query(
            `INSERT INTO rendimiento.jugadores 
            (id_usuario, nombre, apellido, fecha_nacimiento, dni, posicion_principal, pierna_habil, foto_perfil_url, id_club) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING *`,
            [padreId, nombre, apellido, fecha_nacimiento, dni, posicion_principal, pierna_habil, foto_perfil_url, usuarioClub]
        );

        res.status(201).json({
            success: true,
            message: 'Jugador creado exitosamente',
            jugador: result.rows[0]
        });

    } catch (error) {
        console.error('Error creando jugador:', error);
        
        if (error.code === '23505' && error.constraint === 'jugadores_dni_key') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un jugador con ese DNI'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear jugador',
            error: error.message
        });
    }
};

// Actualizar un jugador
const updateJugador = async (req, res) => {
    try {
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;
        const jugadorId = req.params.id;
        const { 
            nombre, 
            apellido, 
            fecha_nacimiento, 
            dni, 
            posicion_principal, 
            pierna_habil,
            foto_perfil_url 
        } = req.body;

        // Verificar propiedad del jugador
        let checkQuery = '';
        let checkParams = [];

        if (usuarioRol === 'admin' || usuarioRol === 'dt') {
            checkQuery = 'SELECT id_jugador, id_usuario FROM rendimiento.jugadores WHERE id_jugador = $1 AND id_club = $2';
            checkParams = [jugadorId, usuarioClub];
        } else {
            checkQuery = 'SELECT id_jugador FROM rendimiento.jugadores WHERE id_jugador = $1 AND id_usuario = $2 AND id_club = $3';
            checkParams = [jugadorId, usuarioId, usuarioClub];
        }

        const checkJugador = await pool.query(checkQuery, checkParams);

        if (checkJugador.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jugador no encontrado o no autorizado'
            });
        }

        const result = await pool.query(
            `UPDATE rendimiento.jugadores 
             SET nombre = $1, apellido = $2, fecha_nacimiento = $3, dni = $4, 
                 posicion_principal = $5, pierna_habil = $6, foto_perfil_url = $7
             WHERE id_jugador = $8
             RETURNING *`,
            [nombre, apellido, fecha_nacimiento, dni, posicion_principal, pierna_habil, foto_perfil_url, jugadorId]
        );

        res.json({
            success: true,
            message: 'Jugador actualizado exitosamente',
            jugador: result.rows[0]
        });

    } catch (error) {
        console.error('Error actualizando jugador:', error);
        
        if (error.code === '23505' && error.constraint === 'jugadores_dni_key') {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un jugador con ese DNI'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar jugador',
            error: error.message
        });
    }
};

// Eliminar jugador (borrado lógico)
const deleteJugador = async (req, res) => {
    try {
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;
        
        if (usuarioRol !== 'admin' && usuarioRol !== 'dt') {
            return res.status(403).json({
                success: false,
                message: 'Solo administradores y directores técnicos pueden eliminar jugadores'
            });
        }

        const jugadorId = req.params.id;

        const result = await pool.query(
            'UPDATE rendimiento.jugadores SET activo = false WHERE id_jugador = $1 AND id_club = $2 RETURNING id_jugador',
            [jugadorId, usuarioClub]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jugador no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Jugador eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error eliminando jugador:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar jugador',
            error: error.message
        });
    }
};

module.exports = {
    getJugadores,
    getJugadorById,
    createJugador,
    updateJugador,
    deleteJugador
};