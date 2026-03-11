const PDFDocument = require('pdfkit');

class PDFProfesional {
    async generar(jugador, evaluaciones, habilidades) {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));

        // ========== ENCABEZADO PROFESIONAL ==========
        doc.rect(0, 0, doc.page.width, 120).fill('#1e3a5f');
        doc.fillColor('white')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('SportMetrics Pro', 50, 40)
           .fontSize(12)
           .text('Informe de Rendimiento Deportivo', 50, 80)
           .fontSize(10)
           .text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 100);

        let yPos = 140;

        // ========== TARJETA DE DATOS DEL JUGADOR ==========
        doc.rect(50, yPos, 500, 100).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#0f172a')
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(`${jugador.nombre} ${jugador.apellido}`, 70, yPos + 15)
           .fontSize(11)
           .font('Helvetica')
           .text(`Posición: ${jugador.posicion_principal}`, 70, yPos + 40)
           .text(`Edad: ${jugador.edad} años · Pierna: ${jugador.pierna_habil}`, 70, yPos + 55)
           .text(`DNI: ${jugador.dni || 'No registrado'}`, 70, yPos + 70);

        yPos += 120;

        // ========== SECCIÓN DE EVALUACIONES ==========
        if (evaluaciones.length > 0) {
            const ultima = evaluaciones[0];
            const fecha = new Date(ultima.fecha_evaluacion).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            // Título de sección con fondo
            doc.rect(50, yPos, 500, 30).fill('#1e3a5f');
            doc.fillColor('white')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(`Evaluación del ${fecha}`, 60, yPos + 8);

            yPos += 40;

            // ========== TARJETAS DE MÉTRICAS PRINCIPALES ==========
            const boxWidth = 235;
            const boxHeight = 80;
            const margin = 30;

            // Fila 1: Goles y Asistencias
            // Goles
            doc.rect(50, yPos, boxWidth, boxHeight).fillAndStroke('#e6f0fa', '#3b82f6');
            doc.fillColor('#1e3a5f')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Goles', 70, yPos + 15)
               .fontSize(28)
               .font('Helvetica')
               .text(ultima.goles.toString(), 70, yPos + 30);

            // Asistencias
            doc.rect(50 + boxWidth + margin, yPos, boxWidth, boxHeight).fillAndStroke('#e0f2e9', '#10b981');
            doc.fillColor('#065f46')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Asistencias', 70 + boxWidth + margin, yPos + 15)
               .fontSize(28)
               .font('Helvetica')
               .text(ultima.asistencias.toString(), 70 + boxWidth + margin, yPos + 30);

            yPos += boxHeight + 15;

            // Fila 2: Minutos y Precisión
            // Minutos jugados
            doc.rect(50, yPos, boxWidth, boxHeight).fillAndStroke('#f3e8ff', '#8b5cf6');
            doc.fillColor('#5b21b6')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Minutos jugados', 70, yPos + 15)
               .fontSize(24)
               .font('Helvetica')
               .text(ultima.minutos_jugados ? `${ultima.minutos_jugados}'` : '-', 70, yPos + 35);

            // Precisión de pases
            doc.rect(50 + boxWidth + margin, yPos, boxWidth, boxHeight).fillAndStroke('#fff1e6', '#f97316');
            doc.fillColor('#9a3412')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Precisión pases', 70 + boxWidth + margin, yPos + 15)
               .fontSize(24)
               .font('Helvetica')
               .text(ultima.precision_pases ? `${ultima.precision_pases}%` : '-', 70 + boxWidth + margin, yPos + 35);

            yPos += boxHeight + 30;

            // ========== TABLA DE MÉTRICAS DE RENDIMIENTO ==========
            doc.rect(50, yPos, 500, 30).fill('#e2e8f0');
            doc.fillColor('#0f172a')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Métricas de Rendimiento', 60, yPos + 8);

            yPos += 40;

            // Encabezados de tabla
            doc.rect(50, yPos, 500, 25).fill('#cbd5e1');
            doc.fillColor('#0f172a')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text('Métrica', 60, yPos + 7)
               .text('Valor', 300, yPos + 7);

            yPos += 25;

            // Filas de métricas
            const metricas = [
                ['Duelos ganados', ultima.duelos_ganados ? ultima.duelos_ganados.toString() : '-'],
                ['Duelos perdidos', ultima.duelos_perdidos ? ultima.duelos_perdidos.toString() : '-'],
                ['% duelos ganados', ultima.porcentaje_duelos_ganados ? `${Math.round(ultima.porcentaje_duelos_ganados)}%` : '-'],
                ['Distancia recorrida', ultima.distancia_recorrida_km ? `${ultima.distancia_recorrida_km} km` : '-'],
                ['Velocidad máxima', ultima.velocidad_maxima_kmh ? `${ultima.velocidad_maxima_kmh} km/h` : '-']
            ];

            metricas.forEach(([metrica, valor], index) => {
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                doc.rect(50, yPos, 500, 20).fill(bgColor);
                doc.fillColor('#0f172a')
                   .font('Helvetica')
                   .fontSize(10)
                   .text(metrica, 60, yPos + 5)
                   .text(valor, 300, yPos + 5);
                yPos += 20;
            });

            yPos += 20;

            // ========== OBSERVACIONES ==========
            if (ultima.observaciones) {
                doc.rect(50, yPos, 500, 30).fill('#fef3c7');
                doc.fillColor('#92400e')
                   .fontSize(14)
                   .font('Helvetica-Bold')
                   .text('Observaciones del cuerpo técnico', 60, yPos + 8);

                yPos += 40;

                const observaciones = ultima.observaciones.destacar || JSON.stringify(ultima.observaciones);
                doc.fillColor('#334155')
                   .fontSize(10)
                   .font('Helvetica')
                   .text(observaciones, 60, yPos, { width: 480, align: 'justify' });

                yPos += 40;
            }
        }

        // ========== HABILIDADES ==========
        if (habilidades) {
            doc.rect(50, yPos, 500, 30).fill('#1e3a5f');
            doc.fillColor('white')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Diagnóstico Inicial', 60, yPos + 8);

            yPos += 40;

            const habBoxWidth = 110;
            const habBoxHeight = 70;
            const habMargin = 20;

            // Reacción
            doc.rect(50, yPos, habBoxWidth, habBoxHeight).fillAndStroke('#fee2e2', '#ef4444');
            doc.fillColor('#7f1d1d')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Reacción', 60, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(`${habilidades.reaccion * 10}%`, 60, yPos + 30);

            // Equilibrio
            doc.rect(50 + habBoxWidth + habMargin, yPos, habBoxWidth, habBoxHeight).fillAndStroke('#fef9c3', '#eab308');
            doc.fillColor('#854d0e')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Equilibrio', 60 + habBoxWidth + habMargin, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(`${habilidades.equilibrio * 10}%`, 60 + habBoxWidth + habMargin, yPos + 30);

            // Velocidad
            doc.rect(50 + (habBoxWidth + habMargin) * 2, yPos, habBoxWidth, habBoxHeight).fillAndStroke('#dcfce7', '#22c55e');
            doc.fillColor('#14532d')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Velocidad', 60 + (habBoxWidth + habMargin) * 2, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(`${habilidades.velocidad * 10}%`, 60 + (habBoxWidth + habMargin) * 2, yPos + 30);

            // Fuerza
            doc.rect(50 + (habBoxWidth + habMargin) * 3, yPos, habBoxWidth, habBoxHeight).fillAndStroke('#e0f2fe', '#0ea5e9');
            doc.fillColor('#075985')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Fuerza', 60 + (habBoxWidth + habMargin) * 3, yPos + 10)
               .fontSize(20)
               .font('Helvetica')
               .text(`${habilidades.fuerza * 10}%`, 60 + (habBoxWidth + habMargin) * 3, yPos + 30);

            yPos += habBoxHeight + 30;
        }

        // ========== PIE DE PÁGINA ==========
        doc.rect(0, 750, doc.page.width, 50).fill('#1e3a5f');
        doc.fillColor('white')
           .fontSize(8)
           .font('Helvetica')
           .text('SportMetrics Pro - Tecnología aplicada al rendimiento deportivo', 50, 770, { align: 'center' })
           .text(`Informe generado el ${new Date().toLocaleDateString('es-ES')} · Todos los derechos reservados`, 50, 785, { align: 'center' });

        doc.end();

        return new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        });
    }
}

module.exports = PDFProfesional;