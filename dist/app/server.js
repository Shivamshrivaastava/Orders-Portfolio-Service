/* eslint-disable no-undef */
import express from 'express';
import { logger } from '../core/logging/logger.js';
import fillsRouter from '../modules/fills/fill.controller.js';
import ordersRouter from '../modules/orders/order.controller.js';
import portfolioRouter from '../modules/portfolio/portfolio.controller.js';
const app = express();
// Middleware
app.use(express.json());
// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Root Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to Orders & Portfolio Service API' });
});
// Feature Routes
app.use(ordersRouter);
app.use(fillsRouter);
app.use(portfolioRouter);
// Start the Server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    logger.info({ port }, `🚀 Orders & Portfolio Service running on port ${port}`);
});
export default app;
