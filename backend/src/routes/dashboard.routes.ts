import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/rbac.js';
import { tenantContext } from '../middleware/tenantContext.js';
import * as dashboardService from '../services/dashboard.service.js';

const router = Router();

router.use(authenticate, tenantContext);

router.get('/stats', requirePermission('kwaliteit:view'), async (req, res, next) => {
  try {
    const schoolId = req.query.schoolId as string | undefined;
    const stats = await dashboardService.getDashboardStats(req.user!.tenantId, schoolId);
    res.json(stats);
  } catch (err) {
    next(err);
  }
});

export default router;
