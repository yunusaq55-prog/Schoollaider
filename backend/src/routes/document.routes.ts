import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as documentService from '../services/document.service.js';
import { autoTriggerAnalysis } from '../services/ai/analysis.service.js';
import { generateUploadUrl, generateDownloadUrl } from '../utils/s3.js';
import { randomUUID } from 'crypto';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/', async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const documents = await documentService.listDocuments(req.user!.tenantId, schoolId);
    res.json(documents);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const document = await documentService.getDocument(req.user!.tenantId, req.params.id);
    res.json(document);
  } catch (err) {
    next(err);
  }
});

router.post('/upload-url', requirePermission('documents:upload'), async (req, res, next) => {
  try {
    const { schoolId, filename, type } = req.body;
    const s3Key = `${req.user!.tenantId}/${schoolId}/${type}/${randomUUID()}-${filename}`;
    const uploadUrl = await generateUploadUrl(s3Key);
    res.json({ uploadUrl, s3Key });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm', requirePermission('documents:upload'), async (req, res, next) => {
  try {
    const document = await documentService.createDocument(req.user!.tenantId, req.user!.userId, req.body);

    // Auto-trigger AI analysis in the background (non-blocking)
    autoTriggerAnalysis(req.user!.tenantId, document.id).catch(() => {});

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/download-url', async (req, res, next) => {
  try {
    const document = await documentService.getDocument(req.user!.tenantId, req.params.id);
    const downloadUrl = await generateDownloadUrl(document.s3Key);
    res.json({ downloadUrl });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/versions', requirePermission('documents:upload'), async (req, res, next) => {
  try {
    const { s3Key, opmerking } = req.body;
    const document = await documentService.createNewVersion(
      req.user!.tenantId,
      req.user!.userId,
      req.params.id,
      s3Key,
      opmerking,
    );
    res.json(document);
  } catch (err) {
    next(err);
  }
});

router.get('/:id/versions', async (req, res, next) => {
  try {
    const versions = await documentService.listDocumentVersions(req.user!.tenantId, req.params.id);
    res.json(versions);
  } catch (err) {
    next(err);
  }
});

router.post('/:id/link-standaard', requirePermission('documents:upload'), async (req, res, next) => {
  try {
    const link = await documentService.linkDocumentToStandaard(
      req.user!.tenantId,
      req.params.id,
      req.body.standaardId,
    );
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/link-standaard/:standaardId', requirePermission('documents:upload'), async (req, res, next) => {
  try {
    await documentService.unlinkDocumentFromStandaard(
      req.user!.tenantId,
      req.params.id,
      req.params.standaardId,
    );
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const document = await documentService.updateDocument(req.user!.tenantId, req.params.id, req.body);
    res.json(document);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await documentService.deleteDocument(req.user!.tenantId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
