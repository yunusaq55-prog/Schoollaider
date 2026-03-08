import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as documentService from '../services/document.service.js';
import { autoTriggerAnalysis } from '../services/ai/analysis.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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

// Direct file upload — stores file as base64 in the database
router.post('/upload', requirePermission('documents:upload'), upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'Geen bestand ontvangen' });
      return;
    }

    const { schoolId, titel, beschrijving, type, vervaltDatum } = req.body;
    const fileData = file.buffer.toString('base64');

    const document = await documentService.createDocument(req.user!.tenantId, req.user!.userId, {
      schoolId,
      titel: titel || file.originalname,
      beschrijving: beschrijving || '',
      type: type || 'OVERIG',
      vervaltDatum,
      fileData,
      mimeType: file.mimetype,
    });

    // Auto-trigger AI analysis in the background (non-blocking)
    autoTriggerAnalysis(req.user!.tenantId, document.id).catch(() => {});

    res.status(201).json(document);
  } catch (err) {
    next(err);
  }
});

// Legacy presigned URL endpoint (kept for backward compatibility but returns error if S3 is not configured)
router.post('/upload-url', requirePermission('documents:upload'), async (_req, res) => {
  res.status(400).json({ message: 'Gebruik /api/documents/upload voor directe upload. S3 is niet meer beschikbaar.' });
});

// Legacy confirm endpoint
router.post('/confirm', requirePermission('documents:upload'), async (_req, res) => {
  res.status(400).json({ message: 'Gebruik /api/documents/upload voor directe upload.' });
});

// Download file from database
router.get('/:id/download', async (req, res, next) => {
  try {
    const document = await documentService.getDocumentWithFile(req.user!.tenantId, req.params.id);
    if (!document.fileData) {
      res.status(404).json({ message: 'Bestand niet gevonden in database' });
      return;
    }

    const buffer = Buffer.from(document.fileData, 'base64');
    res.setHeader('Content-Type', document.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.titel)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
});

// Keep old download-url endpoint for backward compat — redirect to new download
router.get('/:id/download-url', async (req, res, next) => {
  try {
    // Return a URL that points to our direct download endpoint
    const downloadUrl = `/api/documents/${req.params.id}/download`;
    res.json({ downloadUrl });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/versions', requirePermission('documents:upload'), upload.single('file'), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: 'Geen bestand ontvangen' });
      return;
    }

    const fileData = file.buffer.toString('base64');
    const document = await documentService.createNewVersion(
      req.user!.tenantId,
      req.user!.userId,
      req.params.id,
      fileData,
      req.body.opmerking || '',
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
