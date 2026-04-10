const { Pool } = require('pg');
require('dotenv').config();

// Usar SOLO DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
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