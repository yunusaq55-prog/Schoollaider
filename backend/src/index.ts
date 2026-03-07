import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import tenantRoutes from './routes/tenant.routes.js';
import schoolRoutes from './routes/school.routes.js';
import userRoutes from './routes/user.routes.js';
import documentRoutes from './routes/document.routes.js';
import pdcaRoutes from './routes/pdca.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import hrRoutes from './routes/hr.routes.js';
import inspectieRoutes from './routes/inspectie.routes.js';

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
app.use('/api/pdca', pdcaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/inspectie', inspectieRoutes);

// Error handling
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`SchoollAIder API draait op http://localhost:${env.PORT}`);
});
