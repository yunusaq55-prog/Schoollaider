import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as hrService from '../services/hr.service.js';

const router = Router();

router.use(authenticate, tenantContext);

// ── Formatie ────────────────────────────────────────────────────────

router.get('/school/:schoolId/formatie', requirePermission('hr:view'), async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string;
    const formatie = await hrService.getFormatie(req.params.schoolId, schooljaar);
    res.json(formatie);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/formatie', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const formatie = await hrService.upsertFormatie(req.params.schoolId, req.body);
    res.json(formatie);
  } catch (err) {
    next(err);
  }
});

// ── Verzuim ─────────────────────────────────────────────────────────

router.get('/school/:schoolId/verzuim', requirePermission('hr:view'), async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
    const periodes = await hrService.getVerzuimPeriodes(req.params.schoolId, limit);
    res.json(periodes);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/verzuim', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const verzuim = await hrService.upsertVerzuim(req.params.schoolId, req.body);
    res.json(verzuim);
  } catch (err) {
    next(err);
  }
});

// ── Vervanging ──────────────────────────────────────────────────────

router.get('/school/:schoolId/vervanging', requirePermission('hr:view'), async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string;
    const vervanging = await hrService.getVervanging(req.params.schoolId, schooljaar);
    res.json(vervanging);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/vervanging', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const vervanging = await hrService.upsertVervanging(req.params.schoolId, req.body);
    res.json(vervanging);
  } catch (err) {
    next(err);
  }
});

// ── Leeftijd ────────────────────────────────────────────────────────

router.get('/school/:schoolId/leeftijd', requirePermission('hr:view'), async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string;
    const leeftijd = await hrService.getLeeftijd(req.params.schoolId, schooljaar);
    res.json(leeftijd);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/leeftijd', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const leeftijd = await hrService.upsertLeeftijd(req.params.schoolId, req.body);
    res.json(leeftijd);
  } catch (err) {
    next(err);
  }
});

// ── Signalen ────────────────────────────────────────────────────────

router.get('/school/:schoolId/signalen', requirePermission('hr:view'), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const signalen = await hrService.listSignalen(req.params.schoolId, status);
    res.json(signalen);
  } catch (err) {
    next(err);
  }
});

router.patch('/signalen/:id', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const signaal = await hrService.updateSignaalStatus(req.params.id, req.body.status);
    res.json(signaal);
  } catch (err) {
    next(err);
  }
});

// ── Overview ────────────────────────────────────────────────────────

router.get('/overview', requirePermission('hr:view'), async (req, res, next) => {
  try {
    const overview = await hrService.getHrSchoolOverview(req.user!.tenantId);
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

export default router;
