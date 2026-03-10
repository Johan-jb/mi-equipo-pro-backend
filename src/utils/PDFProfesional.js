const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const QRCode = require('qrcode');

class PDFProfesional {
    constructor() {
        this.chartWidth = 400;
        this.chartHeight = 300;
        this.chartJSNodeCanvas = new ChartJSNodeCanvas({
            width: this.chartWidth,
            height: this.chartHeight,
            backgroundColour: 'white'
        });
    }

    async generar(jugador, evaluaciones, habilidades) {
        const doc = new PDFDocument({ 
            margin: 50,
            size: 'A4',
            info: {
                Title: `Informe ${jugador.nombre} ${jugador.apellido}`,
                Author: 'SportMetrics Pro',
                Subject: 'Informe de Rendimiento Deportivo'
            }
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));

        // ========== ENCABEZADO PROFESIONAL ==========
        doc.rect(0, 0, doc.page.width, 120).fill('#1e40af');
        doc.fillColor('white')
           .fontSize(28)
           .font('Helvetica-Bold')
           .text('SportMetrics Pro', 50, 40)
           .fontSize(12)
           .text('Informe de Rendimiento Deportivo', 50, 80)
           .fontSize(10)
           .text(`Fecha: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 50, 100);

        // ========== DATOS DEL JUGADOR (TARJETA) ==========
        doc.fillColor('black');
        doc.rect(50, 140, 500, 100).fillAndStroke('#f8fafc', '#cbd5e1');
        doc.fillColor('#0f172a')
           .fontSize(18)
           .font('Helvetica-Bold')
           .text(`${jugador.nombre} ${jugador.apellido}`, 70, 155)
           .fontSize(11)
           .font('Helvetica')
           .text(`Posición: ${jugador.posicion_principal}`, 70, 180)
           .text(`Edad: ${jugador.edad} años | Pierna: ${jugador.pierna_habil}`, 70, 195)
           .text(`DNI: ${jugador.dni || 'No registrado'}`, 70, 210);

        let yPos = 260;

        // ========== RADAR DE HABILIDADES ==========
        if (habilidades) {
            const radarBuffer = await this.generarRadar(habilidades);
            doc.image(radarBuffer, 50, yPos, { width: 250 });
            
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('Habilidades', 320, yPos + 20)
               .fontSize(10)
               .font('Helvetica')
               .text(`Reacción: ${habilidades.reaccion * 10}%`, 320, yPos + 50)
               .text(`Equilibrio: ${habilidades.equilibrio * 10}%`, 320, yPos + 70)
               .text(`Velocidad: ${habilidades.velocidad * 10}%`, 320, yPos + 90)
               .text(`Fuerza: ${habilidades.fuerza * 10}%`, 320, yPos + 110);
            
            yPos += 220;
        } else {
            yPos += 20;
        }

        // ========== GRÁFICO DE EVOLUCIÓN ==========
        if (evaluaciones.length > 1) {
            const evolucionBuffer = await this.generarEvolucion(evaluaciones);
            doc.image(evolucionBuffer, 50, yPos, { width: 500 });
            yPos += 220;
        }

        // ========== TABLA DE EVALUACIONES ==========
        if (evaluaciones.length > 0) {
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#1e40af')
               .text('Historial de Evaluaciones', 50, yPos);

            yPos += 30;

            // Cabecera de tabla
            doc.rect(50, yPos, 500, 25).fill('#e2e8f0');
            doc.fillColor('#0f172a')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('Fecha', 60, yPos + 8)
               .text('Goles', 160, yPos + 8)
               .text('Asist.', 220, yPos + 8)
               .text('Min.', 280, yPos + 8)
               .text('Precisión', 340, yPos + 8)
               .text('Duelos', 420, yPos + 8);

            yPos += 25;

            // Filas
            evaluaciones.slice(0, 5).forEach((e, index) => {
                const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
                doc.rect(50, yPos, 500, 25).fill(bgColor);
                doc.fillColor('#0f172a')
                   .font('Helvetica')
                   .text(new Date(e.fecha_evaluacion).toLocaleDateString('es-ES'), 60, yPos + 8)
                   .text(e.goles.toString(), 160, yPos + 8)
                   .text(e.asistencias.toString(), 220, yPos + 8)
                   .text(e.minutos_jugados ? e.minutos_jugados.toString() : '-', 280, yPos + 8)
                   .text(e.precision_pases ? `${e.precision_pases}%` : '-', 340, yPos + 8)
                   .text(e.duelos_ganados ? `${e.duelos_ganados}/${e.duelos_perdidos}` : '-', 420, yPos + 8);
                yPos += 25;
            });

            yPos += 20;

            // Promedios
            const totalGoles = evaluaciones.reduce((sum, e) => sum + e.goles, 0);
            const totalAsistencias = evaluaciones.reduce((sum, e) => sum + e.asistencias, 0);
            const promGoles = (totalGoles / evaluaciones.length).toFixed(1);
            const promAsistencias = (totalAsistencias / evaluaciones.length).toFixed(1);

            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text(`Promedio: ${promGoles} goles/partido | ${promAsistencias} asistencias/partido`, 50, yPos);

            yPos += 30;
        }

        // ========== RECOMENDACIONES ==========
        if (habilidades) {
            doc.fontSize(16)
               .font('Helvetica-Bold')
               .fillColor('#1e40af')
               .text('Recomendaciones', 50, yPos);

            yPos += 30;

            const recomendaciones = [];
            if (habilidades.velocidad < 7) recomendaciones.push('• Realizar ejercicios de velocidad (sprints cortos, cambios de ritmo)');
            if (habilidades.fuerza < 7) recomendaciones.push('• Trabajar fuerza en piernas (sentadillas, saltos)');
            if (habilidades.equilibrio < 7) recomendaciones.push('• Mejorar equilibrio con ejercicios de coordinación');
            if (habilidades.reaccion < 7) recomendaciones.push('• Entrenar reflejos con ejercicios de reacción');

            if (recomendaciones.length > 0) {
                doc.font('Helvetica');
                recomendaciones.forEach(r => {
                    doc.text(r, 50, yPos);
                    yPos += 20;
                });
            }
        }

        // ========== QR CODE ==========
        if (jugador.id_jugador) {
            const qrBuffer = await QRCode.toBuffer(`https://sportmetrics-pro.com/jugador/${jugador.id_jugador}`);
            doc.image(qrBuffer, 450, yPos, { width: 100 });
            doc.fontSize(8)
               .text('Escanee para ver perfil digital', 450, yPos + 105);
        }

        // ========== PIE DE PÁGINA ==========
        doc.fontSize(8)
           .fillColor('#64748b')
           .text('SportMetrics Pro - Tecnología aplicada al rendimiento deportivo', 50, 750, { align: 'center' });

        doc.end();

        return new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        });
    }

    async generarRadar(habilidades) {
        const config = {
            type: 'radar',
            data: {
                labels: ['Reacción', 'Equilibrio', 'Velocidad', 'Fuerza'],
                datasets: [{
                    label: 'Nivel actual',
                    data: [
                        habilidades.reaccion * 10,
                        habilidades.equilibrio * 10,
                        habilidades.velocidad * 10,
                        habilidades.fuerza * 10
                    ],
                    backgroundColor: 'rgba(30, 64, 175, 0.2)',
                    borderColor: '#1e40af',
                    pointBackgroundColor: '#1e40af',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#1e40af'
                }]
            },
            options: {
                scale: {
                    min: 0,
                    max: 100,
                    ticks: { stepSize: 20 }
                }
            }
        };
        return await this.chartJSNodeCanvas.renderToBuffer(config);
    }

    async generarEvolucion(evaluaciones) {
        const fechas = evaluaciones.map(e => 
            new Date(e.fecha_evaluacion).toLocaleDateString('es-ES')
        ).reverse();
        
        const goles = evaluaciones.map(e => e.goles).reverse();
        const asistencias = evaluaciones.map(e => e.asistencias).reverse();

        const config = {
            type: 'line',
            data: {
                labels: fechas,
                datasets: [
                    {
                        label: 'Goles',
                        data: goles,
                        borderColor: '#1e40af',
                        backgroundColor: 'rgba(30, 64, 175, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Asistencias',
                        data: asistencias,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                scales: { y: { beginAtZero: true } }
            }
        };
        return await this.chartJSNodeCanvas.renderToBuffer(config);
    }
}

module.exports = PDFProfesional;