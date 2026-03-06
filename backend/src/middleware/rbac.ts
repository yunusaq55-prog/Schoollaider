import type { Request, Response, NextFunction } from 'express';
import { ROLE_PERMISSIONS, type Permission, type Role } from '@schoollaider/shared';
import { ForbiddenError } from '../utils/errors.js';

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role as Role] ?? [];
    const hasAll = permissions.every((p) => userPermissions.includes(p));

    if (!hasAll) {
      return next(new ForbiddenError('Onvoldoende rechten voor deze actie'));
    }

    next();
  };
}
