import { Router } from 'express';
import { parsePagination } from '../../core/utils/pagination.js';
import { orderRepo } from './order.repo.js';
import { ordersService } from './order.service.js';
import { createOrderSchema, listOrdersSchema } from './order.validators.js';
const router = Router();
router.post('/orders', async (req, res, next) => {
    try {
        const parsed = createOrderSchema.parse(req.body);
        const idempotencyKey = req.header('Idempotency-Key') ?? undefined;
        const order = await ordersService.create({ ...parsed, idempotencyKey, rawBody: req.body });
        res.status(201).json(order);
    }
    catch (e) {
        next(e);
    }
});
router.get('/orders', async (req, res, next) => {
    try {
        const q = listOrdersSchema.parse(req.query);
        const { page, pageSize } = parsePagination(q);
        const skip = (page - 1) * pageSize;
        const [total, items] = await orderRepo.list({ skip, take: pageSize, symbol: q.symbol?.toUpperCase(), status: q.status, from: q.from, to: q.to, sort: q.sort });
        res.json({ items, page, pageSize, total });
    }
    catch (e) {
        next(e);
    }
});
router.get('/orders/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await orderRepo.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    }
    catch (e) {
        next(e);
    }
});
export default router;
