import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../utils/errors.js';
import { Role } from '@schoollaider/shared';

export function tenantContext(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new ForbiddenError());
  }

  // Super admins can access any tenant via ?tenantId= query param
  if (req.user.role === Role.SUPER_ADMIN && req.query.tenantId) {
    req.user.tenantId = req.query.tenantId as string;
  }

  if (!req.user.tenantId && req.user.role !== Role.SUPER_ADMIN) {
    return next(new ForbiddenError('Geen tenant context'));
  }

  next();
}
