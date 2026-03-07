import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as schoolService from '../services/school.service.js';
import type { SchoolStatus } from '@prisma/client';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status as SchoolStatus | undefined;
    const schools = await schoolService.listSchools(req.user!.tenantId, { status });
    res.json(schools);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const school = await schoolService.getSchool(req.user!.tenantId, req.params.id);
    res.json(school);
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('schools:manage'), async (req, res, next) => {
  try {
    const school = await schoolService.createSchool(req.user!.tenantId, req.body);
    res.status(201).json(school);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requirePermission('schools:manage'), async (req, res, next) => {
  try {
    const school = await schoolService.updateSchool(req.user!.tenantId, req.params.id, req.body);
    res.json(school);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/archive', requirePermission('schools:manage'), async (req, res, next) => {
  try {
    const school = await schoolService.archiveSchool(req.user!.tenantId, req.params.id);
    res.json(school);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requirePermission('schools:manage'), async (req, res, next) => {
  try {
    await schoolService.deleteSchool(req.user!.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
