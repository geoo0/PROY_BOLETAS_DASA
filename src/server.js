import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { pool } from './db/pool.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Boletas app escuchando en :${PORT}`);
  pool.query('SELECT 1')
    .then(()=>console.log('DB ok ✔'))
    .catch(err=>console.error('DB error al iniciar:', err.message));
});
