const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const QRCode = require('qrcode');
const path = require('path');

class PDFGenerator {
    constructor() {
        this.chartWidth = 600;
        this.chartHeight = 300;
        this.chartJSNodeCanvas = new ChartJSNodeCanvas({
            width: this.chartWidth,
            height: this.chartHeight,
            backgroundColour: 'white'
        });
    }

    async generarInforme(jugador, evaluaciones, habilidades) {
        // Crear el contenido del PDF
        let contenido = this.generarCabecera(jugador);
        
        contenido += this.generarDatosPersonales(jugador);
        
        if (habilidades) {
            const radarChart = await this.generarRadarChart(habilidades);
            contenido += this.agregarImagen(radarChart, 'Radar de Habilidades');
        }

        if (evaluaciones.length > 0) {
            const evolucionChart = await this.generarEvolucionChart(evaluaciones);
            contenido += this.agregarImagen(evolucionChart, 'Evolución del Rendimiento');
            
            contenido += this.generarTablaEvaluaciones(evaluaciones);
        } else {
            contenido += '<p>No hay evaluaciones registradas para este jugador.</p>';
        }

        // Generar QR code
        const qrData = `https://sportmetrics-pro.com/jugador/${jugador.id_jugador}`;
        const qrImage = await QRCode.toDataURL(qrData);
        contenido += this.agregarImagenFromBase64(qrImage, 'Perfil Digital');

        contenido += this.generarPie();

        // Aquí usarías una librería como pdfkit para generar el PDF real
        // Por simplicidad, retornamos un buffer simulado
        return Buffer.from(contenido);
    }

    generarCabecera(jugador) {
        return `
            <h1>SportMetrics Pro - Informe de Rendimiento</h1>
            <h2>${jugador.nombre} ${jugador.apellido}</h2>
            <p>Club: ${jugador.club_nombre || 'No especificado'}</p>
            <p>Fecha: ${new Date().toLocaleDateString('es-ES')}</p>
            <hr/>
        `;
    }

    generarDatosPersonales(jugador) {
        return `
            <h3>Datos Personales</h3>
            <ul>
                <li>Posición: ${jugador.posicion_principal}</li>
                <li>Edad: ${jugador.edad} años</li>
                <li>Pierna hábil: ${jugador.pierna_habil}</li>
                <li>DNI: ${jugador.dni || 'No registrado'}</li>
                <li>Tutor: ${jugador.tutor_nombre || 'No registrado'}</li>
                <li>Email tutor: ${jugador.tutor_email || 'No registrado'}</li>
            </ul>
        `;
    }

    async generarRadarChart(habilidades) {
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
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                scale: {
                    min: 0,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        };
        return await this.chartJSNodeCanvas.renderToBuffer(config);
    }

    async generarEvolucionChart(evaluaciones) {
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
                        borderColor: 'rgba(54, 162, 235, 1)',
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        tension: 0.4
                    },
                    {
                        label: 'Asistencias',
                        data: asistencias,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        };
        return await this.chartJSNodeCanvas.renderToBuffer(config);
    }

    generarTablaEvaluaciones(evaluaciones) {
        let tabla = '<h3>Historial de Evaluaciones</h3>';
        tabla += '<table border="1" cellpadding="5">';
        tabla += '<tr><th>Fecha</th><th>Goles</th><th>Asistencias</th><th>Minutos</th><th>Precisión</th></tr>';
        
        evaluaciones.slice(0, 5).forEach(e => {
            tabla += `<tr>
                <td>${new Date(e.fecha_evaluacion).toLocaleDateString('es-ES')}</td>
                <td>${e.goles}</td>
                <td>${e.asistencias}</td>
                <td>${e.minutos_jugados || '-'}</td>
                <td>${e.precision_pases ? e.precision_pases + '%' : '-'}</td>
            </tr>`;
        });
        
        tabla += '</table>';
        return tabla;
    }

    agregarImagen(buffer, titulo) {
        // En una implementación real, insertarías la imagen en el PDF
        return `<p>Gráfico: ${titulo}</p>`;
    }

    agregarImagenFromBase64(base64, titulo) {
        return `<p>QR Code: ${titulo}</p>`;
    }

    generarPie() {
        return `
            <hr/>
            <p>Informe generado por SportMetrics Pro</p>
            <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        `;
    }
}

module.exports = PDFGenerator;