import { z } from 'zod';

export const ProductDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().default('').optional(),
  price: z.number().min(0).default(0).optional(),
  count: z.number().min(0).default(0).optional(),
});

export type ProductData = z.infer<typeof ProductDataSchema>;
