import { prisma } from '../../core/db/prisma';
import { quotesService } from '../quotes/quotes.service';
export const portfolioService = {
    async snapshot() {
        const positions = await prisma.position.findMany();
        const enriched = positions.map((p) => {
            const mktPrice = quotesService.get(p.symbol);
            const unrealizedPnL = (mktPrice - p.avgCost) * p.qty;
            return { symbol: p.symbol, qty: p.qty, avgCost: p.avgCost, unrealizedPnL, updatedAt: p.updatedAt, mktPrice };
        });
        const value = enriched.reduce((s, p) => s + p.mktPrice * p.qty, 0);
        const pnl = enriched.reduce((s, p) => s + p.unrealizedPnL, 0);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return { positions: enriched.map(({ mktPrice, ...rest }) => rest), totals: { value, pnl } };
    },
};
