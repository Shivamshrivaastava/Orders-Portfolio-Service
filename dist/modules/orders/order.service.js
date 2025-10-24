/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto';
import { prisma } from '../../core/db/prisma';
import { AppError } from '../../core/errors/AppError';
import { eventBus } from '../events/eventBus';
export const ordersService = {
    async create(input) {
        //  Compute unique idempotency key hash (based on clientOrderId or header)
        const keySource = input.idempotencyKey ?? input.clientOrderId ?? crypto.randomUUID();
        const keyHash = crypto.createHash('sha256').update(keySource).digest('hex');
        const payload = JSON.stringify(input.rawBody ?? input);
        // If we already handled this exact payload before → return it
        const existing = await prisma.idempotency.findUnique({ where: { keyHash } });
        if (existing) {
            const savedResponse = JSON.parse(existing.response);
            return savedResponse;
        }
        try {
            //  Do everything atomically in one transaction
            const result = await prisma.$transaction(async (tx) => {
                // create order
                const order = await tx.order.create({
                    data: {
                        symbol: input.symbol.toUpperCase(),
                        side: input.side,
                        qty: input.qty,
                        status: 'pending',
                        clientOrderId: input.clientOrderId ?? null,
                        avgPrice: null,
                    },
                });
                // record idempotency after order creation
                await tx.idempotency.create({
                    data: {
                        keyHash,
                        payload,
                        response: JSON.stringify(order),
                    },
                });
                return order;
            });
            eventBus.publish('order.created', { orderId: result.id });
            return result;
        }
        catch (err) {
            //  Handle duplicates gracefully
            if (err.code === 'P2002') {
                if (err.meta?.target?.includes('clientOrderId')) {
                    throw new AppError('DUPLICATE_CLIENT_ORDER_ID', `An order with clientOrderId '${input.clientOrderId}' already exists.`, 409);
                }
                if (err.meta?.target?.includes('keyHash')) {
                    // Means same idempotency key used again
                    const existing = await prisma.idempotency.findUnique({ where: { keyHash } });
                    if (existing)
                        return JSON.parse(existing.response);
                }
            }
            throw err;
        }
    },
};
