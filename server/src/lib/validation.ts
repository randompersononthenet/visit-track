import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Validation failed', details: result.error.flatten() });
    }
    // Attach parsed data so handlers can use it safely
    (req as any).parsed = result.data;
    next();
  };
}
