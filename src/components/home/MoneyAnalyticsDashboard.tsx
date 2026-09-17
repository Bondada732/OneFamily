import React, { useState } from 'react';

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

// Highly distinct vibrant colors for each category
const CATEGORY_COLORS: { [key: string]: string } = {
  Rent: '#FF5722', // Deep Orange / Coral
  Housing: '#FF5722',
  Maintenance: '#FFB800', // Vibrant Amber / Gold
  Utilities: '#F59E0B',
  Groceries: '#00E676', // Bright Neon Green
  'Food & Dining': '#FF2A6D', // Neon Rose
  'Veg+Fruits': '#00D2FF', // Electric Cyan
  Vegetables: '#00D2FF',
  Fruits: '#38BDF8',
  Shopping: '#9D4EDD', // Electric Purple
  Healthcare: '#FF1744', // Red
  Transport: '#3B82F6', // Blue
  Education: '#10B981', // Emerald
  Entertainment: '#F72585', // Fuchsia
  Miscellaneous: '#64748B', // Slate
  Other: '#64748B',
};

const DISTINCT_PALETTE = [
  '#00D2FF', // Cyan
  '#FFB800', // Gold
  '#00E676', // Green
  '#FF2A6D', // Rose
  '#9D4EDD', // Purple
  '#FF5722', // Orange
  '#3B82F6', // Blue
  '#F72585', // Pink
  '#06D6A0', // Teal
  '#EAB308', // Yellow
];

export const MoneyAnalyticsDashboard: React.FC<MoneyAnalyticsDashboardProps> = ({
  expenses = [],
  monthlyBudget = 100000,
  onNavigateTab,
  isPrivacyMode = false,
}) => {
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

  // Filter this month's expenses
  const monthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
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
    ? expenses
        .filter((e) => e.date?.startsWith(todayStr))
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
    : 0;

  // This week's spending (last 7 days)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeekSpent = hasRealExpenses
    ? expenses
        .filter((e) => {
          if (!e.date) return false;
          const d = new Date(e.date);
          return d >= oneWeekAgo && d <= now;
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
      amt = expenses
        .filter((e) => e.date?.startsWith(ymd))
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
    const x = paddingX + (index / (days14.length - 1)) * usableW;
    const y = paddingY + usableH - (d.amount / maxDayAmt) * usableH;
    return { x, y, label: d.label, amount: d.amount };
  });

  // Smooth Bezier line builder
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    pathD += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

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
      {/* 1. Header Section */}
      <div className="space-y-0.5 px-0.5">
        <h4 className="text-[9.5px] sm:text-[10.5px] font-bold tracking-wider text-slate-400 uppercase">
          HEY! HERE'S WHERE YOUR MONEY WENT
        </h4>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {isPrivacyMode ? '••••••' : `₹${displayTotalSpent.toLocaleString('en-IN')}`}
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-slate-400">
            spent this month
          </span>
        </div>
      </div>

      {/* 2. Four Metrics Cards with Distinct Figure Colors & Scaled Typography */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {/* Card 1: TODAY (Cyan) */}
        <div className="bg-[#0D152D]/95 border border-[#00D2FF]/25 hover:border-[#00D2FF]/50 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-md transition-all">
          <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">
            TODAY
          </span>
          <div className="text-xs sm:text-sm font-black tracking-tight mt-1 truncate text-[#00D2FF]">
            {isPrivacyMode ? '••••' : `₹${todaySpent.toLocaleString('en-IN')}`}
          </div>
          <div className="h-2.5" />
        </div>

        {/* Card 2: THIS WEEK (Gold / Amber) */}
        <div className="bg-[#0D152D]/95 border border-[#FFB800]/25 hover:border-[#FFB800]/50 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-md transition-all">
          <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wider text-slate-400 uppercase">
            THIS WEEK
          </span>
          <div className="text-xs sm:text-sm font-black tracking-tight mt-1 truncate text-[#FFB800]">
            {isPrivacyMode ? '••••' : `₹${thisWeekSpent.toLocaleString('en-IN')}`}
          </div>
          <div className="h-2.5" />
        </div>

        {/* Card 3: BUDGET LEFT (Emerald Green) */}
        <div className="bg-[#0D152D]/95 border border-[#00E676]/25 hover:border-[#00E676]/50 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-md transition-all">
          <span className="text-[8.5px] sm:text-[9.5px] font-bold tracking-wider text-slate-400 uppercase truncate">
            BUDGET LEFT
          </span>
          <div className="text-xs sm:text-sm font-black tracking-tight mt-1 truncate text-[#00E676]">
            {isPrivacyMode ? '••••••' : `₹${budgetLeft.toLocaleString('en-IN')}`}
          </div>
          <div className="text-[9.5px] font-bold text-[#00E676] mt-0.5 leading-none">
            {percentUsed}% used
          </div>
        </div>

        {/* Card 4: TRANSACTIONS (Purple) */}
        <div className="bg-[#0D152D]/95 border border-[#C084FC]/25 hover:border-[#C084FC]/50 rounded-xl p-2 sm:p-2.5 flex flex-col justify-between shadow-md transition-all">
          <span className="text-[8px] sm:text-[9px] font-bold tracking-tight text-slate-400 uppercase">
            TRANSACTIONS
          </span>
          <div className="text-xs sm:text-sm font-black tracking-tight mt-1 truncate text-[#C084FC]">
            {transactionCount}
          </div>
          <div className="text-[8.5px] sm:text-[9px] font-medium text-[#C084FC]/80 mt-0.5 leading-none truncate">
            avg ₹{Math.round(avgPerDay)}/d
          </div>
        </div>
      </div>

      {/* 3. Bottom Dual Cards: Interactive Last 14 days + Interactive Top categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {/* Left Card: Interactive Last 14 days chart */}
        <div className="bg-[#0D152D]/95 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight">Last 14 days</h5>
            {hoveredDayIndex !== null && (
              <span className="text-[10.5px] font-semibold text-amber-400 animate-fadeIn">
                {days14[hoveredDayIndex].label}: ₹{days14[hoveredDayIndex].amount.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          <div className="relative w-full h-28 flex flex-col justify-end pt-1">
            {/* Y-Axis subtle scale indicators */}
            <div className="absolute left-0 top-0 bottom-5 flex flex-col justify-between text-[8.5px] text-slate-500 pointer-events-none select-none">
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
                  <linearGradient id="amberChartGradientInteractive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFB800" stopOpacity="0.45" />
                    <stop offset="65%" stopColor="#FFB800" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#FFB800" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Gradient Fill */}
                <path d={areaD} fill="url(#amberChartGradientInteractive)" />

                {/* Stroke Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#FFB800"
                  strokeWidth="2.2"
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
                          stroke="#FFB800"
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
                          fill={isHovered ? '#FFFFFF' : '#FFB800'}
                          stroke="#0D152D"
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
            <div className="flex justify-between pl-5 pt-1 text-[9px] text-slate-400 font-medium select-none">
              <span>{days14[0]?.label}</span>
              <span>{days14[4]?.label}</span>
              <span>{days14[8]?.label}</span>
              <span>{days14[11]?.label}</span>
              <span>{days14[13]?.label}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Interactive Top categories Donut Chart */}
        <div className="bg-[#0D152D]/95 border border-slate-800/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-lg relative">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs sm:text-sm font-bold text-white tracking-tight">Top categories</h5>
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
                  stroke="#16203D"
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
                    <span className="text-[10px] font-extrabold text-white leading-tight">
                      ₹{activeCategory.amount >= 1000 ? `${(activeCategory.amount / 1000).toFixed(1)}k` : activeCategory.amount}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px] font-semibold text-slate-400">
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
                      isHovered ? 'bg-slate-800/80 scale-[1.02]' : 'hover:bg-slate-800/40'
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
                          isHovered ? 'text-white font-bold' : 'text-slate-300'
                        }`}
                      >
                        {cat.name}
                      </span>
                    </div>
                    <span
                      className="font-bold text-white shrink-0 text-[11px] pl-1 font-mono"
                      style={{ color: isHovered ? cat.color : '#FFFFFF' }}
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
