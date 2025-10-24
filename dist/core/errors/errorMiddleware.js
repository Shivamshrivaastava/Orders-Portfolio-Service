/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppError } from './AppError.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err, _req, res, _next) {
    if (err instanceof AppError) {
        return res.status(err.status).json({ code: err.code, message: err.message, details: err.details ?? null });
    }
    const e = err;
    const message = e?.message ?? 'Internal Server Error';
    return res.status(500).json({ code: 'INTERNAL_ERROR', message });
}
