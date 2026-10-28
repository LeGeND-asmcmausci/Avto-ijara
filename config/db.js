import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'car_rental_db',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
    console.error('Kutilmagan PostgreSQL pool xatosi:', err);
});

export const query = (text, params) => pool.query(text, params);

export default {
    pool,
    query,
};
