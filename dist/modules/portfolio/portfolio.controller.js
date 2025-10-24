import { Router } from 'express';
import { portfolioService } from './portfolio.service';
const router = Router();
router.get('/portfolio', async (_req, res, next) => {
    try {
        const snap = await portfolioService.snapshot();
        res.json(snap);
    }
    catch (e) {
        next(e);
    }
});
export default router;
