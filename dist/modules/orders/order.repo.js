/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '../../core/db/prisma.js';
export const orderRepo = {
    create(data) {
        return prisma.order.create({ data: { ...data, status: 'pending', avgPrice: null } });
    },
    findById(id) { return prisma.order.findUnique({ where: { id }, include: { fills: true } }); },
    list(params) {
        const where = {};
        if (params.symbol)
            where.symbol = params.symbol;
        if (params.status)
            where.status = params.status;
        if (params.from || params.to) {
            where.createdAt = {};
            if (params.from)
                where.createdAt.gte = new Date(params.from);
            if (params.to)
                where.createdAt.lte = new Date(params.to);
        }
        const orderBy = (() => {
            if (!params.sort)
                return { createdAt: 'desc' };
            const [field, dir] = params.sort.split(':');
            const allowed = new Set(['createdAt', 'updatedAt', 'qty', 'symbol', 'status']);
            const direction = dir === 'asc' ? 'asc' : 'desc';
            if (!allowed.has(field))
                return { createdAt: 'desc' };
            return { [field]: direction };
        })();
        return prisma.$transaction([
            prisma.order.count({ where }),
            prisma.order.findMany({ where, skip: params.skip, take: params.take, orderBy }),
        ]);
    },
};
