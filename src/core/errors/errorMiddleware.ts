/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Request, Response, NextFunction } from 'express';
import { AppError } from './AppError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ code: err.code, message: err.message, details: err.details ?? null });
  }
  const e = err as any;
  const message = e?.message ?? 'Internal Server Error';
  return res.status(500).json({ code: 'INTERNAL_ERROR', message });
}
