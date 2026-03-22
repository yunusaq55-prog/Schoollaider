import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { requirePermission } from '../middleware/rbac.js';
import * as morningBriefService from '../services/operations/morning-brief.service.js';
import * as actieService from '../services/operations/actie.service.js';
import * as vergaderingService from '../services/operations/vergadering.service.js';
import * as communicatieService from '../services/operations/communicatie.service.js';
import * as schoolOverviewService from '../services/operations/school-overview.service.js';
import * as beleidService from '../services/operations/beleid.service.js';
import * as predictiveService from '../services/operations/predictive.service.js';
import * as documentSearchService from '../services/operations/document-search.service.js';

const router = Router();

router.use(authenticate, tenantContext, requirePermission('operations:view'));

// ─── Morning Brief ────────────────────────────────────────

router.get('/morning-brief', async (req, res, next) => {
  try {
    const brief = await morningBriefService.getMorningBrief(req.user!.tenantId);
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

router.post('/morning-brief/regenerate', async (req, res, next) => {
  try {
    const brief = await morningBriefService.regenerateMorningBrief(req.user!.tenantId);
    res.json(brief);
  } catch (err) {
    next(err);
  }
});

// ─── School Overview ──────────────────────────────────────

router.get('/school-overview', async (req, res, next) => {
  try {
    const overview = await schoolOverviewService.getSchoolOverview(req.user!.tenantId);
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// ─── Acties ───────────────────────────────────────────────

router.get('/acties', async (req, res, next) => {
  try {
    const { schoolId, status, prioriteit } = req.query as Record<string, string>;
    const acties = await actieService.listActies(req.user!.tenantId, { schoolId, status, prioriteit });
    res.json(acties);
  } catch (err) {
    next(err);
  }
});

router.post('/acties', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const actie = await actieService.createActie({
      ...req.body,
      tenantId: req.user!.tenantId,
      createdBy: req.user!.id,
    });
    res.status(201).json(actie);
  } catch (err) {
    next(err);
  }
});

router.post('/acties/from-signaal', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const { signaalId, signaalType } = req.body;
    const actie = await actieService.createActieFromSignaal(
      req.user!.tenantId,
      signaalId,
      signaalType,
      req.user!.id,
    );
    res.status(201).json(actie);
  } catch (err) {
    next(err);
  }
});

router.patch('/acties/:id', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const actie = await actieService.updateActie(req.params.id, req.user!.tenantId, req.body);
    res.json(actie);
  } catch (err) {
    next(err);
  }
});

// ─── Vergaderingen ────────────────────────────────────────

router.get('/vergaderingen', async (req, res, next) => {
  try {
    const vergaderingen = await vergaderingService.listVergaderingen(req.user!.tenantId);
    res.json(vergaderingen);
  } catch (err) {
    next(err);
  }
});

router.post('/vergaderingen', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const vergadering = await vergaderingService.createVergadering({
      ...req.body,
      datum: new Date(req.body.datum),
      tenantId: req.user!.tenantId,
      createdBy: req.user!.id,
    });
    res.status(201).json(vergadering);
  } catch (err) {
    next(err);
  }
});

router.post('/vergaderingen/:id/agenda', requirePermission('operations:ai_draft'), async (req, res, next) => {
  try {
    const vergadering = await vergaderingService.generateVergaderingAgenda(
      req.params.id,
      req.user!.tenantId,
    );
    res.json(vergadering);
  } catch (err) {
    next(err);
  }
});

router.patch('/vergaderingen/:id', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const vergadering = await vergaderingService.updateVergadering(
      req.params.id,
      req.user!.tenantId,
      req.body,
    );
    res.json(vergadering);
  } catch (err) {
    next(err);
  }
});

// ─── Communicatie ─────────────────────────────────────────

router.get('/communicatie', async (req, res, next) => {
  try {
    const { schoolId, definitief } = req.query as Record<string, string>;
    const drafts = await communicatieService.listDrafts(req.user!.tenantId, {
      schoolId,
      definitief: definitief !== undefined ? definitief === 'true' : undefined,
    });
    res.json(drafts);
  } catch (err) {
    next(err);
  }
});

router.post('/communicatie/genereer', requirePermission('operations:ai_draft'), async (req, res, next) => {
  try {
    const draft = await communicatieService.generateDraft({
      ...req.body,
      tenantId: req.user!.tenantId,
      createdBy: req.user!.id,
    });
    res.status(201).json(draft);
  } catch (err) {
    next(err);
  }
});

router.patch('/communicatie/:id', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const draft = await communicatieService.updateDraft(
      req.params.id,
      req.user!.tenantId,
      req.body,
    );
    res.json(draft);
  } catch (err) {
    next(err);
  }
});

// ─── Beleid ───────────────────────────────────────────────

router.get('/beleid', async (req, res, next) => {
  try {
    const { schoolId, domein, status } = req.query as Record<string, string>;
    const docs = await beleidService.listBeleidsDocumenten(req.user!.tenantId, {
      schoolId,
      domein,
      status,
    });
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.get('/beleid/evaluaties', async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 60;
    const docs = await beleidService.getUpcomingEvaluaties(req.user!.tenantId, days);
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.post('/beleid', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const doc = await beleidService.createBeleidsDocument({
      ...req.body,
      vastgesteldDatum: req.body.vastgesteldDatum ? new Date(req.body.vastgesteldDatum) : undefined,
      evaluatieDatum: req.body.evaluatieDatum ? new Date(req.body.evaluatieDatum) : undefined,
      volgendEvaluatieDatum: req.body.volgendEvaluatieDatum
        ? new Date(req.body.volgendEvaluatieDatum)
        : undefined,
      tenantId: req.user!.tenantId,
      createdBy: req.user!.id,
    });
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.patch('/beleid/:id', requirePermission('operations:manage'), async (req, res, next) => {
  try {
    const doc = await beleidService.updateBeleidsDocument(
      req.params.id,
      req.user!.tenantId,
      req.body,
    );
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// ─── Predictive Analytics ─────────────────────────────────

router.get('/analytics/predictive', async (req, res, next) => {
  try {
    const insights = await predictiveService.getPredictiveInsights(req.user!.tenantId);
    res.json(insights);
  } catch (err) {
    next(err);
  }
});

// ─── Document Search ──────────────────────────────────────

router.post('/zoeken', async (req, res, next) => {
  try {
    const { vraag } = req.body;
    if (!vraag || typeof vraag !== 'string') {
      res.status(400).json({ error: 'vraag is verplicht' });
      return;
    }
    const result = await documentSearchService.semanticSearch(req.user!.tenantId, vraag);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
