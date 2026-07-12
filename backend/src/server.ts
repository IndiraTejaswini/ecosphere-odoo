import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import connectDB from './db';
import { startCronJobs } from './cron/complianceCron';
import { updateLeaderboardCache } from './utils/leaderboardCache';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import masterDataRoutes from './routes/masterData.routes';
import carbonTransactionRoutes from './routes/carbonTransaction.routes';
import csrRoutes from './routes/csr.routes';
import challengeRoutes from './routes/challenge.routes';
import governanceRoutes from './routes/governance.routes';
import rewardRoutes from './routes/reward.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import reportsRoutes from './routes/reports.routes';
import notificationRoutes from './routes/notifications.routes';
import settingsRoutes from './routes/settings.routes';
import diversityRoutes from './routes/diversity.routes';
import trainingRoutes from './routes/training.routes';

const app = express();

// CORS - allow the React frontend (Vite default is 5173, CRA default is 3000)
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Local "Evidence" Storage: serve /uploads statically (Boss Level Add-On #12)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 👉 MOVED HEALTH CHECK HERE (Above all other routes so it doesn't get blocked)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
// masterDataRoutes internally defines /departments, /categories,
// /emission-factors, /environmental-goals, /policies, /badges, /rewards,
// /product-esg-profiles - all mounted under /api
app.use('/api', masterDataRoutes);
app.use('/api/carbon-transactions', carbonTransactionRoutes);
app.use('/api/csr', csrRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/rewards', rewardRoutes); // adds POST /:id/redeem alongside masterDataRoutes' CRUD
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/diversity', diversityRoutes);
app.use('/api/training', trainingRoutes);

// 404 handler
app.use('/api', (_req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler (must be registered last)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  await updateLeaderboardCache(); // warm the leaderboard cache before serving traffic
  startCronJobs();
  app.listen(PORT, () => {
    console.log(`🚀 EcoSphere API running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
});