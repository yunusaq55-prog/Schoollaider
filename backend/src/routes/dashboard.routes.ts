import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import prisma from '../utils/prisma.js';
import * as dashboardService from '../services/dashboard.service.js';
import * as readinessService from '../services/readiness.service.js';
import * as gapAnalysisService from '../services/gap-analysis.service.js';
import * as complianceService from '../services/compliance.service.js';
import { getPdcaCycleStatus, getCurrentSchoolYear } from '../services/pdca.service.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/bestuur/kpis', async (req, res, next) => {
  try {
    const kpis = await dashboardService.getBestuurKPIs(req.user!.tenantId);
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

router.get('/bestuur/overview', async (req, res, next) => {
  try {
    const rows = await dashboardService.getSchoolOverviewTable(req.user!.tenantId);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/bestuur/alerts', async (req, res, next) => {
  try {
    const alerts = await dashboardService.getSchoolAlerts(req.user!.tenantId);
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/score', async (req, res, next) => {
  try {
    const scoreData = await readinessService.calculateSchoolScore(req.user!.tenantId, req.params.schoolId);
    // Transform to ReadinessScore shape expected by frontend
    res.json({
      score: {
        totalScore: scoreData.totalScore,
        domainScores: Object.fromEntries(
          scoreData.domainScores.map((d) => [d.naam, d.score]),
        ),
        berekendOp: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/gaps', async (req, res, next) => {
  try {
    const gapData = await gapAnalysisService.analyzeSchool(req.user!.tenantId, req.params.schoolId);

    // Count standards by status for gap summary
    const schoolId = req.params.schoolId;
    const schooljaar = getCurrentSchoolYear();
    const pdcaStatus = await getPdcaCycleStatus(schoolId, schooljaar);

    // Get all standards and their school statuses for gap summary
    const allStandaarden = await prisma.inspectieStandaard.findMany({
      include: { schoolStatuses: { where: { schoolId } } },
    });

    const aantoonbaar = allStandaarden.filter((s) => s.schoolStatuses[0]?.status === 'AANTOONBAAR').length;
    const onvolledig = allStandaarden.filter((s) => s.schoolStatuses[0]?.status === 'ONVOLLEDIG').length;
    const ontbreekt = allStandaarden.length - aantoonbaar - onvolledig;

    // Transform to shape expected by frontend
    res.json({
      ...gapData,
      gaps: { aantoonbaar, onvolledig, ontbreekt },
      pdca: {
        plan: pdcaStatus.find((p) => p.fase === 'PLAN')?.isComplete ?? false,
        do: pdcaStatus.find((p) => p.fase === 'DO')?.isComplete ?? false,
        check: pdcaStatus.find((p) => p.fase === 'CHECK')?.isComplete ?? false,
        act: pdcaStatus.find((p) => p.fase === 'ACT')?.isComplete ?? false,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/recalculate', async (req, res, next) => {
  try {
    const scores = await readinessService.calculateAllSchoolScores(req.user!.tenantId);
    res.json(scores);
  } catch (err) {
    next(err);
  }
});

// Compliance endpoints
router.get('/school/:schoolId/compliance', async (req, res, next) => {
  try {
    const matrix = await complianceService.getSchoolComplianceMatrix(req.user!.tenantId, req.params.schoolId);
    res.json(matrix);
  } catch (err) {
    next(err);
  }
});

router.get('/bestuur/compliance', async (req, res, next) => {
  try {
    const overview = await complianceService.getBestuurComplianceOverview(req.user!.tenantId);
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

export default router;
