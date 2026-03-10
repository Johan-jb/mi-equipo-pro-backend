const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const pool = require('./src/config/database');
const authRoutes = require('./src/routes/auth.routes');
const jugadoresRoutes = require('./src/routes/jugadores.routes');
const evaluacionesRoutes = require('./src/routes/evaluaciones.routes');
const multimediaRoutes = require('./src/routes/multimedia.routes');
const habilidadesRoutes = require('./src/routes/habilidades.routes');
const informesRoutes = require('./src/routes/informes.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Forzar UTF-8 en todas las respuestas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Middlewares globales
app.use(express.json({ type: 'application/json' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

// Configuración CORS usando variable de entorno
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Manejar preflight requests (OPTIONS)
app.options('*', cors());

app.use(morgan('dev'));

// Ruta de prueba principal
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API SportMetrics Pro',
    status: 'online',
    version: '1.0.0'
  });
});

// Ruta para verificar conexión a la base de datos
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      db: '✅ conectada',
      server: '✅ funcionando',
      time: result.rows[0].time
    });
  } catch (error) {
    res.status(500).json({
      db: '❌ error',
      error: error.message
    });
  }
});

// ========== RUTAS DE LA API ==========
app.use('/api/auth', authRoutes);
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/evaluaciones', evaluacionesRoutes);
app.use('/api/multimedia', multimediaRoutes);
app.use('/api/habilidades', habilidadesRoutes);
app.use('/api/informes', informesRoutes);
// ======================================

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor en http://localhost:${PORT}`);
});