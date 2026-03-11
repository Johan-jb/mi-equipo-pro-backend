const PDFDocument = require('pdfkit');

class PDFProfesional {
    async generar(jugador, evaluaciones, habilidades) {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));

        // ========== TÍTULO PRINCIPAL ==========
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#1e40af')
           .text('Informe de Rendimiento', { align: 'center' })
           .moveDown(2);

        // ========== DATOS DEL JUGADOR ==========
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .fillColor('#0f172a')
           .text('Datos del Jugador')
           .moveDown(0.5);

        // Tabla de datos personales
        const datos = [
            ['Nombre completo', `${jugador.nombre} ${jugador.apellido}`],
            ['Posición', jugador.posicion_principal],
            ['DNI', jugador.dni || 'No registrado'],
            ['Edad', `${jugador.edad} años`],
            ['Pierna hábil', jugador.pierna_habil]
        ];

        let y = doc.y;
        const startX = 50;
        const col1X = 180;

        doc.font('Helvetica');
        datos.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').text(label, startX, y);
            doc.font('Helvetica').text(value, col1X, y);
            y += 20;
        });

        // Actualizar la posición Y del documento
        doc.y = y + 10;

        // ========== EVALUACIONES ==========
        if (evaluaciones.length > 0) {
            // Tomar la evaluación más reciente
            const ultima = evaluaciones[0];
            const fecha = new Date(ultima.fecha_evaluacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#0f172a')
               .text(`Evaluación del ${fecha}`, { align: 'left' })
               .moveDown(0.5);

            // Grid de métricas principales
            const startY = doc.y;
            const boxWidth = 200;
            const boxHeight = 60;
            const marginRight = 30;

            // Goles
            doc.rect(50, startY, boxWidth, boxHeight).fillAndStroke('#f8fafc', '#cbd5e1');
            doc.fillColor('#0f172a')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Goles', 60, startY + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.goles.toString(), 60, startY + 25);

            // Asistencias
            doc.rect(50 + boxWidth + marginRight, startY, boxWidth, boxHeight).fillAndStroke('#f8fafc', '#cbd5e1');
            doc.fillColor('#0f172a')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Asistencias', 60 + boxWidth + marginRight, startY + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.asistencias.toString(), 60 + boxWidth + marginRight, startY + 25);

            // Segunda fila de métricas
            const startY2 = startY + boxHeight + 10;

            // Minutos jugados
            doc.rect(50, startY2, boxWidth, boxHeight).fillAndStroke('#f8fafc', '#cbd5e1');
            doc.fillColor('#0f172a')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Minutos jugados', 60, startY2 + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.minutos_jugados ? ultima.minutos_jugados.toString() : '-', 60, startY2 + 25);

            // Precisión de pases
            doc.rect(50 + boxWidth + marginRight, startY2, boxWidth, boxHeight).fillAndStroke('#f8fafc', '#cbd5e1');
            doc.fillColor('#0f172a')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Precisión de pases', 60 + boxWidth + marginRight, startY2 + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.precision_pases ? `${ultima.precision_pases}%` : '-', 60 + boxWidth + marginRight, startY2 + 25);

            // Actualizar posición Y después de las tarjetas
            doc.y = startY2 + boxHeight + 20;

            // ========== MÉTRICAS DE RENDIMIENTO ==========
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#0f172a')
               .text('Métricas de Rendimiento', { align: 'left' })
               .moveDown(0.5);

            // Tabla de métricas
            const metricas = [
                ['Métrica', 'Valor'],
                ['Duelos ganados', ultima.duelos_ganados ? ultima.duelos_ganados.toString() : '-'],
                ['Duelos perdidos', ultima.duelos_perdidos ? ultima.duelos_perdidos.toString() : '-'],
                ['% duelos ganados', ultima.porcentaje_duelos_ganados ? `${Math.round(ultima.porcentaje_duelos_ganados)}%` : '-'],
                ['Distancia recorrida', ultima.distancia_recorrida_km ? `${ultima.distancia_recorrida_km} km` : '-'],
                ['Velocidad máxima', ultima.velocidad_maxima_kmh ? `${ultima.velocidad_maxima_kmh} km/h` : '-']
            ];

            let metricY = doc.y;
            const metricStartX = 50;
            const metricCol1 = 180;

            metricas.forEach(([metrica, valor], index) => {
                if (index === 0) {
                    doc.font('Helvetica-Bold');
                } else {
                    doc.font('Helvetica');
                }
                doc.text(metrica, metricStartX, metricY);
                doc.text(valor, metricCol1, metricY);
                metricY += 20;
            });

            doc.y = metricY + 10;

            // ========== OBSERVACIONES ==========
            if (ultima.observaciones) {
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .fillColor('#0f172a')
                   .text('Observaciones', { align: 'left' })
                   .moveDown(0.5);

                const observaciones = ultima.observaciones.destacar || JSON.stringify(ultima.observaciones);
                doc.font('Helvetica')
                   .fontSize(10)
                   .fillColor('#334155')
                   .text(observaciones, 50, doc.y, { width: 500, align: 'justify' });

                doc.moveDown(2);
            }
        }

        // ========== PIE DE PÁGINA ==========
        doc.fontSize(8)
           .fillColor('#64748b')
           .text(`Informe generado por SportMetrics Pro - ${new Date().toLocaleDateString('es-ES')}`, 50, 750, { align: 'center' });

        doc.end();

        return new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        });
    }
}

module.exports = PDFProfesional;