import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  Briefcase,
  User,
  Sparkles,
  Plus,
  Image as ImageIcon,
  CreditCard,
  Check,
  Building2,
} from 'lucide-react';
import { getLocalDateString } from '../../utils/formatters.js';
import { CustomDatePicker } from './CustomDatePicker.js';
import { useTheme } from '../../context/ThemeContext.js';
import { uploadFileToCloud } from '../../utils/storage.js';

export interface AddVisitingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (cardData: {
    title: string;
    profession: string;
    phone: string;
    email?: string;
    date: string;
    location: string;
    notes?: string;
    photo_url?: string;
  }) => Promise<void> | void;
}

const CARD_CATEGORIES = [
  { id: 'DOCTOR', name: 'Medical / Doctor', icon: Briefcase, color: '#16C7F2' },
  { id: 'HOME_REPAIR', name: 'Home Services & Repairs', icon: Building2, color: '#FF8A24' },
  { id: 'PROFESSIONAL', name: 'CA, Legal & Business', icon: Tag, color: '#19C9A7' },
  { id: 'REAL_ESTATE', name: 'Real Estate & Housing', icon: MapPin, color: '#FFD21F' },
  { id: 'PERSONAL', name: 'Personal & Friend', icon: User, color: '#FF4D6D' },
  { id: 'OTHER', name: 'Other Vendor', icon: Sparkles, color: '#8B5CF6' },
];

export const AddVisitingCardModal: React.FC<AddVisitingCardModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [personName, setPersonName] = useState('');
  const [profession, setProfession] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('DOCTOR');
  
  // Card Image Upload State
  const [cardPhotoUrl, setCardPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        // Upload to Cloud Storage if available
        const cloudUpload = await uploadFileToCloud(base64Data, 'famora-vault', file.name);
        if (cloudUpload.success && cloudUpload.url) {
          setCardPhotoUrl(cloudUpload.url);
        } else {
          setCardPhotoUrl(base64Data);
        }
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload card photo:', err);
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim() || !phone.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: personName.trim(),
        profession: profession.trim() || 'Service Provider',
        phone: phone.trim(),
        email: email.trim(),
        date: date || getLocalDateString(),
        location: location.trim() || 'Local City',
        notes: notes.trim(),
        photo_url: cardPhotoUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
      });

      // Reset form
      setPersonName('');
      setProfession('');
      setPhone('');
      setEmail('');
      setDate(getLocalDateString());
      setLocation('');
      setNotes('');
      setCardPhotoUrl('');
      onClose();
    } catch (err) {
      console.error('Error submitting visiting card:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-3xl p-5 space-y-4 shadow-2xl border max-h-[92vh] overflow-y-auto scrollbar-thin ${
          isLight
            ? 'bg-[#EFE4D6] border-[#DECFC0] text-[#2A1B14]'
            : 'bg-[#0B1226] border-slate-700/80 text-[#F4F8FF]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 shadow-sm">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base sm:text-lg font-black tracking-tight ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>
                Store Visiting Card
              </h3>
              <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Upload card photo, save phone, date & location
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isLight
                ? 'hover:bg-[#EBE0D2] text-[#634B3F]'
                : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Photo Upload Banner */}
        <div className="space-y-2">
          <label className={`text-xs font-bold block ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
            Card Photo / Image *
          </label>
          {cardPhotoUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-lg group h-36">
              <img src={cardPhotoUrl} alt="Visiting Card Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-cyan-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={() => setCardPhotoUrl('')}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                isLight
                  ? 'border-[#DECFC0] bg-[#FFF8F1] hover:border-[#E05318]'
                  : 'border-slate-700 bg-slate-900/60 hover:border-cyan-500'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-xs font-bold ${isLight ? 'text-[#2A1B14]' : 'text-white'}`}>
                {isUploadingPhoto ? 'Uploading Card Photo...' : 'Click to Upload Visiting Card Photo or Scan Camera'}
              </p>
              <p className={`text-[10px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Supports PNG, JPG, JPEG card photos
              </p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Category Pills */}
        <div className="space-y-1.5">
          <label className={`text-xs font-bold block ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
            Category Tag
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CARD_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shrink-0 ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-md'
                      : isLight
                      ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#634B3F] hover:bg-[#EBE0D2]'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Details Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* Person / Business Title */}
          <div>
            <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
              Card Title / Person or Business Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rajesh Sharma or Bhavani Interiors"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#2A1B14] focus:border-[#E05318]'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* Profession / Services */}
          <div>
            <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
              Profession / Services Offered
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Cardiologist, Modular Kitchen & Interior, Electrician"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                  isLight
                    ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#2A1B14] focus:border-[#E05318]'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                }`}
              />
            </div>
          </div>

          {/* Phone & Email Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
                Phone Number *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                    isLight
                      ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#2A1B14] focus:border-[#E05318]'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
                Email (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                    isLight
                      ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#2A1B14] focus:border-[#E05318]'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Date & Location Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
                Card Date Received *
              </label>
              <CustomDatePicker
                value={date}
                onChange={(d) => setDate(d)}
                placeholder="Select date"
                isLight={isLight}
              />
            </div>

            <div>
              <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
                Location / Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. HSR Layout, Bengaluru"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl text-xs outline-none border transition-all ${
                    isLight
                      ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#2A1B14] focus:border-[#E05318]'
                      : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Notes / Special Services */}
          <div>
            <label className={`text-xs font-bold block mb-1 ${isLight ? 'text-[#2A1B14]' : 'text-slate-200'}`}>
              Notes & Recommended Services
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Recommended by Suresh for modular kitchen. Speaks Telugu & English."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full p-3 rounded-xl text-xs outline-none border transition-all ${
                isLight
                  ? 'bg-[#FFF8F1] border-[#DECFC0] text-[#2A1B14] focus:border-[#E05318]'
                  : 'bg-slate-900 border-slate-700 text-white focus:border-cyan-500'
              }`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                isLight
                  ? 'bg-transparent text-[#634B3F] border-[#DECFC0] hover:bg-[#EBE0D2]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Card...' : 'Save Visiting Card'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
