import { Router } from 'express';
import { fillsService } from './fill.service.js';
import { applyFillSchema } from './fill.validators.js';
const router = Router();
router.post('/fills', async (req, res, next) => {
    try {
        const body = applyFillSchema.parse(req.body);
        const out = await fillsService.applyFill(body);
        res.status(201).json(out);
    }
    catch (e) {
        next(e);
    }
});
export default router;
