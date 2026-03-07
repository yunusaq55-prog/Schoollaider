import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as analysisService from '../services/ai/analysis.service.js';

const router = Router();

router.use(authenticate, tenantContext);

// Trigger analysis for a document
router.post('/documents/:documentId/analyze', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const result = await analysisService.startDocumentAnalysis(req.user!.tenantId, req.params.documentId);
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
});

// Get analysis status for a document
router.get('/documents/:documentId/status', async (req, res, next) => {
  try {
    const status = await analysisService.getAnalysisStatus(req.user!.tenantId, req.params.documentId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// Get analysis results for a document
router.get('/documents/:documentId/results', async (req, res, next) => {
  try {
    const analysis = await analysisService.getDocumentAnalysis(req.user!.tenantId, req.params.documentId);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
});

// Retry failed analysis
router.post('/documents/:documentId/retry', requirePermission('documents:manage'), async (req, res, next) => {
  try {
    const result = await analysisService.retryAnalysis(req.user!.tenantId, req.params.documentId);
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
});

// School analysis overview
router.get('/school/:schoolId/overview', async (req, res, next) => {
  try {
    const overview = await analysisService.getSchoolAnalysisOverview(req.user!.tenantId, req.params.schoolId);
    res.json(overview);
  } catch (err) {
    next(err);
  }
});

// List all analysis jobs (admin)
router.get('/jobs', async (req, res, next) => {
  try {
    const jobs = await analysisService.listAnalysisJobs(req.user!.tenantId);
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

export default router;
