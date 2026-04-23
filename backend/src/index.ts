import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import trackRoutes from './routes/track';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve the tracker script
app.use('/tracker.js', express.static('../tracker/tracker.js'));

// API Routes
app.use('/api/track', trackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app, prisma };
