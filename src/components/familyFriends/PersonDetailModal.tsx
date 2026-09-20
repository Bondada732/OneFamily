import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Heart,
  Cake,
  Sparkles,
  AlertTriangle,
  Send,
  Camera,
  Check,
} from 'lucide-react';
import { FamilyContact, FamilyContactOccasion } from '../../types/index.js';
import { WhatsAppWishModal } from './WhatsAppWishModal.js';
import { AddPersonModal } from './AddPersonModal.js';
import { CustomDatePicker } from '../common/CustomDatePicker.js';
import { apiRequest } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';

interface PersonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: FamilyContact | null;
  onUpdate: () => void;
}

const OCCASION_ICONS: Record<string, string> = {
  BIRTHDAY: '🎂',
  MARRIAGE_ANNIVERSARY: '💍',
  ENGAGEMENT_ANNIVERSARY: '💐',
  GRADUATION_ANNIVERSARY: '🎓',
  OTHER: '⭐',
};

export const PersonDetailModal: React.FC<PersonDetailModalProps> = ({
  isOpen,
  onClose,
  contact,
  onUpdate,
}) => {
  const { family } = useAuth();

  const [currentContact, setCurrentContact] = useState<FamilyContact | null>(contact);

  useEffect(() => {
    setCurrentContact(contact);
  }, [contact]);

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedOccasionForWish, setSelectedOccasionForWish] = useState<any>(null);

  // Add Occasion Sub-modal State
  const [showAddOccasion, setShowAddOccasion] = useState(false);
  const [newOccasionType, setNewOccasionType] = useState('MARRIAGE_ANNIVERSARY');
  const [newCustomName, setNewCustomName] = useState('');
  const [newOccasionDate, setNewOccasionDate] = useState('2015-02-12');
  const [newKnowYear, setNewKnowYear] = useState(true);
  const [newOriginalYear, setNewOriginalYear] = useState('2015');
  const [newReminderDays, setNewReminderDays] = useState(7);
  const [isSubmittingOccasion, setIsSubmittingOccasion] = useState(false);

  // Edit Person & Primary Occasion State
  const [isEditingPerson, setIsEditingPerson] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRelationship, setEditRelationship] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Edit Specific Occasion State
  const [editingOccasion, setEditingOccasion] = useState<FamilyContactOccasion | null>(null);
  const [editOccType, setEditOccType] = useState('BIRTHDAY');
  const [editOccCustomName, setEditOccCustomName] = useState('');
  const [editOccDate, setEditOccDate] = useState('');
  const [editOccKnowYear, setEditOccKnowYear] = useState(false);
  const [editOccYear, setEditOccYear] = useState('');
  const [editOccReminderDays, setEditOccReminderDays] = useState(5);
  const [isSavingOccasion, setIsSavingOccasion] = useState(false);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !currentContact) return null;

  const getInitials = (str: string) => {
    if (!str.trim()) return '👤';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  const handleCall = () => {
    if (currentContact.mobile_number) {
      window.open(`tel:${currentContact.mobile_number.replace(/\s+/g, '')}`, '_self');
    }
  };

  const handleSMS = () => {
    if (currentContact.mobile_number) {
      window.open(`sms:${currentContact.mobile_number.replace(/\s+/g, '')}`, '_self');
    }
  };

  const handleOpenWish = (occ?: any) => {
    setSelectedOccasionForWish(occ || currentContact.occasions?.[0]);
    setShowWhatsAppModal(true);
  };

  const handleStartEditPerson = () => {
    setEditName(currentContact.name);
    setEditPhotoUrl(currentContact.photo_url || '');
    setEditPhone(currentContact.mobile_number || '');
    setEditRelationship(currentContact.relationship || 'Friend');
    setEditNotes(currentContact.notes || '');
    setShowAvatarPicker(false);
    setIsEditingPerson(true);
  };

  const handleSavePersonEdit = async () => {
    if (!family?.id || !editName.trim()) return;
    setIsSavingEdit(true);
    try {
      const updated = await apiRequest(`/family-reminders/${family.id}/contacts/${currentContact.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName.trim(),
          photo_url: editPhotoUrl,
          mobile_number: editPhone.trim(),
          relationship: editRelationship.trim(),
          notes: editNotes.trim(),
        }),
      });

      if (updated && updated.id) {
        setCurrentContact(updated);
      }
      setIsEditingPerson(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to update person:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeletePerson = async () => {
    if (!family?.id) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/family-reminders/${family.id}/contacts/${currentContact.id}`, {
        method: 'DELETE',
      });
      setShowDeleteConfirm(false);
      onClose();
      onUpdate();
    } catch (err) {
      console.error('Failed to delete person:', err);
      alert('Failed to delete person. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddOccasion = async () => {
    if (!family?.id || !newOccasionDate) return;
    setIsSubmittingOccasion(true);

    try {
      let finalYear: number | undefined = undefined;
      let dateString = newOccasionDate;

      if (newKnowYear && newOriginalYear) {
        const y = parseInt(newOriginalYear, 10);
        if (y > 1900 && y < 2100) {
          finalYear = y;
          const dateParts = newOccasionDate.split('-');
          if (dateParts.length >= 2) {
            const m = dateParts[dateParts.length - 2];
            const d = dateParts[dateParts.length - 1];
            dateString = `${y}-${m}-${d}`;
          }
        }
      }

      const created = await apiRequest(`/family-reminders/${family.id}/contacts/${currentContact.id}/occasions`, {
        method: 'POST',
        body: JSON.stringify({
          occasion_type: newOccasionType,
          custom_occasion_name: newOccasionType === 'OTHER' ? newCustomName.trim() : '',
          occasion_date: dateString,
          original_year: finalYear,
          reminder_days_before: newReminderDays,
        }),
      });

      if (created) {
        setCurrentContact((prev) =>
          prev ? { ...prev, occasions: [...(prev.occasions || []), created] } : prev
        );
      }
      setShowAddOccasion(false);
      onUpdate();
    } catch (err) {
      console.error('Failed to add occasion:', err);
      alert('Failed to add occasion. Please check the date.');
    } finally {
      setIsSubmittingOccasion(false);
    }
  };

  const handleStartEditOccasion = (occ: FamilyContactOccasion) => {
    setEditingOccasion(occ);
    setEditOccType(occ.occasion_type);
    setEditOccCustomName(occ.custom_occasion_name || '');
    setEditOccDate(occ.occasion_date || '1990-01-01');
    setEditOccKnowYear(Boolean(occ.original_year));
    setEditOccYear(occ.original_year ? String(occ.original_year) : '');
    setEditOccReminderDays(occ.reminder_days_before ?? 5);
  };

  const handleSaveOccasionEdit = async () => {
    if (!family?.id || !editingOccasion || !editOccDate) return;
    setIsSavingOccasion(true);
    try {
      let finalYear: number | undefined = undefined;
      let dateString = editOccDate;

      if (editOccKnowYear && editOccYear) {
        const y = parseInt(editOccYear, 10);
        if (y > 1900 && y < 2100) {
          finalYear = y;
          const dateParts = editOccDate.split('-');
          if (dateParts.length >= 2) {
            const m = dateParts[dateParts.length - 2];
            const d = dateParts[dateParts.length - 1];
            dateString = `${y}-${m}-${d}`;
          }
        }
      }

      const updated = await apiRequest(`/family-reminders/${family.id}/occasions/${editingOccasion.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          occasion_type: editOccType,
          custom_occasion_name: editOccType === 'OTHER' ? editOccCustomName.trim() : '',
          occasion_date: dateString,
          original_year: finalYear,
          reminder_days_before: editOccReminderDays,
        }),
      });

      if (updated) {
        setCurrentContact((prev) =>
          prev
            ? {
                ...prev,
                occasions: (prev.occasions || []).map((o) => (o.id === editingOccasion.id ? { ...o, ...updated } : o)),
              }
            : prev
        );
      }
      setEditingOccasion(null);
      onUpdate();
    } catch (err) {
      console.error('Failed to update occasion:', err);
      alert('Failed to update occasion. Please try again.');
    } finally {
      setIsSavingOccasion(false);
    }
  };

  const handleDeleteOccasion = async (occasionId: string) => {
    if (!family?.id) return;
    if (!window.confirm('Are you sure you want to remove this occasion?')) return;
    try {
      await apiRequest(`/family-reminders/${family.id}/occasions/${occasionId}`, {
        method: 'DELETE',
      });
      setCurrentContact((prev) =>
        prev
          ? {
              ...prev,
              occasions: (prev.occasions || []).filter((o) => o.id !== occasionId),
            }
          : prev
      );
      onUpdate();
    } catch (err) {
      console.error('Failed to delete occasion:', err);
      alert('Failed to delete occasion.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
        <div className="bg-[#0D152D] border border-slate-700/80 rounded-3xl w-full max-w-md p-5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[92vh]">
          {/* Top Bar with Edit, Delete, Close */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Family & Friend Profile
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEditPerson}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold px-2.5"
                title="Edit Person"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                title="Delete Person"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Profile Content */}
          <div className="overflow-y-auto py-4 space-y-4 flex-1 scrollbar-thin">
            {/* Person Header Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-md">
              {currentContact.photo_url ? (
                <img
                  src={currentContact.photo_url}
                  alt={currentContact.name}
                  className="w-16 h-16 rounded-3xl object-cover ring-4 ring-amber-500/40 shadow-xl shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black ring-4 ring-white/10 shadow-xl shrink-0">
                  {getInitials(currentContact.name)}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-extrabold text-white truncate">{currentContact.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {currentContact.relationship}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentContact.visibility === 'PRIVATE' ? '🔒 Private' : currentContact.visibility === 'SELECTED' ? '👥 Selected' : '🏡 Family'}
                  </span>
                </div>
                {currentContact.mobile_number && (
                  <p className="text-xs text-slate-300 mt-1 font-mono font-medium">
                    {currentContact.mobile_number}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons (Call, WhatsApp, SMS) */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleCall}
                disabled={!currentContact.mobile_number}
                className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all flex flex-col items-center justify-center gap-1 text-slate-200 hover:text-emerald-400 disabled:opacity-40"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-semibold">Call</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenWish()}
                disabled={!currentContact.mobile_number}
                className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 transition-all flex flex-col items-center justify-center gap-1 text-emerald-300 disabled:opacity-40 shadow-sm"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSMS}
                disabled={!currentContact.mobile_number}
                className="p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all flex flex-col items-center justify-center gap-1 text-slate-200 hover:text-indigo-400 disabled:opacity-40"
              >
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px] font-semibold">SMS</span>
              </button>
            </div>

            {/* Important Dates Section */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Important Dates & Occasions</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddOccasion(true)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Occasion</span>
                </button>
              </div>

              {currentContact.occasions && currentContact.occasions.length > 0 ? (
                <div className="space-y-2">
                  {currentContact.occasions.map((occ: any) => {
                    const icon = OCCASION_ICONS[occ.occasion_type] || '⭐';
                    const calc = occ.calculation;
                    const typeLabel =
                      occ.occasion_type === 'BIRTHDAY'
                        ? 'Birthday'
                        : occ.occasion_type === 'MARRIAGE_ANNIVERSARY'
                        ? 'Marriage Anniversary'
                        : occ.occasion_type === 'ENGAGEMENT_ANNIVERSARY'
                        ? 'Engagement Anniversary'
                        : occ.custom_occasion_name || 'Special Occasion';

                    return (
                      <div
                        key={occ.id}
                        className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-xl shrink-0">{icon}</div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span>{typeLabel}</span>
                              {calc?.milestoneText && (
                                <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/15 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                                  {calc.milestoneText}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span>{calc?.occasionDateFormatted || occ.occasion_date}</span>
                              <span>•</span>
                              <span className={calc?.isToday ? 'text-amber-400 font-bold' : calc?.isActiveReminder ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                                {calc?.countdownText || 'Upcoming'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditOccasion(occ)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                            title="Edit this occasion"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenWish(occ)}
                            className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            title="Send greeting"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          {currentContact.occasions!.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOccasion(occ.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                              title="Delete occasion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900 text-center">
                  <p className="text-xs text-slate-400">No occasions recorded yet.</p>
                  <button
                    onClick={() => setShowAddOccasion(true)}
                    className="mt-1.5 text-xs text-amber-400 font-semibold hover:underline"
                  >
                    + Add Birthday or Anniversary
                  </button>
                </div>
              )}
            </div>

            {/* Notes Card */}
            {currentContact.notes && (
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Notes & Personal Preferences
                </span>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  "{currentContact.notes}"
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] text-slate-500">
              ID: {currentContact.id.slice(0, 12)}...
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Single Screen Edit Person Modal */}
      {isEditingPerson && (
        <AddPersonModal
          isOpen={isEditingPerson}
          onClose={() => setIsEditingPerson(false)}
          onSuccess={() => {
            setIsEditingPerson(false);
            onUpdate();
          }}
          editContact={currentContact}
        />
      )}

      {/* SUB-MODAL: Edit Specific Occasion */}
      {editingOccasion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D152D] border border-amber-500/40 rounded-3xl w-full max-w-sm p-5 text-white shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Occasion</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingOccasion(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Occasion Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Occasion Type</label>
              <select
                value={editOccType}
                onChange={(e) => setEditOccType(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="BIRTHDAY">🎂 Birthday</option>
                <option value="MARRIAGE_ANNIVERSARY">💍 Marriage Anniversary</option>
                <option value="ENGAGEMENT_ANNIVERSARY">💐 Engagement Anniversary</option>
                <option value="GRADUATION_ANNIVERSARY">🎓 Graduation Day</option>
                <option value="OTHER">⭐ Other Special Occasion</option>
              </select>
            </div>

            {editOccType === 'OTHER' && (
              <input
                type="text"
                value={editOccCustomName}
                onChange={(e) => setEditOccCustomName(e.target.value)}
                placeholder="Occasion Name"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
              />
            )}

            {/* Occasion Date */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Occasion Date</label>
              <CustomDatePicker
                value={editOccDate}
                onChange={(val) => setEditOccDate(val)}
                label="Select Date"
              />
            </div>

            {/* Know Year */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={editOccKnowYear}
                onChange={(e) => setEditOccKnowYear(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-xs text-slate-300">Know original year?</span>
              {editOccKnowYear && (
                <input
                  type="number"
                  min={1920}
                  max={2030}
                  value={editOccYear}
                  onChange={(e) => setEditOccYear(e.target.value)}
                  placeholder="1990"
                  className="w-20 rounded-lg bg-slate-900 border border-slate-700 p-1 text-xs text-white text-center"
                />
              )}
            </div>

            {/* Reminder Offset */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Remind me</label>
              <select
                value={editOccReminderDays}
                onChange={(e) => setEditOccReminderDays(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
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

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOccasion(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingOccasion}
                onClick={handleSaveOccasionEdit}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-xs font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isSavingOccasion ? 'Saving...' : 'Save Occasion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add Another Occasion to this Person */}
      {showAddOccasion && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D152D] border border-amber-500/40 rounded-3xl w-full max-w-sm p-5 text-white shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Add Occasion for {currentContact.name.split(' ')[0]}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <button
                type="button"
                onClick={() => setShowAddOccasion(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Occasion Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Occasion Type</label>
              <select
                value={newOccasionType}
                onChange={(e) => setNewOccasionType(e.target.value)}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="BIRTHDAY">🎂 Birthday</option>
                <option value="MARRIAGE_ANNIVERSARY">💍 Marriage Anniversary</option>
                <option value="ENGAGEMENT_ANNIVERSARY">💐 Engagement Anniversary</option>
                <option value="GRADUATION_ANNIVERSARY">🎓 Graduation Day</option>
                <option value="OTHER">⭐ Other Special Occasion</option>
              </select>
            </div>

            {newOccasionType === 'OTHER' && (
              <input
                type="text"
                value={newCustomName}
                onChange={(e) => setNewCustomName(e.target.value)}
                placeholder="Occasion Name (e.g. Retirement Day)"
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2 text-xs text-white"
              />
            )}

            {/* Occasion Date */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Date</label>
              <CustomDatePicker
                value={newOccasionDate}
                onChange={(val) => setNewOccasionDate(val)}
                label="Select Occasion Date"
              />
            </div>

            {/* Year */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                checked={newKnowYear}
                onChange={(e) => setNewKnowYear(e.target.checked)}
                className="rounded text-amber-500"
              />
              <span className="text-xs text-slate-300">Know original year?</span>
              {newKnowYear && (
                <input
                  type="number"
                  min={1920}
                  max={2030}
                  value={newOriginalYear}
                  onChange={(e) => setNewOriginalYear(e.target.value)}
                  placeholder="2015"
                  className="w-20 rounded-lg bg-slate-900 border border-slate-700 p-1 text-xs text-white text-center"
                />
              )}
            </div>

            {/* Reminder Offset */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Remind me</label>
              <select
                value={newReminderDays}
                onChange={(e) => setNewReminderDays(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 p-2.5 text-xs text-white focus:ring-2 focus:ring-amber-500"
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

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddOccasion(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingOccasion}
                onClick={handleAddOccasion}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 text-xs font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isSubmittingOccasion ? 'Adding...' : 'Add Occasion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D152D] border border-rose-500/50 rounded-3xl w-full max-w-sm p-5 text-white shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete {currentContact.name}?</h3>
              <p className="text-xs text-slate-300 mt-1.5">
                This will remove <strong className="text-white">{currentContact.name}</strong> and all associated occasions and reminders from your family account.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeletePerson}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Wish Modal */}
      {showWhatsAppModal && (
        <WhatsAppWishModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          contact={currentContact}
          occasion={selectedOccasionForWish}
        />
      )}
    </>
  );
};
