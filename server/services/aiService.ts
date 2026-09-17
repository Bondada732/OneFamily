import db from '../db/database.js';

export interface AIResponse {
  message: string;
  category?: 'FINANCE' | 'CALENDAR' | 'TASK' | 'TRAVEL' | 'OCCASION' | 'GENERAL';
  suggestedAction?: {
    type: 'NAVIGATE' | 'CREATE_TASK' | 'CREATE_REMINDER' | 'CONFIRM_ACTION';
    label: string;
    payload?: any;
  };
  sourcesUsed?: string[];
}

export async function processAIChat(
  familyId: string,
  userId: string,
  query: string,
  clientApiKey?: string,
  clientProvider?: 'gemini' | 'openai' | 'groq',
  history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>
): Promise<AIResponse> {
  const user = db.findOne('users', (u) => u.id === userId);
  if (!user) {
    return { message: 'User session not found.' };
  }

  const family = db.findOne('families', (f) => f.id === familyId);
  const members = db.find('users', (u) => u.family_id === familyId);
  const permissions = db
    .find('member_permissions', (mp) => mp.user_id === user.id)
    .map((mp) => mp.permission_code);

  const isHead = user.role === 'FAMILY_HEAD';
  const hasFinance = isHead || permissions.includes('FINANCE_VIEW');
  const hasInvestment = isHead || permissions.includes('INVESTMENT_VIEW');
  const hasDocs = isHead || permissions.includes('DOCUMENT_VIEW');

  // Load family database records
  const expenses = hasFinance ? db.find('expenses', (e) => e.family_id === familyId) : [];
  const budgets = hasFinance ? db.find('budgets', (b) => b.family_id === familyId) : [];
  const investments = hasInvestment ? db.find('investments', (i) => i.family_id === familyId) : [];
  const liabilities = hasInvestment ? db.find('liabilities', (l) => l.family_id === familyId) : [];
  const goals = hasFinance ? db.find('goals', (g) => g.family_id === familyId) : [];
  const tasks = db.find('tasks', (t) => t.family_id === familyId);
  const events = db.find('calendar_events', (c) => c.family_id === familyId);
  const reminders = db.find('reminders', (r) => r.family_id === familyId && !r.is_dismissed);
  const documents = hasDocs ? db.find('documents', (d) => d.family_id === familyId) : [];
  const maintenance = db.find('maintenance_equipment', (m) => m.family_id === familyId);
  const wishList = db.find('grocery_items', (g) => g.family_id === familyId);

  // Compute key summaries
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalAssets = investments.reduce((s, i) => s + (Number(i.current_value) || 0), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + (Number(l.outstanding_amount) || 0), 0);
  const netWorth = totalAssets - totalLiabilities;

  // Check if external LLM key is configured
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const provider = clientProvider || (clientApiKey ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : process.env.GROQ_API_KEY ? 'groq' : 'gemini');

  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const systemPrompt = `You are "One Family AI" assistant for ${family?.name || 'Famora'} household.
User: ${user.name}

Family Records:
- Members: ${members.map((m) => m.name).join(', ')}
${hasFinance ? `- Monthly Expenses (${expenses.length} items, Total: ₹${totalExpenses.toLocaleString('en-IN')}):
${expenses.map((e) => `  * ${e.merchant} - ₹${e.amount} (${e.category_name}, ${e.date})`).join('\n')}` : ''}
${hasFinance ? `- Monthly Budget: ₹${budgets.reduce((s, b) => s + (Number(b.monthly_limit) || 0), 0) || 93000}` : ''}
${hasInvestment ? `- Net Worth: ₹${(netWorth / 100000).toFixed(2)} Lakhs` : ''}
- Active Tasks: ${tasks.filter((t) => t.status !== 'COMPLETED').map((t) => t.title).join(', ') || 'None'}

Instructions:
1. Provide a direct, crystal-clear, concise answer.
2. DO NOT include unnecessary filler text or excessive markdown symbols.
3. If an item has ₹0 expenses, state directly: "You have spent ₹0 on [item] this month."`;

      if (provider === 'gemini') {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nQuestion:\n${query}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data: any = await response.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) {
            return {
              message: cleanText(answer),
              category: detectCategory(query),
              sourcesUsed: ['Gemini AI'],
            };
          }
        }
      } else if (provider === 'openai' || provider === 'groq') {
        const endpoint = provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
        const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const response = await fetch(endpoint, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: query },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data: any = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) {
            return {
              message: cleanText(answer),
              category: detectCategory(query),
              sourcesUsed: [`${provider.toUpperCase()}`],
            };
          }
        }
      }
    } catch (err) {
      // Fall through to clean engine
    }
  }

  // Built-in Clean Engine
  return generateIntelligentResponse(query, {
    user,
    family,
    members,
    expenses,
    budgets,
    investments,
    liabilities,
    goals,
    tasks,
    events,
    reminders,
    documents,
    maintenance,
    wishList,
    totalExpenses,
    totalAssets,
    totalLiabilities,
    netWorth,
    hasFinance,
    hasInvestment,
    hasDocs,
  });
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*\*/g, '')
    .replace(/###/g, '')
    .trim();
}

function detectCategory(query: string): AIResponse['category'] {
  const q = query.toLowerCase();
  if (q.includes('spend') || q.includes('budget') || q.includes('cost') || q.includes('money') || q.includes('worth') || q.includes('loan') || q.includes('goal')) {
    return 'FINANCE';
  }
  if (q.includes('event') || q.includes('calendar') || q.includes('meeting') || q.includes('due') || q.includes('renew')) {
    return 'CALENDAR';
  }
  if (q.includes('task') || q.includes('chore') || q.includes('todo') || q.includes('clean')) {
    return 'TASK';
  }
  if (q.includes('trip') || q.includes('travel') || q.includes('vacation')) {
    return 'TRAVEL';
  }
  if (q.includes('gift') || q.includes('birthday') || q.includes('anniversary')) {
    return 'OCCASION';
  }
  return 'GENERAL';
}

function generateIntelligentResponse(query: string, ctx: any): AIResponse {
  const q = query.toLowerCase().trim();

  // 1. Greetings
  const greetings = ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good afternoon', 'good evening', 'how are you', 'whats up'];
  if (greetings.some((g) => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g))) {
    return {
      message: `Hello ${ctx.user.name.split(' ')[0]}! 😊\n\nHow can I help you today? Ask me about your spending, chores, budgets, or wishlist.`,
      category: 'GENERAL',
    };
  }

  // 2. Spending / Expenses
  const isSpendingQuery =
    q.includes('spend') ||
    q.includes('spent') ||
    q.includes('cost') ||
    q.includes('expense') ||
    q.includes('how much') ||
    q.includes('did i pay') ||
    q.includes('did we pay') ||
    q.includes('bill');

  if (isSpendingQuery) {
    if (!ctx.hasFinance) {
      return { message: `You do not have permission to view financial records.` };
    }

    // Extract item keywords
    const stopWords = [
      'how', 'much', 'did', 'have', 'we', 'i', 'spent', 'spend', 'for', 'on', 'this',
      'month', 'in', 'the', 'my', 'our', 'me', 'a', 'an', 'total', 'is', 'was', 'amount',
      'expenses', 'money', 'cost', 'pay', 'paid', 'bill', 'bills', 'tell', 'show', 'what',
      'about', 'please', 'can', 'you'
    ];

    const tokens = q
      .replace(/[^\w\s]/gi, '')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    const searchKeyword = tokens.join(' ').trim();

    if (searchKeyword.length > 0) {
      const matchingExpenses = ctx.expenses.filter((e: any) => {
        const merchant = (e.merchant || '').toLowerCase();
        const category = (e.category_name || '').toLowerCase();
        const notes = (e.notes || '').toLowerCase();
        const kw = searchKeyword.toLowerCase();

        return (
          merchant.includes(kw) ||
          category.includes(kw) ||
          notes.includes(kw) ||
          tokens.some((t) => merchant.includes(t) || category.includes(t) || notes.includes(t))
        );
      });

      const capItem = searchKeyword.charAt(0).toUpperCase() + searchKeyword.slice(1);

      if (matchingExpenses.length > 0) {
        const itemTotal = matchingExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

        return {
          message: `You have spent ₹${itemTotal.toLocaleString('en-IN')} on ${capItem} this month (${matchingExpenses.length} transaction${matchingExpenses.length > 1 ? 's' : ''}):\n\n` +
            matchingExpenses
              .map((e: any) => `• ₹${Number(e.amount).toLocaleString('en-IN')} - ${e.merchant} (${e.category_name}) on ${e.date}`)
              .join('\n'),
          category: 'FINANCE',
          sourcesUsed: ['Expenses DB'],
        };
      } else {
        // Zero spent on this specific item
        return {
          message: `You have spent ₹0 on ${capItem} this month.\n\nNo ${capItem} expenses have been logged yet. Total monthly family spending across all items is ₹${ctx.totalExpenses.toLocaleString('en-IN')}.`,
          category: 'FINANCE',
          sourcesUsed: ['Expenses DB'],
        };
      }
    }

    // Overall total spending query
    return {
      message: `Total family spending this month is ₹${ctx.totalExpenses.toLocaleString('en-IN')} across ${ctx.expenses.length} transactions:\n\n` +
        ctx.expenses
          .slice(0, 5)
          .map((e: any) => `• ₹${Number(e.amount).toLocaleString('en-IN')} - ${e.merchant} (${e.category_name})`)
          .join('\n'),
      category: 'FINANCE',
      sourcesUsed: ['Expenses DB'],
    };
  }

  // 3. Net Worth & Assets
  if (q.includes('net worth') || q.includes('wealth') || q.includes('assets') || q.includes('portfolio') || q.includes('savings')) {
    if (!ctx.hasInvestment) {
      return { message: 'You do not have permission to view family wealth.' };
    }
    return {
      message: `Family Net Worth: ₹${(ctx.netWorth / 100000).toFixed(2)} Lakhs (₹${ctx.netWorth.toLocaleString('en-IN')})\n\n• Total Assets: ₹${(ctx.totalAssets / 100000).toFixed(2)} Lakhs\n• Total Loans: ₹${(ctx.totalLiabilities / 100000).toFixed(2)} Lakhs`,
      category: 'FINANCE',
      sourcesUsed: ['Investments DB'],
    };
  }

  // 4. Budgets
  if (q.includes('budget') || q.includes('limit') || q.includes('overspend')) {
    if (!ctx.hasFinance) {
      return { message: 'Access to family budgets is restricted.' };
    }
    const totalBudget = ctx.budgets.reduce((s: number, b: any) => s + (Number(b.monthly_limit) || 0), 0) || 93000;
    const remaining = Math.max(0, totalBudget - ctx.totalExpenses);
    const percentUsed = Math.min(100, Math.round((ctx.totalExpenses / totalBudget) * 100));

    return {
      message: `Monthly Budget Overview:\n\n• Planned Budget: ₹${totalBudget.toLocaleString('en-IN')}\n• Total Spent: ₹${ctx.totalExpenses.toLocaleString('en-IN')} (${percentUsed}% used)\n• Budget Remaining: ₹${remaining.toLocaleString('en-IN')}`,
      category: 'FINANCE',
      sourcesUsed: ['Budgets DB'],
    };
  }

  // 5. Tasks / Chores
  if (q.includes('task') || q.includes('chore') || q.includes('todo') || q.includes('pending')) {
    const pending = ctx.tasks.filter((t: any) => t.status !== 'COMPLETED');
    if (pending.length === 0) {
      return { message: 'All family chores and tasks are completed! 🎉', category: 'TASK' };
    }
    return {
      message: `Pending Tasks (${pending.length}):\n\n` +
        pending.map((t: any) => `• [${t.priority}] ${t.title} (Assigned: ${t.assigned_to_name}, Due: ${t.due_date || 'Today'})`).join('\n'),
      category: 'TASK',
      sourcesUsed: ['Tasks DB'],
    };
  }

  // 6. Wish List
  if (q.includes('wish list') || q.includes('grocery list') || q.includes('buy') || q.includes('wishlist')) {
    const pendingWishes = ctx.wishList.filter((w: any) => !w.is_purchased && !w.completed);
    if (pendingWishes.length === 0) {
      return { message: 'Your family wish list is currently empty.', category: 'GENERAL' };
    }
    return {
      message: `Family Wish List (${pendingWishes.length} items):\n\n` +
        pendingWishes.map((w: any) => `• ${w.name || w.item_name || w.title} [${w.category || 'General'}]`).join('\n'),
      category: 'GENERAL',
      sourcesUsed: ['Wishlist DB'],
    };
  }

  // 7. General Fallback
  return {
    message: `I'm here to help with "${query}".\n\nYou can ask:\n• "How much did I spend on milk/flowers?"\n• "What is our total spending this month?"\n• "What are my pending tasks?"\n• "What is our family net worth?"`,
    category: 'GENERAL',
  };
}

export function generateFinancialInsights(familyId: string): Array<{
  id: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'ALERT' | 'ACHIEVEMENT';
  title: string;
  message: string;
  amountSaved?: number;
  category: string;
}> {
  return [
    {
      id: 'ins_grocery',
      type: 'WARNING',
      title: 'Grocery Spending Alert',
      message: 'Your grocery spending is 18% higher than your 3-month average. You could save approximately ₹2,300 this month by buying bulk staples.',
      amountSaved: 2300,
      category: 'Groceries',
    },
    {
      id: 'ins_fd',
      type: 'OPPORTUNITY',
      title: 'SBI FD Maturity Reinvestment',
      message: '₹5,00,000 SBI Fixed Deposit matures in 15 days (24 Sep). Moving ₹2,00,000 into a balanced fund could yield an estimated 4.2% higher post-tax return.',
      category: 'Investments',
    },
  ];
}
