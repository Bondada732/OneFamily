import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.js';

export interface ExpenseItem {
  id: string;
  amount: number;
  category_name: string;
  category_id?: string;
  date: string;
  merchant?: string;
}

interface MoneyAnalyticsDashboardProps {
  expenses: ExpenseItem[];
  monthlyBudget?: number;
  onNavigateTab?: (tab: string) => void;
  isPrivacyMode?: boolean;
}

// Category chart colors matching official light theme palette
const CATEGORY_COLORS: { [key: string]: string } = {
  'Food & Dining': '#FFC107', // Food & Dining (Yellow)
  Groceries: '#4CAF50', // Transport/Green
  Shopping: '#FF7043', // Shopping (Orange)
  Transport: '#4CAF50', // Transport (Green)
  'Bills & Utilities': '#42A5F5', // Bills & Utilities (Blue)
  Utilities: '#42A5F5',
  Rent: '#FF7043',
  Housing: '#FF7043',
  Maintenance: '#FFC107',
  'Veg+Fruits': '#4CAF50',
  Vegetables: '#4CAF50',
  Fruits: '#4CAF50',
  Healthcare: '#FF6B6B',
  Education: '#42A5F5',
  Entertainment: '#AB47BC',
  Miscellaneous: '#AB47BC',
  Others: '#AB47BC',
  Other: '#AB47BC',
};

const DISTINCT_PALETTE = [
  '#FFC107', // Food & Dining (Yellow)
  '#FF7043', // Shopping (Orange)
  '#4CAF50', // Transport (Green)
  '#42A5F5', // Bills & Utilities (Blue)
  '#AB47BC', // Others (Purple)
  '#22C55E', // Brand Green
  '#F05A28', // Brand Orange
  '#FFB74D', // Secondary Accent
];

export const MoneyAnalyticsDashboard: React.FC<MoneyAnalyticsDashboardProps> = ({
  expenses = [],
  monthlyBudget = 100000,
  onNavigateTab,
  isPrivacyMode = false,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  // Helper to format ISO YYYY-MM-DD
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = formatYMD(now);
  const safeExpenses = Array.isArray(expenses) ? expenses : [];

  // Filter this month's expenses
  const monthExpenses = safeExpenses.filter((e) => {
    if (!e || !e.date) return false;
    const d = new Date(e.date);
    return !isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  // Calculate actual total spent this month
  const actualMonthSpent = monthExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Use actual expenses if entered, or realistic default
  const hasRealExpenses = monthExpenses.length > 0;
  const displayTotalSpent = hasRealExpenses ? actualMonthSpent : 48188;
  const effectiveBudget = Math.max(displayTotalSpent + 5000, monthlyBudget || 100000);
  const budgetLeft = Math.max(0, effectiveBudget - displayTotalSpent);
  const percentUsed = Math.min(100, Math.round((displayTotalSpent / effectiveBudget) * 100));

  // Today's spending
  const todaySpent = hasRealExpenses
    ? safeExpenses
        .filter((e) => e && e.date?.startsWith(todayStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;

  // This week's spending (last 7 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekSpent = hasRealExpenses
    ? safeExpenses
        .filter((e) => {
          if (!e || !e.date) return false;
          const d = new Date(e.date);
          return !isNaN(d.getTime()) && d >= oneWeekAgo && d <= now;
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;

  // Transaction count & daily average
  const transactionCount = hasRealExpenses ? monthExpenses.length : 11;
  const daysElapsed = Math.max(1, currentDate);
  const avgPerDay = displayTotalSpent / daysElapsed;

  // 14-day spending trend computation
  const days14: { dateStr: string; label: string; amount: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const ymd = formatYMD(d);
    const dayLabel = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;

    let amt = 0;
    if (hasRealExpenses) {
      amt = safeExpenses
        .filter((e) => e && e.date?.startsWith(ymd))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    } else {
      if (i === 12) amt = 1200;
      else if (i === 11) amt = 39000;
      else if (i === 10) amt = 5900;
      else if (i === 5) amt = 1200;
      else if (i === 2) amt = 850;
      else amt = 0;
    }

    days14.push({ dateStr: ymd, label: dayLabel, amount: amt });
  }

  // Generate SVG Path for 14-day Chart
  const maxDayAmt = Math.max(10, ...days14.map((d) => d.amount));
  const svgWidth = 280;
  const svgHeight = 85;
  const paddingX = 10;
  const paddingY = 8;
  const usableW = svgWidth - paddingX * 2;
  const usableH = svgHeight - paddingY * 2;

  const points = days14.map((d, index) => {
    const x = paddingX + (index / Math.max(1, days14.length - 1)) * usableW;
    const y = paddingY + usableH - (d.amount / maxDayAmt) * usableH;
    return { x, y, label: d.label, amount: d.amount };
  });

  // Smooth Bezier line builder
  let pathD = points.length > 0 ? `M ${points[0].x} ${points[0].y}` : '';
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z` : '';

  // Top Categories breakdown with distinct colors
  let topCategoriesList: { name: string; amount: number; color: string; percent: number }[] = [];

  if (hasRealExpenses) {
    const categoryTotals: { [key: string]: number } = {};
    monthExpenses.forEach((e) => {
      const cat = e.category_name || 'Miscellaneous';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(e.amount) || 0);
    });

    topCategoriesList = Object.entries(categoryTotals)
      .map(([name, amount], idx) => ({
        name,
        amount,
        color: CATEGORY_COLORS[name] || DISTINCT_PALETTE[idx % DISTINCT_PALETTE.length],
        percent: displayTotalSpent > 0 ? (amount / displayTotalSpent) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  } else {
    topCategoriesList = [
      { name: 'Rent', amount: 39000, color: '#FF5722', percent: 81 },
      { name: 'Maintenance', amount: 5905, color: '#FFB800', percent: 12 },
      { name: 'Groceries', amount: 1277, color: '#00E676', percent: 4 },
      { name: 'Veg+Fruits', amount: 1260, color: '#00D2FF', percent: 3 },
    ];
  }

  // Active highlighted category data for tooltip
  const activeCategory = topCategoriesList.find((c) => c.name === hoveredCategory);

  // Donut chart SVG calculations
  const donutRadius = 36;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedOffset = 0;

  return (
    <div className="w-full space-y-3 pt-1 pb-1 select-none">
      {/* 1. Main Expense Summary Container */}
      <div className={`rounded-[28px] p-4 sm:p-5 transition-all kinora-3d-card ${
        isLight
          ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] shadow-[0_12px_28px_-4px_rgba(130,80,45,0.14),0_4px_10px_-2px_rgba(130,80,45,0.08)] space-y-3.5'
          : 'bg-transparent space-y-3'
      }`}>
        {/* Header Section */}
        <div className="space-y-1">
          <h4 className={`text-[10px] sm:text-[11px] font-black tracking-wider uppercase ${isLight ? 'text-[#D3542F]' : 'text-slate-400'}`}>
            HEY! HERE'S WHERE YOUR MONEY WENT
          </h4>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
              {isPrivacyMode ? '••••••' : `₹${displayTotalSpent.toLocaleString('en-IN')}`}
            </span>
            <span className={`text-xs font-semibold ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
              spent this month
            </span>
          </div>
        </div>

        {/* 2. Four Metrics Cards with 3D Model Tile Styling */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Card 1: TODAY */}
          <div className={`rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all kinora-3d-tile ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12),0_2px_4px_rgba(130,80,45,0.06)]'
              : 'bg-[#0D152D]/95 border border-[#00D2FF]/25 hover:border-[#00D2FF]/50 shadow-md'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                TODAY
              </span>
              <span className={`text-xs ${isLight ? 'text-[#A3A3A3]' : 'text-slate-400'}`}>›</span>
            </div>
            <div className={`text-xs sm:text-sm md:text-base font-black tracking-tight mt-0.5 ${isLight ? 'text-[#D3542F]' : 'text-[#00D2FF]'}`}>
              {isPrivacyMode ? '••••' : `₹${todaySpent.toLocaleString('en-IN')}`}
            </div>
          </div>

          {/* Card 2: THIS WEEK (Warm Highlight Card) */}
          <div className={`rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all kinora-3d-tile ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#FFB74D]/70 border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12),0_2px_4px_rgba(130,80,45,0.06)]'
              : 'bg-[#0D152D]/95 border border-[#FFB800]/25 hover:border-[#FFB800]/50 shadow-md'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase ${isLight ? 'text-[#D3542F]' : 'text-slate-400'}`}>
                THIS WEEK
              </span>
              <span className={`text-xs ${isLight ? 'text-[#D3542F]' : 'text-slate-400'}`}>›</span>
            </div>
            <div className={`text-xs sm:text-sm md:text-base font-black tracking-tight mt-0.5 ${isLight ? 'text-[#1F1F1F]' : 'text-[#FFB800]'}`}>
              {isPrivacyMode ? '••••' : `₹${thisWeekSpent.toLocaleString('en-IN')}`}
            </div>
          </div>

          {/* Card 3: BUDGET LEFT (Brand Green #22C55E) */}
          <div className={`rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all kinora-3d-tile ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12),0_2px_4px_rgba(130,80,45,0.06)]'
              : 'bg-[#0D152D]/95 border border-[#00E676]/25 hover:border-[#00E676]/50 shadow-md'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase truncate ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                BUDGET LEFT
              </span>
              <span className={`text-xs ${isLight ? 'text-[#A3A3A3]' : 'text-slate-400'}`}>›</span>
            </div>
            <div className={`text-xs sm:text-sm md:text-base font-black tracking-tight mt-0.5 ${isLight ? 'text-[#22C55E]' : 'text-[#00E676]'}`}>
              {isPrivacyMode ? '••••••' : `₹${budgetLeft.toLocaleString('en-IN')}`}
            </div>
            <div className={`text-[8.5px] sm:text-[9.5px] font-bold mt-0.5 leading-none ${isLight ? 'text-[#22C55E]' : 'text-[#00E676]'}`}>
              {percentUsed}% used
            </div>
          </div>

          {/* Card 4: TRANSACTIONS (Purple #AB47BC) */}
          <div className={`rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all kinora-3d-tile ${
            isLight
              ? 'bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12),0_2px_4px_rgba(130,80,45,0.06)]'
              : 'bg-[#0D152D]/95 border border-[#C084FC]/25 hover:border-[#C084FC]/50 shadow-md'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[8.5px] sm:text-[9px] font-bold tracking-wider uppercase ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                TRANSACTIONS
              </span>
              <span className={`text-xs ${isLight ? 'text-[#A3A3A3]' : 'text-slate-400'}`}>›</span>
            </div>
            <div className={`text-xs sm:text-sm md:text-base font-black tracking-tight mt-0.5 ${isLight ? 'text-[#AB47BC]' : 'text-[#C084FC]'}`}>
              {transactionCount}
            </div>
            <div className={`text-[8.5px] sm:text-[9px] font-medium mt-0.5 leading-none truncate ${isLight ? 'text-[#6B6B6B]' : 'text-[#C084FC]/80'}`}>
              avg ₹{Math.round(avgPerDay)}/d
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Dual Cards: Interactive Last 14 days + Interactive Top categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Left Card: Interactive Last 14 days chart */}
        <div className={isLight ? "bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] rounded-[26px] p-4 flex flex-col justify-between shadow-[0_10px_24px_-4px_rgba(130,80,45,0.14),0_4px_8px_-2px_rgba(130,80,45,0.08)] relative overflow-hidden kinora-3d-card" : "bg-[#0D152D]/95 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden"}>
          <div className="flex items-center justify-between mb-1.5">
            <h5 className={`text-xs sm:text-sm font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Last 14 days</h5>
            {hoveredDayIndex !== null && (
              <span className={`text-[10.5px] font-bold animate-fadeIn ${isLight ? 'text-[#D3542F]' : 'text-amber-400'}`}>
                {days14[hoveredDayIndex].label}: ₹{days14[hoveredDayIndex].amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="relative w-full h-28 flex flex-col justify-end pt-1">
            {/* Y-Axis subtle scale indicators */}
            <div className={`absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[8.5px] pointer-events-none select-none ${isLight ? 'text-[#A3A3A3]' : 'text-slate-500'}`}>
              <span>{maxDayAmt >= 1000 ? `₹${Math.round(maxDayAmt / 1000)}k` : maxDayAmt}</span>
              <span>0</span>
            </div>

            {/* Spark Area Line Chart with interactive touch/cursor tracking */}
            <div
              className="w-full h-20 pl-5 relative cursor-crosshair"
              onMouseLeave={() => setHoveredDayIndex(null)}
            >
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="chartGradientInteractive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isLight ? "#FDE0B2" : "#FFB800"} stopOpacity={isLight ? "0.60" : "0.45"} />
                    <stop offset="65%" stopColor={isLight ? "#FDE0B2" : "#FFB800"} stopOpacity={isLight ? "0.20" : "0.1"} />
                    <stop offset="100%" stopColor={isLight ? "#FDE0B2" : "#FFB800"} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Gradient Fill */}
                <path d={areaD} fill="url(#chartGradientInteractive)" />

                {/* Stroke Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isLight ? "#F59E0B" : "#FFB800"}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points on Hover or Peak */}
                {points.map((pt, idx) => {
                  const isHovered = hoveredDayIndex === idx;
                  const isPeak = pt.amount === maxDayAmt && maxDayAmt > 0;

                  return (
                    <g key={idx}>
                      {/* Invisible hover hitbox for each day */}
                      <rect
                        x={pt.x - usableW / (days14.length * 2)}
                        y="0"
                        width={usableW / days14.length}
                        height={svgHeight}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredDayIndex(idx)}
                        onTouchStart={() => setHoveredDayIndex(idx)}
                      />

                      {/* Interactive vertical guide line on hover */}
                      {isHovered && (
                        <line
                          x1={pt.x}
                          y1="0"
                          x2={pt.x}
                          y2={svgHeight}
                          stroke={isLight ? "#D3542F" : "#FFB800"}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                          opacity="0.8"
                        />
                      )}

                      {/* Visible Point Dot */}
                      {(isHovered || isPeak) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isHovered ? 4.5 : 3.5}
                          fill={isHovered ? '#FFFFFF' : isLight ? '#D3542F' : '#FFB800'}
                          stroke={isLight ? '#D3542F' : '#0D152D'}
                          strokeWidth="1.5"
                          className="transition-all duration-150"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-Axis Date Labels with Clean Spacing */}
            <div className={`flex justify-between pl-5 pt-1 text-[9px] font-medium select-none ${isLight ? 'text-[#A3A3A3]' : 'text-slate-400'}`}>
              <span>{days14[0]?.label}</span>
              <span>{days14[4]?.label}</span>
              <span>{days14[8]?.label}</span>
              <span>{days14[11]?.label}</span>
              <span>{days14[13]?.label}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Interactive Top categories Donut Chart */}
        <div className={isLight ? "bg-[#F3E3D3] border border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2] rounded-[26px] p-4 flex flex-col justify-between shadow-[0_10px_24px_-4px_rgba(130,80,45,0.14),0_4px_8px_-2px_rgba(130,80,45,0.08)] relative kinora-3d-card" : "bg-[#0D152D]/95 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg relative"}>
          <div className="flex items-center justify-between mb-2">
            <h5 className={`text-xs sm:text-sm font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Top categories</h5>
            {activeCategory && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-fadeIn"
                style={{
                  backgroundColor: `${activeCategory.color}20`,
                  color: activeCategory.color,
                  border: `1px solid ${activeCategory.color}40`,
                }}
              >
                {activeCategory.name}: {activeCategory.percent.toFixed(0)}%
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Interactive Donut Ring Chart */}
            <div
              className="relative w-24 h-24 shrink-0 flex items-center justify-center cursor-pointer"
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring Track */}
                <circle
                  cx="50"
                  cy="50"
                  r={donutRadius}
                  fill="transparent"
                  stroke={isLight ? '#F8EDE0' : '#16203D'}
                  strokeWidth="14"
                />

                {/* Dynamic Donut Segments with Hover Focus */}
                {topCategoriesList.map((cat, idx) => {
                  const segLength = (cat.percent / 100) * donutCircumference;
                  const dashArray = `${segLength} ${donutCircumference - segLength}`;
                  const dashOffset = -accumulatedOffset;
                  accumulatedOffset += segLength;

                  const isHovered = hoveredCategory === cat.name;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r={donutRadius}
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth={isHovered ? 18 : 14}
                      strokeDasharray={dashArray}
                      strokeDashoffset={dashOffset}
                      strokeLinecap="butt"
                      className="transition-all duration-200 cursor-pointer"
                      style={{
                        filter: isHovered ? `drop-shadow(0 0 6px ${cat.color})` : 'none',
                        opacity: hoveredCategory && !isHovered ? 0.45 : 1,
                      }}
                      onMouseEnter={() => setHoveredCategory(cat.name)}
                      onTouchStart={() => setHoveredCategory(cat.name)}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Text (Interactive Hover Display) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-1">
                {activeCategory ? (
                  <>
                    <span className="text-[9px] font-bold leading-tight truncate max-w-[50px]" style={{ color: activeCategory.color }}>
                      {activeCategory.name}
                    </span>
                    <span className={`text-[10px] font-extrabold leading-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                      ₹{activeCategory.amount >= 1000 ? `${(activeCategory.amount / 1000).toFixed(1)}k` : activeCategory.amount}
                    </span>
                  </>
                ) : (
                  <span className={`text-[9.5px] font-bold ${isLight ? 'text-[#6B6B6B]' : 'text-slate-400'}`}>
                    {topCategoriesList.length} Types
                  </span>
                )}
              </div>
            </div>

            {/* Category Legend & Breakdown List with distinct colors and hover interactions */}
            <div className="flex-1 space-y-1.5 min-w-0">
              {topCategoriesList.map((cat, idx) => {
                const isHovered = hoveredCategory === cat.name;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredCategory(cat.name)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className={`flex items-center justify-between gap-1.5 py-0.5 px-1.5 rounded-lg transition-all cursor-pointer ${
                      isHovered
                        ? isLight ? 'bg-[#F8EDE0] scale-[1.02]' : 'bg-slate-800/80 scale-[1.02]'
                        : isLight ? 'hover:bg-[#F8EDE0]/60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0 shadow-sm"
                        style={{
                          backgroundColor: cat.color,
                          boxShadow: isHovered ? `0 0 8px ${cat.color}` : 'none',
                        }}
                      />
                      <span
                        className={`font-medium truncate text-[11px] transition-colors ${
                          isHovered
                            ? isLight ? 'text-[#1F1F1F] font-bold' : 'text-white font-bold'
                            : isLight ? 'text-[#6B6B6B]' : 'text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                    <span
                      className={`font-bold shrink-0 text-[11px] pl-1 font-mono ${
                        isLight ? 'text-[#1F1F1F]' : 'text-white'
                      }`}
                      style={{ color: isHovered ? cat.color : isLight ? '#1F1F1F' : '#FFFFFF' }}
                    >
                      {isPrivacyMode ? '••••' : `₹${cat.amount.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
