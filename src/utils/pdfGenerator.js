const PDFDocument = require('pdfkit');

class PDFGenerator {
    async generarInforme(jugador, evaluaciones, habilidades) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // ========== ENCABEZADO ==========
                doc.fontSize(25)
                   .font('Helvetica-Bold')
                   .text('SportMetrics Pro', { align: 'center' })
                   .fontSize(12)
                   .font('Helvetica')
                   .text('Informe de Rendimiento Deportivo', { align: 'center' })
                   .moveDown();

                // ========== DATOS DEL JUGADOR ==========
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .text(`${jugador.nombre} ${jugador.apellido}`, { align: 'left' })
                   .moveDown(0.5);

                // Tabla de datos personales
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('Datos Personales:', { underline: true })
                   .moveDown(0.3);

                const datosPersonales = [
                    ['Posición:', jugador.posicion_principal],
                    ['Edad:', `${jugador.edad} años`],
                    ['Pierna hábil:', jugador.pierna_habil],
                    ['DNI:', jugador.dni || 'No registrado'],
                    ['Tutor:', jugador.tutor_nombre || 'No registrado'],
                    ['Email:', jugador.tutor_email || 'No registrado']
                ];

                datosPersonales.forEach(([label, value]) => {
                    doc.font('Helvetica-Bold').text(label, { continued: true })
                       .font('Helvetica').text(` ${value}`);
                });

                doc.moveDown();

                // ========== HABILIDADES ==========
                if (habilidades) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Diagnóstico Inicial', { underline: true })
                       .moveDown(0.3);

                    const habilidadesData = [
                        ['Reacción:', `${habilidades.reaccion * 10}%`],
                        ['Equilibrio:', `${habilidades.equilibrio * 10}%`],
                        ['Velocidad:', `${habilidades.velocidad * 10}%`],
                        ['Fuerza:', `${habilidades.fuerza * 10}%`]
                    ];

                    habilidadesData.forEach(([label, value]) => {
                        doc.font('Helvetica-Bold').text(label, { continued: true, width: 150 })
                           .font('Helvetica').text(value);
                    });
                    doc.moveDown();
                }

                // ========== EVALUACIONES ==========
                if (evaluaciones.length > 0) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Historial de Evaluaciones', { underline: true })
                       .moveDown(0.5);

                    // Cabecera de la tabla
                    doc.font('Helvetica-Bold')
                       .text('Fecha', { width: 100 })
                       .text('Goles', { width: 70, align: 'center', continued: true })
                       .text('Asist.', { width: 70, align: 'center', continued: true })
                       .text('Min.', { width: 70, align: 'center', continued: true })
                       .text('Precisión', { width: 80, align: 'center' })
                       .moveDown(0.3);

                    doc.font('Helvetica');
                    evaluaciones.slice(0, 5).forEach(e => {
                        const fecha = new Date(e.fecha_evaluacion).toLocaleDateString('es-ES');
                        const goles = e.goles.toString();
                        const asistencias = e.asistencias.toString();
                        const minutos = e.minutos_jugados ? e.minutos_jugados.toString() : '-';
                        const precision = e.precision_pases ? `${e.precision_pases}%` : '-';

                        doc.text(fecha, { width: 100 })
                           .text(goles, { width: 70, align: 'center', continued: true })
                           .text(asistencias, { width: 70, align: 'center', continued: true })
                           .text(minutos, { width: 70, align: 'center', continued: true })
                           .text(precision, { width: 80, align: 'center' });
                    });

                    // Promedios
                    const totalGoles = evaluaciones.reduce((sum, e) => sum + e.goles, 0);
                    const totalAsistencias = evaluaciones.reduce((sum, e) => sum + e.asistencias, 0);
                    const promedioGoles = (totalGoles / evaluaciones.length).toFixed(1);
                    const promedioAsistencias = (totalAsistencias / evaluaciones.length).toFixed(1);

                    doc.moveDown()
                       .font('Helvetica-Bold')
                       .text('Promedios:', { continued: true })
                       .font('Helvetica')
                       .text(` ${promedioGoles} goles/partido, ${promedioAsistencias} asistencias/partido`);
                }

                // ========== PIE DE PÁGINA ==========
                doc.moveDown(2)
                   .fontSize(8)
                   .font('Helvetica')
                   .text('Informe generado por SportMetrics Pro', { align: 'center' })
                   .text(`© ${new Date().getFullYear()} - Todos los derechos reservados`, { align: 'center' });

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;