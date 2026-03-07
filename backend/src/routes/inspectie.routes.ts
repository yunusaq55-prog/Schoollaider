import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as inspectieService from '../services/inspectie.service.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/domeinen', async (_req, res, next) => {
  try {
    const domeinen = await inspectieService.listDomeinen();
    res.json(domeinen);
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/statuses', async (req, res, next) => {
  try {
    const data = await inspectieService.getSchoolStandaardStatuses(
      req.user!.tenantId,
      req.params.schoolId,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/standaard/:standaardId', async (req, res, next) => {
  try {
    const status = await inspectieService.upsertSchoolStandaardStatus(
      req.params.schoolId,
      req.params.standaardId,
      req.body,
    );
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/standaard/:standaardId/evidence', async (req, res, next) => {
  try {
    const data = await inspectieService.getStandaardWithEvidence(
      req.user!.tenantId,
      req.params.schoolId,
      req.params.standaardId,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
