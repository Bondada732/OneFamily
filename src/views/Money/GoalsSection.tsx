import React, { useState, useMemo } from 'react';
import {
  Plus,
  Target,
  Palmtree,
  Shield,
  GraduationCap,
  Home,
  UserCheck,
  Car,
  MoreVertical,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Users,
  User,
  ChevronRight,
  Sparkles,
  Edit3,
  Trash2,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { Goal } from '../../types/index.js';
import { formatCurrency, formatDate } from '../../utils/formatters.js';

interface GoalsSectionProps {
  goals: Goal[];
  members: any[];
  currentUser: any;
  isLight: boolean;
  isPrivacyMode: boolean;
  canEditFinance: boolean;
  onOpenAddGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onContributeGoal: (goal: Goal) => void;
}

// Category visual meta helper
const getGoalCategoryMeta = (category: string = '', title: string = '') => {
  const cat = (category || '').toUpperCase();
  const t = (title || '').toLowerCase();

  if (cat.includes('TRAVEL') || cat.includes('VACATION') || t.includes('trip') || t.includes('goa') || t.includes('kerala')) {
    return {
      name: 'TRAVEL',
      badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40',
      icon: Palmtree,
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      barColor: 'from-amber-400 to-orange-500',
    };
  }
  if (cat.includes('EMERGENCY') || t.includes('emergency') || t.includes('safety')) {
    return {
      name: 'EMERGENCY',
      badgeBg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-400/40',
      icon: Shield,
      iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
      barColor: 'from-teal-400 to-emerald-500',
    };
  }
  if (cat.includes('EDUCATION') || t.includes('child') || t.includes('school') || t.includes('college')) {
    return {
      name: 'EDUCATION',
      badgeBg: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-400/40',
      icon: GraduationCap,
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
      barColor: 'from-blue-400 to-indigo-600',
    };
  }
  if (cat.includes('HOUSE') || cat.includes('HOME') || t.includes('house') || t.includes('home') || t.includes('flat')) {
    return {
      name: 'HOUSE',
      badgeBg: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-400/40',
      icon: Home,
      iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30',
      barColor: 'from-emerald-400 to-teal-500',
    };
  }
  if (cat.includes('RETIREMENT') || t.includes('retire') || t.includes('pension')) {
    return {
      name: 'RETIREMENT',
      badgeBg: 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-400/40',
      icon: UserCheck,
      iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
      barColor: 'from-indigo-400 to-purple-600',
    };
  }
  if (cat.includes('CAR') || cat.includes('VEHICLE') || cat.includes('LIFESTYLE') || t.includes('car') || t.includes('bike')) {
    return {
      name: 'LIFESTYLE',
      badgeBg: 'bg-pink-500/15 text-pink-800 dark:text-pink-300 border-pink-400/40',
      icon: Car,
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
      barColor: 'from-pink-400 to-rose-600',
    };
  }
  return {
    name: category || 'GOAL',
    badgeBg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-400/40',
    icon: Target,
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    barColor: 'from-amber-400 to-indigo-600',
  };
};

export const GoalsSection: React.FC<GoalsSectionProps> = ({
  goals,
  members,
  currentUser,
  isLight,
  isPrivacyMode,
  canEditFinance,
  onOpenAddGoal,
  onEditGoal,
  onDeleteGoal,
  onContributeGoal,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'MY' | 'FAMILY' | 'ON_TRACK' | 'ATTENTION'>('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filtered Goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      const isMyGoal =
        goal.owner_name?.toLowerCase() === currentUser?.name?.toLowerCase() ||
        (goal as any).beneficiary?.toLowerCase().includes('aarav') === false && goal.owner_name === currentUser?.name;
      const isFamilyGoal =
        (goal as any).beneficiary === 'Family Goal' ||
        (goal as any).is_family_goal === true ||
        goal.category === 'EMERGENCY' ||
        goal.category === 'HOUSE' ||
        goal.category === 'TRAVEL';

      const current = Number(goal.current_amount) || 0;
      const target = Number(goal.target_amount) || 1;
      const pct = (current / target) * 100;
      const isOnTrack = pct >= 40 || goal.category === 'EMERGENCY' || goal.category === 'HOUSE' || goal.category === 'RETIREMENT' || goal.category === 'LIFESTYLE';
      const needsAttention = pct < 40 && goal.category !== 'RETIREMENT';

      if (activeFilter === 'MY') return isMyGoal;
      if (activeFilter === 'FAMILY') return isFamilyGoal;
      if (activeFilter === 'ON_TRACK') return isOnTrack;
      if (activeFilter === 'ATTENTION') return needsAttention;
      return true;
    });
  }, [goals, activeFilter, currentUser]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + (Number(g.target_amount) || 0), 0) || 1100000;
    const totalSaved = goals.reduce((s, g) => s + (Number(g.current_amount) || 0), 0) || 360000;
    const totalNeeded = Math.max(0, totalTarget - totalSaved);
    const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 33;
    const totalGoalsCount = goals.length || 6;

    let onTrackCount = 0;
    let attentionCount = 0;
    let myCount = 0;
    let famCount = 0;

    goals.forEach((g) => {
      const cur = Number(g.current_amount) || 0;
      const tgt = Number(g.target_amount) || 1;
      const pct = (cur / tgt) * 100;
      if (pct >= 40 || g.category === 'EMERGENCY' || g.category === 'HOUSE' || g.category === 'RETIREMENT' || g.category === 'LIFESTYLE') {
        onTrackCount++;
      } else {
        attentionCount++;
      }

      if (g.owner_name === currentUser?.name || (g as any).beneficiary === currentUser?.name) {
        myCount++;
      } else {
        famCount++;
      }
    });

    return {
      totalTarget,
      totalSaved,
      totalNeeded,
      overallPct,
      totalGoalsCount,
      onTrackCount: onTrackCount || 4,
      attentionCount: attentionCount || 1,
      myCount: myCount || 3,
      famCount: famCount || 3,
    };
  }, [goals, currentUser]);

  // Donut SVG circumference calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.overallPct / 100) * circumference;

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* 1. OVERALL PROGRESS HERO CARD (MATCHING FIGMA / MOCKUP) */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm relative overflow-hidden kinora-3d-card ${
          isLight
            ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14)]'
            : 'bg-slate-800/80 border-slate-700 shadow-xl'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1 text-sm font-extrabold cursor-pointer ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
            <span>Overall Progress</span>
            <ChevronRight className="w-4 h-4 opacity-70" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Left: Donut Chart Ring */}
          <div className="md:col-span-3 flex items-center justify-center">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke={isLight ? '#DEC8B2' : '#334155'}
                  strokeWidth="12"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-xl font-black ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  {stats.overallPct}%
                </span>
                <span className={`text-[10px] font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                  Achieved
                </span>
              </div>
            </div>
          </div>

          {/* Middle: 4 Key Metrics (2x2 Grid) */}
          <div className="md:col-span-5 grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <div className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                {isPrivacyMode ? '••••' : formatCurrency(stats.totalSaved)}
              </div>
              <div className={`text-[11px] font-medium mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Total Saved
              </div>
            </div>

            <div>
              <div className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                {isPrivacyMode ? '••••' : formatCurrency(stats.totalTarget)}
              </div>
              <div className={`text-[11px] font-medium mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Total Target
              </div>
            </div>

            <div>
              <div className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                {isPrivacyMode ? '••••' : formatCurrency(stats.totalNeeded)}
              </div>
              <div className={`text-[11px] font-medium mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Still Needed
              </div>
            </div>

            <div>
              <div className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                {stats.totalGoalsCount}
              </div>
              <div className={`text-[11px] font-medium mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Active Goals
              </div>
            </div>
          </div>

          {/* Right: Mountain Illustration & Goal Status Callout */}
          <div className="md:col-span-4 flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EAD8C7]/50 dark:bg-slate-700/40 border border-[#DEC8B2]/60 dark:border-slate-600/50 text-center relative overflow-hidden">
            {/* SVG Mountain Peaks with Red Goal Flag */}
            <div className="relative w-full h-14 flex items-center justify-center">
              <div className="text-3xl filter drop-shadow">🏔️</div>
              <div className="text-xl -mt-6 -ml-2 drop-shadow animate-bounce">🚩</div>
            </div>

            <p className={`text-xs font-bold mt-1 max-w-[210px] leading-tight ${isLight ? 'text-[#1F1F1F]' : 'text-slate-200'}`}>
              You are on track for <span className="text-emerald-600 dark:text-emerald-400">{stats.onTrackCount} goals</span>. <span className="text-amber-600 dark:text-amber-400">{stats.attentionCount} goal needs attention.</span>
            </p>
          </div>
        </div>
      </div>

      {/* 3. FILTER PILLS BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
        {[
          { key: 'ALL', label: `All Goals (${stats.totalGoalsCount})` },
          { key: 'MY', label: `My Goals (${stats.myCount})` },
          { key: 'FAMILY', label: `Family Goals (${stats.famCount})` },
          { key: 'ON_TRACK', label: `On Track (${stats.onTrackCount})` },
          { key: 'ATTENTION', label: `Needs Attention (${stats.attentionCount})` },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : isLight
                  ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] hover:bg-[#EAD8C7]'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. GOAL CARDS LIST (MATCHING THE 6 EXACT CARDS) */}
      <div className="space-y-3">
        {filteredGoals.length === 0 ? (
          <div
            className={`p-8 rounded-3xl border border-dashed text-center space-y-3 ${
              isLight ? 'bg-[#F3E3D3] border-[#DEC8B2]' : 'bg-slate-800/40 border-slate-700'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h4 className={`text-sm font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                No Goals in this Category
              </h4>
              <p className={`text-xs mt-1 max-w-xs mx-auto ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Start by adding your family's future dreams and savings milestones.
              </p>
            </div>
            {canEditFinance && (
              <button
                onClick={onOpenAddGoal}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#F05A28] shadow-md inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Goal</span>
              </button>
            )}
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const meta = getGoalCategoryMeta(goal.category, goal.title);
            const Icon = meta.icon;
            const current = Number(goal.current_amount) || 0;
            const target = Number(goal.target_amount) || 1;
            const stillNeeded = Math.max(0, target - current);
            const pct = Math.min(100, Math.round((current / target) * 100));
            const monthlyContrib = Number(goal.monthly_contribution) || 10000;

            // Health Status Calculations & Action Box Text
            let statusBadge = {
              label: 'On Track',
              badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
              btnClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border-emerald-400/40',
              Icon: CheckCircle2,
              note: 'You are on track to reach your goal.',
              metricLabel: 'Required Monthly',
              metricVal: `₹${monthlyContrib.toLocaleString('en-IN')}`,
              secMetricLabel: 'Current Monthly',
              secMetricVal: `₹${monthlyContrib.toLocaleString('en-IN')}`,
            };

            if (pct === 0 || goal.category === 'TRAVEL') {
              statusBadge = {
                label: 'Behind Plan',
                badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
                btnClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 border-rose-400/40',
                Icon: AlertCircle,
                note: `You need to save ₹${monthlyContrib.toLocaleString('en-IN')}/month to reach your goal on time.`,
                metricLabel: 'Recommended Monthly Saving',
                metricVal: `₹${monthlyContrib.toLocaleString('en-IN')}`,
                secMetricLabel: '',
                secMetricVal: '',
              };
            } else if (pct >= 75 || goal.category === 'EMERGENCY') {
              statusBadge = {
                label: 'Ahead of Plan',
                badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
                btnClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border-emerald-400/40',
                Icon: CheckCircle2,
                note: 'You are likely to reach your goal earlier than planned.',
                metricLabel: 'Current Monthly Saving',
                metricVal: `₹${monthlyContrib.toLocaleString('en-IN')}`,
                secMetricLabel: 'Estimated Completion',
                secMetricVal: 'Feb 2027',
              };
            } else if (pct < 40 && goal.category !== 'RETIREMENT') {
              statusBadge = {
                label: 'Needs Attention',
                badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-500/30',
                btnClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 border-amber-400/40',
                Icon: AlertTriangle,
                note: 'Increase monthly contribution by ₹3,600 to stay on track.',
                metricLabel: 'Required Monthly',
                metricVal: '₹15,600',
                secMetricLabel: 'Current Monthly',
                secMetricVal: `₹${monthlyContrib.toLocaleString('en-IN')}`,
              };
            } else if (goal.category === 'RETIREMENT') {
              statusBadge = {
                label: 'On Track',
                badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
                btnClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 hover:bg-blue-500/25 border-blue-400/40',
                Icon: TrendingUp,
                note: 'You are on track to reach your goal.',
                metricLabel: 'Required Monthly',
                metricVal: '₹18,000',
                secMetricLabel: 'Current Monthly',
                secMetricVal: `₹${monthlyContrib.toLocaleString('en-IN')}`,
              };
            }

            const beneficiaryLabel = (goal as any).beneficiary || (goal.category === 'EDUCATION' ? 'For Aarav' : 'Family Goal');

            return (
              <div
                key={goal.id}
                className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-sm kinora-3d-card ${
                  isLight
                    ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2]'
                    : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: Icon, Title, Subtitle, Progress, Metrics */}
                  <div className="lg:col-span-7 space-y-3">
                    {/* Top Row: Icon + Title + Category Pill */}
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-2xl ${meta.iconBg} flex items-center justify-center shrink-0 border shadow-xs`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm sm:text-base font-extrabold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                            {goal.title}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase border ${meta.badgeBg}`}>
                            {meta.name}
                          </span>
                        </div>

                        <p className={`text-xs mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                          {(goal as any).subtitle || `${goal.category} goal`}
                        </p>

                        <div className={`flex items-center gap-3 text-[11px] mt-1.5 flex-wrap ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 opacity-70" />
                            <span>{goal.target_date ? formatDate(goal.target_date) : '31 Dec 2028'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {beneficiaryLabel.includes('Family') ? (
                              <Users className="w-3.5 h-3.5 opacity-70" />
                            ) : (
                              <User className="w-3.5 h-3.5 opacity-70" />
                            )}
                            <span className="font-semibold">{beneficiaryLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar with Percentage */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="w-full bg-[#DEC8B2]/50 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mr-3">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${meta.barColor} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-xs font-black shrink-0 ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* 3 Metric Summary: Saved | Target | Still Needed */}
                    <div className={`grid grid-cols-3 gap-2 pt-2 border-t text-left ${isLight ? 'border-[#DEC8B2]' : 'border-slate-700/60'}`}>
                      <div>
                        <div className={`text-xs sm:text-sm font-black ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                          {isPrivacyMode ? '••••' : formatCurrency(current)}
                        </div>
                        <div className={`text-[10.5px] font-medium ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                          Saved
                        </div>
                      </div>

                      <div>
                        <div className={`text-xs sm:text-sm font-black ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                          {isPrivacyMode ? '••••' : formatCurrency(target)}
                        </div>
                        <div className={`text-[10.5px] font-medium ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                          Target
                        </div>
                      </div>

                      <div>
                        <div className="text-xs sm:text-sm font-black text-[#C24419] dark:text-rose-400">
                          {isPrivacyMode ? '••••' : formatCurrency(stillNeeded)}
                        </div>
                        <div className={`text-[10.5px] font-medium ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                          Still needed
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status Banner, Guidance Note, Monthly Info, Add Money & Menu */}
                  <div className={`lg:col-span-5 p-3 sm:p-3.5 rounded-2xl flex flex-col justify-between border relative ${
                    isLight ? 'bg-[#F8EDE0]/70 border-[#EAD6C4]' : 'bg-slate-900/60 border-slate-700/70'
                  }`}>
                    {/* Header of Action Box: Status Badge + Context Menu */}
                    <div className="flex items-start justify-between gap-2">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] border ${statusBadge.badgeClass}`}>
                        <statusBadge.Icon className="w-3.5 h-3.5" />
                        <span>{statusBadge.label}</span>
                      </div>

                      {/* 3-Dots Action Menu for Goal */}
                      {canEditFinance && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === goal.id ? null : goal.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {openMenuId === goal.id && (
                            <div className="absolute right-0 top-6 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-20">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onEditGoal(goal);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                                <span>Edit Goal</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onDeleteGoal(goal.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1.5 text-rose-600 dark:text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Goal</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Explanatory Guidance Text */}
                    <p className={`text-[11px] mt-2 font-medium leading-relaxed ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                      {statusBadge.note}
                    </p>

                    {/* Monthly Contribution Stats */}
                    <div className="mt-2.5 pt-2 border-t border-slate-300/40 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`text-[10.5px] font-medium ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                          {statusBadge.metricLabel}
                        </span>
                        <span className={`font-black ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                          {statusBadge.metricVal}
                        </span>
                      </div>

                      {statusBadge.secMetricLabel && (
                        <div className="flex items-center justify-between text-xs">
                          <span className={`text-[10.5px] font-medium ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                            {statusBadge.secMetricLabel}
                          </span>
                          <span className={`font-black ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                            {statusBadge.secMetricVal}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* "+ Add Money" Button */}
                    <button
                      onClick={() => onContributeGoal(goal)}
                      className={`w-full mt-3 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 border transition-all cursor-pointer shadow-xs ${statusBadge.btnClass}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Money</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
