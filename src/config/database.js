const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error conectando a la base de datos:', err.message);
    }
    console.log('✅ Conectado a PostgreSQL exitosamente');
    release();
});

module.exports = pool;