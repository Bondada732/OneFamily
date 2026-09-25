import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Heart,
  Calendar,
  Bell,
  Sparkles,
  AlertTriangle,
  Users,
  Lock,
  Globe,
} from 'lucide-react';
import { CustomDatePicker } from '../common/CustomDatePicker.js';
import { apiRequest } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { FamilyContact } from '../../types/index.js';
import { uploadFileToCloud } from '../../utils/storage.js';

interface AddPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editContact?: FamilyContact | null; // If provided, acts as Edit Modal
}

const RELATIONSHIP_CHOICES = [
  'Uncle',
  'Aunt',
  'Cousin',
  'Friend',
  'Father',
  'Mother',
  'Husband',
  'Wife',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Colleague',
  'Neighbor',
  'Other',
];

const OCCASION_TYPES = [
  { id: 'BIRTHDAY', label: '🎂 Birthday' },
  { id: 'MARRIAGE_ANNIVERSARY', label: '💍 Marriage Anniversary' },
  { id: 'ENGAGEMENT_ANNIVERSARY', label: '💐 Engagement Anniversary' },
  { id: 'GRADUATION_ANNIVERSARY', label: '🎓 Graduation Day' },
  { id: 'OTHER', label: '⭐ Other Special Occasion' },
];

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editContact,
}) => {
  const { family } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isEditing = Boolean(editContact && editContact.id);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [relationship, setRelationship] = useState('Uncle');
  const [customRelationship, setCustomRelationship] = useState('');
  const [notes, setNotes] = useState('');
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Occasion States
  const [occasionType, setOccasionType] = useState('BIRTHDAY');
  const [customOccasionName, setCustomOccasionName] = useState('');
  const [occasionDate, setOccasionDate] = useState('1990-09-25');
  const [knowYear, setKnowYear] = useState(true);
  const [originalYear, setOriginalYear] = useState('1990');
  const [reminderDaysBefore, setReminderDaysBefore] = useState(5);
  const [existingOccasionId, setExistingOccasionId] = useState<string | null>(null);

  // Pre-fill on open or edit
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');

      if (editContact) {
        setName(editContact.name || '');
        setPhotoUrl(editContact.photo_url || '');
        const phone = editContact.mobile_number || '';
        if (phone.includes(' ')) {
          const parts = phone.split(' ');
          setCountryCode(parts[0] || '+91');
          setMobileNumber(parts.slice(1).join(' '));
        } else {
          setCountryCode('+91');
          setMobileNumber(phone);
        }
        if (RELATIONSHIP_CHOICES.includes(editContact.relationship)) {
          setRelationship(editContact.relationship);
          setCustomRelationship('');
        } else {
          setRelationship('Other');
          setCustomRelationship(editContact.relationship || '');
        }
        setNotes(editContact.notes || '');

        const primaryOcc = editContact.occasions?.[0];
        if (primaryOcc) {
          setExistingOccasionId(primaryOcc.id);
          setOccasionType(primaryOcc.occasion_type || 'BIRTHDAY');
          setCustomOccasionName(primaryOcc.custom_occasion_name || '');
          setOccasionDate(primaryOcc.occasion_date || '1990-09-25');
          setKnowYear(Boolean(primaryOcc.original_year));
          setOriginalYear(primaryOcc.original_year ? String(primaryOcc.original_year) : '');
          setReminderDaysBefore(primaryOcc.reminder_days_before ?? 5);
        }
      } else {
        setName('');
        setPhotoUrl('');
        setMobileNumber('');
        setCountryCode('+91');
        setRelationship('Uncle');
        setCustomRelationship('');
        setNotes('');
        setOccasionType('BIRTHDAY');
        setCustomOccasionName('');
        setOccasionDate('1990-09-25');
        setKnowYear(true);
        setOriginalYear('1990');
        setReminderDaysBefore(5);
        setExistingOccasionId(null);
      }
    }
  }, [isOpen, editContact]);

  if (!isOpen) return null;

  const getInitials = (str: string) => {
    if (!str.trim()) return '👤';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!family?.id) return;
    if (!name.trim()) {
      setErrorMsg("Please enter the person's name.");
      return;
    }
    if (!occasionDate) {
      setErrorMsg('Please select an occasion date.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const fullPhone = mobileNumber.trim() ? `${countryCode} ${mobileNumber.trim()}` : '';
      const finalRel = relationship === 'Other' && customRelationship.trim() ? customRelationship.trim() : relationship;

      let dateString = occasionDate;
      let finalYear: number | undefined = undefined;

      if (knowYear && originalYear) {
        const y = parseInt(originalYear, 10);
        if (y > 1900 && y < 2100) {
          finalYear = y;
          const dateParts = occasionDate.split('-');
          if (dateParts.length >= 2) {
            const m = dateParts[dateParts.length - 2];
            const d = dateParts[dateParts.length - 1];
            dateString = `${y}-${m}-${d}`;
          }
        }
      }

      let finalPhotoUrl = photoUrl;
      if (photoUrl && photoUrl.startsWith('data:')) {
        const uploadRes = await uploadFileToCloud(
          photoUrl,
          'famora-memories',
          `contact_${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
        );
        if (uploadRes.success && uploadRes.url) {
          finalPhotoUrl = uploadRes.url;
        }
      }

      if (isEditing && editContact) {
        // 1. Update Contact
        await apiRequest(`/family-reminders/${family.id}/contacts/${editContact.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: name.trim(),
            photo_url: finalPhotoUrl,
            mobile_number: fullPhone,
            relationship: finalRel,
            notes: notes.trim(),
            occasion: {
              id: existingOccasionId,
              occasion_type: occasionType,
              custom_occasion_name: occasionType === 'OTHER' ? customOccasionName.trim() : '',
              occasion_date: dateString,
              original_year: finalYear,
              reminder_days_before: reminderDaysBefore,
            },
          }),
        });
      } else {
        // 2. Create New Contact + Occasion
        await apiRequest(`/family-reminders/${family.id}/contacts`, {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            photo_url: finalPhotoUrl,
            mobile_number: fullPhone,
            relationship: finalRel,
            notes: notes.trim(),
            occasion: {
              occasion_type: occasionType,
              custom_occasion_name: occasionType === 'OTHER' ? customOccasionName.trim() : '',
              occasion_date: dateString,
              original_year: finalYear,
              reminder_days_before: reminderDaysBefore,
            },
          }),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save contact:', err);
      setErrorMsg(err?.message || 'Failed to save information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-md animate-fade-in`}>
      <div className={`rounded-3xl w-full max-w-lg p-4 sm:p-5 relative flex flex-col max-h-[94vh] ${
        isLight
          ? 'bg-[#EFE4D6] border-2 border-[#DECFC0] text-[#2A1B14] shadow-[0_20px_60px_rgba(140,95,60,0.22)]'
          : 'bg-[#0D152D] border border-slate-700/90 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${isLight ? 'border-[#DECFC0]' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <div>
              <h3 className={`text-sm sm:text-base font-bold tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>
                {isEditing ? 'Edit Family & Friend' : 'Add Family & Friend'}
              </h3>
              <p className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>All details & reminder in one screen</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isLight
                ? 'hover:bg-[#EBE0D2] text-[#634B3F] hover:text-[#2A1B14]'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className={`mt-2.5 p-2.5 rounded-xl border text-xs flex items-center gap-2 shrink-0 ${
            isLight
              ? 'bg-[#F7D4BC] border-[#E8BC9E] text-[#C62828]'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Single Screen Form */}
        <form onSubmit={handleSave} className="overflow-y-auto py-3 space-y-3.5 flex-1 scrollbar-thin pr-1">
          {/* Hidden native file inputs for Gallery & Camera */}
          <input
            type="file"
            ref={galleryInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageFileChange}
          />
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageFileChange}
          />

          {/* Row 1: Profile Photo (Left) + Full Name (Right) side-by-side */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-3">
              {/* Photo Avatar & Upload Buttons */}
              <div className="flex flex-col items-center shrink-0 space-y-1.5">
                <div
                  className="relative group cursor-pointer"
                  onClick={() => galleryInputRef.current?.click()}
                  title="Click to choose from Gallery"
                >
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className={`w-14 h-14 rounded-2xl object-cover ring-2 shadow-md ${
                        isLight ? 'ring-[#B84A1E]' : 'ring-amber-400/80'
                      }`}
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white text-base font-bold ring-2 shadow-md ${
                      isLight
                        ? 'bg-gradient-to-tr from-[#D96632] to-[#B84A1E] ring-[#DECFC0]'
                        : 'bg-gradient-to-tr from-amber-500 to-indigo-600 ring-white/10'
                    }`}>
                      {getInitials(name)}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-md ${
                    isLight ? 'bg-[#B84A1E] text-white' : 'bg-amber-500 text-slate-950'
                  }`}>
                    <Camera className="w-3 h-3 stroke-[2.5]" />
                  </div>
                </div>

                {/* Direct Gallery & Camera Action Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className={`px-2 py-1 border rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                      isLight
                        ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] border-[#DECFC0] text-[#634B3F]'
                        : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200'
                    }`}
                    title="Upload from Gallery"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Gallery</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className={`px-2 py-1 border rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                      isLight
                        ? 'bg-[#F7D4BC] hover:bg-[#E8BC9E] border-[#E8BC9E] text-[#B84A1E]'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                    }`}
                    title="Take Photo with Camera"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Camera</span>
                  </button>
                </div>
                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="text-[9px] text-rose-500 hover:text-rose-600 hover:underline block"
                  >
                    ✕ Remove
                  </button>
                )}
              </div>

              {/* Full Name Input */}
              <div className="flex-1 min-w-0">
                <label className={`text-[11px] font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  className={`w-full rounded-xl px-3 py-2.5 text-xs outline-none border ${
                    isLight
                      ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                      : 'bg-slate-900/90 border-slate-700/80 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Mobile Number */}
          <div>
            <label className={`text-[11px] font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
              Mobile Number (Call & WhatsApp)
            </label>
            <div className="flex items-center gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={`rounded-xl px-2.5 py-2.5 text-xs outline-none border shrink-0 ${
                  isLight
                    ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14]'
                    : 'bg-slate-900/90 border-slate-700/80 text-white focus:ring-2 focus:ring-amber-500/50'
                }`}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+65">🇸🇬 +65</option>
                <option value="+61">🇦🇺 +61</option>
              </select>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="98765 43210"
                className={`w-full rounded-xl px-3 py-2.5 text-xs outline-none border ${
                  isLight
                    ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                    : 'bg-slate-900/90 border-slate-700/80 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50'
                }`}
              />
            </div>
          </div>

          {/* Row 3: Relationship (Dropdown) */}
          <div>
            <label className={`text-[11px] font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
              Relationship
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className={`w-full rounded-xl p-2.5 text-xs outline-none border ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14]'
                  : 'bg-slate-900/90 border-slate-700/80 text-white focus:ring-2 focus:ring-amber-500/50'
              }`}
            >
              {RELATIONSHIP_CHOICES.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
            {relationship === 'Other' && (
              <input
                type="text"
                value={customRelationship}
                onChange={(e) => setCustomRelationship(e.target.value)}
                placeholder="Enter relationship (e.g. Mentor, Neighbor)"
                className={`mt-2 w-full rounded-xl p-2.5 text-xs outline-none border ${
                  isLight
                    ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                    : 'bg-slate-900/90 border-slate-700/80 text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50'
                }`}
              />
            )}
          </div>

          {/* Divider: Occasion Section */}
          <div className={`p-3 rounded-2xl border space-y-3 ${
            isLight
              ? 'bg-[#EBE0D2] border-[#DECFC0]'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
              isLight ? 'text-[#B84A1E]' : 'text-amber-400'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>Occasion & Reminder Details</span>
            </div>

            {/* Occasion Type */}
            <div>
              <label className={`text-[11px] font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                Occasion Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={occasionType}
                onChange={(e) => setOccasionType(e.target.value)}
                className={`w-full rounded-xl p-2.5 text-xs outline-none border ${
                  isLight
                    ? 'bg-[#F4EDE4] border-[#DECFC0] text-[#2A1B14]'
                    : 'bg-slate-950 border-slate-700/90 text-white focus:ring-2 focus:ring-amber-500'
                }`}
              >
                {OCCASION_TYPES.map((occ) => (
                  <option key={occ.id} value={occ.id}>
                    {occ.label}
                  </option>
                ))}
              </select>
              {occasionType === 'OTHER' && (
                <input
                  type="text"
                  value={customOccasionName}
                  onChange={(e) => setCustomOccasionName(e.target.value)}
                  placeholder="e.g. Retirement Day, Housewarming"
                  className={`mt-1.5 w-full rounded-xl p-2 text-xs outline-none border ${
                    isLight
                      ? 'bg-[#F4EDE4] border-[#DECFC0] text-[#2A1B14]'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              )}
            </div>

            {/* Occasion Date */}
            <div>
              <CustomDatePicker
                value={occasionDate}
                onChange={(val) => setOccasionDate(val)}
                label="Occasion Date *"
              />
            </div>

            {/* Year & Milestone */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="checkbox"
                id="knowYearCheckbox"
                checked={knowYear}
                onChange={(e) => setKnowYear(e.target.checked)}
                className={`rounded cursor-pointer ${isLight ? 'text-[#B84A1E] focus:ring-0' : 'text-amber-500 focus:ring-0'}`}
              />
              <label htmlFor="knowYearCheckbox" className={`text-xs cursor-pointer select-none ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                {occasionType === 'BIRTHDAY' ? 'Know birth year?' : 'Know original year?'}
              </label>
              {knowYear && (
                <input
                  type="number"
                  min={1920}
                  max={2030}
                  value={originalYear}
                  onChange={(e) => setOriginalYear(e.target.value)}
                  placeholder="1990"
                  className={`w-20 rounded-lg p-1 text-xs text-center ml-auto border outline-none ${
                    isLight
                      ? 'bg-[#F4EDE4] border-[#DECFC0] text-[#2A1B14]'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
              )}
            </div>

            {/* Reminder Window */}
            <div>
              <label className={`text-[11px] font-semibold block mb-1 flex items-center gap-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                <Bell className={`w-3 h-3 ${isLight ? 'text-[#B84A1E]' : 'text-amber-400'}`} />
                <span>Remind family from</span>
              </label>
              <select
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                className={`w-full rounded-xl p-2.5 text-xs outline-none border ${
                  isLight
                    ? 'bg-[#F4EDE4] border-[#DECFC0] text-[#2A1B14]'
                    : 'bg-slate-950 border-slate-700/90 text-white focus:ring-2 focus:ring-amber-500'
                }`}
              >
                <option value={0}>On the day</option>
                <option value={1}>1 day before</option>
                <option value={3}>3 days before</option>
                <option value={5}>5 days before</option>
                <option value={7}>7 days before</option>
                <option value={14}>14 days before</option>
                <option value={30}>30 days before</option>
              </select>
            </div>
          </div>

          {/* Row 4: Notes (Optional) */}
          <div>
            <label className={`text-[11px] font-semibold block mb-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
              Notes & Preferences (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Likes books, traditional sweets, filter coffee..."
              className={`w-full rounded-xl p-2.5 text-xs outline-none border ${
                isLight
                  ? 'bg-[#EBE0D2] border-[#DECFC0] text-[#2A1B14] placeholder-[#947D70] focus:border-[#C25425]'
                  : 'bg-slate-900/90 border-slate-700/80 text-white placeholder-slate-500'
              }`}
            />
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                isLight
                  ? 'bg-[#EBE0D2] hover:bg-[#DECFC0] text-[#634B3F]'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                isLight
                  ? 'bg-gradient-to-r from-[#D96632] via-[#C85928] to-[#B84A1E] shadow-lg shadow-[#B84A1E]/30'
                  : 'bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 shadow-lg shadow-amber-500/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Reminder'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonModal;
