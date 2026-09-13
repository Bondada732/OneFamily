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

  // Load family database records for context
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

  // Build System Prompt with comprehensive context
  const systemPrompt = `You are "One Family AI", an intelligent, empathetic, and highly capable family assistant for the ${family?.name || 'Famora'} household in India.
Current User: ${user.name} (Role: ${user.role})

Current Family Context:
- Members: ${members.map((m) => `${m.name} (${m.relationship || m.role})`).join(', ')}
${hasFinance ? `- Monthly Logged Expenses (${expenses.length} items, Total: ₹${totalExpenses.toLocaleString('en-IN')}):
${expenses.slice(0, 15).map((e) => `  * ${e.date}: ${e.merchant} - ₹${e.amount} (${e.category_name}, paid by ${e.paid_by_name})`).join('\n')}` : '- Finance access: Restricted'}
${hasFinance ? `- Monthly Budgets:
${budgets.map((b) => `  * ${b.category_name}: Limit ₹${b.monthly_limit}`).join('\n')}` : ''}
${hasInvestment ? `- Net Worth: ₹${(netWorth / 100000).toFixed(2)} Lakhs (Total Assets: ₹${(totalAssets / 100000).toFixed(2)}L, Total Liabilities: ₹${(totalLiabilities / 100000).toFixed(2)}L)
- Assets/Investments: ${investments.map((i) => `${i.title} (₹${i.current_value.toLocaleString('en-IN')})`).join(', ')}
- Liabilities/Loans: ${liabilities.map((l) => `${l.title} (₹${l.outstanding_amount.toLocaleString('en-IN')}, EMI: ₹${l.monthly_emi})`).join(', ')}` : ''}
${hasFinance ? `- Financial Goals: ${goals.map((g) => `${g.title} (Saved: ₹${g.current_amount} / Target: ₹${g.target_amount}, Target Date: ${g.target_date})`).join('; ')}` : ''}
- Active Tasks/Chores: ${tasks.filter((t) => t.status !== 'COMPLETED').map((t) => `${t.title} [${t.priority}] (Assigned: ${t.assigned_to_name})`).join('; ') || 'None'}
- Upcoming Calendar Events: ${events.map((e) => `${e.title} on ${e.start_date}`).join('; ') || 'None'}
- Active Reminders: ${reminders.map((r) => `${r.title} (Due: ${r.due_date})`).join('; ') || 'None'}
${hasDocs ? `- Vault Documents: ${documents.map((d) => `${d.title} (Owner: ${d.owner_name}, Expiry: ${d.expiry_date || 'N/A'})`).join('; ')}` : ''}
- Wish List Items: ${wishList.map((w) => `${w.name} [${w.category}]`).join(', ') || 'Empty'}
- Household Equipment: ${maintenance.map((m) => `${m.name} (${m.brand_model}, Next Service: ${m.next_service_date || 'N/A'})`).join('; ') || 'None'}

Instructions:
1. Understand and answer ANY question asked by the user in a natural, polite, and well-formatted markdown style.
2. If the user asks about family data (expenses, net worth, budgets, tasks, events, documents, wish list, maintenance), answer accurately using the real family records above.
3. If the user asks general questions (advice, calculations, recipes, math, coding, explanations, drafting letters, study tips, travel itineraries, etc.), give a complete, helpful, and insightful response.
4. Format prices in Indian Rupees (₹) when relevant. Use bullet points and bold headers for clarity.`;

  // Determine which LLM provider to use
  const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  const provider = clientProvider || (clientApiKey ? 'gemini' : process.env.OPENAI_API_KEY ? 'openai' : process.env.GROQ_API_KEY ? 'groq' : 'gemini');

  // Try calling real LLM API if key is available
  if (apiKey) {
    try {
      if (provider === 'gemini') {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\nUser Question:\n${query}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1200,
            },
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) {
            return {
              message: answer,
              category: detectCategory(query),
              sourcesUsed: ['Google Gemini LLM', 'Family Context DB'],
            };
          }
        }
      } else if (provider === 'openai' || provider === 'groq') {
        const endpoint = provider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = provider === 'groq' ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...(history || []).map((h) => ({
                role: h.role === 'model' ? 'assistant' : 'user',
                content: h.text,
              })),
              { role: 'user', content: query },
            ],
            temperature: 0.7,
            max_tokens: 1200,
          }),
        });

        if (response.ok) {
          const data: any = await response.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) {
            return {
              message: answer,
              category: detectCategory(query),
              sourcesUsed: [`${provider.toUpperCase()} (${model})`, 'Family Context DB'],
            };
          }
        }
      }
    } catch (err) {
      console.warn('Direct LLM API call error, falling back to intelligent conversational engine:', err);
    }
  }

  // Built-in Smart Semantic Reasoning Engine
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
  if (q.includes('trip') || q.includes('travel') || q.includes('vacation') || q.includes('flight') || q.includes('hotel')) {
    return 'TRAVEL';
  }
  if (q.includes('gift') || q.includes('birthday') || q.includes('anniversary') || q.includes('celebrat')) {
    return 'OCCASION';
  }
  return 'GENERAL';
}

function generateIntelligentResponse(query: string, ctx: any): AIResponse {
  const q = query.toLowerCase().trim();

  // 1. Greetings & Small Talk
  const greetings = ['hi', 'hello', 'hey', 'namaste', 'vanakkam', 'good morning', 'good afternoon', 'good evening', 'how are you', "what's up", 'whats up', 'hii', 'heyy'];
  if (greetings.some((g) => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g))) {
    return {
      message: `Hello ${ctx.user.name}! 😊 Good to see you.\n\nHow can I help you and your family today? You can ask me anything about your household finances, pending chores, upcoming schedules, or ask for general advice, recipes, travel planning, drafting emails, and more!`,
      category: 'GENERAL',
    };
  }

  // 2. Capabilities & Help
  if (q === 'help' || q.includes('what can you do') || q.includes('who are you') || q.includes('your features')) {
    return {
      message: `I am your **One Family AI Assistant**, equipped to help your household with:\n\n1. 💳 **Family Finances & Budgets:** Ask about your logged expenses, category budgets, investments, loan EMIs, and net worth.\n2. 📋 **Chores & Tasks:** Check active tasks, assign chores, and manage deadlines.\n3. 📅 **Calendar & Deadlines:** Check upcoming events, document renewals, and reminders.\n4. ✈️ **Travel & Itineraries:** Create packing checklists and vacation planning.\n5. 🍳 **Recipes, Advice & Writing:** Ask for cooking recipes, study tips, drafting emails/letters, or general knowledge.\n\nWhat would you like to explore?`,
      category: 'GENERAL',
    };
  }

  // 3. Recipes & Cooking
  if (q.includes('recipe') || q.includes('cook') || q.includes('how to make') || q.includes('dinner idea') || q.includes('lunch idea') || q.includes('breakfast')) {
    const dish = query.replace(/recipe|for|how to make|cook|please|give me a/gi, '').trim() || 'Paneer Butter Masala';
    return {
      message: `### 🍲 Delicious Home Recipe: **${dish.charAt(0).toUpperCase() + dish.slice(1)}**\n\n**🛒 Key Ingredients:**\n• Main base (250g Paneer/Veggies/Rice/Chicken)\n• 2 finely chopped onions & 3 pureed tomatoes\n• 1 tbsp Ginger-Garlic paste\n• 1 tsp Cumin seeds, 1/2 tsp Turmeric, 1 tsp Kashmiri Chilli powder, 1 tsp Garam Masala\n• 2 tbsp Fresh cream or butter, Fresh coriander for garnish\n• Salt to taste & 2 tbsp cooking oil/ghee\n\n**👩‍🍳 Step-by-Step Instructions:**\n1. **Base Gravy:** Heat oil/ghee in a pan. Sauté cumin seeds, onions, and ginger-garlic paste until golden brown.\n2. **Spices:** Add tomato puree, turmeric, chilli powder, and salt. Cook until oil separates from the masala (5-7 mins).\n3. **Simmer:** Add 1/2 cup warm water, mix well, and simmer on medium heat.\n4. **Main Ingredient:** Gently add your sliced paneer/veggies and simmer for 4-5 minutes so the flavours absorb.\n5. **Finishing Touch:** Stir in fresh cream and garam masala. Garnish with chopped coriander and serve hot with rotis, naans, or jeera rice!\n\n*Enjoy your family meal!* 🍽️`,
      category: 'GENERAL',
    };
  }

  // 4. Letter / Email / Message Drafting
  if (q.includes('write') || q.includes('draft') || q.includes('email') || q.includes('letter') || q.includes('message to')) {
    return {
      message: `### ✉️ Draft Template for: *"${query}"*\n\n---\n**Subject:** Important Communication - ${ctx.family?.name || 'Family'}\n\nDear [Recipient Name / Teacher / Manager],\n\nI hope this message finds you well.\n\nI am writing to formally communicate regarding [State Purpose: e.g., leave of absence for child / society maintenance query / schedule update]. Please let us know if any further details or documents are required from our end.\n\nThank you for your understanding and prompt support.\n\nWarm regards,\n**${ctx.user.name}**  \n${ctx.family?.name || 'Famora'} Household  \nContact: [Your Phone / Email]\n---`,
      category: 'GENERAL',
    };
  }

  // 5. Jokes & Fun
  if (q.includes('joke') || q.includes('funny') || q.includes('make me laugh')) {
    const jokes = [
      "Why did the smartphone need glasses? Because it lost all its contacts! 😄",
      "Why don't eggs tell jokes? They'd crack each other up! 🥚😂",
      "What do you call a fake noodle? An impasta! 🍝",
      "Why did the math book look so sad? Because it had too many problems! 📚",
    ];
    return {
      message: `${jokes[Math.floor(Math.random() * jokes.length)]}\n\nHope that brought a smile to your family! 😊`,
      category: 'GENERAL',
    };
  }

  // 6. Total Spending / Expenses
  if (q.includes('spend') || q.includes('spent') || q.includes('total expense') || q.includes('how much have we spent') || q.includes('how much did we spend') || q.includes('expenses')) {
    if (!ctx.hasFinance) {
      return { message: `I'm sorry ${ctx.user.name}, you do not have permission to view financial records.` };
    }

    // Check specific category query
    const matchingCat = ctx.expenses.find((e: any) => q.includes(e.category_name.toLowerCase()) || q.includes(e.merchant.toLowerCase()));
    if (matchingCat) {
      const catExpenses = ctx.expenses.filter((e: any) => e.category_id === matchingCat.category_id || e.category_name.toLowerCase() === matchingCat.category_name.toLowerCase());
      const catTotal = catExpenses.reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
      return {
        message: `### 📊 ${matchingCat.category_name} Spending\n\nYour family has spent a total of **₹${catTotal.toLocaleString('en-IN')}** on **${matchingCat.category_name}** this month across ${catExpenses.length} transaction(s):\n\n${catExpenses.map((e: any) => `• **₹${Number(e.amount).toLocaleString('en-IN')}** at *${e.merchant}* on ${e.date} (Paid by ${e.paid_by_name})`).join('\n')}\n\n*Overall total monthly expenditure is ₹${ctx.totalExpenses.toLocaleString('en-IN')}.*`,
        category: 'FINANCE',
        sourcesUsed: ['Expenses DB'],
      };
    }

    return {
      message: `### 💳 Total Monthly Family Spending\n\nYour family has logged **₹${ctx.totalExpenses.toLocaleString('en-IN')}** in total expenses for this month across **${ctx.expenses.length} transactions**.\n\n**Top Recent Spends:**\n${ctx.expenses.slice(0, 5).map((e: any) => `• **₹${Number(e.amount).toLocaleString('en-IN')}** - ${e.merchant} (${e.category_name})`).join('\n')}\n\nYou can view the complete itemized breakdown in the **Money > Expenses** tab.`,
      category: 'FINANCE',
      sourcesUsed: ['Expenses DB'],
    };
  }

  // 7. Net Worth & Assets
  if (q.includes('net worth') || q.includes('wealth') || q.includes('assets') || q.includes('portfolio') || q.includes('how much money')) {
    if (!ctx.hasInvestment) {
      return { message: `I'm sorry ${ctx.user.name}, you do not have permission to view family net worth & assets.` };
    }
    return {
      message: `### 📈 Family Net Worth Summary\n\nYour family's calculated Net Worth is **₹${(ctx.netWorth / 100000).toFixed(2)} Lakhs** (₹${ctx.netWorth.toLocaleString('en-IN')}).\n\n• **Total Assets (Investments & Savings):** ₹${(ctx.totalAssets / 100000).toFixed(2)} Lakhs\n  ${ctx.investments.map((i: any) => `  - *${i.title}*: ₹${(Number(i.current_value) / 100000).toFixed(2)}L (${i.type})`).join('\n')}\n\n• **Total Liabilities (Loans & EMIs):** ₹${(ctx.totalLiabilities / 100000).toFixed(2)} Lakhs\n  ${ctx.liabilities.map((l: any) => `  - *${l.title}*: ₹${(Number(l.outstanding_amount) / 100000).toFixed(2)}L (Monthly EMI: ₹${l.monthly_emi})`).join('\n')}\n\n*Calculation formula: Total Assets (₹${(ctx.totalAssets / 100000).toFixed(2)}L) - Total Liabilities (₹${(ctx.totalLiabilities / 100000).toFixed(2)}L) = ₹${(ctx.netWorth / 100000).toFixed(2)}L*`,
      category: 'FINANCE',
      sourcesUsed: ['Investments DB', 'Liabilities DB'],
    };
  }

  // 8. Budgets
  if (q.includes('budget') || q.includes('limit') || q.includes('overspend') || q.includes('spending cap')) {
    if (!ctx.hasFinance) {
      return { message: 'Access to family budgets is private to authorized members.' };
    }
    const totalBudget = ctx.budgets.reduce((s: number, b: any) => s + (Number(b.monthly_limit) || 0), 0);
    return {
      message: `### 🎯 Monthly Family Budget Overview\n\n• **Total Planned Budget:** ₹${totalBudget > 0 ? totalBudget.toLocaleString('en-IN') : '93,000'}\n• **Total Spent So Far:** ₹${ctx.totalExpenses.toLocaleString('en-IN')}\n• **Remaining Budget:** ₹${Math.max(0, (totalBudget || 93000) - ctx.totalExpenses).toLocaleString('en-IN')}\n\n**Category Budgets:**\n${ctx.budgets.map((b: any) => `• **${b.category_name}:** ₹${Number(b.monthly_limit).toLocaleString('en-IN')}/mo`).join('\n') || '• Default categories active'}\n\nYou can customize or adjust any category limit under the **Money > Budget** screen.`,
      category: 'FINANCE',
      sourcesUsed: ['Budgets DB', 'Expenses DB'],
    };
  }

  // 9. Goals
  if (q.includes('goal') || q.includes('future') || q.includes('target') || q.includes('saving for')) {
    if (!ctx.hasFinance) {
      return { message: 'Financial goals are private to family heads and parents.' };
    }
    return {
      message: `### 🎯 Family Financial Goals (${ctx.goals.length})\n\n${ctx.goals.map((g: any) => {
        const pct = Math.round((Number(g.current_amount || 0) / (Number(g.target_amount) || 1)) * 100);
        return `• **${g.title}** (${g.category})\n  - Progress: **₹${(g.current_amount / 100000).toFixed(2)}L / ₹${(g.target_amount / 100000).toFixed(2)}L** (${pct}%)\n  - Target Date: ${g.target_date}\n  - Monthly SIP: ₹${Number(g.monthly_contribution || 0).toLocaleString('en-IN')}/month`;
      }).join('\n\n') || 'No goals created yet. You can set goals in the Money > Goals tab.'}`,
      category: 'FINANCE',
      sourcesUsed: ['Goals DB'],
    };
  }

  // 10. Tasks / Chores
  if (q.includes('task') || q.includes('chore') || q.includes('todo') || q.includes('pending') || q.includes('what should i do')) {
    const pending = ctx.tasks.filter((t: any) => t.status !== 'COMPLETED');
    return {
      message: `### 📋 Family Tasks & Chores (${pending.length} Pending)\n\n${pending.map((t: any) => `• [**${t.priority}**] **${t.title}**\n  - Assigned to: ${t.assigned_to_name} (Due: ${t.due_date || 'Today'})`).join('\n') || '🎉 All chores and tasks are completed for today!'}\n\nWould you like to assign a new task to any family member?`,
      category: 'TASK',
      sourcesUsed: ['Tasks DB'],
    };
  }

  // 11. Calendar & Events / Deadlines / Insurance
  if (q.includes('event') || q.includes('calendar') || q.includes('schedule') || q.includes('insurance') || q.includes('renew') || q.includes('expire') || q.includes('deadline')) {
    return {
      message: `### 📅 Upcoming Family Events & Deadlines\n\n**Events:**\n${ctx.events.map((e: any) => `• **${e.title}** on ${e.start_date} (Assigned: ${e.assigned_member_name})`).join('\n') || '• No events scheduled this week'}\n\n**Active Reminders:**\n${ctx.reminders.map((r: any) => `• 🔔 **${r.title}** (Due: ${r.due_date})`).join('\n') || '• No pending reminder alerts'}\n\n${ctx.documents.length > 0 ? `**Vault Documents:**\n${ctx.documents.map((d: any) => `• 📄 **${d.title}** (${d.owner_name}) - Expiry: ${d.expiry_date || 'Lifetime'}`).join('\n')}` : ''}`,
      category: 'CALENDAR',
      sourcesUsed: ['Calendar DB', 'Reminders DB', 'Documents DB'],
    };
  }

  // 12. Wish List
  if (q.includes('wish list') || q.includes('grocery list') || q.includes('shopping list') || q.includes('buy')) {
    return {
      message: `### 🛒 Family Wish List (${ctx.wishList.length} items)\n\n${ctx.wishList.map((w: any) => `• **${w.name}** [${w.category}] - Added by ${w.added_by_name || 'Family member'}`).join('\n') || 'Your family wish list is currently empty.'}\n\nYou can add items or manage the list under **Family > Wish List**.`,
      category: 'GENERAL',
      sourcesUsed: ['Wish List DB'],
    };
  }

  // 13. Maintenance / Appliances
  if (q.includes('maintenance') || q.includes('appliance') || q.includes('equipment') || q.includes('service') || q.includes('ac') || q.includes('water purifier') || q.includes('geyser')) {
    return {
      message: `### 🔧 Household Maintenance & Appliances\n\n${ctx.maintenance.map((m: any) => `• **${m.name}** (${m.brand_model})\n  - Service Interval: Every ${m.service_interval_months} months\n  - Next Service Date: **${m.next_service_date || 'Pending'}**\n  - Service Center: ${m.service_center_phone || 'N/A'}`).join('\n\n') || 'No equipment registered yet. You can add appliances under Family > Maintenance.'}`,
      category: 'GENERAL',
      sourcesUsed: ['Maintenance DB'],
    };
  }

  // 14. Members
  if (q.includes('who is in') || q.includes('members') || q.includes('family member')) {
    return {
      message: `### 👨‍👩‍👧‍👦 ${ctx.family?.name || 'Famora'} Household Members (${ctx.members.length})\n\n${ctx.members.map((m: any) => `• **${m.name}** - ${m.relationship || m.role} (${m.email || 'Mobile user'})`).join('\n')}`,
      category: 'GENERAL',
      sourcesUsed: ['Users DB'],
    };
  }

  // 15. General Conversational Fallback
  return {
    message: `I'm here to help with **"${query}"**! 😊\n\nCould you please provide a little more detail, or let me know what you would like to do? For example:\n• Ask for financial breakdowns or savings tips\n• Request a meal recipe or travel packing checklist\n• Check family tasks, reminders, or upcoming dates\n• Draft an email or message`,
    category: 'GENERAL',
    sourcesUsed: ['Family AI Context Engine'],
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
      message: 'Your grocery spending is 18% higher than your 3-month average. You could save approximately ₹2,300 this month by buying bulk staples and trimming snack impulse purchases.',
      amountSaved: 2300,
      category: 'Groceries',
    },
    {
      id: 'ins_fd',
      type: 'OPPORTUNITY',
      title: 'SBI FD Maturity Reinvestment',
      message: '₹5,00,000 SBI Fixed Deposit matures in 15 days (24 Sep). Moving ₹2,00,000 into a balanced advantage fund could yield an estimated 4.2% higher post-tax annualized return.',
      category: 'Investments',
    },
    {
      id: 'ins_insurance',
      type: 'ALERT',
      title: 'Vehicle Insurance Expiring',
      message: 'Honda City insurance expires in 12 days. Early online renewal qualifies for a 50% No Claim Bonus (NCB) discount of ₹4,800.',
      amountSaved: 4800,
      category: 'Insurance',
    },
  ];
}

