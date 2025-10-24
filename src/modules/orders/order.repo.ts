/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from '../../core/db/prisma';
export const orderRepo = {
  create(data: { symbol: string; side: string; qty: number; clientOrderId?: string }) {
    return prisma.order.create({ data: { ...data, status: 'pending', avgPrice: null } });
  },
  findById(id: string) { return prisma.order.findUnique({ where: { id }, include: { fills: true } }); },
  list(params: { skip: number; take: number; symbol?: string; status?: string; from?: string; to?: string; sort?: string; }) {
    const where: any = {};
    if (params.symbol) where.symbol = params.symbol;
    if (params.status) where.status = params.status;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }
    const orderBy = (() => {
      if (!params.sort) return { createdAt: 'desc' as const };
      const [field, dir] = params.sort.split(':');
      const allowed = new Set(['createdAt', 'updatedAt', 'qty', 'symbol', 'status']);
      const direction = dir === 'asc' ? 'asc' : 'desc';
      if (!allowed.has(field)) return { createdAt: 'desc' as const };
      return { [field]: direction } as any;
    })();
    return prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({ where, skip: params.skip, take: params.take, orderBy }),
    ]);
  },
};
