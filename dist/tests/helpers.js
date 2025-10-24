import { prisma } from '../core/db/prisma.js';
export async function resetDb() {
    await prisma.$transaction([
        prisma.fill.deleteMany(),
        prisma.order.deleteMany(),
        prisma.position.deleteMany(),
        prisma.idempotency.deleteMany(),
    ]);
}
