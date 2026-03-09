const PdfPrinter = require('pdfmake');
const QRCode = require('qrcode');

class PDFGenerator {
    constructor() {
        // Definir fuentes para pdfmake
        const fonts = {
            Roboto: {
                normal: 'Helvetica',
                bold: 'Helvetica-Bold',
                italics: 'Helvetica-Oblique',
                bolditalics: 'Helvetica-BoldOblique'
            }
        };
        this.printer = new PdfPrinter(fonts);
    }

    async generarInforme(jugador, evaluaciones, habilidades) {
        // Preparar el contenido del documento
        const docDefinition = {
            content: [
                // Encabezado
                { text: 'SportMetrics Pro - Informe de Rendimiento', style: 'header' },
                { text: `${jugador.nombre} ${jugador.apellido}`, style: 'subheader' },
                { text: `Club: ${jugador.club_nombre || 'No especificado'}`, style: 'normal' },
                { text: `Fecha: ${new Date().toLocaleDateString('es-ES')}`, style: 'normal' },
                { text: '\n' },

                // Datos personales
                { text: 'Datos Personales', style: 'section' },
                {
                    ul: [
                        `Posición: ${jugador.posicion_principal}`,
                        `Edad: ${jugador.edad} años`,
                        `Pierna hábil: ${jugador.pierna_habil}`,
                        `DNI: ${jugador.dni || 'No registrado'}`,
                        `Tutor: ${jugador.tutor_nombre || 'No registrado'}`,
                        `Email tutor: ${jugador.tutor_email || 'No registrado'}`
                    ],
                    style: 'normal'
                },
                { text: '\n' },

                // Habilidades (radar)
                ...this.generarSeccionHabilidades(habilidades),

                // Evaluaciones
                ...this.generarSeccionEvaluaciones(evaluaciones),

                // Pie de página
                { text: '\n' },
                { text: 'Informe generado por SportMetrics Pro', style: 'footer' },
                { text: `© ${new Date().getFullYear()} - Todos los derechos reservados`, style: 'footer' }
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 10]
                },
                subheader: {
                    fontSize: 14,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 5]
                },
                section: {
                    fontSize: 12,
                    bold: true,
                    margin: [0, 10, 0, 5]
                },
                normal: {
                    fontSize: 10,
                    margin: [0, 0, 0, 2]
                },
                footer: {
                    fontSize: 8,
                    alignment: 'center',
                    color: 'gray'
                }
            },
            defaultStyle: {
                font: 'Roboto'
            }
        };

        // Generar el PDF
        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
                const chunks = [];
                
                pdfDoc.on('data', (chunk) => chunks.push(chunk));
                pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
                pdfDoc.on('error', reject);
                
                pdfDoc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    generarSeccionHabilidades(habilidades) {
        if (!habilidades) {
            return [{ text: 'Sin diagnóstico inicial', style: 'normal', margin: [0, 5, 0, 5] }];
        }

        return [
            { text: 'Diagnóstico Inicial', style: 'section' },
            {
                table: {
                    widths: ['*', '*'],
                    body: [
                        [
                            { text: `Reacción: ${habilidades.reaccion * 10}%`, alignment: 'left' },
                            { text: `Equilibrio: ${habilidades.equilibrio * 10}%`, alignment: 'right' }
                        ],
                        [
                            { text: `Velocidad: ${habilidades.velocidad * 10}%`, alignment: 'left' },
                            { text: `Fuerza: ${habilidades.fuerza * 10}%`, alignment: 'right' }
                        ]
                    ]
                },
                layout: 'noBorders',
                margin: [0, 5, 0, 10]
            }
        ];
    }

    generarSeccionEvaluaciones(evaluaciones) {
        if (evaluaciones.length === 0) {
            return [{ text: 'No hay evaluaciones registradas', style: 'normal', margin: [0, 5, 0, 5] }];
        }

        const body = [
            [
                { text: 'Fecha', style: 'tableHeader' },
                { text: 'Goles', style: 'tableHeader' },
                { text: 'Asistencias', style: 'tableHeader' },
                { text: 'Minutos', style: 'tableHeader' },
                { text: 'Precisión', style: 'tableHeader' }
            ]
        ];

        evaluaciones.slice(0, 5).forEach(e => {
            body.push([
                new Date(e.fecha_evaluacion).toLocaleDateString('es-ES'),
                e.goles.toString(),
                e.asistencias.toString(),
                e.minutos_jugados ? e.minutos_jugados.toString() : '-',
                e.precision_pases ? `${e.precision_pases}%` : '-'
            ]);
        });

        return [
            { text: 'Historial de Evaluaciones', style: 'section' },
            {
                table: {
                    widths: ['auto', 'auto', 'auto', 'auto', 'auto'],
                    body: body
                },
                layout: 'lightHorizontalLines',
                margin: [0, 5, 0, 10]
            }
        ];
    }
}

module.exports = PDFGenerator;