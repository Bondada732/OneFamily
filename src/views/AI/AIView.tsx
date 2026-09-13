import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { Sparkles, Send, Bot, User, ShieldCheck, Plane, Gift, TrendingUp, AlertCircle, CheckCircle2, ArrowRight, Settings, Trash2, Key, Cpu, X, Check } from 'lucide-react';

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
  const { currentUser, family, activeLanguage, hasPermission } = useAuth();
  const t = translations[activeLanguage];
  const canUseAI = hasPermission('AI_USE');

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('family_ai_api_key') || '');
  const [provider, setProvider] = useState<'gemini' | 'groq' | 'openai'>(() => (localStorage.getItem('family_ai_provider') as any) || 'gemini');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiKey);
  const [tempProvider, setTempProvider] = useState(provider);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'AI',
      text: `Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! 👋 I am your **One Family AI Assistant**.\n\nAsk me anything! You can ask about your family's expenses, budgets, assets, tasks, calendar schedules, or ask for general assistance, trip planning, advice, message drafting, and recipes.\n\nHow can I help you today?`,
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

  if (!canUseAI) {
    return (
      <div className="p-6 text-center space-y-4 my-auto">
        <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Family AI Access Restricted</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          Access to FamilyAI has not been enabled for your profile. Please ask your Family Head to enable FamilyAI access in the Family Hub.
        </p>
      </div>
    );
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(tempApiKey.trim());
    setProvider(tempProvider);
    localStorage.setItem('family_ai_api_key', tempApiKey.trim());
    localStorage.setItem('family_ai_provider', tempProvider);
    setShowSettings(false);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'AI',
        text: `Chat cleared. Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! Ask me any question.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim()) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const currentHistory = [...messages, userMsg];
    setMessages(currentHistory);
    setInputValue('');
    setIsThinking(true);

    try {
      const res = await apiRequest('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          query,
          apiKey: apiKey || undefined,
          provider,
          history: currentHistory.slice(-8).map((m) => ({
            role: m.sender === 'USER' ? 'user' : 'model',
            text: m.text,
          })),
        }),
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

  return (
    <div className="p-4 space-y-4 animate-fade-in text-slate-100 pb-12 flex flex-col min-h-[780px]">
      {/* Title & Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-amber-400 p-0.5 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white drop-shadow" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">FamilyAI Assistant</h2>
            <p className="text-[11px] text-slate-400">
              {apiKey ? `Connected: ${provider.toUpperCase()}` : 'Intelligent Hybrid Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setTempApiKey(apiKey);
              setTempProvider(provider);
              setShowSettings(true);
            }}
            className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs flex items-center gap-1 transition-all"
            title="Configure LLM API Key"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LLM Key</span>
          </button>
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl bg-slate-800/90 border border-slate-700 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
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
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
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
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-300 pt-1 border-t border-slate-700/60 font-mono">
                      <span>⚡ {msg.sourcesUsed.join(' • ')}</span>
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
                <span>FamilyAI is thinking and analyzing records...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 p-2 rounded-2xl shadow-lg">
            <input
              type="text"
              placeholder={t.askFamilyAI || 'Ask FamilyAI anything...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-transparent text-xs text-white placeholder-slate-400 outline-none px-2"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isThinking}
              className={`p-2.5 rounded-xl shadow-md transition-all ${
                inputValue.trim() && !isThinking
                  ? 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white active:scale-95 cursor-pointer'
                  : 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI LLM Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">LLM Provider Configuration</h3>
              </div>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">AI Model Provider</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gemini', label: 'Google Gemini' },
                    { id: 'groq', label: 'Groq (Llama 3)' },
                    { id: 'openai', label: 'OpenAI (GPT-4o)' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTempProvider(p.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        tempProvider === p.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-white'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold mb-1 block">
                  {tempProvider === 'gemini' ? 'Google Gemini API Key' : tempProvider === 'groq' ? 'Groq API Key' : 'OpenAI API Key'} (Optional)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Paste your API Key here (e.g. AIzaSy...)"
                    value={tempApiKey}
                    onChange={(e) => setTempApiKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                  <Key className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Leave empty to use the built-in Smart Semantic AI Engine, or enter your API key for direct cloud LLM generation.
                </p>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Configuration
                </button>
              </div>
            </form>
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
