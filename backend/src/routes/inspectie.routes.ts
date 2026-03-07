import { Router } from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/inspectie/domeinen - alle domeinen met standaarden
router.get('/domeinen', async (_req, res, next) => {
  try {
    const domeinen = await prisma.inspectieDomein.findMany({
      include: { standaarden: true },
      orderBy: { code: 'asc' },
    });
    res.json(domeinen);
  } catch (err) {
    next(err);
  }
});

export default router;
