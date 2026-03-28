const pool = require('../config/database');
const PDFDocument = require('pdfkit');

// Generar informe PDF de un jugador (último o por fecha específica)
const generarInformeJugador = async (req, res) => {
    try {
        const jugadorId = req.params.id;
        const { fecha } = req.query; // Parámetro opcional: fecha (YYYY-MM-DD)
        const usuarioId = req.user.id;
        const usuarioRol = req.user.rol;
        const usuarioClub = req.user.id_club;

        // Verificar que el jugador pertenezca al club del usuario
        const jugadorResult = await pool.query(
            `SELECT j.*, u.nombre_completo as tutor_nombre, u.email as tutor_email
             FROM rendimiento.jugadores j
             JOIN rendimiento.usuarios u ON j.id_usuario = u.id_usuario
             WHERE j.id_jugador = $1 AND j.id_club = $2`,
            [jugadorId, usuarioClub]
        );

        if (jugadorResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Jugador no encontrado o no autorizado'
            });
        }

        const jugador = jugadorResult.rows[0];

        let evaluacion = null;

        // Si hay fecha específica, buscar esa evaluación
        if (fecha) {
            const evalResult = await pool.query(
                `SELECT * FROM rendimiento.evaluaciones 
                 WHERE id_jugador = $1 AND DATE(fecha_evaluacion) = $2
                 ORDER BY fecha_evaluacion DESC
                 LIMIT 1`,
                [jugadorId, fecha]
            );
            if (evalResult.rows.length > 0) {
                evaluacion = evalResult.rows[0];
            }
        } else {
            // Si no hay fecha, obtener la última evaluación
            const evalResult = await pool.query(
                `SELECT * FROM rendimiento.evaluaciones 
                 WHERE id_jugador = $1 
                 ORDER BY fecha_evaluacion DESC 
                 LIMIT 1`,
                [jugadorId]
            );
            if (evalResult.rows.length > 0) {
                evaluacion = evalResult.rows[0];
            }
        }

        // Obtener habilidades del jugador
        const habilidadesResult = await pool.query(
            `SELECT reaccion, equilibrio, velocidad, fuerza, fecha_diagnostico
             FROM rendimiento.habilidades 
             WHERE id_jugador = $1 
             ORDER BY fecha_diagnostico DESC 
             LIMIT 1`,
            [jugadorId]
        );
        const habilidades = habilidadesResult.rows[0] || null;

        // Generar el PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=informe_${jugador.nombre}_${jugador.apellido}_${fecha || 'ultimo'}.pdf`);
        
        doc.pipe(res);

        // Título
        doc.fontSize(20).font('Helvetica-Bold').text('SportMetrics Pro - Informe de Rendimiento', { align: 'center' });
        doc.moveDown();

        // Datos del jugador
        doc.fontSize(14).font('Helvetica-Bold').text('Datos del Jugador');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Nombre: ${jugador.nombre} ${jugador.apellido}`);
        doc.text(`Posición: ${jugador.posicion_principal}`);
        doc.text(`Pierna hábil: ${jugador.pierna_habil}`);
        doc.text(`Edad: ${jugador.edad} años`);
        if (jugador.dni) doc.text(`DNI: ${jugador.dni}`);
        doc.moveDown();

        // Datos del tutor
        doc.fontSize(14).font('Helvetica-Bold').text('Responsable');
        doc.fontSize(12).font('Helvetica');
        doc.text(`Nombre: ${jugador.tutor_nombre}`);
        doc.text(`Email: ${jugador.tutor_email}`);
        doc.moveDown();

        // Habilidades (Diagnóstico Inicial)
        if (habilidades) {
            doc.fontSize(14).font('Helvetica-Bold').text('Diagnóstico Inicial');
            doc.fontSize(12).font('Helvetica');
            doc.text(`Fecha: ${new Date(habilidades.fecha_diagnostico).toLocaleDateString('es-ES')}`);
            doc.text(`Reacción: ${Math.round(habilidades.reaccion * 10)}%`);
            doc.text(`Equilibrio: ${Math.round(habilidades.equilibrio * 10)}%`);
            doc.text(`Velocidad: ${Math.round(habilidades.velocidad * 10)}%`);
            doc.text(`Fuerza: ${Math.round(habilidades.fuerza * 10)}%`);
            doc.moveDown();
        }

        // Evaluación
        if (evaluacion) {
            doc.fontSize(14).font('Helvetica-Bold').text('Evaluación de Rendimiento');
            doc.fontSize(12).font('Helvetica');
            doc.text(`Fecha: ${new Date(evaluacion.fecha_evaluacion).toLocaleDateString('es-ES')}`);
            doc.moveDown();
            
            // Tabla de estadísticas
            const stats = [
                ['Goles', evaluacion.goles || 0],
                ['Asistencias', evaluacion.asistencias || 0],
                ['Minutos jugados', evaluacion.minutos_jugados || 0],
                ['Precisión de pases', evaluacion.precision_pases ? `${evaluacion.precision_pases}%` : 'N/A'],
                ['Precisión de remates', evaluacion.precision_remates ? `${evaluacion.precision_remates}%` : 'N/A'],
                ['Duelos ganados', evaluacion.duelos_ganados || 0],
                ['Duelos perdidos', evaluacion.duelos_perdidos || 0],
                ['Distancia recorrida', evaluacion.distancia_recorrida_km ? `${evaluacion.distancia_recorrida_km} km` : 'N/A'],
                ['Velocidad máxima', evaluacion.velocidad_maxima_kmh ? `${evaluacion.velocidad_maxima_kmh} km/h` : 'N/A']
            ];
            
            const startX = 50;
            let y = doc.y;
            
            stats.forEach(([label, value]) => {
                doc.text(`${label}:`, startX, y, { continued: true });
                doc.text(` ${value}`, { align: 'right' });
                y = doc.y + 10;
                doc.moveDown(0.5);
            });
            doc.moveDown();
            
            if (evaluacion.observaciones) {
                doc.fontSize(14).font('Helvetica-Bold').text('Observaciones');
                doc.fontSize(12).font('Helvetica');
                doc.text(evaluacion.observaciones.destacar || evaluacion.observaciones);
            }
        } else {
            doc.fontSize(12).font('Helvetica').text('No hay evaluaciones registradas para este período.');
        }

        // Pie de página
        doc.moveDown(2);
        doc.fontSize(10).font('Helvetica-Oblique').text('SportMetrics Pro - Sistema de gestión deportiva', { align: 'center' });
        doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, { align: 'center' });

        doc.end();

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