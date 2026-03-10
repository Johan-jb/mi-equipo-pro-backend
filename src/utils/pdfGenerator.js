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

                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('Datos Personales:', { underline: true })
                   .moveDown(0.3);

                // Lista de datos personales
                const datos = [
                    `Posición: ${jugador.posicion_principal}`,
                    `Edad: ${jugador.edad} años`,
                    `Pierna hábil: ${jugador.pierna_habil}`,
                    `DNI: ${jugador.dni || 'No registrado'}`,
                    `Tutor: ${jugador.tutor_nombre || 'No registrado'}`,
                    `Email: ${jugador.tutor_email || 'No registrado'}`
                ];

                datos.forEach(item => {
                    doc.font('Helvetica').text(`• ${item}`);
                });
                doc.moveDown();

                // ========== HABILIDADES ==========
                if (habilidades) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Diagnóstico Inicial', { underline: true })
                       .moveDown(0.3);

                    const habilidadesData = [
                        `Reacción: ${habilidades.reaccion * 10}%`,
                        `Equilibrio: ${habilidades.equilibrio * 10}%`,
                        `Velocidad: ${habilidades.velocidad * 10}%`,
                        `Fuerza: ${habilidades.fuerza * 10}%`
                    ];

                    habilidadesData.forEach(item => {
                        doc.font('Helvetica').text(`• ${item}`);
                    });
                    doc.moveDown();
                }

                // ========== EVALUACIONES ==========
                if (evaluaciones.length > 0) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Historial de Evaluaciones', { underline: true })
                       .moveDown(0.5);

                    // Crear tabla con columnas definidas
                    const table = {
                        headers: ['Fecha', 'Goles', 'Asist.', 'Min.', 'Precisión'],
                        rows: []
                    };

                    evaluaciones.slice(0, 5).forEach(e => {
                        table.rows.push([
                            new Date(e.fecha_evaluacion).toLocaleDateString('es-ES'),
                            e.goles.toString(),
                            e.asistencias.toString(),
                            e.minutos_jugados ? e.minutos_jugados.toString() : '-',
                            e.precision_pases ? `${e.precision_pases}%` : '-'
                        ]);
                    });

                    // Dibujar la tabla
                    let y = doc.y;
                    const startX = 50;
                    const columnWidths = [90, 50, 50, 50, 70];

                    // Encabezados
                    doc.font('Helvetica-Bold');
                    let x = startX;
                    table.headers.forEach((header, i) => {
                        doc.text(header, x, y, { width: columnWidths[i], align: 'center' });
                        x += columnWidths[i];
                    });

                    // Línea separadora
                    doc.moveTo(startX, y + 15)
                       .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), y + 15)
                       .stroke();

                    y += 25;

                    // Filas
                    doc.font('Helvetica');
                    table.rows.forEach(row => {
                        x = startX;
                        row.forEach((cell, i) => {
                            doc.text(cell, x, y, { width: columnWidths[i], align: 'center' });
                            x += columnWidths[i];
                        });
                        y += 20;
                    });

                    // Promedios
                    const totalGoles = evaluaciones.reduce((sum, e) => sum + e.goles, 0);
                    const totalAsistencias = evaluaciones.reduce((sum, e) => sum + e.asistencias, 0);
                    const promedioGoles = (totalGoles / evaluaciones.length).toFixed(1);
                    const promedioAsistencias = (totalAsistencias / evaluaciones.length).toFixed(1);

                    doc.moveDown(2)
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