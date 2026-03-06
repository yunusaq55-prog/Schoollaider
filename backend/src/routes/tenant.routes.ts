import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import * as tenantService from '../services/tenant.service.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('tenants:manage'));

router.get('/', async (_req, res, next) => {
  try {
    const tenants = await tenantService.listTenants();
    res.json(tenants);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const tenant = await tenantService.getTenant(req.params.id);
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);
    res.status(201).json(tenant);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json(tenant);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await tenantService.deleteTenant(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
