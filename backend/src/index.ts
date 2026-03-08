import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initBucket } from './utils/s3.js';
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


const app = express();

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
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

// Error handling
app.use(errorHandler);

// Start server
async function start() {
  try {
    await initBucket();
    console.log('S3 bucket gereed');
  } catch (err) {
    console.warn('S3 bucket init overgeslagen (MinIO niet beschikbaar):', (err as Error).message);
  }

  if (env.AI_ENABLED) {
    console.log('AI analyse ingeschakeld (inline modus, geen Redis vereist)');
  }

  app.listen(env.PORT, () => {
    console.log(`SchoollAIder API draait op http://localhost:${env.PORT}`);
  });
}

start();
