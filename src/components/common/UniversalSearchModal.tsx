import React, { useState, useEffect } from 'react';
import { Search, X, FolderLock, Receipt, Users, CheckSquare, Calendar, Camera, ShieldAlert, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../utils/api.js';

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
        return <FolderLock className="w-4 h-4 text-amber-400" />;
      case 'EXPENSE':
      case 'GOAL':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'MEMBER':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'TASK':
        return <CheckSquare className="w-4 h-4 text-cyan-400" />;
      case 'CALENDAR':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'MEMORY':
        return <Camera className="w-4 h-4 text-rose-400" />;
      case 'EMERGENCY':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <Search className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 px-3.5 py-2.5 rounded-2xl">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search documents, expenses, people, tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-xs bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-lg text-slate-300 font-medium">
            Esc
          </button>
        </div>

        {/* Search results list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isSearching && (
            <div className="text-center py-6 text-xs text-slate-400">Searching family vault and records...</div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-sm font-semibold text-slate-300">No matching records found</div>
              <p className="text-xs mt-1 text-slate-500">Only authorized information accessible to your role is displayed.</p>
            </div>
          )}

          {!query && (
            <div className="py-4 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Suggested Searches</div>
              <div className="flex flex-wrap gap-2">
                {['Passport', 'Car Insurance', 'Groceries', 'School', 'Emergency Doctor', 'Goa Trip'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-xl transition-colors"
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
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-700/50 flex items-center justify-center shrink-0">
                  {getResultIcon(res.type)}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white line-clamp-1">{res.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{res.subtitle}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
