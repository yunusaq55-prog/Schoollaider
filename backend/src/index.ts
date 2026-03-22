import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
// S3 no longer used — documents stored in database
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import schoolRoutes from './routes/school.routes.js';
import userRoutes from './routes/user.routes.js';
import documentRoutes from './routes/document.routes.js';
import inspectieRoutes from './routes/inspectie.routes.js';
import pdcaRoutes from './routes/pdca.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import exportRoutes from './routes/export.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import hrRoutes from './routes/hr.routes.js';
import subsidieRoutes from './routes/subsidie.routes.js';
import operationsRoutes from './routes/operations.routes.js';
import {
  startSignalScannerWorker,
  scheduleSignalScanner,
  startInProcessScanner,
} from './jobs/signal-scanner.job.js';
import prisma from './utils/prisma.js';

const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/inspectie', inspectieRoutes);
app.use('/api/pdca', pdcaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/subsidies', subsidieRoutes);
app.use('/api/operations', operationsRoutes);

// Error handling
app.use(errorHandler);

// Start server
async function start() {
  if (env.AI_ENABLED) {
    console.log('AI analyse ingeschakeld (inline modus, geen Redis vereist)');
  }

  app.listen(env.PORT, () => {
    console.log(`SchoollAIder API draait op http://localhost:${env.PORT}`);
  });

  // Signal scanner — BullMQ als Redis beschikbaar is, anders in-process fallback
  try {
    const { getRedisConnection } = await import('./config/redis.js');
    const redis = getRedisConnection();
    await redis.ping(); // gooit error als Redis niet bereikbaar is
    startSignalScannerWorker();
    const tenants = await prisma.tenant.findMany({ select: { id: true } });
    await scheduleSignalScanner(tenants.map((t) => t.id));
  } catch {
    startInProcessScanner();
  }
}

start();
