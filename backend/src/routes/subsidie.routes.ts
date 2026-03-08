import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as bibliotheekService from '../services/subsidie/bibliotheek.service.js';
import * as matchService from '../services/subsidie/match.service.js';
import * as dossierService from '../services/subsidie/dossier.service.js';
import * as bestedingService from '../services/subsidie/besteding.service.js';
import * as verantwoordingService from '../services/subsidie/verantwoording.service.js';
import * as signaalService from '../services/subsidie/signaal.service.js';
import * as dashboardService from '../services/subsidie/dashboard.service.js';
import * as kalenderService from '../services/subsidie/kalender.service.js';

const router = Router();

router.use(authenticate, tenantContext);

// ─── Bibliotheek endpoints ──────────────────────────────────

router.get('/bibliotheek', async (req, res, next) => {
  try {
    const financier = req.query.financier as string | undefined;
    const actief = req.query.actief !== undefined
      ? req.query.actief === 'true'
      : undefined;
    const regelingen = await bibliotheekService.listRegelingen({ financier, actief });
    res.json(regelingen);
  } catch (err) {
    next(err);
  }
});

router.get('/bibliotheek/:id', async (req, res, next) => {
  try {
    const regeling = await bibliotheekService.getRegeling(req.params.id);
    res.json(regeling);
  } catch (err) {
    next(err);
  }
});

// ─── Matches endpoints ─────────────────────────────────────

router.get('/matches', async (req, res, next) => {
  try {
    const matches = await matchService.getMatches(req.user!.tenantId);
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

// ─── Dossier endpoints ─────────────────────────────────────

router.get('/dossiers', async (req, res, next) => {
  try {
    const dossiers = await dossierService.listDossiers(req.user!.tenantId);
    res.json(dossiers);
  } catch (err) {
    next(err);
  }
});

router.post('/dossiers', async (req, res, next) => {
  try {
    const { subsidieId, naam, schoolIds, bedragAangevraagd } = req.body;
    const dossier = await dossierService.createDossier({
      tenantId: req.user!.tenantId,
      subsidieId,
      naam,
      schoolIds,
      bedragAangevraagd,
      createdBy: req.user!.userId,
    });
    res.status(201).json(dossier);
  } catch (err) {
    next(err);
  }
});

router.get('/dossiers/:id', async (req, res, next) => {
  try {
    const dossier = await dossierService.getDossier(req.params.id, req.user!.tenantId);
    res.json(dossier);
  } catch (err) {
    next(err);
  }
});

router.patch('/dossiers/:id', async (req, res, next) => {
  try {
    const dossier = await dossierService.updateDossier(req.params.id, req.user!.tenantId, req.body);
    res.json(dossier);
  } catch (err) {
    next(err);
  }
});

router.delete('/dossiers/:id', async (req, res, next) => {
  try {
    await dossierService.deleteDossier(req.params.id, req.user!.tenantId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Bestedingen endpoints ──────────────────────────────────

router.get('/dossiers/:id/bestedingen', async (req, res, next) => {
  try {
    const bestedingen = await bestedingService.listBestedingen(req.params.id, req.user!.tenantId);
    res.json(bestedingen);
  } catch (err) {
    next(err);
  }
});

router.post('/dossiers/:id/bestedingen', async (req, res, next) => {
  try {
    const besteding = await bestedingService.createBesteding({
      dossierId: req.params.id,
      tenantId: req.user!.tenantId,
      createdBy: req.user!.userId,
      ...req.body,
    });
    res.status(201).json(besteding);
  } catch (err) {
    next(err);
  }
});

router.patch('/bestedingen/:id', async (req, res, next) => {
  try {
    const besteding = await bestedingService.updateBesteding(req.params.id, req.user!.tenantId, req.body);
    res.json(besteding);
  } catch (err) {
    next(err);
  }
});

router.delete('/bestedingen/:id', async (req, res, next) => {
  try {
    await bestedingService.deleteBesteding(req.params.id, req.user!.tenantId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// ─── Verantwoording endpoints ───────────────────────────────

router.get('/dossiers/:id/verantwoording', async (req, res, next) => {
  try {
    const verantwoording = await verantwoordingService.getVerantwoording(req.params.id, req.user!.tenantId);
    res.json(verantwoording);
  } catch (err) {
    next(err);
  }
});

router.patch('/dossiers/:id/verantwoording', async (req, res, next) => {
  try {
    const verantwoording = await verantwoordingService.updateVerantwoording(req.params.id, req.user!.tenantId, req.body);
    res.json(verantwoording);
  } catch (err) {
    next(err);
  }
});

// ─── Signalen endpoints ────────────────────────────────────

router.get('/signalen', async (req, res, next) => {
  try {
    const gelezen = req.query.gelezen !== undefined
      ? req.query.gelezen === 'true'
      : undefined;
    const urgentie = req.query.urgentie as string | undefined;
    const signalen = await signaalService.listSignalen(req.user!.tenantId, { gelezen, urgentie });
    res.json(signalen);
  } catch (err) {
    next(err);
  }
});

router.patch('/signalen/:id/gelezen', async (req, res, next) => {
  try {
    const signaal = await signaalService.markGelezen(req.params.id, req.user!.tenantId);
    res.json(signaal);
  } catch (err) {
    next(err);
  }
});

// ─── Dashboard & Kalender endpoints ────────────────────────

router.get('/dashboard', async (req, res, next) => {
  try {
    const kpis = await dashboardService.getDashboardKPIs(req.user!.tenantId);
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

router.get('/kalender', async (req, res, next) => {
  try {
    const items = await kalenderService.getDeadlineKalender(req.user!.tenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

export default router;
