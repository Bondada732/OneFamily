import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Heart,
  Calendar,
  Phone,
  Send,
  ChevronRight,
  Edit3,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { FamilyContact } from '../../types/index.js';
import { apiRequest } from '../../utils/api.js';
import { useAuth } from '../../context/AuthContext.js';
import { AddPersonModal } from '../../components/familyFriends/AddPersonModal.js';
import { PersonDetailModal } from '../../components/familyFriends/PersonDetailModal.js';
import { WhatsAppWishModal } from '../../components/familyFriends/WhatsAppWishModal.js';

const OCCASION_ICONS: Record<string, string> = {
  BIRTHDAY: '🎂',
  MARRIAGE_ANNIVERSARY: '💍',
  ENGAGEMENT_ANNIVERSARY: '💐',
  GRADUATION_ANNIVERSARY: '🎓',
  OTHER: '⭐',
};

type FilterCategory = 'ALL' | 'BIRTHDAYS' | 'ANNIVERSARIES' | 'OTHER';

export const FamilyFriendsView: React.FC = () => {
  const { family } = useAuth();

  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<FamilyContact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<FamilyContact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedContact, setSelectedContact] = useState<FamilyContact | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [wishContact, setWishContact] = useState<any>(null);

  const loadContacts = async () => {
    if (!family?.id) return;
    try {
      setIsLoading(true);
      const data = await apiRequest(`/family-reminders/${family.id}/contacts`);
      if (Array.isArray(data)) {
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [family?.id]);

  const getInitials = (str: string) => {
    if (!str.trim()) return '👤';
    const parts = str.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  // Filter and Search
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        contact.name.toLowerCase().includes(q) ||
        contact.relationship.toLowerCase().includes(q) ||
        (contact.mobile_number && contact.mobile_number.includes(q)) ||
        (contact.notes && contact.notes.toLowerCase().includes(q)) ||
        (contact.occasions &&
          contact.occasions.some(
            (o) =>
              o.occasion_type.toLowerCase().includes(q) ||
              (o.custom_occasion_name && o.custom_occasion_name.toLowerCase().includes(q))
          ));

      if (!matchSearch) return false;

      if (activeFilter === 'BIRTHDAYS') {
        return contact.occasions?.some((o) => o.occasion_type === 'BIRTHDAY');
      }
      if (activeFilter === 'ANNIVERSARIES') {
        return contact.occasions?.some(
          (o) =>
            o.occasion_type === 'MARRIAGE_ANNIVERSARY' ||
            o.occasion_type === 'ENGAGEMENT_ANNIVERSARY'
        );
      }
      if (activeFilter === 'OTHER') {
        return contact.occasions?.some(
          (o) =>
            o.occasion_type !== 'BIRTHDAY' &&
            o.occasion_type !== 'MARRIAGE_ANNIVERSARY' &&
            o.occasion_type !== 'ENGAGEMENT_ANNIVERSARY'
        );
      }

      return true;
    });
  }, [contacts, searchQuery, activeFilter]);

  const handleOpenDetail = (contact: FamilyContact) => {
    setSelectedContact(contact);
    setShowDetailModal(true);
  };

  const handleStartEdit = (e: React.MouseEvent, contact: FamilyContact) => {
    e.stopPropagation();
    setContactToEdit(contact);
    setShowAddModal(true);
  };

  const handlePromptDelete = (e: React.MouseEvent, contact: FamilyContact) => {
    e.stopPropagation();
    setContactToDelete(contact);
  };

  const handleConfirmDelete = async () => {
    if (!family?.id || !contactToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/family-reminders/${family.id}/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });
      setContacts((prev) => prev.filter((c) => c.id !== contactToDelete.id));
      if (selectedContact?.id === contactToDelete.id) {
        setSelectedContact(null);
        setShowDetailModal(false);
      }
      setContactToDelete(null);
    } catch (err) {
      console.error('Failed to delete contact:', err);
      alert('Failed to delete contact. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenWhatsApp = (e: React.MouseEvent, contact: FamilyContact) => {
    e.stopPropagation();
    setWishContact(contact);
    setShowWhatsAppModal(true);
  };

  const handleCall = (e: React.MouseEvent, phone?: string) => {
    e.stopPropagation();
    if (phone) {
      window.open(`tel:${phone.replace(/\s+/g, '')}`, '_self');
    }
  };

  return (
    <div className="p-3.5 space-y-3.5 text-[#F4F8FF] pb-28 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Family & Friends
            </h2>
            <span className="text-base">👥</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Never miss an important birthday, anniversary or milestone.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setContactToEdit(null);
            setShowAddModal(true);
          }}
          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Person</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, relationship, occasion, phone..."
          className="w-full rounded-2xl bg-[#0D152D] border border-slate-800/90 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'ALL' as FilterCategory, label: 'All', icon: Users },
          { id: 'BIRTHDAYS' as FilterCategory, label: '🎂 Birthdays' },
          { id: 'ANNIVERSARIES' as FilterCategory, label: '💍 Anniversaries' },
          { id: 'OTHER' as FilterCategory, label: '⭐ Other' },
        ].map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                  : 'bg-[#0D152D] border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contacts List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse pt-2">
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
          <div className="h-20 bg-[#0D152D] rounded-2xl"></div>
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="space-y-2.5">
          {filteredContacts.map((contact) => {
            const primaryOccasion = contact.occasions?.[0];
            const calc = (primaryOccasion as any)?.calculation;
            const icon = primaryOccasion ? OCCASION_ICONS[primaryOccasion.occasion_type] || '⭐' : '🎂';
            const isToday = calc?.isToday;

            return (
              <div
                key={contact.id}
                onClick={() => handleOpenDetail(contact)}
                className={`p-3.5 rounded-2xl bg-[#0D152D] border transition-all cursor-pointer group shadow-lg flex items-center justify-between hover:scale-[1.01] ${
                  isToday
                    ? 'border-amber-500/60 ring-2 ring-amber-500/30 bg-gradient-to-r from-amber-500/10 via-[#0D152D] to-[#0D152D]'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Photo and Person Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {contact.photo_url ? (
                    <img
                      src={contact.photo_url}
                      alt={contact.name}
                      className={`w-12 h-12 rounded-2xl object-cover ring-2 shadow-md shrink-0 ${
                        isToday ? 'ring-amber-400' : 'ring-slate-700'
                      }`}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
                      {getInitials(contact.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
                        {contact.name}
                      </h4>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md shrink-0">
                        {contact.relationship}
                      </span>
                    </div>

                    {/* Occasion Snippet */}
                    {primaryOccasion ? (
                      <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1.5 truncate">
                        <span>{icon}</span>
                        <span className="truncate">
                          {calc?.displayTitle || primaryOccasion.occasion_type}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-200">
                          {calc?.occasionDateFormatted || primaryOccasion.occasion_date}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 mt-0.5">No occasions added</p>
                    )}

                    {/* Countdown Badge */}
                    {calc && (
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isToday
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : calc.daysRemaining <= 7
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {calc.countdownText}
                        </span>
                        {calc.milestoneText && (
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {calc.milestoneText}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Icons: Edit, Delete, Call, WhatsApp */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => handleStartEdit(e, contact)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors"
                    title="Edit person"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => handlePromptDelete(e, contact)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                    title="Delete person"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {contact.mobile_number && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleCall(e, contact.mobile_number)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 border border-slate-700 transition-colors"
                        title="Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenWhatsApp(e, contact)}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
                        title="WhatsApp Wish"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-12 px-4 text-center rounded-3xl bg-[#0D152D] border border-slate-800/80 space-y-3 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Never miss an important day</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Add birthdays, wedding anniversaries and special milestones for your loved ones.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setContactToEdit(null);
              setShowAddModal(true);
            }}
            className="mt-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 text-xs font-bold text-white shadow-lg shadow-amber-500/20 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ Add First Person</span>
          </button>
        </div>
      )}

      {/* Single-Screen Add / Edit Person Modal */}
      {showAddModal && (
        <AddPersonModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setContactToEdit(null);
          }}
          onSuccess={loadContacts}
          editContact={contactToEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {contactToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D152D] border border-rose-500/50 rounded-3xl w-full max-w-sm p-5 text-white shadow-2xl space-y-3.5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete {contactToDelete.name}?</h3>
              <p className="text-xs text-slate-300 mt-1.5">
                This will remove <strong className="text-white">{contactToDelete.name}</strong> and all associated occasions from your family space.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setContactToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Person Details Modal */}
      {showDetailModal && selectedContact && (
        <PersonDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedContact(null);
          }}
          contact={selectedContact}
          onUpdate={async () => {
            await loadContacts();
            if (family?.id && selectedContact?.id) {
              try {
                const refreshed = await apiRequest(`/family-reminders/${family.id}/contacts/${selectedContact.id}`);
                if (refreshed && refreshed.id) {
                  setSelectedContact(refreshed);
                } else {
                  setSelectedContact(null);
                  setShowDetailModal(false);
                }
              } catch {
                setSelectedContact(null);
                setShowDetailModal(false);
              }
            }
          }}
        />
      )}

      {/* WhatsApp Wish Modal */}
      {showWhatsAppModal && wishContact && (
        <WhatsAppWishModal
          isOpen={showWhatsAppModal}
          onClose={() => setShowWhatsAppModal(false)}
          contact={wishContact}
          occasion={wishContact.occasions?.[0]}
        />
      )}
    </div>
  );
};
