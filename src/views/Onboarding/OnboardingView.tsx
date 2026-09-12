import React, { useState } from 'react';
import { ShieldCheck, Heart, Users, Sparkles, TrendingUp, FolderLock, ArrowRight, Check, Plus, KeyRound } from 'lucide-react';
import { apiRequest } from '../../utils/api.js';

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState<'SLIDES' | 'CREATE_FAMILY' | 'JOIN_FAMILY' | 'CHECKLIST'>('SLIDES');
  const [formData, setFormData] = useState({
    familyName: 'Sharma Family',
    location: 'Hyderabad, India',
    currency: 'INR',
    language: 'en',
    headName: 'Raj Sharma',
    headEmail: 'raj.sharma@example.com',
    pinCode: '1234',
  });
  const [inviteCode, setInviteCode] = useState('');
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Add family members', done: true },
    { id: 2, label: 'Create monthly budget', done: false },
    { id: 3, label: 'Add first family goal', done: false },
    { id: 4, label: 'Upload an important document', done: false },
    { id: 5, label: 'Add family calendar events', done: false },
    { id: 6, label: 'Add emergency contacts', done: false },
    { id: 7, label: 'Create your first memory', done: false },
  ]);

  const slides = [
    {
      title: 'Welcome to One Family',
      subtitle: 'One Home. One Family. One Future.',
      description: 'The private Family Operating System that brings together your members, finances, vault, memories, and AI assistant.',
      icon: Heart,
      color: 'from-amber-400 to-rose-500',
    },
    {
      title: 'Manage Your Family',
      subtitle: 'Roles, Permissions & Family Tree',
      description: 'Empower parents, co-admins, grandparents, and children with tailored role-based access to family records.',
      icon: Users,
      color: 'from-indigo-500 to-blue-600',
    },
    {
      title: 'Secure Your Important Information',
      subtitle: 'Private Digital Family Vault',
      description: 'Store Aadhaar, PAN, passports, insurance policies, and property deeds with AI expiry tracking and OCR scanner.',
      icon: FolderLock,
      color: 'from-amber-500 to-yellow-600',
    },
    {
      title: "Plan Your Family's Future",
      subtitle: 'Wealth, Budgets & Shared Goals',
      description: 'Track mutual funds, SIPs, fixed deposits, gold, and calculate family net worth while budgeting for what matters.',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Preserve Your Memories',
      subtitle: 'Timelines, Voice Notes & Yearbook',
      description: 'Capture trip photo timelines, record grandparent stories with audio translation, and generate annual family yearbooks.',
      icon: Heart,
      color: 'from-rose-500 to-purple-600',
    },
    {
      title: 'Meet Your Family AI Assistant',
      subtitle: 'FamilyAI — Safe, Calm & Context-Aware',
      description: 'Ask questions about grocery spending, insurance due dates, trip packing lists, and personalized gift suggestions.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
    },
  ];

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/register-family', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setMode('CHECKLIST');
    } catch (err) {
      console.error(err);
      setMode('CHECKLIST');
    }
  };

  const toggleChecklistItem = (id: number) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter((c) => c.done).length;

  if (mode === 'CREATE_FAMILY') {
    return (
      <div className="p-6 space-y-6 animate-fade-in text-white">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-indigo-600 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Create Your Family</h2>
          <p className="text-xs text-slate-400">Set up your private family digital space</p>
        </div>

        <form onSubmit={handleCreateFamily} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Family Name</label>
            <input
              type="text"
              required
              value={formData.familyName}
              onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:border-amber-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
              >
                <option value="INR">₹ INR (Indian Rupee)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300">Family Head Full Name</label>
            <input
              type="text"
              required
              value={formData.headName}
              onChange={(e) => setFormData({ ...formData, headName: e.target.value })}
              className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300">Email Address</label>
              <input
                type="email"
                value={formData.headEmail}
                onChange={(e) => setFormData({ ...formData, headEmail: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300">App PIN (4 Digits)</label>
              <input
                type="password"
                maxLength={4}
                value={formData.pinCode}
                onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transition-all active:scale-95 text-sm"
          >
            Create Family Space
          </button>
        </form>

        <button
          onClick={() => setMode('SLIDES')}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
        >
          ← Back to Walkthrough
        </button>
      </div>
    );
  }

  if (mode === 'JOIN_FAMILY') {
    return (
      <div className="p-6 space-y-6 animate-fade-in text-white">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 mx-auto flex items-center justify-center">
            <KeyRound className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Join Existing Family</h2>
          <p className="text-xs text-slate-400">Enter the invitation code provided by your Family Head</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">6-Digit Family Invite Code</label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 1F-9482"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full mt-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-amber-400 outline-none"
            />
          </div>

          <button
            onClick={() => setMode('CHECKLIST')}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
          >
            Join Family
          </button>
        </div>

        <button
          onClick={() => setMode('SLIDES')}
          className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
        >
          ← Back
        </button>
      </div>
    );
  }

  if (mode === 'CHECKLIST') {
    return (
      <div className="p-6 space-y-5 animate-fade-in text-white">
        <div className="text-center space-y-1">
          <span className="text-3xl">❤️</span>
          <h2 className="text-xl font-extrabold text-white">Welcome to One Family!</h2>
          <p className="text-xs text-slate-400">Let's build your family's new digital home.</p>
        </div>

        {/* Progress Card */}
        <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-200">Setup Checklist</span>
            <span className="text-amber-400 font-bold">{completedCount} of {checklist.length} completed</span>
          </div>
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-indigo-500 transition-all duration-500"
              style={{ width: `${(completedCount / checklist.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {checklist.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                item.done
                  ? 'bg-slate-800/40 border-slate-800 text-slate-400'
                  : 'bg-slate-800 border-slate-700 text-slate-100 hover:border-slate-600'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                  item.done ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'border-slate-600'
                }`}
              >
                {item.done && <Check className="w-4 h-4" />}
              </div>
              <span className={`text-xs font-semibold ${item.done ? 'line-through text-slate-500' : ''}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onComplete}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 transition-transform active:scale-95 text-sm flex items-center justify-center gap-2"
        >
          <span>Enter Family Operating System</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // SLIDES View
  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-full flex flex-col justify-between p-6 text-white animate-fade-in">
      {/* Top indicator dots */}
      <div className="flex justify-center gap-1.5 pt-2">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              currentSlide === i ? 'w-6 bg-amber-400' : 'w-2 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Center visual & slide content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center my-8 space-y-6">
        <div className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${slide.color} p-0.5 shadow-2xl flex items-center justify-center ring-8 ring-slate-800/50`}>
          <div className="w-full h-full bg-slate-900/40 rounded-3xl backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-14 h-14 text-white drop-shadow" />
          </div>
        </div>

        <div className="space-y-2 max-w-xs">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">{slide.subtitle}</span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{slide.title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">{slide.description}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {currentSlide < slides.length - 1 ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('CREATE_FAMILY')}
              className="py-3 px-4 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Skip
            </button>
            <button
              onClick={() => setCurrentSlide((prev) => prev + 1)}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 text-xs flex items-center justify-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            <button
              onClick={() => setMode('CREATE_FAMILY')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-500/30 text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span>Create Family Space</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMode('JOIN_FAMILY')}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-700 text-xs transition-colors"
            >
              Join Existing Family with Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
