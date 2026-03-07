import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as userService from '../services/user.service.js';
import { Role, ROLE_PERMISSIONS } from '@schoollaider/shared';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', async (req, res, next) => {
  try {
    const userPerms = ROLE_PERMISSIONS[req.user!.role as Role] ?? [];
    let schoolId = req.query.schoolId as string | undefined;

    // School directors can only see users in their own school
    if (userPerms.includes('users:manage_own_school') && !userPerms.includes('users:manage')) {
      schoolId = req.user!.schoolId ?? undefined;
    } else if (!userPerms.includes('users:manage') && !userPerms.includes('users:manage_own_school')) {
      res.status(403).json({ error: 'Onvoldoende rechten' });
      return;
    }

    const users = await userService.listUsers(req.user!.tenantId, schoolId);
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.getUser(req.user!.tenantId, req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requirePermission('users:manage'), async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.user!.tenantId, req.params.id, req.body);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requirePermission('users:manage'), async (req, res, next) => {
  try {
    await userService.deleteUser(req.user!.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
