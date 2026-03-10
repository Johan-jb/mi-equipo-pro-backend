const PDFDocument = require('pdfkit');

class PDFGenerator {
    async generarInforme(jugador, evaluaciones, habilidades) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const chunks = [];

                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Título
                doc.fontSize(20).text('SportMetrics Pro', { align: 'center' });
                doc.fontSize(16).text(`Informe de ${jugador.nombre} ${jugador.apellido}`, { align: 'center' });
                doc.moveDown();

                // Datos personales
                doc.fontSize(12).text('Datos Personales:');
                doc.fontSize(10).text(`- Posición: ${jugador.posicion_principal}`);
                doc.fontSize(10).text(`- Edad: ${jugador.edad} años`);
                doc.fontSize(10).text(`- Pierna hábil: ${jugador.pierna_habil}`);
                doc.moveDown();

                // Habilidades
                if (habilidades) {
                    doc.fontSize(12).text('Diagnóstico Inicial:');
                    doc.fontSize(10).text(`- Reacción: ${habilidades.reaccion * 10}%`);
                    doc.fontSize(10).text(`- Equilibrio: ${habilidades.equilibrio * 10}%`);
                    doc.fontSize(10).text(`- Velocidad: ${habilidades.velocidad * 10}%`);
                    doc.fontSize(10).text(`- Fuerza: ${habilidades.fuerza * 10}%`);
                    doc.moveDown();
                }

                // Evaluaciones
                if (evaluaciones.length > 0) {
                    doc.fontSize(12).text('Últimas Evaluaciones:');
                    evaluaciones.slice(0, 5).forEach(e => {
                        doc.fontSize(10).text(
                            `${new Date(e.fecha_evaluacion).toLocaleDateString('es-ES')}: ` +
                            `${e.goles} goles, ${e.asistencias} asistencias`
                        );
                    });
                } else {
                    doc.fontSize(10).text('No hay evaluaciones registradas.');
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;