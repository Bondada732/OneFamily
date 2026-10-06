import express from 'express';
import cors from 'cors';
import { PORT, APP_NAME, TAGLINE } from './config.js';
import { seedDatabase } from './db/seed.js';
import db from './db/database.js';
import { isAzurePostgresConfigured } from './db/azurePostgres.js';

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
import smartExpensesRouter from './routes/smartExpenses.js';
import familyRemindersRouter from './routes/familyReminders.js';
import uploadRouter from './routes/upload.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Root & Health Check Endpoints
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    app: APP_NAME,
    tagline: TAGLINE,
    message: 'Famora API Server is up and running!',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      families: '/api/families',
      expenses: '/api/expenses',
      goals: '/api/goals',
      dashboard: '/api/dashboard',
    },
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

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
app.use('/api/smart-expenses', smartExpensesRouter);
app.use('/api/family-reminders', familyRemindersRouter);
app.use('/api/upload', uploadRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({
    error: 'Something went wrong. Please try again.',
    message: err.message || 'Internal Server Error',
  });
});

async function startServer() {
  const azureConfigured = isAzurePostgresConfigured();

  if (azureConfigured) {
    const hydratedFromAzure = await db.hydrateFromAzurePostgres();
    if (!hydratedFromAzure) {
      console.error('Azure PostgreSQL is configured, but app data could not be loaded. Skipping Supabase fallback and demo seeding.');
    }
  } else {
    await db.hydrateFromSupabase();
  }

  if (db.getTable('users').length === 0 && !azureConfigured) {
    console.log('⚡ Initializing and seeding Sharma Family demo data...');
    seedDatabase();
  }

  // Ensure all existing SPOUSE & ADULT members have default Finance & Investment permissions granted
  const allUsers = db.getTable('users');
  const targetRoles = ['SPOUSE', 'ADULT'];
  const financeCodes = ['FINANCE_VIEW', 'FINANCE_EDIT', 'INVESTMENT_VIEW', 'INVESTMENT_EDIT'];
  for (const u of allUsers) {
    if (targetRoles.includes(u.role)) {
      for (const code of financeCodes) {
        const existing = db.findOne('member_permissions', (mp) => mp.user_id === u.id && mp.permission_code === code);
        if (!existing) {
          db.insert('member_permissions', { user_id: u.id, permission_code: code });
        }
      }
    }
  }

  app.listen(PORT, () => {
    console.log(`✨ ${APP_NAME} Backend running on http://localhost:${PORT}`);
    console.log(`🏡 "${TAGLINE}"`);
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize the database:', err);
  process.exitCode = 1;
});
