import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();


console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

export default pool;