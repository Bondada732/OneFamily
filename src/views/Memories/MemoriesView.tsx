import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { Memory, VoiceMemory } from '../../types/index.js';
import { formatDate } from '../../utils/formatters.js';
import { Heart, Mic, BookOpen, Camera, Play, Pause, Plus, Volume2, Globe2, Sparkles, MapPin, Calendar } from 'lucide-react';

export const MemoriesView: React.FC = () => {
  const { family, activeLanguage, hasPermission, currentUser } = useAuth();
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'ALBUMS' | 'VOICE' | 'YEARBOOK'>('ALBUMS');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [voiceMemories, setVoiceMemories] = useState<VoiceMemory[]>([]);
  const [yearbook, setYearbook] = useState<any>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<'ORIGINAL' | 'HINDI' | 'TELUGU'>('ORIGINAL');

  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showRecordVoice, setShowRecordVoice] = useState(false);

  const [newMemory, setNewMemory] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    album: 'Family Vacation',
    description: '',
  });

  const canUploadMemory = hasPermission('MEMORY_UPLOAD');

  useEffect(() => {
    if (!family?.id) return;
    const loadMemories = async () => {
      try {
        const [memData, yrData] = await Promise.all([
          apiRequest(`/memories/${family.id}/memories`),
          apiRequest(`/memories/${family.id}/yearbook/2026`),
        ]);
        setMemories(memData.memories || []);
        setVoiceMemories(memData.voiceMemories || []);
        setYearbook(yrData);
      } catch (err) {
        console.error('Failed to load memories:', err);
      }
    };
    loadMemories();
  }, [family?.id, currentUser?.id]);

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest(`/memories/${family?.id}/memories`, {
        method: 'POST',
        body: JSON.stringify(newMemory),
      });
      setMemories([
        {
          ...created,
          photosList: ['https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800'],
          taggedMembersList: [currentUser?.name || 'Sharma Family'],
        },
        ...memories,
      ]);
      setShowAddMemory(false);
      setNewMemory({
        title: '',
        date: new Date().toISOString().split('T')[0],
        location: '',
        album: 'Family Vacation',
        description: '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Family Memory Vault</h2>
          <p className="text-xs text-slate-400">Timelines, grandparent voice stories & yearbooks</p>
        </div>
        {canUploadMemory && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowRecordVoice(true)}
              className="p-2 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-xl border border-purple-500/40 text-xs flex items-center gap-1 font-semibold"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice</span>
            </button>
            <button
              onClick={() => setShowAddMemory(true)}
              className="p-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-md"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Memory</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80">
        <button
          onClick={() => setActiveSubTab('ALBUMS')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'ALBUMS' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Photo Timelines
        </button>
        <button
          onClick={() => setActiveSubTab('VOICE')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'VOICE' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          Grandparent Stories
        </button>
        <button
          onClick={() => setActiveSubTab('YEARBOOK')}
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'YEARBOOK' ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md' : 'text-slate-400'
          }`}
        >
          2026 Yearbook
        </button>
      </div>

      {/* 1. PHOTO TIMELINES */}
      {activeSubTab === 'ALBUMS' && (
        <div className="space-y-4">
          {memories.map((mem) => (
            <div key={mem.id} className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">{mem.title}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5">
                    <span>📅 {formatDate(mem.date)}</span>
                    {mem.location && <span>📍 {mem.location}</span>}
                  </div>
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {mem.album}
                </span>
              </div>

              {/* Photos Gallery Horizontal Scroll */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {mem.photosList?.map((photo, i) => (
                  <div key={i} className="min-w-[200px] h-36 rounded-2xl overflow-hidden border border-slate-700 shrink-0">
                    <img src={photo} alt="Story" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              {mem.description && (
                <p className="text-xs text-slate-300 leading-relaxed italic">{mem.description}</p>
              )}

              {mem.taggedMembersList && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-1 border-t border-slate-700/60">
                  <span>Tagged:</span>
                  <span className="text-amber-300 font-semibold">{mem.taggedMembersList.join(', ')}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2. GRANDPARENT VOICE MEMORIES */}
      {activeSubTab === 'VOICE' && (
        <div className="space-y-3">
          <div className="p-4 rounded-3xl bg-purple-950/40 border border-purple-500/30 space-y-2">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
              <Mic className="w-4 h-4" />
              <span>Oral History & Family Wisdom</span>
            </div>
            <p className="text-xs text-slate-300">
              Preserve life stories and advice from grandparents with audio recordings, auto-transcription, and translations.
            </p>
          </div>

          <div className="space-y-3">
            {voiceMemories.map((vm) => {
              const isPlaying = playingVoiceId === vm.id;
              return (
                <div key={vm.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setPlayingVoiceId(isPlaying ? null : vm.id)}
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                          isPlaying
                            ? 'bg-amber-400 text-slate-900 animate-pulse'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </button>
                      <div>
                        <div className="text-xs font-bold text-white">{vm.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {vm.speaker_name} ({vm.speaker_relationship}) • {vm.duration_seconds}s
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Language switch tabs for transcript */}
                  <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 text-[10px]">
                    <button
                      onClick={() => setSelectedLanguageTab('ORIGINAL')}
                      className={`px-2 py-0.5 rounded-lg font-bold ${
                        selectedLanguageTab === 'ORIGINAL' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      English
                    </button>
                    {vm.translation_hindi && (
                      <button
                        onClick={() => setSelectedLanguageTab('HINDI')}
                        className={`px-2 py-0.5 rounded-lg font-bold ${
                          selectedLanguageTab === 'HINDI' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        हिन्दी (Hindi)
                      </button>
                    )}
                    {vm.translation_telugu && (
                      <button
                        onClick={() => setSelectedLanguageTab('TELUGU')}
                        className={`px-2 py-0.5 rounded-lg font-bold ${
                          selectedLanguageTab === 'TELUGU' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                        }`}
                      >
                        తెలుగు (Telugu)
                      </button>
                    )}
                  </div>

                  {/* Transcription Content */}
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-200 leading-relaxed italic">
                    "{selectedLanguageTab === 'HINDI' && vm.translation_hindi
                      ? vm.translation_hindi
                      : selectedLanguageTab === 'TELUGU' && vm.translation_telugu
                      ? vm.translation_telugu
                      : vm.transcript}"
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. YEARBOOK SUBTAB */}
      {activeSubTab === 'YEARBOOK' && yearbook && (
        <div className="space-y-4">
          {/* Yearbook Hero Book Cover */}
          <div className="p-5 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-slate-900 to-indigo-950/80 border border-amber-500/30 text-center space-y-3 shadow-2xl">
            <span className="text-3xl">📖</span>
            <h3 className="text-lg font-extrabold text-white">{yearbook.title}</h3>
            <p className="text-xs text-slate-300 max-w-xs mx-auto">
              Curated review of Sharma Family achievements, trips, birthdays, and savings milestones.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 text-left">
              <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase">Tasks Completed</span>
                <div className="text-sm font-bold text-emerald-400">{yearbook.familyGrowthMetrics?.tasksCompleted}</div>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase">Savings Added</span>
                <div className="text-sm font-bold text-amber-400">{yearbook.familyGrowthMetrics?.goalsProgressed}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">2026 Milestone Timeline</span>
            {yearbook.milestones?.map((m: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-3">
                <div className="text-xs font-bold text-amber-400 w-20 shrink-0">{m.month}</div>
                <div className="text-xs text-slate-200">{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Memory Modal */}
      {showAddMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Save Family Memory</h3>
            <form onSubmit={handleSaveMemory} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Picnic at Golconda Fort"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Date</label>
                  <input
                    type="date"
                    value={newMemory.date}
                    onChange={(e) => setNewMemory({ ...newMemory, date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={newMemory.location}
                    onChange={(e) => setNewMemory({ ...newMemory, location: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Description / Story</label>
                <textarea
                  rows={3}
                  placeholder="What made this moment special for our family?"
                  value={newMemory.description}
                  onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemory(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Voice Memory Modal */}
      {showRecordVoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-bold text-white">Record Grandparent Voice Story</h3>
            <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center animate-pulse">
              <Mic className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-300">
              Recording in high-definition audio with automated multilingual speech-to-text...
            </p>
            <button
              onClick={() => {
                alert('Simulated voice memory saved with transcript & translations!');
                setShowRecordVoice(false);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
            >
              Finish & Save Voice Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
