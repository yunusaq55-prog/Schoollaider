import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as pdcaService from '../services/pdca.service.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', requirePermission('kwaliteit:view'), async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const cycli = await pdcaService.listCycli(req.user!.tenantId, schoolId);
    res.json(cycli);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requirePermission('kwaliteit:view'), async (req, res, next) => {
  try {
    const cyclus = await pdcaService.getCyclus(req.user!.tenantId, req.params.id);
    res.json(cyclus);
  } catch (err) {
    next(err);
  }
});

router.post('/', requirePermission('kwaliteit:manage'), async (req, res, next) => {
  try {
    const cyclus = await pdcaService.createCyclus(req.user!.tenantId, req.user!.userId, req.body);
    res.status(201).json(cyclus);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', requirePermission('kwaliteit:manage'), async (req, res, next) => {
  try {
    const cyclus = await pdcaService.updateCyclus(req.user!.tenantId, req.params.id, req.body);
    res.json(cyclus);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requirePermission('kwaliteit:manage'), async (req, res, next) => {
  try {
    await pdcaService.deleteCyclus(req.user!.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post('/:id/acties', requirePermission('kwaliteit:manage'), async (req, res, next) => {
  try {
    const actie = await pdcaService.addActie(req.params.id, req.body);
    res.status(201).json(actie);
  } catch (err) {
    next(err);
  }
});

router.patch('/acties/:actieId', requirePermission('kwaliteit:manage'), async (req, res, next) => {
  try {
    const actie = await pdcaService.updateActie(req.params.actieId, req.body);
    res.json(actie);
  } catch (err) {
    next(err);
  }
});

router.delete('/acties/:actieId', requirePermission('kwaliteit:manage'), async (req, res, next) => {
  try {
    await pdcaService.deleteActie(req.params.actieId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
