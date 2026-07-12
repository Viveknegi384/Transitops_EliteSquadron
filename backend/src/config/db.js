
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/transitops'
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client pool', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
