import express from 'express';
import cors from 'cors';
import { PORT, APP_NAME, TAGLINE } from './config.js';
import { seedDatabase } from './db/seed.js';
import db from './db/database.js';

import authRouter from './routes/auth.js';
import familiesRouter from './routes/families.js';
import dashboardRouter from './routes/dashboard.js';
import expensesRouter from './routes/expenses.js';
import budgetRouter from './routes/budget.js';
import investmentsRouter from './routes/investments.js';
import goalsRouter from './routes/goals.js';
import calendarRouter from './routes/calendar.js';
import documentsRouter from './routes/documents.js';
import tasksRouter from './routes/tasks.js';
import memoriesRouter from './routes/memories.js';
import emergencyRouter from './routes/emergency.js';
import aiRouter from './routes/ai.js';
import searchRouter from './routes/search.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Ensure seed data exists on startup
if (db.getTable('users').length === 0) {
  console.log('⚡ Initializing and seeding Sharma Family demo data...');
  seedDatabase();
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: APP_NAME,
    tagline: TAGLINE,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/families', familiesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/budget', budgetRouter);
app.use('/api/investments', investmentsRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/memories', memoriesRouter);
app.use('/api/emergency', emergencyRouter);
app.use('/api/ai', aiRouter);
app.use('/api/search', searchRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Something went wrong. Please try again.',
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`✨ ${APP_NAME} Backend running on http://localhost:${PORT}`);
  console.log(`🏡 "${TAGLINE}"`);
});
