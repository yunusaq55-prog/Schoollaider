import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import { generateInspectiedossier } from '../services/export.service.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/school/:schoolId/inspectiedossier', requirePermission('export:inspectiedossier'), async (req, res, next) => {
  try {
    const pdfBuffer = await generateInspectiedossier(req.user!.tenantId, req.params.schoolId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="inspectiedossier-${req.params.schoolId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;
