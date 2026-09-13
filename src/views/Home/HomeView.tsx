import React, { useEffect } from 'react';
import { useFamily } from '../../context/FamilyContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { useSecurity } from '../../context/SecurityContext.js';
import { translations } from '../../i18n/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import { Users, TrendingUp, CreditCard, Target, AlertTriangle, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, Calendar, Clock, ArrowUpRight } from 'lucide-react';

interface HomeViewProps {
  onNavigateTab: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateTab }) => {
  const { dashboard, isLoading, refreshDashboard } = useFamily();
  const { activeLanguage, currentUser, family } = useAuth();
  const { isPrivacyMode } = useSecurity();
  const t = translations[activeLanguage];

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);


  if (isLoading || !dashboard) {
    return (
      <div className="p-6 space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-slate-800 rounded-lg"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-800 rounded-2xl"></div>
          <div className="h-24 bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-36 bg-slate-800 rounded-2xl"></div>
      </div>
    );
  }

  const { snapshot, attentionItems, today, goals, recentMemories, aiInsight } = dashboard;

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-8">
      {/* 1. Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{dashboard.userGreeting}</h2>
          <p className="text-xs text-slate-400">{family?.name || 'Family Hub'} • {family?.location || 'India'}</p>
        </div>
        <div className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[11px] text-indigo-300 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>All Systems Synced</span>
        </div>
      </div>

      {/* 2. FAMILY SNAPSHOT - 4 Cards */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>{t.familySnapshot}</span>
          <span className="text-[10px] text-slate-500 font-normal"> (5-sec pulse)</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Members */}
          <div
            onClick={() => onNavigateTab('family')}
            className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">{t.members}</span>
              <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-white tracking-tight">
              {snapshot.membersCount} <span className="text-xs font-normal text-slate-400">Members</span>
            </div>
            <div className="text-[10px] text-indigo-300 mt-0.5">3 Generations Active</div>
          </div>

          {/* Net Worth */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">{t.netWorth}</span>
              <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${
                snapshot.netWorth !== null && snapshot.netWorth < 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className={`text-lg font-extrabold tracking-tight ${
              snapshot.netWorth !== null && snapshot.netWorth < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {isPrivacyMode ? '••••••' : formatCurrency(snapshot.netWorth, true)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {snapshot.netWorth !== null ? (snapshot.netWorth >= 0 ? '+4.2% this year' : 'Liabilities exceed assets') : 'Restricted'}
            </div>
          </div>

          {/* Monthly Spending */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">{t.monthlySpending}</span>
              <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg group-hover:scale-110 transition-transform">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-amber-400 tracking-tight">
              {isPrivacyMode ? '••••••' : formatCurrency(snapshot.monthlySpending, false)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Sep Budget: {formatCurrency(snapshot.monthlyBudget || 93000, true)}
            </div>
          </div>


          {/* Savings Goal */}
          <div
            onClick={() => onNavigateTab('money')}
            className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold">{t.savingsGoal}</span>
              <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg group-hover:scale-110 transition-transform">
                <Target className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-purple-300 tracking-tight">
              {snapshot.savingsGoalPct !== null ? `${snapshot.savingsGoalPct}% Complete` : '—'}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">On track for 2026</div>
          </div>
        </div>
      </div>

      {/* 3. NEEDS YOUR ATTENTION */}
      {attentionItems.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.needsAttention}</span>
            <span className="text-[10px] bg-rose-500/20 text-rose-400 font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
              {attentionItems.length} Urgent
            </span>
          </div>

          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigateTab(item.actionTab)}
                className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between hover:border-slate-600 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${item.badgeColor} shrink-0 animate-ping`} />
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. AI FAMILY INSIGHT (Proactive Spending & Saving Alert) */}
      <div
        onClick={() => onNavigateTab('ai')}
        className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/30 shadow-xl shadow-indigo-950/30 cursor-pointer hover:border-indigo-400/50 transition-all relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">{t.aiInsight}</span>
          </div>
          <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
            Save ~₹2,300
          </span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed">{aiInsight.message}</p>
        <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-bold mt-2 hover:underline">
          <span>Ask FamilyAI for category breakdown</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* 5. TODAY - Events, Tasks, Reminders */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.today}</span>
          <button onClick={() => onNavigateTab('calendar')} className="text-[11px] text-indigo-400 hover:underline">
            View Calendar →
          </button>
        </div>

        <div className="p-4 rounded-3xl bg-slate-800/80 border border-slate-700/80 space-y-3 shadow-md">
          {today.events.map((evt) => (
            <div key={evt.id} className="flex items-start gap-3 pb-2 border-b border-slate-700/60 last:border-0 last:pb-0">
              <div className="p-2 bg-purple-500/20 text-purple-300 rounded-xl shrink-0 mt-0.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white">{evt.title}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{formatDate(evt.start_date)}</span>
                  <span>•</span>
                  <span>{evt.assigned_member_name}</span>
                </div>
              </div>
            </div>
          ))}

          {today.tasks.slice(0, 2).map((tsk) => (
            <div key={tsk.id} className="flex items-start gap-3 pb-2 border-b border-slate-700/60 last:border-0 last:pb-0">
              <div className="p-2 bg-cyan-500/20 text-cyan-300 rounded-xl shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-white">{tsk.title}</div>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="text-amber-400 font-semibold">{tsk.priority} Priority</span>
                  <span>•</span>
                  <span>Assigned: {tsk.assigned_to_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. FAMILY GOALS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.familyGoals}</span>
          <button onClick={() => onNavigateTab('money')} className="text-[11px] text-indigo-400 hover:underline">
            All Goals →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            return (
              <div
                key={goal.id}
                onClick={() => onNavigateTab('money')}
                className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md hover:border-slate-600 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-white">{goal.title}</span>
                  <span className="font-extrabold text-amber-400">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Saved: {isPrivacyMode ? '••••' : formatCurrency(goal.current_amount, true)}</span>
                  <span>Target: {formatCurrency(goal.target_amount, true)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. RECENT MEMORIES */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.recentMemories}</span>
          <button onClick={() => onNavigateTab('memories')} className="text-[11px] text-indigo-400 hover:underline">
            View Album →
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {recentMemories.map((mem) => {
            const photo = mem.photosList?.[0] || 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400';
            return (
              <div
                key={mem.id}
                onClick={() => onNavigateTab('memories')}
                className="min-w-[170px] max-w-[170px] rounded-2xl bg-slate-800/90 border border-slate-700/80 overflow-hidden shadow-md shrink-0 cursor-pointer group"
              >
                <div className="h-28 overflow-hidden relative">
                  <img
                    src={photo}
                    alt={mem.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white truncate max-w-[150px]">
                    {mem.location || 'Family Moment'}
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="text-xs font-bold text-white line-clamp-1">{mem.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{formatDate(mem.date)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
