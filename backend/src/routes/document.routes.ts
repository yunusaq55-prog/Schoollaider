import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as documentService from '../services/document.service.js';

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

router.post('/', requirePermission('documents:upload'), async (req, res, next) => {
  try {
    // TODO: Integrate actual S3/MinIO upload - for now accept s3Key in body
    const document = await documentService.createDocument(req.user!.tenantId, req.user!.userId, req.body);
    res.status(201).json(document);
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
