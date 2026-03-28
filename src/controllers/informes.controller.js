const pool = require('../config/database');
const PDFProfesional = require('../utils/PDFProfesional');

const generarInformeJugador = async (req, res) => {
    try {
        const { id_jugador } = req.params;
        const { fecha } = req.query;
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;

        let jugadorQuery = '';
        let jugadorParams = [];

        if (usuarioRol === 'admin' || usuarioRol === 'dt' || usuarioRol === 'preparador') {
            jugadorQuery = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad,
                       u.nombre_completo as tutor_nombre,
                       u.email as tutor_email,
                       c.nombre as club_nombre
                FROM rendimiento.jugadores j
                JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
                JOIN rendimiento.clubes c ON j.id_club = c.id_club
                WHERE j.id_jugador = $1 AND j.activo = true AND j.id_club = $2
            `;
            jugadorParams = [id_jugador, usuarioClub];
        } else {
            jugadorQuery = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad,
                       u.nombre_completo as tutor_nombre,
                       u.email as tutor_email,
                       c.nombre as club_nombre
                FROM rendimiento.jugadores j
                JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
                JOIN rendimiento.clubes c ON j.id_club = c.id_club
                WHERE j.id_jugador = $1 AND j.id_usuario = $2 AND j.activo = true AND j.id_club = $3
            `;
            jugadorParams = [id_jugador, usuarioId, usuarioClub];
        }

        const jugadorResult = await pool.query(jugadorQuery, jugadorParams);

        if (jugadorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jugador no encontrado o no autorizado'
            });
        }

        const jugador = jugadorResult.rows[0];

        let evaluaciones = [];
        
        if (fecha) {
            const evaluacionResult = await pool.query(
                `SELECT * FROM rendimiento.evaluaciones 
                 WHERE id_jugador = $1 AND DATE(fecha_evaluacion) = $2
                 ORDER BY fecha_evaluacion DESC`,
                [id_jugador, fecha]
            );
            evaluaciones = evaluacionResult.rows;
        } else {
            const evaluacionesResult = await pool.query(
                `SELECT * FROM rendimiento.evaluaciones 
                 WHERE id_jugador = $1 
                 ORDER BY fecha_evaluacion DESC`,
                [id_jugador]
            );
            evaluaciones = evaluacionesResult.rows;
        }

        const habilidadesResult = await pool.query(
            `SELECT * FROM rendimiento.habilidades 
             WHERE id_jugador = $1 
             ORDER BY fecha_diagnostico DESC 
             LIMIT 1`,
            [id_jugador]
        );

        const habilidades = habilidadesResult.rows[0] || null;

        const pdfGenerator = new PDFProfesional();
        const pdfBuffer = await pdfGenerator.generar(
            jugador,
            evaluaciones,
            habilidades
        );

        let nombreArchivo = '';
        if (fecha) {
            const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES').replace(/\//g, '-');
            nombreArchivo = `informe_${jugador.nombre}_${jugador.apellido}_${fechaFormateada}.pdf`;
        } else {
            nombreArchivo = `informe_${jugador.nombre}_${jugador.apellido}_${Date.now()}.pdf`;
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generando informe PDF:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar el informe',
            error: error.message
        });
    }
};

module.exports = {
    generarInformeJugador
};