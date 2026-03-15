const pool = require('../config/database');

const verificarSuscripcion = async (req, res, next) => {
    try {
        const clubId = req.user.id_club;

        // Obtener datos del club
        const clubResult = await pool.query(
            `SELECT plan, fecha_expiracion_trial, jugadores_max, activo 
             FROM rendimiento.clubes 
             WHERE id_club = $1`,
            [clubId]
        );

        if (clubResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Club no encontrado'
            });
        }

        const club = clubResult.rows[0];

        // Verificar si el club está activo
        if (!club.activo) {
            return res.status(403).json({
                success: false,
                message: 'Club suspendido. Contacte al administrador.'
            });
        }

        // Verificar período de prueba
        if (club.plan === 'trial') {
            const hoy = new Date();
            const expiracion = new Date(club.fecha_expiracion_trial);
            
            if (hoy > expiracion) {
                return res.status(403).json({
                    success: false,
                    message: 'Período de prueba expirado. Por favor, actualiza tu plan para continuar usando el sistema.'
                });
            }
        }

        // Si todo está bien, continuar
        req.club = club;
        next();

    } catch (error) {
        console.error('Error verificando suscripción:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar suscripción'
        });
    }
};

const verificarLimiteJugadores = async (req, res, next) => {
    try {
        const clubId = req.user.id_club;
        const club = await pool.query(
            'SELECT jugadores_max FROM rendimiento.clubes WHERE id_club = $1',
            [clubId]
        );

        const jugadoresCount = await pool.query(
            'SELECT COUNT(*) FROM rendimiento.jugadores WHERE id_club = $1 AND activo = true',
            [clubId]
        );

        if (jugadoresCount.rows[0].count >= club.rows[0].jugadores_max) {
            return res.status(403).json({
                success: false,
                message: `Has alcanzado el límite de ${club.rows[0].jugadores_max} jugadores. Actualizá tu plan para agregar más.`
            });
        }

        next();
    } catch (error) {
        console.error('Error verificando límite de jugadores:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar límite de jugadores'
        });
    }
};

module.exports = {
    verificarSuscripcion,
    verificarLimiteJugadores
};