import { prisma } from '../../core/db/prisma';
import { AppError } from '../../core/errors/AppError';
import { eventBus } from '../events/eventBus';
export const fillsService = {
    async applyFill(input) {
        await prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id: input.orderId },
                include: { fills: true },
            });
            if (!order)
                throw new AppError('NOT_FOUND', 'Order not found', 404);
            if (order.status === 'cancelled' || order.status === 'rejected')
                throw new AppError('INVALID_STATE', `Cannot apply fill to status ${order.status}`, 400);
            const fill = await tx.fill.create({
                data: {
                    orderId: input.orderId,
                    price: input.price,
                    qty: input.qty,
                    timestamp: new Date(input.timestamp),
                },
            });
            const allFills = [...order.fills, fill];
            const filledQty = allFills.reduce((s, f) => s + f.qty, 0);
            const avgPrice = allFills.reduce((s, f) => s + f.price * f.qty, 0) / filledQty;
            let status = 'partially_filled';
            if (filledQty >= order.qty)
                status = 'filled';
            await tx.order.update({
                where: { id: order.id },
                data: { status, avgPrice },
            });
            const side = order.side;
            const pos = await tx.position.findUnique({ where: { symbol: order.symbol } });
            if (side === 'sell' && (!pos || pos.qty < input.qty)) {
                throw new AppError('INSUFFICIENT_HOLDINGS', `Cannot sell ${input.qty} of ${order.symbol}. You only hold ${pos?.qty ?? 0}.`, 400);
            }
            if (!pos && side === 'buy') {
                await tx.position.create({
                    data: { symbol: order.symbol, qty: input.qty, avgCost: input.price },
                });
            }
            else if (pos && side === 'buy') {
                const newQty = pos.qty + input.qty;
                const newAvg = (pos.qty * pos.avgCost + input.qty * input.price) /
                    (newQty === 0 ? 1 : newQty);
                await tx.position.update({
                    where: { symbol: pos.symbol },
                    data: { qty: newQty, avgCost: newAvg },
                });
            }
            else if (pos && side === 'sell') {
                const newQty = pos.qty - input.qty;
                await tx.position.update({
                    where: { symbol: pos.symbol },
                    data: { qty: newQty },
                });
            }
            eventBus.publish('fill.applied', { orderId: order.id });
        });
        const updatedOrder = await prisma.order.findUnique({
            where: { id: input.orderId },
        });
        const latestFill = await prisma.fill.findFirst({
            where: { orderId: input.orderId },
            orderBy: { timestamp: 'desc' },
        });
        return { order: updatedOrder, latestFill };
    },
};
