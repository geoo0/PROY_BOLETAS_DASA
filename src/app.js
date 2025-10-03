import express from 'express';
import boletasRoutes from './routes/boletas.js';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', boletasRoutes);

export default app;
