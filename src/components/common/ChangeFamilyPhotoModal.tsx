import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, Link, Check, RefreshCw, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.js';
import { uploadFileToCloud } from '../../utils/storage.js';

interface ChangeFamilyPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPhotoUrl?: string;
  onSave: (photoUrl: string) => Promise<boolean> | void;
}

const PRESET_FAMILY_PHOTOS = [
  {
    id: 'pixar_hero',
    name: '3D Pixar Family',
    url: '/family-hero.jpg',
    desc: 'Default 3D Animated Indian Family',
  },
  {
    id: 'login_art',
    name: 'Kinora Banner',
    url: '/assets/images/login-family-hero.png',
    desc: 'KinoraOne Brand Illustration',
  },
  {
    id: 'preset_cozy',
    name: 'Cozy Family',
    url: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
    desc: 'Warm Home Moment',
  },
  {
    id: 'preset_sunset',
    name: 'Outdoor Sunset',
    url: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=800',
    desc: 'Golden Hour Together',
  },
  {
    id: 'preset_joy',
    name: 'Happy Celebration',
    url: 'https://images.unsplash.com/photo-1581953970007-9880ab706e22?w=800',
    desc: 'Laughter & Joy',
  },
  {
    id: 'preset_modern',
    name: 'Modern Portrait',
    url: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800',
    desc: 'Clean & Elegant',
  },
];

export const ChangeFamilyPhotoModal: React.FC<ChangeFamilyPhotoModalProps> = ({
  isOpen,
  onClose,
  currentPhotoUrl,
  onSave,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const DEFAULT_URL = '/family-hero.jpg';
  const initialUrl = currentPhotoUrl || localStorage.getItem('onefamily_custom_hero_photo') || DEFAULT_URL;

  const [selectedPhoto, setSelectedPhoto] = useState<string>(initialUrl);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'PRESETS' | 'UPLOAD' | 'URL'>('PRESETS');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const active = currentPhotoUrl || localStorage.getItem('onefamily_custom_hero_photo') || DEFAULT_URL;
      setSelectedPhoto(active);
      setCustomUrlInput('');
      setUploadError('');
    }
  }, [isOpen, currentPhotoUrl]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setIsUploading(true);

    try {
      // 1. First convert to base64 for instant local display
      const reader = new FileReader();
      reader.onload = async () => {
        const localDataUrl = reader.result as string;
        setSelectedPhoto(localDataUrl);

        // 2. Stream upload to Supabase cloud storage bucket
        const uploadRes = await uploadFileToCloud(localDataUrl, 'famora-avatars', `family_hero_${Date.now()}.jpg`);
        if (uploadRes.success && uploadRes.url) {
          setSelectedPhoto(uploadRes.url);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Failed to read photo:', err);
      setUploadError('Failed to process image file. Please try another image.');
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!customUrlInput.trim()) return;
    setSelectedPhoto(customUrlInput.trim());
    setCustomUrlInput('');
  };

  const handleResetToDefault = async () => {
    setSelectedPhoto(DEFAULT_URL);
  };

  const handleSavePhoto = async () => {
    try {
      setIsSaving(true);
      await onSave(selectedPhoto);
      onClose();
    } catch (err) {
      console.error('Failed to save family photo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
      isLight ? 'bg-black/60' : 'bg-black/85'
    } backdrop-blur-md animate-fade-in select-none`}>
      <div className={`w-full max-w-md rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col ${
        isLight
          ? 'bg-[#FFF8F1] border-2 border-[#DEC8B2] text-[#1F1F1F]'
          : 'bg-[#07132B] border border-[#168BFF]/30 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-[#DEC8B2]' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
              isLight ? 'bg-orange-100 border-orange-200 text-[#E05318]' : 'bg-[#168BFF]/20 border-[#168BFF]/30 text-[#16C7F2]'
            }`}>
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-extrabold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Change Family Picture
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Shown on both Login screen and Home Hero banner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              isLight ? 'text-[#634B3F] hover:bg-[#F3E3D3] hover:text-[#1F1F1F]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Photo Preview Box */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold flex items-center justify-between">
            <span className={isLight ? 'text-[#1F1F1F]' : 'text-slate-300'}>Live Card Preview</span>
            <button
              type="button"
              onClick={handleResetToDefault}
              className={`text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                isLight ? 'text-[#E05318] hover:underline' : 'text-[#16C7F2] hover:underline'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset Default</span>
            </button>
          </div>

          <div className={`relative h-40 rounded-2xl overflow-hidden border shadow-inner flex items-center justify-center ${
            isLight ? 'bg-[#F3E3D3] border-[#DEC8B2]' : 'bg-[#030E22] border-[#168BFF]/30'
          }`}>
            <img
              src={selectedPhoto}
              alt="Family Preview"
              className="w-full h-full object-cover object-top transition-all duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_URL;
              }}
            />

            {/* Badge overlay preview */}
            <div className={`absolute top-2 right-2 flex items-center gap-0.5 px-2.5 py-1 rounded-full border shadow-sm ${
              isLight
                ? 'bg-[#FFF8F1]/95 backdrop-blur-xs border-[#EAD6C4] text-[#D3542F]'
                : 'bg-[#080D1A]/95 backdrop-blur-xs border-[#168BFF]/40 text-[#16C7F2]'
            }`}>
              <span className="font-serif italic font-bold text-[10px] tracking-tight">Better Together</span>
              <span className="text-[10px] font-bold">♡</span>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-bold">Uploading Photo...</span>
              </div>
            )}
          </div>
        </div>

        {/* Option Tabs */}
        <div className={`flex rounded-xl p-1 border text-xs font-bold ${
          isLight ? 'bg-[#F3E3D3] border-[#DEC8B2]' : 'bg-[#030E22] border-[#168BFF]/30'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('PRESETS')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'PRESETS'
                ? isLight
                  ? 'bg-[#E05318] text-white shadow-sm'
                  : 'bg-[#168BFF] text-white shadow-sm'
                : isLight
                ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Preset Art</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'UPLOAD'
                ? isLight
                  ? 'bg-[#E05318] text-white shadow-sm'
                  : 'bg-[#168BFF] text-white shadow-sm'
                : isLight
                ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('URL')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'URL'
                ? isLight
                  ? 'bg-[#E05318] text-white shadow-sm'
                  : 'bg-[#168BFF] text-white shadow-sm'
                : isLight
                ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Paste URL</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-[140px] space-y-3 scrollbar-none">
          {activeTab === 'PRESETS' && (
            <div className="grid grid-cols-3 gap-2">
              {PRESET_FAMILY_PHOTOS.map((preset) => {
                const isSelected = selectedPhoto === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPhoto(preset.url)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all text-left group ${
                      isSelected
                        ? isLight
                          ? 'border-[#E05318] ring-2 ring-[#E05318]/30'
                          : 'border-[#16C7F2] ring-2 ring-[#16C7F2]/30'
                        : isLight
                        ? 'border-[#DEC8B2] hover:border-[#E05318]/60'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="h-16 w-full relative">
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-full h-full object-cover object-top"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white bg-emerald-500 rounded-full p-0.5" />
                        </div>
                      )}
                    </div>
                    <div className={`p-1.5 text-[10px] leading-tight ${
                      isLight ? 'bg-[#FFF8F1]' : 'bg-[#08132B]'
                    }`}>
                      <div className={`font-bold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                        {preset.name}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'UPLOAD' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                  isLight
                    ? 'border-[#DEC8B2] hover:border-[#E05318] bg-[#F8EFE6]/60 hover:bg-[#F8EFE6]'
                    : 'border-slate-700 hover:border-cyan-400 bg-slate-900/50 hover:bg-slate-900'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  isLight ? 'bg-orange-100 border-orange-200 text-[#E05318]' : 'bg-[#168BFF]/20 border-[#168BFF]/30 text-[#16C7F2]'
                }`}>
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                    Click to choose photo from device / camera
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Supports JPG, PNG, WEBP (Auto-synced to family space)
                  </div>
                </div>
              </div>

              {uploadError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
                  {uploadError}
                </div>
              )}
            </div>
          )}

          {activeTab === 'URL' && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-slate-300'}`}>
                  Image URL / Web Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/family-photo.jpg"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl text-xs outline-none border transition-all ${
                      isLight
                        ? 'bg-[#F8EFE6] border-[#DEC8B2] text-[#1F1F1F] placeholder-[#8A6D5E] focus:border-[#E05318]'
                        : 'bg-[#030E22] border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    disabled={!customUrlInput.trim()}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-white transition-all ${
                      customUrlInput.trim()
                        ? isLight
                          ? 'bg-[#E05318] hover:bg-[#C2410C]'
                          : 'bg-[#168BFF] hover:bg-[#0A56C2]'
                        : 'bg-slate-400 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800/20 shrink-0">
          <button
            type="button"
            onClick={handleSavePhoto}
            disabled={isSaving || isUploading}
            className={`w-full py-3 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isSaving || isUploading ? 'opacity-70 cursor-wait' : ''
            } ${
              isLight
                ? 'bg-gradient-to-r from-[#FF8A3D] via-[#E05318] to-[#C2410C] hover:from-[#E05318] hover:to-[#B83808] border-t border-white/30 border-b-[3px] border-b-[#9A3412] shadow-lg shadow-orange-500/25 active:translate-y-0.5'
                : 'bg-gradient-to-r from-[#168BFF] via-[#2F80ED] to-[#7B2CBF] hover:from-[#168BFF] hover:to-[#9D4EDD] active:scale-[0.99] shadow-lg shadow-[#168BFF]/30'
            }`}
          >
            <Check className="w-4 h-4 text-white" />
            <span>{isSaving ? 'Saving Family Picture...' : 'Save Family Picture'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-1.5 text-center text-xs font-medium transition-colors cursor-pointer ${
              isLight ? 'text-[#634B3F] hover:text-[#1F1F1F]' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
