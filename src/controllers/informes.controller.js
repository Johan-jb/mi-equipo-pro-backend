const pool = require('../config/database');
const PDFProfesional = require('../utils/PDFProfesional');

const generarInformePDF = async (req, res) => {
    try {
        const { id_jugador } = req.params;
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;

        let query = '';
        let queryParams = [];

        if (usuarioRol === 'admin' || usuarioRol === 'dt' || usuarioRol === 'preparador') {
            query = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad,
                       u.nombre_completo as tutor_nombre,
                       u.email as tutor_email,
                       c.nombre as club_nombre
                FROM rendimiento.jugadores j
                JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
                JOIN rendimiento.clubes c ON j.id_club = c.id_club
                WHERE j.id_jugador = $1 AND j.activo = true
            `;
            queryParams = [id_jugador];
        } else {
            query = `
                SELECT j.*, 
                       EXTRACT(YEAR FROM AGE(j.fecha_nacimiento)) as edad,
                       u.nombre_completo as tutor_nombre,
                       u.email as tutor_email,
                       c.nombre as club_nombre
                FROM rendimiento.jugadores j
                JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
                JOIN rendimiento.clubes c ON j.id_club = c.id_club
                WHERE j.id_jugador = $1 AND j.id_usuario = $2 AND j.activo = true
            `;
            queryParams = [id_jugador, usuarioId];
        }

        const jugadorResult = await pool.query(query, queryParams);

        if (jugadorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jugador no encontrado o no autorizado'
            });
        }

        const jugador = jugadorResult.rows[0];

        const evaluacionesResult = await pool.query(
            `SELECT * FROM rendimiento.evaluaciones 
             WHERE id_jugador = $1 
             ORDER BY fecha_evaluacion DESC`,
            [id_jugador]
        );

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
            evaluacionesResult.rows,
            habilidades
        );

        const nombreArchivo = `informe_${jugador.nombre}_${jugador.apellido}_${Date.now()}.pdf`;

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
    generarInformePDF
};