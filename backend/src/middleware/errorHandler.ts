import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/errors.js';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validatie fout', details: err.flatten().fieldErrors });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Interne serverfout' });
};
