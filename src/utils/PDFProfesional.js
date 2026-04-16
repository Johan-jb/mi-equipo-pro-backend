const PDFDocument = require('pdfkit');

class PDFProfesional {
    async generar(jugador, evaluaciones, habilidades) {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));

        let yPos = 120;

        // Helper para salto de página automático
        const checkPageBreak = (extra = 0) => {
            if (yPos + extra > 700) {
                doc.addPage();
                yPos = 50;
            }
        };

        // ========== ENCABEZADO PROFESIONAL ==========
        doc.rect(0, 0, doc.page.width, 100).fill('#1e3a5f');
        doc.fillColor('white')
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('SportMetrics Pro', 50, 35)
           .fontSize(10)
           .text(`Informe generado el ${new Date().toLocaleDateString('es-ES', {
               timeZone: 'America/Argentina/Buenos_Aires',
               year: 'numeric',
               month: 'long',
               day: 'numeric'
           })}`, 50, 70);

        // ========== TARJETA DE DATOS DEL JUGADOR ==========
        doc.rect(50, yPos, 500, 100).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#0f172a')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text(`${jugador.nombre} ${jugador.apellido}`, 70, yPos + 15)
           .fontSize(10)
           .font('Helvetica')
           .text(`Posición: ${jugador.posicion_principal}`, 70, yPos + 40)
           .text(`Edad: ${jugador.edad} años`, 70, yPos + 55)
           .text(`Pierna hábil: ${jugador.pierna_habil}`, 70, yPos + 70)
           .text(`DNI: ${jugador.dni || 'No registrado'}`, 70, yPos + 85);

        yPos += 120;

        // ========== EVALUACIONES ==========
        if (evaluaciones.length > 0) {
            const ultima = evaluaciones[0];
            const fecha = new Date(ultima.fecha_evaluacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            checkPageBreak(40);

            // Título
            doc.rect(50, yPos, 500, 25).fill('#1e3a5f');
            doc.fillColor('white')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(`Evaluación del ${fecha}`, 60, yPos + 7);

            yPos += 35;

            const boxWidth = 235;
            const boxHeight = 60;
            const margin = 30;

            // Goles
            doc.rect(50, yPos, boxWidth, boxHeight).fillAndStroke('#e6f0fa', '#3b82f6');
            doc.fillColor('#1e3a5f')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Goles', 70, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.goles.toString(), 70, yPos + 25);

            // Asistencias
            doc.rect(50 + boxWidth + margin, yPos, boxWidth, boxHeight).fillAndStroke('#e0f2e9', '#10b981');
            doc.fillColor('#065f46')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Asistencias', 70 + boxWidth + margin, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.asistencias.toString(), 70 + boxWidth + margin, yPos + 25);

            yPos += boxHeight + 10;

            // Minutos
            doc.rect(50, yPos, boxWidth, boxHeight).fillAndStroke('#f3e8ff', '#8b5cf6');
            doc.fillColor('#5b21b6')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Minutos', 70, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.minutos_jugados ? `${ultima.minutos_jugados}'` : '-', 70, yPos + 25);

            // Precisión
            doc.rect(50 + boxWidth + margin, yPos, boxWidth, boxHeight).fillAndStroke('#fff1e6', '#f97316');
            doc.fillColor('#9a3412')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Precisión', 70 + boxWidth + margin, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(ultima.precision_pases ? `${ultima.precision_pases}%` : '-', 70 + boxWidth + margin, yPos + 25);

            yPos += boxHeight + 15;

            // Tabla métricas
            const metricas = [
                ['Duelos ganados', ultima.duelos_ganados || '-'],
                ['Duelos perdidos', ultima.duelos_perdidos || '-'],
                ['% duelos', ultima.porcentaje_duelos_ganados ? `${Math.round(ultima.porcentaje_duelos_ganados)}%` : '-'],
                ['Distancia', ultima.distancia_recorrida_km ? `${ultima.distancia_recorrida_km} km` : '-'],
                ['Vel. máxima', ultima.velocidad_maxima_kmh ? `${ultima.velocidad_maxima_kmh} km/h` : '-']
            ];

            metricas.forEach(([m, v], i) => {
                doc.rect(50, yPos, 500, 18).fill(i % 2 === 0 ? '#f8fafc' : '#ffffff');
                doc.fillColor('#0f172a')
                   .fontSize(9)
                   .text(m, 60, yPos + 4)
                   .text(v.toString(), 300, yPos + 4);
                yPos += 18;
            });

            yPos += 10;

            // ========== OBSERVACIONES ==========
            if (ultima.observaciones) {
                checkPageBreak(80);

                doc.rect(50, yPos, 500, 20).fill('#fef3c7');
                doc.fillColor('#92400e')
                   .fontSize(10)
                   .font('Helvetica-Bold')
                   .text('Observaciones', 60, yPos + 5);

                yPos += 25;

                const observaciones = ultima.observaciones.destacar || JSON.stringify(ultima.observaciones);

                doc.fillColor('#334155')
                   .fontSize(9)
                   .font('Helvetica');

                const textHeight = doc.heightOfString(observaciones, {
                    width: 480,
                    align: 'justify'
                });

                doc.text(observaciones, 60, yPos, {
                    width: 480,
                    align: 'justify'
                });

                yPos += textHeight + 15;
            }
        }

        // ========== HABILIDADES ==========
        if (habilidades) {
            checkPageBreak(100);

            doc.rect(50, yPos, 500, 20).fill('#1e3a5f');
            doc.fillColor('white')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Diagnóstico Inicial', 60, yPos + 5);

            yPos += 30;

            const habBoxWidth = 110;
            const habBoxHeight = 50;
            const habMargin = 20;

            const drawHab = (label, value, x, colorBg, colorBorder, colorText) => {
                doc.rect(x, yPos, habBoxWidth, habBoxHeight).fillAndStroke(colorBg, colorBorder);
                doc.fillColor(colorText)
                   .fontSize(8)
                   .font('Helvetica-Bold')
                   .text(label, x + 10, yPos + 8)
                   .fontSize(14)
                   .font('Helvetica')
                   .text(`${value * 10}%`, x + 10, yPos + 22);
            };

            drawHab('Reacción', habilidades.reaccion, 50, '#fee2e2', '#ef4444', '#7f1d1d');
            drawHab('Equilibrio', habilidades.equilibrio, 50 + (habBoxWidth + habMargin), '#fef9c3', '#eab308', '#854d0e');
            drawHab('Velocidad', habilidades.velocidad, 50 + (habBoxWidth + habMargin) * 2, '#dcfce7', '#22c55e', '#14532d');
            drawHab('Fuerza', habilidades.fuerza, 50 + (habBoxWidth + habMargin) * 3, '#e0f2fe', '#0ea5e9', '#075985');

            yPos += habBoxHeight + 20;
        }

        // ========== FOOTER ==========
        doc.rect(0, 740, doc.page.width, 50).fill('#1e3a5f');
        doc.fillColor('white')
           .fontSize(7)
           .text('SportMetrics Pro - Tecnología aplicada al rendimiento deportivo', 50, 755, { align: 'center' })
           .text('Todos los derechos reservados', 50, 770, { align: 'center' });

        doc.end();

        return new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        });
    }
}

module.exports = PDFProfesional;