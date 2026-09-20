import React, { useState, useEffect } from 'react';
import { Search, X, FolderLock, Receipt, Users, CheckSquare, Calendar, Camera, ShieldAlert, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../utils/api.js';
import { useTheme } from '../../context/ThemeContext.js';

interface SearchResult {
  type: string;
  title: string;
  subtitle: string;
  tab: string;
  id: string;
}

interface UniversalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: any) => void;
}

export const UniversalSearchModal: React.FC<UniversalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await apiRequest(`/search/universal?q=${encodeURIComponent(query)}`);
        setResults(res.results || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return <FolderLock className={`w-4 h-4 ${isLight ? 'text-[#B87333]' : 'text-[#FFD21F]'}`} />;
      case 'EXPENSE':
      case 'GOAL':
        return <Receipt className={`w-4 h-4 ${isLight ? 'text-[#2E7D32]' : 'text-[#55D98A]'}`} />;
      case 'MEMBER':
        return <Users className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-[#168BFF]'}`} />;
      case 'TASK':
        return <CheckSquare className={`w-4 h-4 ${isLight ? 'text-[#C25425]' : 'text-[#16C7F2]'}`} />;
      case 'CALENDAR':
        return <Calendar className={`w-4 h-4 ${isLight ? 'text-[#C25425]' : 'text-[#7EDCFF]'}`} />;
      case 'MEMORY':
        return <Camera className={`w-4 h-4 ${isLight ? 'text-[#B84A1E]' : 'text-[#FF8A24]'}`} />;
      case 'EMERGENCY':
        return <ShieldAlert className={`w-4 h-4 ${isLight ? 'text-[#C62828]' : 'text-[#FF4D6D]'}`} />;
      default:
        return <Search className={`w-4 h-4 ${isLight ? 'text-[#634B3F]' : 'text-[#B9D8FF]'}`} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`w-full max-w-md rounded-3xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] space-y-4 max-h-[85vh] flex flex-col ${
        isLight
          ? 'bg-[#EFE4D6] border-2 border-[#DECFC0] text-[#2A1B14]'
          : 'bg-[#0B1226] border-2 border-slate-700/80 text-[#F4F8FF]'
      }`}>
        {/* Search Input Bar */}
        <div className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${
          isLight
            ? 'bg-[#EBE0D2] border-[#DECFC0]'
            : 'bg-[#0D152D] border-slate-700/70'
        }`}>
          <Search className={`w-5 h-5 shrink-0 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
          <input
            type="text"
            autoFocus
            placeholder="Search documents, expenses, people, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full bg-transparent text-sm outline-none ${
              isLight
                ? 'text-[#2A1B14] placeholder-[#947D70]'
                : 'text-white placeholder-slate-400'
            }`}
          />
          {query && (
            <button onClick={() => setQuery('')} className={`p-1 ${isLight ? 'text-[#634B3F] hover:text-[#2A1B14]' : 'text-slate-400 hover:text-white'}`}>
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className={`text-xs px-2.5 py-1 rounded-lg font-medium border ${
            isLight
              ? 'bg-[#DECFC0] hover:bg-[#D4C4B4] text-[#2A1B14] border-[#DECFC0]'
              : 'bg-[#050811] hover:bg-[#131F3F] text-slate-300 border-slate-700/60'
          }`}>
            Esc
          </button>
        </div>

        {/* Search results list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isSearching && (
            <div className={`text-center py-6 text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Searching family vault and records...</div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className={`text-center py-8 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              <div className={`text-sm font-semibold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>No matching records found</div>
              <p className={`text-xs mt-1 ${isLight ? 'text-[#947D70]' : 'text-slate-400'}`}>Only authorized information accessible to your role is displayed.</p>
            </div>
          )}

          {!query && (
            <div className="py-4 space-y-3">
              <div className={`text-[11px] font-semibold uppercase tracking-wider ${isLight ? 'text-[#B84A1E]' : 'text-[#7EDCFF]'}`}>Suggested Searches</div>
              <div className="flex flex-wrap gap-2">
                {['Passport', 'Car Insurance', 'Groceries', 'School', 'Emergency Doctor', 'Goa Trip'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className={`text-xs px-3 py-1.5 rounded-xl transition-colors border ${
                      isLight
                        ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#2A1B14] border-[#DECFC0]'
                        : 'bg-[#0D152D] hover:bg-[#131F3F] text-slate-300 hover:text-white border-slate-700/70'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.map((res, i) => (
            <button
              key={`${res.id}-${i}`}
              onClick={() => {
                onNavigate(res.tab);
                onClose();
              }}
              className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all hover:scale-[1.01] border ${
                isLight
                  ? 'bg-[#EBE0D2] hover:bg-[#E4D7C7] border-[#DECFC0]'
                  : 'bg-[#0D152D] hover:bg-[#131F3F] border-slate-700/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-[#F4EDE4] border-[#DECFC0]'
                    : 'bg-[#050811] border-slate-700/60'
                }`}>
                  {getResultIcon(res.type)}
                </div>
                <div>
                  <div className={`font-semibold text-xs line-clamp-1 ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>{res.title}</div>
                  <div className={`text-[11px] line-clamp-1 mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{res.subtitle}</div>
                </div>
              </div>
              <ArrowRight className={`w-4 h-4 shrink-0 ml-2 ${isLight ? 'text-[#B84A1E]' : 'text-[#16C7F2]'}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
