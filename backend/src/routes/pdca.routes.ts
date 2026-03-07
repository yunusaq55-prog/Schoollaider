import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as pdcaService from '../services/pdca.service.js';
import * as pdcaGenerator from '../services/ai/pdca-generator.service.js';
import { requirePermission } from '../middleware/rbac.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/school/:schoolId', async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string | undefined;
    const items = await pdcaService.listPdcaItems(req.params.schoolId, schooljaar);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/cycle-status', async (req, res, next) => {
  try {
    const schooljaar = (req.query.schooljaar as string) ?? pdcaService.getCurrentSchoolYear();
    const status = await pdcaService.getPdcaCycleStatus(req.params.schoolId, schooljaar);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

router.post('/school/:schoolId', async (req, res, next) => {
  try {
    const item = await pdcaService.createPdcaItem({
      schoolId: req.params.schoolId,
      ...req.body,
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const item = await pdcaService.updatePdcaItem(req.params.id, req.body);
    res.json(item);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await pdcaService.deletePdcaItem(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// AI suggestion routes
router.post('/school/:schoolId/generate', requirePermission('pdca:manage'), async (req, res, next) => {
  try {
    const schooljaar = req.body.schooljaar as string | undefined;
    const result = await pdcaGenerator.generateSuggestionsForSchool(req.user!.tenantId, req.params.schoolId, schooljaar);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/school/:schoolId/suggestions', async (req, res, next) => {
  try {
    const schooljaar = req.query.schooljaar as string | undefined;
    const status = req.query.status as string | undefined;
    const suggestions = await pdcaGenerator.listSuggestions(req.params.schoolId, schooljaar, status);
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
});

router.post('/suggestions/:id/accept', requirePermission('pdca:manage'), async (req, res, next) => {
  try {
    const pdcaItem = await pdcaGenerator.acceptSuggestion(req.params.id);
    res.json(pdcaItem);
  } catch (err) {
    next(err);
  }
});

router.post('/suggestions/:id/dismiss', requirePermission('pdca:manage'), async (req, res, next) => {
  try {
    const suggestion = await pdcaGenerator.dismissSuggestion(req.params.id);
    res.json(suggestion);
  } catch (err) {
    next(err);
  }
});

export default router;
