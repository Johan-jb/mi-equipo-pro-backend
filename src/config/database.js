const { Pool } = require('pg');
require('dotenv').config();

// Usar DATABASE_URL si existe (Render/Supabase), si no usar variables individuales
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
});

// Probar la conexión
pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error conectando a la base de datos:', err.message);
    }
    console.log('✅ Conectado a PostgreSQL exitosamente');
    release();
});

module.exports = pool;