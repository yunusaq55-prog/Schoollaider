import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as inspectieService from '../services/inspectie.service.js';
import prisma from '../utils/prisma.js';

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

router.post('/school/:schoolId/bulk-update', async (req, res, next) => {
  try {
    const { updates } = req.body as {
      updates: Array<{ standaardId: string; status: 'AANTOONBAAR' | 'ONVOLLEDIG' | 'ONTBREEKT' }>;
    };
    if (!Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ error: 'updates array is verplicht' });
      return;
    }
    const result = await prisma.$transaction(
      updates.map(({ standaardId, status }) =>
        prisma.schoolStandaardStatus.upsert({
          where: { schoolId_standaardId: { schoolId: req.params.schoolId, standaardId } },
          update: { status },
          create: {
            schoolId: req.params.schoolId,
            standaardId,
            status,
            bewijs: '',
            evaluatie: '',
            actueel: false,
            opmerking: '',
          },
        })
      ),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
