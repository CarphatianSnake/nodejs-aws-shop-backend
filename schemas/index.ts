import { z } from 'zod';

export const CreateProductDataSchema = z.object({
  title: z.string(),
  description: z.string().default('').optional(),
  price: z.number().min(0).default(0).optional(),
  count: z.number().min(0).default(0).optional(),
});

export type CreateProductData = z.infer<typeof CreateProductDataSchema>;
