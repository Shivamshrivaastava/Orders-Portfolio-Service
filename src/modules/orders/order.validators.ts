
import { z } from 'zod';
export const createOrderSchema = z.object({
  symbol: z.string().min(1),
  side: z.enum(['buy', 'sell']),
  qty: z.number().int().positive(),
  clientOrderId: z.string().min(1).optional(),
});
export const listOrdersSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  symbol: z.string().optional(),
  status: z.enum(['pending', 'filled', 'partially_filled', 'rejected', 'cancelled']).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.string().optional(),
});
