/* eslint-disable @typescript-eslint/no-explicit-any */

import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { errorMiddleware } from '../core/errors/errorMiddleware';
import { logger } from '../core/logging/logger';
import routes from './routes';

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp({ logger: logger as any }));


app.get('/health', (_req, res) => res.json({ ok: true }));
app.use(routes);
app.use(errorMiddleware);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  logger.info({ port }, 'Orders & Portfolio service listening');
});

export default app;
