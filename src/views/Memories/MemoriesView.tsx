import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { Memory, VoiceMemory } from '../../types/index.js';
import { formatDate, getLocalDateString } from '../../utils/formatters.js';
import { CustomDatePicker } from '../../components/common/CustomDatePicker.js';
import { uploadFileToCloud } from '../../utils/storage.js';
import { Heart, Mic, BookOpen, Camera, Play, Pause, Plus, Volume2, Globe2, Sparkles, MapPin, Calendar, Image as ImageIcon, Video, Upload, X, Film, Eye, AlertCircle, Loader2, CheckCircle2, Trash2, Edit3, AlertTriangle } from 'lucide-react';

const MEMORY_ALBUMS = [
  'Family Vacation',
  'Diwali Gathering',
  'Birthday Party',
  'Marriage Anniversary',
  'Engagement',
  'Family Reunion',
  'Festival & Puja',
  'Road Trip',
  'School / College Milestone',
  'Weekend Outing',
  'Other Moments',
];

/**
 * Maximum size for direct video upload (12MB) to prevent Android WebView Out-Of-Memory SIGKILL crashes
 */
const MAX_VIDEO_BYTES = 12 * 1024 * 1024;

/**
 * Client-side media processor: scales photos to max 1280px and validates video size to prevent OOM crashes
 */
const processMediaFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 1. If Video file, enforce 12MB limit to protect mobile memory
    if (file.type.startsWith('video/')) {
      if (file.size > MAX_VIDEO_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        reject(
          new Error(
            `Video "${file.name}" is ${sizeMb}MB. Maximum direct upload size is 12MB to keep app fast and prevent mobile crashes. For longer videos, you can paste a YouTube or Google Drive link.`
          )
        );
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target?.result as string);
      reader.onerror = () => reject(new Error(`Failed to read video "${file.name}"`));
      reader.readAsDataURL(file);
      return;
    }

    // 2. If Image file, compress with canvas to max 1280px (reduces size from 5-10MB down to ~150KB)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1280;
          const maxHeight = 1280;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.82));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = () => resolve(event.target?.result as string);
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error(`Failed to read photo "${file.name}"`));
      reader.readAsDataURL(file);
      return;
    }

    // 3. Fallback for any other media
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const getEmbedVideoUrl = (url: string): string | null => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  }
  const gdMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdMatch && gdMatch[1]) {
    return `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
  }
  return null;
};

export const MemoriesView: React.FC = () => {
  const { family, activeLanguage, hasPermission, currentUser } = useAuth();
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'ALBUMS' | 'VOICE' | 'YEARBOOK'>('ALBUMS');
  const [memories, setMemories] = useState<Memory[]>([]);
  const [voiceMemories, setVoiceMemories] = useState<VoiceMemory[]>([]);
  const [yearbook, setYearbook] = useState<any>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [selectedLanguageTab, setSelectedLanguageTab] = useState<'ORIGINAL' | 'HINDI' | 'TELUGU'>('ORIGINAL');

  // Add Memory Modal State
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showRecordVoice, setShowRecordVoice] = useState(false);
  const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; title?: string; memoryId?: string; photoIndex?: number } | null>(null);

  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [videoLinkInput, setVideoLinkInput] = useState('');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [newMemory, setNewMemory] = useState({
    title: '',
    date: getLocalDateString(),
    location: '',
    album: 'Family Vacation',
    description: '',
  });

  // Edit Memory Modal State
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    date: getLocalDateString(),
    location: '',
    album: 'Family Vacation',
    description: '',
  });
  const [editSelectedMedia, setEditSelectedMedia] = useState<string[]>([]);
  const [editVideoLinkInput, setEditVideoLinkInput] = useState('');
  const [isEditingProcessingMedia, setIsEditingProcessingMedia] = useState(false);
  const [isEditingSaving, setIsEditingSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const editGalleryInputRef = useRef<HTMLInputElement>(null);
  const editCameraInputRef = useRef<HTMLInputElement>(null);
  const editVideoInputRef = useRef<HTMLInputElement>(null);

  // Delete Memory State
  const [deletingMemory, setDeletingMemory] = useState<Memory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canUploadMemory = hasPermission('MEMORY_UPLOAD');
  const canDeleteMemory = hasPermission('MEMORY_DELETE');

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

  const handleMediaFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingMedia(true);
    setSaveError('');
    try {
      const promises = Array.from(files).map((file) => processMediaFile(file));
      const results = await Promise.all(promises);
      setSelectedMedia((prev) => [...prev, ...results]);
    } catch (err: any) {
      console.error('Failed to process media files:', err);
      setSaveError(err?.message || 'Failed to process uploaded media. Please try again.');
    } finally {
      setIsProcessingMedia(false);
      e.target.value = '';
    }
  };

  const handleEditMediaFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsEditingProcessingMedia(true);
    setEditError('');
    try {
      const promises = Array.from(files).map((file) => processMediaFile(file));
      const results = await Promise.all(promises);
      setEditSelectedMedia((prev) => [...prev, ...results]);
    } catch (err: any) {
      console.error('Failed to process edit media files:', err);
      setEditError(err?.message || 'Failed to process uploaded media. Please try again.');
    } finally {
      setIsEditingProcessingMedia(false);
      e.target.value = '';
    }
  };

  const handleAddVideoLink = () => {
    const trimmed = videoLinkInput.trim();
    if (!trimmed) return;
    setSelectedMedia((prev) => [...prev, trimmed]);
    setVideoLinkInput('');
  };

  const handleAddEditVideoLink = () => {
    const trimmed = editVideoLinkInput.trim();
    if (!trimmed) return;
    setEditSelectedMedia((prev) => [...prev, trimmed]);
    setEditVideoLinkInput('');
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveEditMedia = (index: number) => {
    setEditSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const isVideoMedia = (url: string) => {
    if (!url) return false;
    return (
      url.startsWith('data:video') ||
      url.includes('.mp4') ||
      url.includes('.webm') ||
      url.includes('.mov') ||
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('drive.google.com') ||
      url.includes('vimeo.com')
    );
  };

  const handleOpenEdit = (mem: Memory) => {
    setEditingMemory(mem);
    setEditFormData({
      title: mem.title || '',
      date: mem.date || getLocalDateString(),
      location: mem.location || '',
      album: mem.album || 'Family Vacation',
      description: mem.description || '',
    });
    setEditSelectedMedia(mem.photosList || (typeof mem.photos === 'string' ? JSON.parse(mem.photos || '[]') : mem.photos) || []);
    setEditError('');
  };

  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.title.trim()) {
      setSaveError('Please enter a title for the memory.');
      return;
    }
    if (!family?.id) {
      setSaveError('No active family session found. Please refresh or sign in again.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      // Upload any local base64 media items to Supabase Cloud Storage (famora-memories)
      const cloudMediaList = await Promise.all(
        selectedMedia.map(async (media, idx) => {
          if (media.startsWith('data:')) {
            const uploadRes = await uploadFileToCloud(
              media,
              'famora-memories',
              `memory_${Date.now()}_${idx}.jpg`
            );
            return uploadRes.success && uploadRes.url ? uploadRes.url : media;
          }
          return media;
        })
      );

      const created = await apiRequest(`/memories/${family.id}/memories`, {
        method: 'POST',
        body: JSON.stringify({
          ...newMemory,
          photos: cloudMediaList,
          tagged_members: [currentUser?.name || family?.name || 'Our Family'],
        }),
      });

      setMemories((prev) => [
        {
          ...created,
          photosList: cloudMediaList,
          taggedMembersList: [currentUser?.name || family?.name || 'Our Family'],
        },
        ...prev,
      ]);
      setShowAddMemory(false);
      setNewMemory({
        title: '',
        date: getLocalDateString(),
        location: '',
        album: 'Family Vacation',
        description: '',
      });
      setSelectedMedia([]);
    } catch (err: any) {
      console.error('Failed to save memory:', err);
      setSaveError(err?.message || 'Failed to save memory. Please check details and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemory || !family?.id) return;
    if (!editFormData.title.trim()) {
      setEditError('Please enter a title for the memory.');
      return;
    }

    setIsEditingSaving(true);
    setEditError('');
    try {
      // Upload any local base64 media items to Supabase Cloud Storage (famora-memories)
      const cloudMediaList = await Promise.all(
        editSelectedMedia.map(async (media, idx) => {
          if (media.startsWith('data:')) {
            const uploadRes = await uploadFileToCloud(
              media,
              'famora-memories',
              `memory_edit_${Date.now()}_${idx}.jpg`
            );
            return uploadRes.success && uploadRes.url ? uploadRes.url : media;
          }
          return media;
        })
      );

      await apiRequest(`/memories/${family.id}/memories/${editingMemory.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: editFormData.title.trim(),
          date: editFormData.date,
          location: editFormData.location.trim(),
          album: editFormData.album,
          description: editFormData.description.trim(),
          photos: cloudMediaList,
        }),
      });

      setMemories((prev) =>
        prev.map((m) =>
          m.id === editingMemory.id
            ? {
                ...m,
                title: editFormData.title.trim(),
                date: editFormData.date,
                location: editFormData.location.trim(),
                album: editFormData.album,
                description: editFormData.description.trim(),
                photosList: cloudMediaList,
                photos: JSON.stringify(cloudMediaList),
              }
            : m
        )
      );
      setEditingMemory(null);
    } catch (err: any) {
      console.error('Failed to update memory:', err);
      setEditError(err?.message || 'Failed to update memory. Please try again.');
    } finally {
      setIsEditingSaving(false);
    }
  };

  const handleDeleteSinglePhoto = async (memId: string, photoIdx: number) => {
    if (!family?.id) return;
    const target = memories.find((m) => m.id === memId);
    if (!target) return;

    const currentPhotos = target.photosList || [];
    if (currentPhotos.length <= 1) {
      if (!confirm('This is the only photo in this memory. Deleting it will leave the memory with 0 photos. Do you want to proceed?')) {
        return;
      }
    }

    const updatedPhotos = currentPhotos.filter((_, idx) => idx !== photoIdx);
    try {
      await apiRequest(`/memories/${family.id}/memories/${memId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          photos: updatedPhotos,
        }),
      });

      setMemories((prev) =>
        prev.map((m) => (m.id === memId ? { ...m, photosList: updatedPhotos, photos: JSON.stringify(updatedPhotos) } : m))
      );

      if (lightboxMedia && lightboxMedia.memoryId === memId) {
        setLightboxMedia(null);
      }
    } catch (err: any) {
      console.error('Failed to delete photo:', err);
      alert(err?.message || 'Failed to delete photo.');
    }
  };

  const handleDeleteMemory = async (memId: string) => {
    if (!family?.id) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/memories/${family.id}/memories/${memId}`, {
        method: 'DELETE',
      });
      setMemories((prev) => prev.filter((m) => m.id !== memId));
      setDeletingMemory(null);
      if (editingMemory?.id === memId) {
        setEditingMemory(null);
      }
    } catch (err: any) {
      console.error('Failed to delete memory:', err);
      alert(err?.message || 'Failed to delete memory.');
    } finally {
      setIsDeleting(false);
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
          {memories.length > 0 ? (
            memories.map((mem) => (
              <div key={mem.id} className="p-4 rounded-3xl bg-slate-800/90 border border-slate-700/80 space-y-3 shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-white truncate">{mem.title}</h3>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-0.5 flex-wrap">
                      <span>📅 {formatDate(mem.date)}</span>
                      {mem.location && <span>📍 {mem.location}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2.5 py-1 rounded-full border border-indigo-500/30">
                      {mem.album}
                    </span>
                    {canUploadMemory && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(mem)}
                        className="p-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-600/80 transition-all shadow-sm"
                        title="Edit Memory & Photos"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDeleteMemory && (
                      <button
                        type="button"
                        onClick={() => setDeletingMemory(mem)}
                        className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/30 transition-all shadow-sm"
                        title="Delete Memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photos & Videos Gallery Horizontal Scroll */}
                {mem.photosList && mem.photosList.length > 0 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                    {mem.photosList.map((media, i) => {
                      const isVid = isVideoMedia(media);
                      return (
                        <div
                          key={i}
                          className="relative min-w-[220px] max-w-[260px] h-40 rounded-2xl overflow-hidden border border-slate-700 shrink-0 bg-slate-950 group shadow-md"
                        >
                          <div
                            onClick={() => setLightboxMedia({ url: media, type: isVid ? 'video' : 'image', title: mem.title, memoryId: mem.id, photoIndex: i })}
                            className="w-full h-full cursor-pointer"
                          >
                            {isVid ? (
                              <div className="w-full h-full relative flex items-center justify-center bg-black">
                                <video src={media} className="w-full h-full object-cover opacity-80" preload="metadata" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                                  <div className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg">
                                    <Play className="w-5 h-5 ml-0.5 fill-current" />
                                  </div>
                                </div>
                                <span className="absolute bottom-2 left-2 text-[9px] bg-slate-900/90 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                  <Film className="w-3 h-3" /> VIDEO
                                </span>
                              </div>
                            ) : (
                              <img
                                src={media}
                                alt="Story"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            )}
                            <div className="absolute bottom-2 right-2 bg-slate-900/80 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-3.5 h-3.5 text-white" />
                            </div>
                          </div>

                          {/* Quick Delete Single Photo/Video Button */}
                          {canUploadMemory && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSinglePhoto(mem.id, i);
                              }}
                              className="absolute top-2 right-2 bg-rose-600/90 hover:bg-rose-500 text-white p-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                              title="Delete this photo/video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

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
            ))
          ) : (
            <div className="p-8 text-center rounded-3xl bg-slate-800/60 border border-dashed border-slate-700 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">No Family Memories Yet</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Start capturing family vacations, celebrations, and precious moments to cherish forever.
                </p>
              </div>
              {canUploadMemory && (
                <button
                  onClick={() => setShowAddMemory(true)}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition-opacity inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Memory</span>
                </button>
              )}
            </div>
          )}
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
              Curated review of {family?.name || 'our family'} achievements, trips, birthdays, and savings milestones.
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Save Family Memory</h3>
                <p className="text-[11px] text-slate-400">Add photos, video clips, and cherish family moments forever</p>
              </div>
              <button onClick={() => setShowAddMemory(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            {/* Hidden native file inputs for Gallery & Camera */}
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleMediaFilesSelected}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleMediaFilesSelected}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleMediaFilesSelected}
              accept="video/*"
              capture="environment"
              className="hidden"
            />

            {saveError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            {isProcessingMedia && (
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                <span>Optimizing photos for crisp display and fast upload...</span>
              </div>
            )}

            <form onSubmit={handleSaveMemory} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Picnic at Golconda Fort"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory({ ...newMemory, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Photos & Videos Upload Area */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Upload Photos & Videos ({selectedMedia.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Gallery or Camera</span>
                </div>

                {/* Upload action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={isProcessingMedia || isSaving}
                    className="p-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-indigo-300" />
                    <span>From Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isProcessingMedia || isSaving}
                    className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Take Snap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isProcessingMedia || isSaving}
                    className="p-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Video className="w-4 h-4 text-purple-300" />
                    <span>Record Clip (≤12MB)</span>
                  </button>
                </div>

                {/* Video Link / Cloud Storage input */}
                <div className="pt-1.5 flex gap-1.5">
                  <input
                    type="url"
                    placeholder="Or paste YouTube / Google Drive / MP4 Link"
                    value={videoLinkInput}
                    onChange={(e) => setVideoLinkInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-white outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddVideoLink}
                    disabled={!videoLinkInput.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold shrink-0 transition-colors"
                  >
                    + Add Link
                  </button>
                </div>

                {/* Selected Media Preview Grid */}
                {selectedMedia.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Selected Media Preview</span>
                    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                      {selectedMedia.map((media, idx) => {
                        const isVid = isVideoMedia(media);
                        return (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-600 aspect-video bg-black">
                            {isVid ? (
                              <video src={media} className="w-full h-full object-cover opacity-80" />
                            ) : (
                              <img src={media} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-1 left-1">
                              {isVid ? (
                                <span className="bg-purple-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">VIDEO</span>
                              ) : (
                                <span className="bg-indigo-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">PHOTO</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(idx)}
                              className="absolute top-1 right-1 bg-rose-600/90 text-white p-1 rounded-full hover:bg-rose-500 shadow transition-colors"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomDatePicker
                    label="Date"
                    value={newMemory.date}
                    onChange={(newDate) => setNewMemory({ ...newMemory, date: newDate })}
                    className="!bg-slate-800 !border-slate-700 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={newMemory.location}
                    onChange={(e) => setNewMemory({ ...newMemory, location: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Album / Occasion Category</label>
                <select
                  value={newMemory.album}
                  onChange={(e) => setNewMemory({ ...newMemory, album: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                >
                  {MEMORY_ALBUMS.map((alb) => (
                    <option key={alb} value={alb}>
                      {alb}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Description / Story</label>
                <textarea
                  rows={2}
                  placeholder="What made this moment special for our family?"
                  value={newMemory.description}
                  onChange={(e) => setNewMemory({ ...newMemory, description: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMemory(false)}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isProcessingMedia}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Story</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">✏️</span>
                <div>
                  <h3 className="text-base font-bold text-white">Edit Family Memory</h3>
                  <p className="text-[11px] text-slate-400">Update details, add or delete photos/videos</p>
                </div>
              </div>
              <button onClick={() => setEditingMemory(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            {/* Hidden native file inputs for Gallery & Camera in Edit Mode */}
            <input
              type="file"
              ref={editGalleryInputRef}
              onChange={handleEditMediaFilesSelected}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={editCameraInputRef}
              onChange={handleEditMediaFilesSelected}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
            <input
              type="file"
              ref={editVideoInputRef}
              onChange={handleEditMediaFilesSelected}
              accept="video/*"
              capture="environment"
              className="hidden"
            />

            {editError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {isEditingProcessingMedia && (
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                <span>Optimizing photos for crisp display and fast upload...</span>
              </div>
            )}

            <form onSubmit={handleUpdateMemory} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Weekend Picnic at Golconda Fort"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              {/* Photos & Videos Section */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Memory Photos & Videos ({editSelectedMedia.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Click ✕ to remove any photo</span>
                </div>

                {/* Upload action buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => editGalleryInputRef.current?.click()}
                    disabled={isEditingProcessingMedia || isEditingSaving}
                    className="p-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 text-indigo-300" />
                    <span>From Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => editCameraInputRef.current?.click()}
                    disabled={isEditingProcessingMedia || isEditingSaving}
                    className="p-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Take Snap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => editVideoInputRef.current?.click()}
                    disabled={isEditingProcessingMedia || isEditingSaving}
                    className="p-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Video className="w-4 h-4 text-purple-300" />
                    <span>Record Clip (≤12MB)</span>
                  </button>
                </div>

                {/* Video Link / Cloud Storage input in Edit Modal */}
                <div className="pt-1.5 flex gap-1.5">
                  <input
                    type="url"
                    placeholder="Or paste YouTube / Google Drive / MP4 Link"
                    value={editVideoLinkInput}
                    onChange={(e) => setEditVideoLinkInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-[11px] text-white outline-none focus:border-purple-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditVideoLink}
                    disabled={!editVideoLinkInput.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-[11px] font-bold shrink-0 transition-colors"
                  >
                    + Add Link
                  </button>
                </div>

                {/* Selected Media Grid with individual delete button */}
                {editSelectedMedia.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Media Preview ({editSelectedMedia.length})</span>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {editSelectedMedia.map((media, idx) => {
                        const isVid = isVideoMedia(media);
                        return (
                          <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-600 aspect-video bg-black shadow">
                            {isVid ? (
                              <video src={media} className="w-full h-full object-cover opacity-80" />
                            ) : (
                              <img src={media} alt="Preview" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute top-1 left-1">
                              {isVid ? (
                                <span className="bg-purple-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">VIDEO</span>
                              ) : (
                                <span className="bg-indigo-600/90 text-white text-[8px] font-bold px-1 py-0.5 rounded">PHOTO</span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveEditMedia(idx)}
                              className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-full shadow-lg transition-transform hover:scale-110"
                              title="Delete this photo/video"
                            >
                              <X className="w-3 h-3 stroke-[3]" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                    No photos or videos attached yet. Click above to add some.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomDatePicker
                    label="Date"
                    value={editFormData.date}
                    onChange={(newDate) => setEditFormData({ ...editFormData, date: newDate })}
                    className="!bg-slate-800 !border-slate-700 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Hyderabad"
                    value={editFormData.location}
                    onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Album / Occasion Category</label>
                <select
                  value={editFormData.album}
                  onChange={(e) => setEditFormData({ ...editFormData, album: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                >
                  {MEMORY_ALBUMS.map((alb) => (
                    <option key={alb} value={alb}>
                      {alb}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Description / Story</label>
                <textarea
                  rows={2}
                  placeholder="What made this moment special for our family?"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                {canDeleteMemory && (
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingMemory(editingMemory);
                    }}
                    className="px-3 py-2.5 bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Memory</span>
                  </button>
                )}

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingMemory(null)}
                    disabled={isEditingSaving}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditingSaving || isEditingProcessingMedia}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {isEditingSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Memory Confirmation Modal */}
      {deletingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Memory?</h3>
              <p className="text-xs text-slate-300 mt-1.5">
                Are you sure you want to permanently delete <strong className="text-white">"{deletingMemory.title}"</strong>?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                All photos and videos in this memory will be removed.
              </p>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingMemory(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMemory(deletingMemory.id)}
                disabled={isDeleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
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

      {/* Full-size Lightbox Modal */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxMedia(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 bg-slate-900/90 border-b border-slate-800">
              <span className="text-xs font-bold text-white">{lightboxMedia.title || 'Memory Media'}</span>
              <div className="flex items-center gap-2">
                {lightboxMedia.memoryId !== undefined && lightboxMedia.photoIndex !== undefined && canUploadMemory && (
                  <button
                    type="button"
                    onClick={() => handleDeleteSinglePhoto(lightboxMedia.memoryId!, lightboxMedia.photoIndex!)}
                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1 transition-colors"
                    title="Delete this photo/video"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Photo</span>
                  </button>
                )}
                <button
                  onClick={() => setLightboxMedia(null)}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 bg-black min-h-[300px]">
              {lightboxMedia.type === 'video' ? (
                (() => {
                  const embed = getEmbedVideoUrl(lightboxMedia.url);
                  if (embed) {
                    return (
                      <iframe
                        src={embed}
                        title="Video Player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-[65vh] rounded-2xl border-0 shadow-lg"
                      />
                    );
                  }
                  return (
                    <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[70vh] rounded-2xl shadow-lg" />
                  );
                })()
              ) : (
                <img src={lightboxMedia.url} alt="Memory" className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
