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

                // Título
                doc.fontSize(20)
                   .font('Helvetica-Bold')
                   .text('SportMetrics Pro', { align: 'center' })
                   .fontSize(16)
                   .text(`Informe de ${jugador.nombre} ${jugador.apellido}`, { align: 'center' })
                   .moveDown();

                // Datos personales
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .text('Datos Personales:', { underline: true })
                   .moveDown(0.3);

                const datos = [
                    `Posición: ${jugador.posicion_principal}`,
                    `Edad: ${jugador.edad} años`,
                    `Pierna hábil: ${jugador.pierna_habil}`,
                    `DNI: ${jugador.dni || 'No registrado'}`,
                    `Tutor: ${jugador.tutor_nombre || 'No registrado'}`,
                    `Email: ${jugador.tutor_email || 'No registrado'}`
                ];

                doc.font('Helvetica');
                datos.forEach(item => doc.text(`• ${item}`));
                doc.moveDown();

                // Habilidades
                if (habilidades) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Diagnóstico Inicial:', { underline: true })
                       .moveDown(0.3);

                    const habilidadesData = [
                        `Reacción: ${habilidades.reaccion * 10}%`,
                        `Equilibrio: ${habilidades.equilibrio * 10}%`,
                        `Velocidad: ${habilidades.velocidad * 10}%`,
                        `Fuerza: ${habilidades.fuerza * 10}%`
                    ];

                    doc.font('Helvetica');
                    habilidadesData.forEach(item => doc.text(`• ${item}`));
                    doc.moveDown();
                }

                // Evaluaciones
                if (evaluaciones.length > 0) {
                    doc.fontSize(12)
                       .font('Helvetica-Bold')
                       .text('Historial de Evaluaciones:', { underline: true })
                       .moveDown(0.5);

                    // Cabecera de tabla
                    doc.font('Helvetica-Bold');
                    doc.text('Fecha', 50, doc.y, { width: 100 });
                    doc.text('Goles', 160, doc.y - 12, { width: 70, align: 'center' });
                    doc.text('Asist.', 230, doc.y - 12, { width: 70, align: 'center' });
                    doc.text('Min.', 300, doc.y - 12, { width: 70, align: 'center' });
                    doc.text('Precisión', 370, doc.y - 12, { width: 80, align: 'center' });
                    
                    doc.moveDown(0.5);
                    doc.moveTo(50, doc.y - 5).lineTo(450, doc.y - 5).stroke();
                    
                    doc.font('Helvetica');
                    evaluaciones.slice(0, 5).forEach(e => {
                        doc.text(new Date(e.fecha_evaluacion).toLocaleDateString('es-ES'), 50, doc.y, { width: 100 });
                        doc.text(e.goles.toString(), 160, doc.y - 12, { width: 70, align: 'center' });
                        doc.text(e.asistencias.toString(), 230, doc.y - 12, { width: 70, align: 'center' });
                        doc.text(e.minutos_jugados ? e.minutos_jugados.toString() : '-', 300, doc.y - 12, { width: 70, align: 'center' });
                        doc.text(e.precision_pases ? `${e.precision_pases}%` : '-', 370, doc.y - 12, { width: 80, align: 'center' });
                        doc.moveDown();
                    });

                    // Promedios
                    const totalGoles = evaluaciones.reduce((sum, e) => sum + e.goles, 0);
                    const totalAsistencias = evaluaciones.reduce((sum, e) => sum + e.asistencias, 0);
                    const promGoles = (totalGoles / evaluaciones.length).toFixed(1);
                    const promAsistencias = (totalAsistencias / evaluaciones.length).toFixed(1);

                    doc.moveDown()
                       .font('Helvetica-Bold')
                       .text('Promedios:', { continued: true })
                       .font('Helvetica')
                       .text(` ${promGoles} goles/partido, ${promAsistencias} asistencias/partido`);
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;