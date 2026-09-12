import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { Sparkles, Send, Bot, User, ShieldCheck, Plane, Gift, TrendingUp, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  category?: string;
  suggestedAction?: any;
  sourcesUsed?: string[];
  timestamp: string;
}

export const AIView: React.FC = () => {
  const { currentUser, family, activeLanguage } = useAuth();
  const t = translations[activeLanguage];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'AI',
      text: `Hello ${currentUser?.name.split(' ')[0]}! 👋 I am **FamilyAI**, your private family assistant.\n\nI have authorized access to your Sharma family records based on your **${currentUser?.role}** role.\n\nHere are some questions you can ask me:`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'INSIGHTS' | 'TRAVEL' | 'OCCASIONS'>('CHAT');

  // Travel & Occasions state
  const [travelResult, setTravelResult] = useState<any>(null);
  const [occasionResult, setOccasionResult] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ query }),
      });

      const aiMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'AI',
        text: res.message,
        category: res.category,
        suggestedAction: res.suggestedAction,
        sourcesUsed: res.sourcesUsed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'AI',
          text: `Something went wrong. ${err.message || 'Please try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const generateTravelChecklist = async () => {
    try {
      const res = await apiRequest('/ai/travel-checklist', {
        method: 'POST',
        body: JSON.stringify({ destination: 'Uttarakhand Family Tour (5 Days)', durationDays: 5 }),
      });
      setTravelResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const generateOccasionIdeas = async () => {
    try {
      const res = await apiRequest('/ai/occasion-ideas', {
        method: 'POST',
        body: JSON.stringify({ occasion: 'Birthday', personName: 'Mom (Priya)', budget: '₹10,000' }),
      });
      setOccasionResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  const samplePrompts = [
    'How much did we spend on groceries this month?',
    'When is our next insurance renewal?',
    'What is our family net worth?',
    'Are we on track for our emergency fund?',
    'What tasks are pending today?',
  ];

  return (
    <div className="p-4 space-y-4 animate-fade-in text-slate-100 pb-12 flex flex-col min-h-[780px]">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white drop-shadow" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">FamilyAI Assistant</h2>
            <p className="text-[11px] text-slate-400">Context-aware • Role: {currentUser?.role}</p>
          </div>
        </div>

        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>RBAC Guardrails Active</span>
        </span>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
        <button
          onClick={() => setActiveTab('CHAT')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CHAT' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab('INSIGHTS')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'INSIGHTS' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Insights
        </button>
        <button
          onClick={() => { setActiveTab('TRAVEL'); generateTravelChecklist(); }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'TRAVEL' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Travel
        </button>
        <button
          onClick={() => { setActiveTab('OCCASIONS'); generateOccasionIdeas(); }}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'OCCASIONS' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Occasions
        </button>
      </div>

      {/* 1. CHAT TAB */}
      {activeTab === 'CHAT' && (
        <div className="flex-1 flex flex-col justify-between space-y-3">
          {/* Messages Container */}
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'AI' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'USER'
                      ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-medium rounded-tr-none shadow-md'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-sm'
                  }`}
                >
                  <div>{msg.text}</div>

                  {msg.sourcesUsed && msg.sourcesUsed.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 pt-1 border-t border-slate-700/60 font-mono">
                      <span>Sources: {msg.sourcesUsed.join(', ')}</span>
                    </div>
                  )}

                  {msg.suggestedAction && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60">
                      <button
                        onClick={() => alert(`Action triggered: ${msg.suggestedAction.label}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md shadow-indigo-600/30"
                      >
                        <span>{msg.suggestedAction.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-400 text-right mt-1 opacity-70">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex gap-2.5 items-center text-slate-400 text-xs italic">
                <div className="w-7 h-7 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 animate-spin">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span>FamilyAI is analyzing authorized family context...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sample Prompts Carousel */}
          <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                className="text-[11px] bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl shrink-0 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 p-2 rounded-2xl">
            <input
              type="text"
              placeholder={t.askFamilyAI}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none px-2"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl shadow-md transition-transform active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. INSIGHTS TAB */}
      {activeTab === 'INSIGHTS' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>Grocery Spending Pattern</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your grocery spending is 18% higher than your 3-month average. You could save approximately <strong>₹2,300</strong> this month by cutting down on impulse snack items.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>SBI Fixed Deposit Maturity Reinvestment</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ₹5,00,000 SBI Fixed Deposit matures in 15 days (24 Sep). Moving ₹2,00,000 into a balanced advantage fund could yield an estimated 4.2% higher post-tax return.
            </p>
          </div>
        </div>
      )}

      {/* 3. TRAVEL TAB */}
      {activeTab === 'TRAVEL' && travelResult && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Plane className="w-4 h-4" />
              <span>{travelResult.destination}</span>
            </div>
            <p className="text-xs text-slate-300">
              Personalized checklist covering medical needs for Grandmother Kalyani and IDs for all 5 members:
            </p>
          </div>

          <div className="space-y-2.5">
            {travelResult.checklist?.map((group: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1.5">
                <span className="text-xs font-bold text-indigo-300 uppercase">{group.category}</span>
                <div className="space-y-1">
                  {group.items?.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. OCCASIONS TAB */}
      {activeTab === 'OCCASIONS' && occasionResult && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <Gift className="w-4 h-4" />
              <span>Mom's (Priya) Upcoming Birthday Celebration</span>
            </div>
            <p className="text-xs text-slate-300">
              Curated gift ideas and dining suggestions for 22nd September:
            </p>
          </div>

          <div className="space-y-2.5">
            {occasionResult.suggestions?.map((sug: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{sug.title}</span>
                  <span className="text-amber-400 font-bold">{sug.estimatedCost}</span>
                </div>
                <p className="text-xs text-slate-400">{sug.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
