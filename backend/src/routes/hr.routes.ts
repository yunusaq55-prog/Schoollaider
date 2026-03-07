import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requirePermission } from '../middleware/rbac.js';
import * as formatieService from '../services/hr/formatie.service.js';
import * as verzuimService from '../services/hr/verzuim.service.js';
import * as vervangingService from '../services/hr/vervanging.service.js';
import * as leeftijdService from '../services/hr/leeftijd.service.js';
import * as hrScoreService from '../services/hr/hr-score.service.js';
import * as hrSignaalService from '../services/hr/hr-signaal.service.js';
import * as hrDashboardService from '../services/hr/hr-dashboard.service.js';

const router = Router();

router.use(authenticate, tenantContext);

// ─── Bestuur dashboard endpoints ─────────────────────────────

router.get('/bestuur/kpis', async (req, res, next) => {
  try {
    const kpis = await hrDashboardService.getHrBestuurKPIs(req.user!.tenantId);
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

router.get('/bestuur/overview', async (req, res, next) => {
  try {
    const rows = await hrDashboardService.getHrSchoolOverview(req.user!.tenantId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/bestuur/alerts', async (req, res, next) => {
  try {
    const alerts = await hrDashboardService.getHrAlerts(req.user!.tenantId);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// ─── Formatie endpoints ──────────────────────────────────────

router.get('/school/:schoolId/formatie', async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string | undefined;
    const data = await formatieService.getFormatie(req.params.schoolId, schooljaar);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/formatie', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const data = await formatieService.upsertFormatie(req.params.schoolId, req.body);
    // Generate signals after data change
    await hrSignaalService.generateSignalen(req.params.schoolId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Verzuim endpoints ───────────────────────────────────────

router.get('/school/:schoolId/verzuim', async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 12;
    const data = await verzuimService.getVerzuimPeriodes(req.params.schoolId, limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/verzuim', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const data = await verzuimService.upsertVerzuim(req.params.schoolId, req.body);
    await hrSignaalService.generateSignalen(req.params.schoolId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Vervanging endpoints ────────────────────────────────────

router.get('/school/:schoolId/vervanging', async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string | undefined;
    const data = await vervangingService.getVervanging(req.params.schoolId, schooljaar);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/vervanging', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const data = await vervangingService.upsertVervanging(req.params.schoolId, req.body);
    await hrSignaalService.generateSignalen(req.params.schoolId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Leeftijd endpoints ──────────────────────────────────────

router.get('/school/:schoolId/leeftijd', async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string | undefined;
    const data = await leeftijdService.getLeeftijd(req.params.schoolId, schooljaar);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.put('/school/:schoolId/leeftijd', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const data = await leeftijdService.upsertLeeftijd(req.params.schoolId, req.body);
    await hrSignaalService.generateSignalen(req.params.schoolId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── Score & Signalen endpoints ──────────────────────────────

router.get('/school/:schoolId/score', async (req, res, next) => {
  try {
    const data = await hrScoreService.getHrRisicoScore(req.params.schoolId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/signalen', async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const data = await hrSignaalService.listSignalen(
      req.params.schoolId,
      status as 'OPEN' | 'IN_BEHANDELING' | 'AFGEHANDELD' | undefined,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.patch('/signalen/:id', requirePermission('hr:manage'), async (req, res, next) => {
  try {
    const data = await hrSignaalService.updateSignaalStatus(req.params.id, req.body.status);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
