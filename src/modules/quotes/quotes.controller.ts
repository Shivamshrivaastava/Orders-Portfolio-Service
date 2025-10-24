
import { Router } from 'express';
import { z } from 'zod';
import { quotesService } from './quotes.service';
const router = Router();
const bodySchema = z.object({ symbol: z.string().min(1), price: z.number().positive() });
router.post('/quotes', (req, res, next) => {
  try {
    const { symbol, price } = bodySchema.parse(req.body);
    quotesService.set(symbol, price);
    res.json({ symbol: symbol.toUpperCase(), price });
  } catch (e) { next(e); }
});
export default router;
