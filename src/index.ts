import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';

dotenv.config();

console.log('Starting Flow9 backend...');

import { connectDB } from './config/database';
import authRoutes from './routes/auth';
import shiftsRoutes from './routes/shifts';
import salaryRoutes from './routes/salary';
import subscriptionsRoutes from './routes/subscriptions';
import transactionsRoutes from './routes/transactions';
import categoriesRoutes from './routes/categories';
import notificationsRoutes from './routes/notifications';
import { startCronJobs } from './cron';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftsRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const startServer = async () => {
  try {
    await connectDB();
    console.log('MongoDB connected');

    startCronJobs();
    console.log('Cron jobs started');

    app.listen(PORT, () => {
      console.log(`Flow9 backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
