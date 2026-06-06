import pg from 'pg';
import config from './config.js';

const { Pool } = pg;

const pool = new Pool(config.database);

export default pool;
