
import { Router } from 'express';
import fillsRouter from '../modules/fills/fill.controller';
import ordersRouter from '../modules/orders/order.controller';
import portfolioRouter from '../modules/portfolio/portfolio.controller';
import quotesRouter from '../modules/quotes/quotes.controller';
const router = Router();
router.use(ordersRouter);
router.use(fillsRouter);
router.use(portfolioRouter);
router.use(quotesRouter);
export default router;
