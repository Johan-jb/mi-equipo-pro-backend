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
                       .text('Últimas Evaluaciones:', { underline: true })
                       .moveDown(0.3);

                    evaluaciones.slice(0, 5).forEach(e => {
                        doc.font('Helvetica')
                           .text(`${new Date(e.fecha_evaluacion).toLocaleDateString('es-ES')}: ` +
                                 `${e.goles} goles, ${e.asistencias} asistencias`);
                    });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;