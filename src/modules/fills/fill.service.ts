import { prisma } from '../../core/db/prisma';
import { AppError } from '../../core/errors/AppError';
import { eventBus } from '../events/eventBus';

export const fillsService = {
  async applyFill(input: { orderId: string; price: number; qty: number; timestamp: string }) {
    // Run inside a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      //  Fetch order with all existing fills
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: { fills: true },
      });

      if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404);
      if (order.status === 'cancelled' || order.status === 'rejected')
        throw new AppError('INVALID_STATE', `Cannot apply fill to status ${order.status}`, 400);

      //  Create the new fill
      const fill = await tx.fill.create({
        data: {
          orderId: input.orderId,
          price: input.price,
          qty: input.qty,
          timestamp: new Date(input.timestamp),
        },
      });

      //  Recalculate filled quantity and average price
      const allFills = [...order.fills, fill];
      const filledQty = allFills.reduce((s, f) => s + f.qty, 0);
      const avgPrice = allFills.reduce((s, f) => s + f.price * f.qty, 0) / filledQty;

      //  Corrected Order Status Logic
      let status: string;
      if (filledQty === order.qty) {
        status = 'filled';
      } else if (filledQty > 0 && filledQty < order.qty) {
        status = 'partially_filled';
      } else {
        status = 'pending';
      }

      //  Update the order record
      await tx.order.update({
        where: { id: order.id },
        data: { status, avgPrice },
      });

      //  Handle portfolio updates
      const side = order.side as 'buy' | 'sell';
      const pos = await tx.position.findUnique({ where: { symbol: order.symbol } });

      // Prevent overselling beyond current holdings
      if (side === 'sell' && (!pos || pos.qty < input.qty)) {
        throw new AppError(
          'INSUFFICIENT_HOLDINGS',
          `Cannot sell ${input.qty} of ${order.symbol}. You only hold ${pos?.qty ?? 0}.`,
          400
        );
      }

      // BUY → Increase qty and recalculate avg cost
      if (!pos && side === 'buy') {
        await tx.position.create({
          data: { symbol: order.symbol, qty: input.qty, avgCost: input.price },
        });
      } else if (pos && side === 'buy') {
        const newQty = pos.qty + input.qty;
        const newAvg =
          (pos.qty * pos.avgCost + input.qty * input.price) /
          (newQty === 0 ? 1 : newQty);
        await tx.position.update({
          where: { symbol: pos.symbol },
          data: { qty: newQty, avgCost: newAvg },
        });
      }

      // SELL → Reduce qty, keep avg cost unchanged
      else if (pos && side === 'sell') {
        const newQty = pos.qty - input.qty;
        await tx.position.update({
          where: { symbol: pos.symbol },
          data: { qty: newQty },
        });
      }

      // Publish event to internal event bus
      eventBus.publish('fill.applied', { orderId: order.id });
    });

    //  Return updated order and latest fill (for response)
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
