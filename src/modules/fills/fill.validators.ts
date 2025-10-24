
import { z } from 'zod';
export const applyFillSchema = z.object({
  orderId: z.string().uuid(),
  price: z.number().positive(),
  qty: z.number().int().positive(),
  timestamp: z.string().datetime(),
});
