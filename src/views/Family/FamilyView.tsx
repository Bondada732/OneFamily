import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { formatDate, getLocalDateString } from '../../utils/formatters.js';
import { FamilyMember, TaskItem, GroceryItem, MaintenanceItem, EmergencyContact, EmergencyProfile } from '../../types/index.js';
import { Users, CheckSquare, ShoppingCart, Wrench, ShieldAlert, Phone, Plus, Check, ShieldCheck, Heart, UserPlus, GitFork, ChevronRight, ChevronDown, ChevronUp, Lock, Camera, Edit3, User, Upload, Image as ImageIcon, Gift, Trash2, Tag, Copy, Share2, KeyRound, RotateCw, X } from 'lucide-react';

const AVATAR_PRESETS = [
  { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200', label: 'Father / Head' },
  { url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200', label: 'Mother / Co-Head' },
  { url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200', label: 'Teen Boy' },
  { url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200', label: 'Young Girl' },
  { url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=200', label: 'Grandmother' },
  { url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200', label: 'Grandfather' },
  { url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200', label: 'Young Woman' },
  { url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200', label: 'Young Man' },
];

export const FamilyView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission, familyMembers, refreshUser, regenerateFamilyKey, approveMember, rejectMember, updateMemberPermissions } = useAuth();
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'MEMBERS' | 'TREE' | 'TASKS' | 'WISHLIST' | 'MAINTENANCE' | 'EMERGENCY'>('MEMBERS');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyProfiles, setEmergencyProfiles] = useState<EmergencyProfile[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [keyCopied, setKeyCopied] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [isSecretKeyExpanded, setIsSecretKeyExpanded] = useState(false);

  // Approval & Member Request States (Family Head)
  const [approvingMember, setApprovingMember] = useState<FamilyMember | null>(null);
  const [approvalPermissions, setApprovalPermissions] = useState<string[]>([]);
  const [approvalRole, setApprovalRole] = useState<string>('ADULT');
  const [approvalRelationship, setApprovalRelationship] = useState<string>('Family Member');
  const [isApprovingSubmitting, setIsApprovingSubmitting] = useState(false);

  // Modals & form states
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [memberProfileForm, setMemberProfileForm] = useState({
    name: '',
    avatar_url: '',
    relationship: '',
    phone: '',
  });
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<FamilyMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(currentUser?.name || 'All Family');
  const [newTaskPriority, setNewTaskPriority] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [newGroceryName, setNewGroceryName] = useState('');
  const [newGroceryCategory, setNewGroceryCategory] = useState('WISH');
  const [newGroceryQty, setNewGroceryQty] = useState('1 unit');

  // Emergency Contacts & Medical Profiles Form States
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: 'Family Doctor',
    phone: '',
    secondary_phone: '',
    email: '',
    type: 'PERSONAL' as 'PERSONAL' | 'DOCTOR' | 'HOSPITAL' | 'INSURANCE' | 'POLICE' | 'AMBULANCE' | 'OTHER',
    address: '',
    is_primary: false,
  });

  const [showAddProfile, setShowAddProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState<EmergencyProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    blood_group: 'O+',
    allergies: '',
    chronic_conditions: '',
    medications: '',
    primary_doctor: '',
    insurance_summary: '',
    special_instructions: '',
  });

  // Maintenance state
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [newMaintenance, setNewMaintenance] = useState({
    item_name: '',
    service_type: 'APPLIANCE',
    last_service_date: getLocalDateString(),
    next_service_due: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      return getLocalDateString(d);
    })(),
    service_provider: '',
    contact_phone: '',
    recurring_interval_months: '6',
    notes: '',
  });

  // Refs for avatar uploads
  const editGalleryRef = useRef<HTMLInputElement>(null);
  const editCameraRef = useRef<HTMLInputElement>(null);
  const addGalleryRef = useRef<HTMLInputElement>(null);
  const addCameraRef = useRef<HTMLInputElement>(null);

  // Add Member form state
  const [newMemberData, setNewMemberData] = useState({
    name: '',
    relationship: 'Spouse',
    role: 'SPOUSE',
    email: '',
    phone: '',
    birth_date: '1990-01-01',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  });

  const canManageFamily = hasPermission('FAMILY_MANAGE');
  const canEditTasks = hasPermission('TASK_EDIT');
  const canViewEmergency = hasPermission('EMERGENCY_VIEW');

  useEffect(() => {
    if (!family?.id) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [taskData, treeRes] = await Promise.all([
          apiRequest(`/tasks/${family.id}/tasks`),
          apiRequest(`/families/${family.id}/tree`),
        ]);

        setTasks(taskData.tasks || []);
        setGroceryItems(taskData.groceryItems || []);
        setMaintenanceItems(taskData.maintenanceItems || []);
        setTreeData(treeRes.treeNodes || []);

        if (canViewEmergency) {
          const emgData = await apiRequest(`/emergency/${family.id}/emergency`);
          setEmergencyContacts(emgData.contacts || []);
          setEmergencyProfiles(emgData.profiles || []);
        }
      } catch (err) {
        console.error('Failed to load family data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [family?.id, canViewEmergency, currentUser?.id]);

  const toggleTask = async (taskId: string) => {
    try {
      const updated = await apiRequest(`/tasks/${family?.id}/tasks/${taskId}/toggle`, { method: 'PATCH' });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const created = await apiRequest(`/tasks/${family?.id}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          category: 'CHORE',
          priority: newTaskPriority,
          assigned_to_name: newTaskAssignee || currentUser?.name || 'All Family',
        }),
      });
      setTasks([created, ...tasks]);
      setNewTaskTitle('');
      setShowAddTask(false);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGrocery = async (itemId: string) => {
    try {
      const updated = await apiRequest(`/tasks/${family?.id}/grocery/${itemId}/toggle`, { method: 'PATCH' });
      setGroceryItems((prev) => prev.map((g) => (g.id === itemId ? updated : g)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGrocery = async (itemId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Optimistic removal for instant UI response
    setGroceryItems((prev) => prev.filter((g) => g.id !== itemId));
    try {
      await apiRequest(`/tasks/${family?.id}/grocery/${itemId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete wish item:', err);
    }
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;

    try {
      const created = await apiRequest(`/tasks/${family?.id}/grocery`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: newGroceryName,
          quantity: newGroceryQty || '1 unit',
          category: newGroceryCategory || 'WISH',
        }),
      });
      setGroceryItems([...groceryItems, created]);
      setNewGroceryName('');
      setNewGroceryQty('1 unit');
      setNewGroceryCategory('WISH');
      setShowAddGrocery(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaintenance.item_name.trim() || !family?.id) return;
    try {
      const created = await apiRequest(`/tasks/${family.id}/maintenance`, {
        method: 'POST',
        body: JSON.stringify(newMaintenance),
      });
      setMaintenanceItems([...maintenanceItems, created]);
      setShowAddMaintenance(false);
      setNewMaintenance({
        item_name: '',
        service_type: 'APPLIANCE',
        last_service_date: getLocalDateString(),
        next_service_due: (() => {
          const d = new Date();
          d.setMonth(d.getMonth() + 6);
          return getLocalDateString(d);
        })(),
        service_provider: '',
        contact_phone: '',
        recurring_interval_months: '6',
        notes: '',
      });
    } catch (err) {
      console.error('Failed to add maintenance item:', err);
    }
  };

  const handleDeleteMaintenance = async (maintId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setMaintenanceItems((prev) => prev.filter((m) => m.id !== maintId));
    try {
      await apiRequest(`/tasks/${family?.id}/maintenance/${maintId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete maintenance item:', err);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.name.trim() || !family?.id) return;

    try {
      await apiRequest(`/families/${family.id}/members`, {
        method: 'POST',
        body: JSON.stringify(newMemberData),
      });
      await refreshUser();
      setShowAddMember(false);
      setNewMemberData({
        name: '',
        relationship: 'Spouse',
        role: 'SPOUSE',
        email: '',
        phone: '',
        birth_date: '1990-01-01',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      });
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleAvatarFileSelected = (e: React.ChangeEvent<HTMLInputElement>, target: 'edit' | 'add') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        if (target === 'edit') {
          setMemberProfileForm((prev) => ({ ...prev, avatar_url: dataUrl }));
        } else {
          setNewMemberData((prev) => ({ ...prev, avatar_url: dataUrl }));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const openEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setMemberProfileForm({
      name: member.name || '',
      avatar_url: member.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      relationship: member.relationship || '',
      phone: member.phone || '',
    });
  };

  const handleSaveMemberProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    try {
      if (editingMember.id === currentUser?.id) {
        await apiRequest('/auth/profile', {
          method: 'PATCH',
          body: JSON.stringify(memberProfileForm),
        });
      } else {
        await apiRequest(`/families/${family?.id}/members/${editingMember.id}`, {
          method: 'PATCH',
          body: JSON.stringify(memberProfileForm),
        });
      }
      setEditingMember(null);
      await refreshUser();
    } catch (err) {
      console.error('Failed to update member profile:', err);
    }
  };

  const openPermissions = (member: FamilyMember) => {
    setShowPermissionsModal(member);
    setSelectedPermissions(member.permissions || []);
  };

  const savePermissions = async () => {
    if (!showPermissionsModal) return;
    try {
      setIsSavingPermissions(true);
      const res = await updateMemberPermissions(showPermissionsModal.id, selectedPermissions);
      if (res.success) {
        setShowPermissionsModal(null);
      } else {
        alert(res.error || 'Failed to update permissions');
      }
    } catch (err: any) {
      console.error('Failed to save permissions:', err);
      alert(err.message || 'Failed to save permissions');
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleApproveMemberSubmit = async () => {
    if (!approvingMember) return;
    try {
      setIsApprovingSubmitting(true);
      const res = await approveMember(
        approvingMember.id,
        approvalPermissions,
        approvalRole,
        approvalRelationship
      );
      if (res.success) {
        setApprovingMember(null);
        await refreshUser();
      } else {
        alert(res.error || 'Failed to approve member');
      }
    } catch (err: any) {
      console.error('Approval failed:', err);
      alert(err.message || 'Approval failed');
    } finally {
      setIsApprovingSubmitting(false);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone || !family?.id) return;
    try {
      if (editingContact) {
        const updated = await apiRequest(`/emergency/${family.id}/emergency/contacts/${editingContact.id}`, {
          method: 'PATCH',
          body: JSON.stringify(contactForm),
        });
        setEmergencyContacts((prev) => prev.map((c) => (c.id === editingContact.id ? updated : c)));
      } else {
        const created = await apiRequest(`/emergency/${family.id}/emergency/contacts`, {
          method: 'POST',
          body: JSON.stringify(contactForm),
        });
        setEmergencyContacts((prev) => [...prev, created]);
      }
      setShowAddContact(false);
      setEditingContact(null);
      setContactForm({
        name: '',
        relationship: 'Family Doctor',
        phone: '',
        secondary_phone: '',
        email: '',
        type: 'PERSONAL',
        address: '',
        is_primary: false,
      });
    } catch (err) {
      console.error('Failed to save emergency contact:', err);
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (!family?.id) return;
    if (!window.confirm(`Delete emergency contact "${contactName}"?`)) return;
    try {
      await apiRequest(`/emergency/${family.id}/emergency/contacts/${contactId}`, {
        method: 'DELETE',
      });
      setEmergencyContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (err) {
      console.error('Failed to delete emergency contact:', err);
    }
  };

  const openEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      secondary_phone: contact.secondary_phone || '',
      email: contact.email || '',
      type: contact.type || 'PERSONAL',
      address: contact.address || '',
      is_primary: Boolean(contact.is_primary),
    });
    setShowAddContact(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name || !family?.id) return;
    try {
      if (editingProfile) {
        const updated = await apiRequest(`/emergency/${family.id}/emergency/profiles/${editingProfile.id}`, {
          method: 'PATCH',
          body: JSON.stringify(profileForm),
        });
        setEmergencyProfiles((prev) => prev.map((p) => (p.id === editingProfile.id ? updated : p)));
      } else {
        const created = await apiRequest(`/emergency/${family.id}/emergency/profiles`, {
          method: 'POST',
          body: JSON.stringify(profileForm),
        });
        setEmergencyProfiles((prev) => [...prev, created]);
      }
      setShowAddProfile(false);
      setEditingProfile(null);
      setProfileForm({
        full_name: '',
        blood_group: 'O+',
        allergies: '',
        chronic_conditions: '',
        medications: '',
        primary_doctor: '',
        insurance_summary: '',
        special_instructions: '',
      });
    } catch (err) {
      console.error('Failed to save medical profile:', err);
    }
  };

  const handleDeleteProfile = async (profileId: string, profileName: string) => {
    if (!family?.id) return;
    if (!window.confirm(`Delete medical card for "${profileName}"?`)) return;
    try {
      await apiRequest(`/emergency/${family.id}/emergency/profiles/${profileId}`, {
        method: 'DELETE',
      });
      setEmergencyProfiles((prev) => prev.filter((p) => p.id !== profileId));
    } catch (err) {
      console.error('Failed to delete medical profile:', err);
    }
  };

  const openEditProfile = (prof: EmergencyProfile) => {
    setEditingProfile(prof);
    setProfileForm({
      full_name: prof.full_name,
      blood_group: prof.blood_group || 'O+',
      allergies: prof.allergies || '',
      chronic_conditions: prof.chronic_conditions || '',
      medications: prof.medications || '',
      primary_doctor: prof.primary_doctor || '',
      insurance_summary: prof.insurance_summary || '',
      special_instructions: prof.special_instructions || '',
    });
    setShowAddProfile(true);
  };

  const allAvailablePermissions = [
    { code: 'FINANCE_VIEW', name: 'View Finances & Spending', category: 'Finance' },
    { code: 'FINANCE_EDIT', name: 'Record & Manage Expenses', category: 'Finance' },
    { code: 'INVESTMENT_VIEW', name: 'View Wealth & Net Worth', category: 'Finance' },
    { code: 'DOCUMENT_VIEW', name: 'View Vault Documents', category: 'Vault' },
    { code: 'DOCUMENT_UPLOAD', name: 'Upload & Scan Documents', category: 'Vault' },
    { code: 'EMERGENCY_VIEW', name: 'View Emergency Vault & Medical', category: 'Emergency' },
    { code: 'EMERGENCY_EDIT', name: 'Manage Emergency Contacts & Medical Cards', category: 'Emergency' },
    { code: 'MEMORY_VIEW', name: 'View Family Memories & Albums', category: 'Memories' },
    { code: 'CALENDAR_VIEW', name: 'View Shared Calendar', category: 'Calendar' },
    { code: 'TASK_VIEW', name: 'View Tasks & Grocery List', category: 'Tasks' },
    { code: 'TASK_EDIT', name: 'Manage Tasks & Grocery Items', category: 'Tasks' },
    { code: 'AI_USE', name: 'Use FamilyAI Assistant', category: 'AI' },
    { code: 'FAMILY_MANAGE', name: 'Family Admin (Manage Members)', category: 'Admin' },
  ];

  return (
    <div className="p-4 space-y-4 animate-fade-in text-slate-100 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Family</h2>
          <p className="text-xs text-slate-400">Together Always • {family?.name || 'One Family'}</p>
        </div>
        {canManageFamily && (
          <button
            onClick={() => setShowAddMember(true)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-all shadow-sm"
            title="Add Family Member"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Story-style Member Avatars (Mockup Screen 2) */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none pt-1">
        {familyMembers.map((member) => (
          <div
            key={member.id}
            onClick={() => openEditMember(member)}
            className="flex flex-col items-center min-w-[64px] cursor-pointer group active:scale-95 transition-transform"
          >
            <div className="relative mb-1">
              <img
                src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={member.name}
                className={`w-12 h-12 rounded-full object-cover p-0.5 border-2 transition-all ${
                  member.role === 'FAMILY_HEAD'
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : 'border-indigo-500/80 group-hover:border-amber-400'
                }`}
              />
              {member.role === 'FAMILY_HEAD' && (
                <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1 rounded-full shadow-sm">
                  👑
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-white group-hover:text-amber-300 truncate max-w-[64px]">
              {member.name.split(' ')[0]}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[64px]">
              {member.role === 'FAMILY_HEAD' ? 'Family Head' : member.relationship || 'Member'}
            </span>
          </div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 overflow-x-auto scrollbar-none">
        {(['MEMBERS', 'TREE', 'TASKS', 'WISHLIST', 'MAINTENANCE', 'EMERGENCY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === tab
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'WISHLIST' ? 'WISH LIST' : tab}
          </button>
        ))}
      </div>

      {/* 1. MEMBERS SUBTAB */}
      {activeSubTab === 'MEMBERS' && (
        <div className="space-y-3.5">
          {/* Family Secret Key & Invite Card (Visible ONLY to Family Head, collapsible by default) */}
          {currentUser?.role === 'FAMILY_HEAD' && (
            <div className="rounded-3xl bg-gradient-to-br from-slate-800/95 via-indigo-950/40 to-slate-900 border-2 border-amber-500/40 shadow-xl overflow-hidden transition-all">
              <button
                type="button"
                onClick={() => setIsSecretKeyExpanded(!isSecretKeyExpanded)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Family Secret Key</h3>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded border border-amber-500/30">
                        HEAD ONLY
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isSecretKeyExpanded
                        ? 'Share with family members to let them join'
                        : 'Tap to view secret key & invite family members'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 rounded-xl shrink-0">
                  <span>{isSecretKeyExpanded ? 'Hide Key' : 'Show Key'}</span>
                  {isSecretKeyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isSecretKeyExpanded && (
                <div className="p-4 pt-0 space-y-3 border-t border-slate-800/80 mt-1 animate-fade-in">
                  <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-2xl">
                    <div className="font-mono text-sm sm:text-base font-black tracking-widest text-amber-400 pl-2 select-all">
                      {family?.family_key || 'FAM-SHARMA-01'}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(family?.family_key || 'FAM-SHARMA-01');
                          setKeyCopied(true);
                          setTimeout(() => setKeyCopied(false), 2000);
                        }}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                      >
                        {keyCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-300" />}
                        <span>{keyCopied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const key = family?.family_key || 'FAM-SHARMA-01';
                          const text = `Join our family space "${family?.name || 'Famora'}" on Famora! Use Family Secret Key: *${key}* to sign up and join.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>New members who join with this key will require your approval before gaining access.</span>
                    {canManageFamily && (
                      <button
                        onClick={async () => {
                          if (isRotatingKey) return;
                          if (!window.confirm('Generate a new secret key? Old invite keys will no longer work.')) return;
                          setIsRotatingKey(true);
                          await regenerateFamilyKey();
                          setIsRotatingKey(false);
                        }}
                        disabled={isRotatingKey}
                        className="p-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors text-[10px] flex items-center gap-1 border border-slate-700 shrink-0 ml-2"
                        title="Regenerate Family Key"
                      >
                        <RotateCw className={`w-3 h-3 ${isRotatingKey ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Reset Key</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pending Members Approval Card (Visible only to Family Head when requests exist) */}
          {currentUser?.role === 'FAMILY_HEAD' && familyMembers.some((m) => m.is_approved === false || m.status === 'PENDING_APPROVAL') && (
            <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                    ⏳
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Pending Access Requests ({familyMembers.filter((m) => m.is_approved === false || m.status === 'PENDING_APPROVAL').length})
                    </h3>
                    <p className="text-[10px] text-amber-300/80">Members joined with Secret Key awaiting your approval</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {familyMembers
                  .filter((m) => m.is_approved === false || m.status === 'PENDING_APPROVAL')
                  .map((member) => (
                    <div
                      key={member.id}
                      className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={member.name}
                          className="w-10 h-10 rounded-2xl object-cover ring-2 ring-amber-500/40"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{member.name}</span>
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                              PENDING
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {member.relationship || 'Member'} • Role: <strong className="text-slate-300">{member.role || 'ADULT'}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setApprovingMember(member);
                            setApprovalRole(member.role || 'ADULT');
                            setApprovalRelationship(member.relationship || 'Family Member');
                            if (member.role === 'CHILD') {
                              setApprovalPermissions(['TASK_VIEW', 'TASK_EDIT', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'AI_USE']);
                            } else if (member.role === 'SPOUSE') {
                              setApprovalPermissions(allAvailablePermissions.map((p) => p.code));
                            } else if (member.role === 'VIEWER') {
                              setApprovalPermissions(['FINANCE_VIEW', 'DOCUMENT_VIEW', 'EMERGENCY_VIEW', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'TASK_VIEW']);
                            } else {
                              setApprovalPermissions([
                                'FINANCE_VIEW',
                                'FINANCE_EDIT',
                                'INVESTMENT_VIEW',
                                'DOCUMENT_VIEW',
                                'DOCUMENT_UPLOAD',
                                'EMERGENCY_VIEW',
                                'MEMORY_VIEW',
                                'CALENDAR_VIEW',
                                'TASK_VIEW',
                                'TASK_EDIT',
                                'AI_USE',
                              ]);
                            }
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl text-[11px] shadow-md transition-transform active:scale-95"
                        >
                          Review & Approve
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Reject and remove access request for ${member.name}?`)) {
                              await rejectMember(member.id);
                            }
                          }}
                          className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-xl border border-rose-500/30 text-xs transition-colors"
                          title="Reject Request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold text-slate-400 uppercase">
              Approved Family Members ({familyMembers.filter((m) => m.is_approved !== false && m.status !== 'PENDING_APPROVAL').length})
            </span>
            {canManageFamily && (
              <button
                onClick={() => setShowAddMember(true)}
                className="flex items-center gap-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Member</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {familyMembers
              .filter((m) => m.is_approved !== false && m.status !== 'PENDING_APPROVAL')
              .map((member) => (
                <div
                  key={member.id}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm ${
                    member.id === currentUser?.id
                      ? 'bg-indigo-950/40 border-indigo-500/40'
                      : 'bg-slate-800/90 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => {
                        if (canManageFamily || member.id === currentUser?.id) {
                          openEditMember(member);
                        }
                      }}
                      title="Change photo / profile"
                    >
                      <img
                        src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={member.name}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-700 group-hover:ring-amber-400 transition-all"
                      />
                      {(canManageFamily || member.id === currentUser?.id) && (
                        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow-md">
                          <Camera className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{member.name}</span>
                        {member.id === currentUser?.id && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-md font-bold border border-indigo-500/30">
                            YOU
                          </span>
                        )}
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md font-semibold">
                          {member.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{member.relationship}</div>
                      <div className="text-[10px] text-indigo-400 mt-0.5 font-medium">
                        {member.role === 'FAMILY_HEAD'
                          ? '👑 Family Head (Master Access)'
                          : member.role === 'SPOUSE'
                          ? 'Full Co-Admin Access'
                          : `${member.permissions?.length || 0} permissions granted`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(canManageFamily || member.id === currentUser?.id) && (
                      <button
                        onClick={() => openEditMember(member)}
                        className="p-2 bg-slate-700/80 hover:bg-slate-600 text-slate-200 rounded-xl text-xs transition-colors"
                        title="Edit Profile & Avatar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManageFamily && member.role !== 'FAMILY_HEAD' && (
                      <button
                        onClick={() => openPermissions(member)}
                        className="p-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-xs border border-indigo-500/40 transition-colors"
                        title="Manage Permissions"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 2. FAMILY TREE SUBTAB */}
      {activeSubTab === 'TREE' && (
        <div className="space-y-4">
          <div className="text-xs font-bold text-slate-400 uppercase">Interactive Generational Tree</div>

          <div className="space-y-4">
            {treeData.map((gen) => (
              <div key={gen.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <GitFork className="w-4 h-4" />
                  <span>{gen.title} (Generation {gen.generation})</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {gen.members?.map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2.5 p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                      <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-bold text-white">{m.name}</div>
                        <div className="text-[10px] text-slate-400">{m.relationship}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. TASKS SUBTAB */}
      {activeSubTab === 'TASKS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Family Tasks & Chores</span>
            {canEditTasks && (
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-1 text-amber-400 hover:underline font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => canEditTasks && toggleTask(task.id)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  task.status === 'COMPLETED'
                    ? 'bg-slate-800/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      task.status === 'COMPLETED' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                    }`}
                  >
                    {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${task.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-white'}`}>
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Assigned: <span className="text-slate-200">{task.assigned_to_name}</span> • Due: {task.due_date}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === 'HIGH'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. WISH LIST SUBTAB */}
      {activeSubTab === 'WISHLIST' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Shared Family Wish List ({groceryItems.length})</span>
            <button
              onClick={() => setShowAddGrocery(true)}
              className="flex items-center gap-1 text-amber-400 hover:underline font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to Wish List</span>
            </button>
          </div>

          <div className="space-y-2">
            {groceryItems.length === 0 ? (
              <div
                onClick={() => setShowAddGrocery(true)}
                className="p-6 rounded-3xl bg-slate-800/60 border border-dashed border-slate-700 text-center cursor-pointer hover:border-amber-400 hover:bg-slate-800/90 transition-all space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">Family Wish List is Empty</div>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Add items, books, gadgets, groceries, or gifts any family member wishes to get.
                </p>
                <button className="px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold inline-flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add First Wish
                </button>
              </div>
            ) : (
              groceryItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    item.is_purchased
                      ? 'bg-slate-800/40 border-slate-800/60 opacity-60'
                      : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                  }`}
                >
                  <div
                    onClick={() => toggleGrocery(item.id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden mr-2"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        item.is_purchased ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                      }`}
                    >
                      {item.is_purchased && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className={`text-xs font-bold truncate ${item.is_purchased ? 'line-through text-slate-500' : 'text-white'}`}>
                        {item.item_name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        Added by <span className="text-amber-300 font-semibold">{item.added_by_name}</span> • {item.created_at ? formatDate(item.created_at) : '12 Sep 2026'}
                        {item.quantity && item.quantity !== '1 unit' && item.quantity !== '1 pack' && ` (${item.quantity})`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                      {item.category || 'WISH'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteGrocery(item.id, e)}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 active:scale-90 transition-all z-10"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. MAINTENANCE SUBTAB */}
      {activeSubTab === 'MAINTENANCE' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Household Equipment Maintenance ({maintenanceItems.length})</span>
            <button
              onClick={() => setShowAddMaintenance(true)}
              className="flex items-center gap-1 text-amber-400 hover:underline font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {maintenanceItems.length === 0 ? (
              <div
                onClick={() => setShowAddMaintenance(true)}
                className="p-6 rounded-3xl bg-slate-800/60 border border-dashed border-slate-700 text-center cursor-pointer hover:border-amber-400 hover:bg-slate-800/90 transition-all space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">No Household Equipment Tracked</div>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Track service dates, filter replacements, and warranty for ACs, RO water purifiers, inverters, chimneys, and vehicles.
                  </p>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold rounded-xl text-xs shadow-lg inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Equipment & Service
                </button>
              </div>
            ) : (
              maintenanceItems.map((maint) => (
                <div key={maint.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{maint.item_name}</span>
                        <span className="text-[9px] bg-slate-700 text-indigo-300 px-2 py-0.5 rounded font-semibold uppercase">
                          {maint.service_type || 'APPLIANCE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <span>Last serviced: {maint.last_service_date ? formatDate(maint.last_service_date) : 'N/A'}</span>
                        <span>•</span>
                        <span>Every {maint.recurring_interval_months || 6}m</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        Due: {maint.next_service_due ? formatDate(maint.next_service_due) : 'Upcoming'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteMaintenance(maint.id, e)}
                        className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 active:scale-90 transition-all"
                        title="Delete Equipment"
                      >
                        <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                      </button>
                    </div>
                  </div>

                  {(maint.service_provider || maint.contact_phone) && (
                    <div className="flex items-center justify-between text-[11px] bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-slate-300 truncate">
                        <span className="text-slate-500">Service:</span> {maint.service_provider || 'Authorized Technician'}
                      </div>
                      {maint.contact_phone && (
                        <a
                          href={`tel:${maint.contact_phone}`}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1 shrink-0 ml-2"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{maint.contact_phone}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {maint.notes && (
                    <div className="text-[11px] text-slate-400 italic bg-slate-800/40 p-2 rounded-lg">
                      Note: {maint.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. EMERGENCY VAULT SUBTAB */}
      {activeSubTab === 'EMERGENCY' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-rose-950/40 border border-rose-500/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Emergency Mode & Critical Cards</h3>
            </div>
            <p className="text-xs text-slate-300">
              Instant 1-tap dial for doctors, ambulance, hospital TPA, and critical allergies.
            </p>
          </div>

          {/* Quick Contacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Emergency Contacts ({emergencyContacts.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingContact(null);
                  setContactForm({
                    name: '',
                    relationship: 'Family Doctor',
                    phone: '',
                    secondary_phone: '',
                    email: '',
                    type: 'PERSONAL',
                    address: '',
                    is_primary: false,
                  });
                  setShowAddContact(true);
                }}
                className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-2.5 py-1 rounded-lg border border-emerald-500/30 text-xs font-bold transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            {emergencyContacts.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">No Emergency Contacts Added</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Add doctors, ambulance, hospital TPA, or family members.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingContact(null);
                    setContactForm({
                      name: '',
                      relationship: 'Family Doctor',
                      phone: '',
                      secondary_phone: '',
                      email: '',
                      type: 'DOCTOR',
                      address: '',
                      is_primary: false,
                    });
                    setShowAddContact(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Contact</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between gap-3 shadow-sm hover:border-slate-600 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white truncate">{contact.name}</span>
                        <span className="text-[9px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-semibold">
                          {contact.relationship}
                        </span>
                        {contact.type && contact.type !== 'PERSONAL' && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold">
                            {contact.type}
                          </span>
                        )}
                        {contact.is_primary && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                            ★ PRIMARY
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-amber-400 font-mono font-bold">{contact.phone}</div>
                      {contact.secondary_phone && (
                        <div className="text-[10px] text-slate-400 font-mono">Alt: {contact.secondary_phone}</div>
                      )}
                      {contact.address && (
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">📍 {contact.address}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform"
                        title="Call Contact"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditContact(contact)}
                        className="p-2.5 bg-slate-700/80 hover:bg-slate-600 text-slate-200 rounded-xl transition-colors"
                        title="Edit Contact"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        className="p-2.5 bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-xl transition-colors"
                        title="Delete Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medical Profiles & Critical Allergy Warning */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Medical Profiles & Allergies ({emergencyProfiles.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProfile(null);
                  setProfileForm({
                    full_name: '',
                    blood_group: 'O+',
                    allergies: '',
                    chronic_conditions: '',
                    medications: '',
                    primary_doctor: '',
                    insurance_summary: '',
                    special_instructions: '',
                  });
                  setShowAddProfile(true);
                }}
                className="flex items-center gap-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-2.5 py-1 rounded-lg border border-rose-500/30 text-xs font-bold transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medical Profile</span>
              </button>
            </div>

            {emergencyProfiles.length === 0 ? (
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-center space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">No Medical Profiles Added</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Store blood groups, critical allergies, medications, and insurance.</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProfile(null);
                    setProfileForm({
                      full_name: '',
                      blood_group: 'O+',
                      allergies: '',
                      chronic_conditions: '',
                      medications: '',
                      primary_doctor: '',
                      insurance_summary: '',
                      special_instructions: '',
                    });
                    setShowAddProfile(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md inline-flex items-center gap-1 transition-transform active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Medical Profile</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {emergencyProfiles.map((prof) => (
                  <div key={prof.id} className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{prof.full_name}</span>
                        <span className="text-[11px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md">
                          🩸 Blood: {prof.blood_group || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditProfile(prof)}
                          className="p-1.5 bg-slate-700/80 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                          title="Edit Medical Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(prof.id, prof.full_name)}
                          className="p-1.5 bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-colors"
                          title="Delete Medical Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {prof.allergies && (
                        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
                          <strong className="text-rose-400">⚠️ Critical Allergies:</strong> {prof.allergies}
                        </div>
                      )}
                      {prof.chronic_conditions && (
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                          <strong className="text-slate-400">Conditions:</strong> {prof.chronic_conditions}
                        </div>
                      )}
                      {prof.medications && (
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                          <strong className="text-slate-400">Medications:</strong> {prof.medications}
                        </div>
                      )}
                      {prof.primary_doctor && (
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                          <strong className="text-slate-400">Doctor:</strong> {prof.primary_doctor}
                        </div>
                      )}
                      {prof.insurance_summary && (
                        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 sm:col-span-2">
                          <strong className="text-indigo-400">🛡️ Insurance Policy:</strong> {prof.insurance_summary}
                        </div>
                      )}
                    </div>

                    {prof.special_instructions && (
                      <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium">
                        ⚠️ <strong>Instructions:</strong> {prof.special_instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Management Modal (Family Head Only) */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={showPermissionsModal.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={showPermissionsModal.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/50"
                />
                <div>
                  <h3 className="text-base font-extrabold text-white">Manage Permissions</h3>
                  <p className="text-xs text-slate-400">
                    Access for <strong className="text-amber-400">{showPermissionsModal.name}</strong> ({showPermissionsModal.relationship || showPermissionsModal.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSavingPermissions && setShowPermissionsModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets & Status */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Presets</span>
                <span className="text-[11px] font-bold text-indigo-400">
                  {selectedPermissions.length} of {allAvailablePermissions.length} granted
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPermissions([
                      'FINANCE_VIEW',
                      'FINANCE_EDIT',
                      'DOCUMENT_VIEW',
                      'CALENDAR_VIEW',
                      'TASK_VIEW',
                      'TASK_EDIT',
                      'MEMORY_VIEW',
                      'AI_USE',
                      'EMERGENCY_VIEW',
                    ])
                  }
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-[11px] font-semibold text-indigo-300 transition-colors"
                >
                  🌟 Standard Adult
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPermissions(['TASK_VIEW', 'TASK_EDIT', 'MEMORY_VIEW', 'AI_USE'])
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300 transition-colors"
                >
                  👶 Kids / Chores
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPermissions([
                      'FINANCE_VIEW',
                      'INVESTMENT_VIEW',
                      'DOCUMENT_VIEW',
                      'EMERGENCY_VIEW',
                      'CALENDAR_VIEW',
                      'TASK_VIEW',
                      'MEMORY_VIEW',
                    ])
                  }
                  className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 border border-amber-500/30 text-[11px] font-semibold text-amber-300 transition-colors"
                >
                  👁️ View Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions(allAvailablePermissions.map((p) => p.code))}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-[11px] font-semibold text-purple-300 transition-colors"
                >
                  👑 Full Master
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions([])}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/30 text-[11px] font-semibold text-rose-300 transition-colors"
                >
                  🚫 Revoke All
                </button>
              </div>
            </div>

            {/* Scrollable Permissions List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {allAvailablePermissions.map((perm) => {
                const isChecked = selectedPermissions.includes(perm.code);
                return (
                  <div
                    key={perm.code}
                    onClick={() => {
                      if (isChecked) {
                        setSelectedPermissions(selectedPermissions.filter((c) => c !== perm.code));
                      } else {
                        setSelectedPermissions([...selectedPermissions, perm.code]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{perm.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-700/60 font-semibold text-slate-300">
                          {perm.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">{perm.code}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600 bg-slate-900/50'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex gap-2 pt-3 border-t border-slate-800 shrink-0">
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={() => setShowPermissionsModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={savePermissions}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isSavingPermissions ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Save Permissions</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Member Review & Approve Modal (Family Head Only) */}
      {approvingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={approvingMember.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={approvingMember.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-500/50"
                />
                <div>
                  <h3 className="text-base font-extrabold text-white">Approve Access</h3>
                  <p className="text-xs text-slate-400">
                    Grant permissions for <strong className="text-amber-400">{approvingMember.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovingMember(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {/* Role & Relationship Selectors */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300">Family Role</label>
                  <select
                    value={approvalRole}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setApprovalRole(newRole);
                      if (newRole === 'CHILD') {
                        setApprovalPermissions(['TASK_VIEW', 'TASK_EDIT', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'AI_USE']);
                      } else if (newRole === 'SPOUSE') {
                        setApprovalPermissions(allAvailablePermissions.map((p) => p.code));
                      } else if (newRole === 'VIEWER') {
                        setApprovalPermissions(['FINANCE_VIEW', 'DOCUMENT_VIEW', 'EMERGENCY_VIEW', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'TASK_VIEW']);
                      } else {
                        setApprovalPermissions([
                          'FINANCE_VIEW',
                          'FINANCE_EDIT',
                          'INVESTMENT_VIEW',
                          'DOCUMENT_VIEW',
                          'DOCUMENT_UPLOAD',
                          'EMERGENCY_VIEW',
                          'MEMORY_VIEW',
                          'CALENDAR_VIEW',
                          'TASK_VIEW',
                          'TASK_EDIT',
                          'AI_USE',
                        ]);
                      }
                    }}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="ADULT">Adult Member</option>
                    <option value="SPOUSE">Spouse / Co-Admin</option>
                    <option value="CHILD">Child / Dependent</option>
                    <option value="VIEWER">Viewer Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300">Relationship</label>
                  <input
                    type="text"
                    value={approvalRelationship}
                    onChange={(e) => setApprovalRelationship(e.target.value)}
                    placeholder="e.g. Son, Daughter, Mother"
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">Quick Permission Presets</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions([
                        'FINANCE_VIEW',
                        'FINANCE_EDIT',
                        'INVESTMENT_VIEW',
                        'DOCUMENT_VIEW',
                        'DOCUMENT_UPLOAD',
                        'EMERGENCY_VIEW',
                        'MEMORY_VIEW',
                        'CALENDAR_VIEW',
                        'TASK_VIEW',
                        'TASK_EDIT',
                        'AI_USE',
                      ]);
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
                  >
                    🌟 Standard Adult
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions(['TASK_VIEW', 'TASK_EDIT', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'AI_USE']);
                    }}
                    className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                  >
                    👶 Kids / Chores Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions(['FINANCE_VIEW', 'DOCUMENT_VIEW', 'EMERGENCY_VIEW', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'TASK_VIEW']);
                    }}
                    className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-600 hover:bg-slate-600 transition-colors"
                  >
                    👁️ View Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions(allAvailablePermissions.map((p) => p.code));
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 hover:bg-amber-500/30 transition-colors"
                  >
                    👑 Full Master
                  </button>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                  Select Modules ({approvalPermissions.length} enabled)
                </label>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {allAvailablePermissions.map((perm) => {
                    const isChecked = approvalPermissions.includes(perm.code);
                    return (
                      <div
                        key={perm.code}
                        onClick={() => {
                          if (isChecked) {
                            setApprovalPermissions(approvalPermissions.filter((c) => c !== perm.code));
                          } else {
                            setApprovalPermissions([...approvalPermissions, perm.code]);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold">{perm.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{perm.code}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-600'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setApprovingMember(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveMemberSubmit}
                disabled={isApprovingSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {isApprovingSubmitting ? 'Approving...' : '✓ Approve & Grant Access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Family Task</h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Honda City Car"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Assign To</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="All Family">All Family</option>
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.relationship || m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-semibold">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Profile & Avatar Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Edit Member Profile & Photo</h3>
                <p className="text-[11px] text-slate-400">Update photo, name, and details for {editingMember.name}</p>
              </div>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            {/* Hidden native file inputs */}
            <input
              type="file"
              ref={editGalleryRef}
              onChange={(e) => handleAvatarFileSelected(e, 'edit')}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={editCameraRef}
              onChange={(e) => handleAvatarFileSelected(e, 'edit')}
              accept="image/*"
              capture="user"
              className="hidden"
            />

            <form onSubmit={handleSaveMemberProfile} className="space-y-4">
              {/* Avatar Preview & Selection */}
              <div className="space-y-2.5">
                <label className="text-xs text-slate-300 font-semibold block">Choose Profile Picture / Avatar</label>
                
                <div className="flex items-center gap-3 bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                  <img
                    src={memberProfileForm.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt="Preview"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-amber-400 shadow-md"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editGalleryRef.current?.click()}
                        className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Choose from Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editCameraRef.current?.click()}
                        className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Camera</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">Or pick from preset avatars below</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMemberProfileForm({ ...memberProfileForm, avatar_url: preset.url })}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                        memberProfileForm.avatar_url === preset.url
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                          : 'border-slate-700 hover:border-slate-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-12 object-cover rounded-lg" />
                      <span className="block text-[9px] text-center truncate text-slate-300 font-medium mt-0.5">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="pt-1">
                  <label className="text-[11px] text-slate-400 font-medium">Or Custom Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={memberProfileForm.avatar_url}
                    onChange={(e) => setMemberProfileForm({ ...memberProfileForm, avatar_url: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Full Name</label>
                <input
                  type="text"
                  required
                  value={memberProfileForm.name}
                  onChange={(e) => setMemberProfileForm({ ...memberProfileForm, name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Relationship</label>
                  <input
                    type="text"
                    value={memberProfileForm.relationship}
                    onChange={(e) => setMemberProfileForm({ ...memberProfileForm, relationship: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={memberProfileForm.phone}
                    onChange={(e) => setMemberProfileForm({ ...memberProfileForm, phone: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Add Family Member</h3>
                <p className="text-[11px] text-slate-400">Add a parent, grandparent, teen, or child to your family</p>
              </div>
              <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            {/* Hidden native file inputs for Add Member */}
            <input
              type="file"
              ref={addGalleryRef}
              onChange={(e) => handleAvatarFileSelected(e, 'add')}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={addCameraRef}
              onChange={(e) => handleAvatarFileSelected(e, 'add')}
              accept="image/*"
              capture="user"
              className="hidden"
            />

            <form onSubmit={handleAddMember} className="space-y-3.5">
              {/* Avatar selection */}
              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-semibold block">Select Avatar / Photo</label>
                
                <div className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80">
                  <img
                    src={newMemberData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt="Preview"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-400 shadow"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addGalleryRef.current?.click()}
                      className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5 text-indigo-300" />
                      <span>From Gallery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => addCameraRef.current?.click()}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Camera</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNewMemberData({ ...newMemberData, avatar_url: preset.url })}
                      className={`relative group rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                        newMemberData.avatar_url === preset.url
                          ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105'
                          : 'border-slate-700 hover:border-slate-500 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-11 object-cover rounded-lg" />
                      <span className="block text-[9px] text-center truncate text-slate-300 font-medium mt-0.5">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Relationship</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mother, Son, Dadi"
                    value={newMemberData.relationship}
                    onChange={(e) => setNewMemberData({ ...newMemberData, relationship: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Role & Permissions</label>
                  <select
                    value={newMemberData.role}
                    onChange={(e) => setNewMemberData({ ...newMemberData, role: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="SPOUSE">Co-Head / Spouse (Full Access)</option>
                    <option value="ADULT">Adult (General Access)</option>
                    <option value="CHILD">Teen / Child (Protected)</option>
                    <option value="VIEWER">Grandparent / Elder (Care)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={newMemberData.email}
                  onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Wish List Modal */}
      {showAddGrocery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Add to Family Wish List</h3>
              </div>
              <button onClick={() => setShowAddGrocery(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleAddGrocery} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Wish Item / Product *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Earbuds, Harry Potter Book, Bicycle, Milk"
                  value={newGroceryName}
                  onChange={(e) => setNewGroceryName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Category</label>
                  <select
                    value={newGroceryCategory}
                    onChange={(e) => setNewGroceryCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="WISH">🎁 Wish / Gift</option>
                    <option value="GADGET">📱 Gadget / Tech</option>
                    <option value="SHOPPING">🛍️ Shopping / Clothes</option>
                    <option value="BOOK">📚 Books / Study</option>
                    <option value="GROCERY">🛒 Grocery / Food</option>
                    <option value="HOME">🏡 Home & Living</option>
                    <option value="OTHER">✨ Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Note / Detail</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 unit / Birthday wish"
                    value={newGroceryQty}
                    onChange={(e) => setNewGroceryQty(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Add to Wish List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Maintenance / Equipment Modal */}
      {showAddMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Add Equipment & Service</h3>
                  <p className="text-[11px] text-slate-400">Track service schedules, filter changes & warranties</p>
                </div>
              </div>
              <button onClick={() => setShowAddMaintenance(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleAddMaintenance} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Equipment / Appliance Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Living Room Daikin AC / Kent RO Purifier / Honda City"
                  value={newMaintenance.item_name}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, item_name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Category</label>
                  <select
                    value={newMaintenance.service_type}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, service_type: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="APPLIANCE">❄️ AC / Appliance</option>
                    <option value="WATER_PURIFIER">💧 RO Water Purifier</option>
                    <option value="VEHICLE">🚗 Car / Bike Service</option>
                    <option value="ELECTRICAL">⚡ Inverter / Solar</option>
                    <option value="PLUMBING">🔧 Plumbing / Chimney</option>
                    <option value="OTHER">🛠️ Other Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Service Frequency</label>
                  <select
                    value={newMaintenance.recurring_interval_months}
                    onChange={(e) => {
                      const interval = Number(e.target.value) || 6;
                      const d = new Date(newMaintenance.last_service_date || Date.now());
                      d.setMonth(d.getMonth() + interval);
                      setNewMaintenance({
                        ...newMaintenance,
                        recurring_interval_months: e.target.value,
                        next_service_due: getLocalDateString(d),
                      });
                    }}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  >
                    <option value="3">Every 3 Months</option>
                    <option value="6">Every 6 Months</option>
                    <option value="12">Every 1 Year (Annual)</option>
                    <option value="24">Every 2 Years</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Last Serviced Date</label>
                  <input
                    type="date"
                    value={newMaintenance.last_service_date}
                    onChange={(e) => {
                      const dateVal = e.target.value;
                      const interval = Number(newMaintenance.recurring_interval_months) || 6;
                      const d = new Date(dateVal || Date.now());
                      d.setMonth(d.getMonth() + interval);
                      setNewMaintenance({
                        ...newMaintenance,
                        last_service_date: dateVal,
                        next_service_due: getLocalDateString(d),
                      });
                    }}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Next Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newMaintenance.next_service_due}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, next_service_due: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-amber-300 font-semibold outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Service Provider / Tech</label>
                  <input
                    type="text"
                    placeholder="e.g. Daikin Service / Urban Co"
                    value={newMaintenance.service_provider}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, service_provider: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Technician Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={newMaintenance.contact_phone}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, contact_phone: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Notes / Warranty Details</label>
                <input
                  type="text"
                  placeholder="e.g. Free warranty service till 2027, carbon filter model #491"
                  value={newMaintenance.notes}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMaintenance(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Emergency Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Phone className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Contact / Doctor / Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma / Apollo Emergency"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Relationship / Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pediatrician, Uncle, Hospital TPA"
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Category Type</label>
                  <select
                    value={contactForm.type}
                    onChange={(e) => setContactForm({ ...contactForm, type: e.target.value as any })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="PERSONAL">Family / Relative</option>
                    <option value="DOCTOR">Doctor / Physician</option>
                    <option value="HOSPITAL">Hospital / Clinic</option>
                    <option value="AMBULANCE">Ambulance Service</option>
                    <option value="POLICE">Police / Helpline</option>
                    <option value="INSURANCE">Insurance TPA</option>
                    <option value="OTHER">Other Service</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Primary Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Secondary Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional backup phone"
                    value={contactForm.secondary_phone}
                    onChange={(e) => setContactForm({ ...contactForm, secondary_phone: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Email Address</label>
                <input
                  type="email"
                  placeholder="Optional email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Address / Hospital Location</label>
                <input
                  type="text"
                  placeholder="e.g. Road No 36, Jubilee Hills, Hyderabad"
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="contact_is_primary"
                  checked={contactForm.is_primary}
                  onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-0"
                />
                <label htmlFor="contact_is_primary" className="text-xs text-slate-300 cursor-pointer">
                  Mark as Primary Emergency Contact (1-Tap Dial Priority)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContact(false);
                    setEditingContact(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/30 transition-all active:scale-95"
                >
                  {editingContact ? 'Save Changes' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Medical Profile Modal */}
      {showAddProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">
                  {editingProfile ? 'Edit Medical Profile' : 'Add Medical Profile & Allergies'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddProfile(false);
                  setEditingProfile(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Family Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh / Priya"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Blood Group *</label>
                  <select
                    value={profileForm.blood_group}
                    onChange={(e) => setProfileForm({ ...profileForm, blood_group: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-rose-400 font-bold outline-none focus:border-rose-500"
                  >
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Critical Allergies ⚠️</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Dust, Sulfa drugs"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-rose-300 outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes, Asthma"
                    value={profileForm.chronic_conditions}
                    onChange={(e) => setProfileForm({ ...profileForm, chronic_conditions: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Ongoing Medications</label>
                  <input
                    type="text"
                    placeholder="e.g. Inhaler, Metformin 500mg"
                    value={profileForm.medications}
                    onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Primary Doctor / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Verma (9876543210)"
                    value={profileForm.primary_doctor}
                    onChange={(e) => setProfileForm({ ...profileForm, primary_doctor: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Insurance Policy Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Star Health #POL-8842"
                    value={profileForm.insurance_summary}
                    onChange={(e) => setProfileForm({ ...profileForm, insurance_summary: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Special Instructions for EMTs</label>
                <input
                  type="text"
                  placeholder="e.g. Always carry epipen in left backpack pouch; pacemaker fitted"
                  value={profileForm.special_instructions}
                  onChange={(e) => setProfileForm({ ...profileForm, special_instructions: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProfile(false);
                    setEditingProfile(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 transition-all active:scale-95"
                >
                  {editingProfile ? 'Save Medical Card' : 'Add Medical Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

