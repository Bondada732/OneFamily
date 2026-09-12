import express from 'express';
import db from '../db/database.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { processAIChat, generateFinancialInsights } from '../services/aiService.js';
import { logActivity } from '../services/auditService.js';

const router = express.Router();
router.use(authMiddleware);

// FamilyAI Chat (Strictly Permission Aware)
router.post('/chat', (req: AuthRequest, res) => {
  const familyId = req.familyId!;
  const userId = req.user!.id;
  const { query } = req.body;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query string required' });
  }

  const response = processAIChat(familyId, userId, query);

  // Save in conversation history
  db.insert('ai_conversations', {
    id: `conv_${Date.now()}`,
    family_id: familyId,
    user_id: userId,
    role_at_time: req.user!.role,
    user_query: query,
    ai_response: response.message,
    tools_called: JSON.stringify(response.sourcesUsed || []),
    created_at: new Date().toISOString(),
  });

  res.json(response);
});

// Proactive AI Financial Insights
router.get('/insights', (req: AuthRequest, res) => {
  const familyId = req.familyId!;
  const user = req.user!;

  const hasFinance = user.role === 'FAMILY_HEAD' || user.permissions.includes('FINANCE_VIEW');
  if (!hasFinance) {
    return res.status(403).json({ error: 'Permission denied for financial insights' });
  }

  const insights = generateFinancialInsights(familyId);
  res.json(insights);
});

// AI Travel Packing List Generator
router.post('/travel-checklist', (req: AuthRequest, res) => {
  const { destination, durationDays, tripType } = req.body;
  const familyId = req.familyId!;

  const result = {
    destination: destination || 'Goa / Hill Station',
    durationDays: durationDays || 5,
    checklist: [
      { category: 'Documents', items: ['Aadhaar Cards / Passports for all 5 members', 'Flight / Hotel Booking Voucher', 'HDFC Health Insurance Card'] },
      { category: 'Medical & Hygiene', items: ["Dadi's Telmisartan BP medicine (10 days supply)", 'First aid kit, band-aids & motion sickness tablets', 'Hand sanitizer & N95 masks', "Aarav's Cetirizine allergy tablets"] },
      { category: 'Clothing & Comfort', items: ['Cotton wear & comfortable walking shoes', 'Light jackets / sweaters for evening breeze', 'Swimwear & UV sunglasses for kids', 'Dadi walking stick support'] },
      { category: 'Electronics', items: ['Multi-port power bank (20000mAh)', 'Phone chargers & camera gear', 'Car phone mount for navigation'] },
    ],
  };

  logActivity(familyId, req.user!.id, req.user!.name, 'Generated AI Travel Checklist', 'TASK', `Created travel packing checklist for ${result.destination}`);

  res.json(result);
});

// AI Occasion Assistant
router.post('/occasion-ideas', (req: AuthRequest, res) => {
  const { occasion, personName, relationship, budget } = req.body;

  res.json({
    occasion: occasion || 'Birthday',
    personName: personName || 'Priya (Mom)',
    suggestions: [
      {
        type: 'GIFT',
        title: 'Curated Wellness Spa Experience or Kindle',
        estimatedCost: '₹5,000 - ₹8,000',
        description: 'A thoughtful day of relaxation or reading time.',
      },
      {
        type: 'DINING',
        title: 'Family Dinner at Sheraton Feast / Chutneys',
        estimatedCost: '₹4,000 - ₹6,000',
        description: 'Table for 5 with custom celebration dessert.',
      },
      {
        type: 'MEMORY',
        title: 'Personalized Photo Album Frame',
        estimatedCost: '₹1,500',
        description: 'Framed candid memories from Goa vacation.',
      },
    ],
    reminderSchedule: [
      'Order customized cake (3 days before)',
      'Confirm dinner table reservation (2 days before)',
      'Kids handmade greeting cards (1 day before)',
    ],
  });
});

export default router;
