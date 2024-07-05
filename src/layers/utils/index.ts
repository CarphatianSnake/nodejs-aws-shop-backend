import { z } from 'zod';

export const createResponse = (
  methods: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS')[],
  headers?: { [x: string]: string }
) => ({
  statusCode: 500,
  headers: {
    "Access-Control-Allow-Origin": "https://d3ffym298mm09d.cloudfront.net, http://localhost:3000",
    "Access-Control-Allow-Headers": "Authorization, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Content-Type",
    "Access-Control-Allow-Methods": `${methods.join(', ')}`,
    "Content-Type": "application/json",
    ...headers,
  },
  body: JSON.stringify({ message: 'Something went wrong!' })
});

export class CustomError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const ProductSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().default('').optional(),
  price: z.coerce.number().nonnegative().safe().default(0).optional(),
  count: z.coerce.number().nonnegative().safe().default(0).optional(),
});
