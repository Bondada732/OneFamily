import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useTheme } from '../../context/ThemeContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { formatDate, getLocalDateString } from '../../utils/formatters.js';
import { CustomDatePicker } from '../../components/common/CustomDatePicker.js';
import { CustomSelect } from '../../components/common/CustomSelect.js';
import { FamilyMember, TaskItem, GroceryItem, MaintenanceItem, EmergencyContact, EmergencyProfile } from '../../types/index.js';
import { Users, CheckSquare, ShoppingCart, Wrench, ShieldAlert, Phone, Plus, Check, ShieldCheck, Heart, UserPlus, GitFork, ChevronRight, ChevronDown, ChevronUp, Lock, Camera, Edit3, User, Upload, Image as ImageIcon, Gift, Trash2, Tag, Copy, Share2, KeyRound, RotateCw, X, AlertTriangle, Loader2, UserMinus } from 'lucide-react';
import { FamilyFriendsView } from '../FamilyFriends/FamilyFriendsView.js';

export const FamilyView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission, familyMembers, refreshUser, regenerateFamilyKey, approveMember, rejectMember, updateMemberPermissions } = useAuth();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'MEMBERS' | 'FRIENDS' | 'TREE' | 'TASKS' | 'WISHLIST' | 'MAINTENANCE' | 'EMERGENCY'>('MEMBERS');
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
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [memberProfileForm, setMemberProfileForm] = useState({
    name: '',
    avatar_url: '',
    relationship: '',
    phone: '',
    birth_date: '1990-01-01',
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
  const [customGroceryCat, setCustomGroceryCat] = useState('');
  const [newGroceryQty, setNewGroceryQty] = useState('1 unit');
  const [newGroceryPrice, setNewGroceryPrice] = useState('');

  // Dynamic list of unique categories across default + custom wishlist items
  const availableWishCategories = useMemo(() => {
    const base = [
      { id: 'WISH', name: '🎁 Wish / Gift' },
      { id: 'GADGET', name: '📱 Gadget / Tech' },
      { id: 'SHOPPING', name: '🛍️ Shopping / Clothes' },
      { id: 'BOOK', name: '📚 Books / Study' },
      { id: 'GROCERY', name: '🛒 Grocery / Food' },
      { id: 'HOME', name: '🏡 Home & Living' },
      { id: 'VEHICLE', name: '🚗 Vehicle & Bike' },
      { id: 'TRAVEL', name: '✈️ Trip & Vacation' },
      { id: 'APPLIANCE', name: '📺 TV & Appliance' },
    ];
    const map = new Map<string, string>();
    base.forEach((b) => map.set(b.id, b.name));

    groceryItems.forEach((item) => {
      if (item.category && !map.has(item.category) && !base.some((b) => b.id.toUpperCase() === item.category.toUpperCase())) {
        const cleanName = item.category.startsWith('CAT_') ? 'Custom' : item.category;
        map.set(item.category, `✨ ${cleanName}`);
      }
    });

    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [groceryItems]);

  // Editing Modals State (Family Head or TASK_EDIT permitted)
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [editingGrocery, setEditingGrocery] = useState<GroceryItem | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState<MaintenanceItem | null>(null);

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

  const handleDeleteTask = async (taskId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await apiRequest(`/tasks/${family?.id}/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !family?.id) return;
    try {
      const updated = await apiRequest(`/tasks/${family.id}/tasks/${editingTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingTask),
      });
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t)));
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to update task:', err);
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

  const handleUpdateGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrocery || !family?.id) return;
    try {
      const updated = await apiRequest(`/tasks/${family.id}/grocery/${editingGrocery.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingGrocery),
      });
      setGroceryItems((prev) => prev.map((g) => (g.id === editingGrocery.id ? { ...g, ...updated } : g)));
      setEditingGrocery(null);
    } catch (err) {
      console.error('Failed to update wish item:', err);
    }
  };

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim() || !family?.id) return;

    try {
      const categoryToUse = (newGroceryCategory === '__CUSTOM__' && customGroceryCat.trim()
        ? customGroceryCat.trim()
        : newGroceryCategory) || 'WISH';

      const created = await apiRequest(`/tasks/${family.id}/grocery`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: newGroceryName.trim(),
          quantity: newGroceryPrice ? `₹${Number(newGroceryPrice).toLocaleString('en-IN')}` : (newGroceryQty || '1 unit'),
          category: categoryToUse,
          estimated_cost: Number(newGroceryPrice) || 0,
        }),
      });
      setGroceryItems([...groceryItems, created]);
      setNewGroceryName('');
      setNewGroceryQty('1 unit');
      setNewGroceryPrice('');
      setNewGroceryCategory('WISH');
      setCustomGroceryCat('');
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

  const handleUpdateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaintenance || !family?.id) return;
    try {
      const updated = await apiRequest(`/tasks/${family.id}/maintenance/${editingMaintenance.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingMaintenance),
      });
      setMaintenanceItems((prev) => prev.map((m) => (m.id === editingMaintenance.id ? { ...m, ...updated } : m)));
      setEditingMaintenance(null);
    } catch (err) {
      console.error('Failed to update maintenance item:', err);
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
      birth_date: member.birth_date || '1990-01-01',
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

  const handleConfirmRemoveMember = async () => {
    if (!memberToDelete || !family?.id) return;
    try {
      setIsDeletingMember(true);
      await apiRequest(`/families/${family.id}/members/${memberToDelete.id}`, {
        method: 'DELETE',
      });
      setMemberToDelete(null);
      if (editingMember?.id === memberToDelete.id) {
        setEditingMember(null);
      }
      await refreshUser();
    } catch (err: any) {
      console.error('Failed to remove member:', err);
      alert(err?.message || 'Failed to remove member');
    } finally {
      setIsDeletingMember(false);
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
    <div className={`p-4 space-y-4 animate-fade-in pb-24 ${
      isLight ? 'text-[#2A1B14]' : 'text-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-extrabold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Family</h2>
          <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Together Always • {family?.name || 'One Family'}</p>
        </div>
        {canManageFamily && (
          <button
            onClick={() => setShowAddMember(true)}
            className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-sm border ${
              isLight
                ? 'bg-[#F05A28] text-white border-[#F05A28] hover:bg-[#E76F3C]'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
            }`}
            title="Add Family Member"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Horizontal Story-style Member Avatars */}
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
                    ? isLight ? 'border-[#C25425] ring-2 ring-[#C25425]/30' : 'border-amber-400 ring-2 ring-amber-400/30'
                    : isLight ? 'border-[#EAD6C4] group-hover:border-[#C25425]' : 'border-indigo-500/80 group-hover:border-amber-400'
                }`}
              />
              {member.role === 'FAMILY_HEAD' && (
                <span className={`absolute -bottom-1 -right-1 text-[8px] font-black px-1 rounded-full shadow-sm ${
                  isLight ? 'bg-[#F05A28] text-white' : 'bg-amber-500 text-slate-950'
                }`}>
                  👑
                </span>
              )}
            </div>
            <span className={`text-xs font-bold truncate max-w-[64px] ${isLight ? 'text-[#1F1F1F] group-hover:text-[#D3542F]' : 'text-white group-hover:text-amber-300'}`}>
              {member.name.split(' ')[0]}
            </span>
            <span className={`text-[10px] truncate max-w-[64px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              {member.role === 'FAMILY_HEAD' ? 'Family Head' : member.relationship || 'Member'}
            </span>
          </div>
        ))}
      </div>

      {/* Sub Tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-2xl overflow-x-auto scrollbar-none border ${
        isLight
          ? 'bg-[#EAD8C7] border-[#DEC8B2] shadow-inner'
          : 'bg-slate-800/80 border border-slate-700/80'
      }`}>
        {(['MEMBERS', 'FRIENDS', 'TREE', 'TASKS', 'WISHLIST', 'MAINTENANCE', 'EMERGENCY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === tab
                ? isLight
                  ? 'bg-[#F05A28] text-white shadow-md'
                  : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                : isLight
                  ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                  : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab === 'WISHLIST' ? 'WISH LIST' : tab === 'FRIENDS' ? 'FRIENDS & DATES 🎂' : tab}
          </button>
        ))}
      </div>

      {/* 1. MEMBERS SUBTAB */}
      {activeSubTab === 'MEMBERS' && (
        <div className="space-y-3.5">
          {/* Family Secret Key & Invite Card (Visible ONLY to Family Head, collapsible by default) */}
          {currentUser?.role === 'FAMILY_HEAD' && (
            <div className={`rounded-3xl border-2 shadow-xl overflow-hidden transition-all kinora-3d-card ${
              isLight
                ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[3px] border-b-[#DEC8B2]'
                : 'bg-gradient-to-br from-slate-800/95 via-indigo-950/40 to-slate-900 border-amber-500/40'
            }`}>
              <button
                type="button"
                onClick={() => setIsSecretKeyExpanded(!isSecretKeyExpanded)}
                className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                  isLight ? 'hover:bg-white/20' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 kinora-3d-icon-box ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  }`}>
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                        Family Secret Key
                      </h3>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                        isLight
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        HEAD ONLY
                      </span>
                    </div>
                    <p className={`text-[10px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      {isSecretKeyExpanded
                        ? 'Share with family members to let them join'
                        : 'Tap to view secret key & invite family members'}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl shrink-0 border ${
                  isLight
                    ? 'bg-[#FFF8F1] text-[#8C5228] border-[#DEC8B2] kinora-3d-tile'
                    : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                }`}>
                  <span>{isSecretKeyExpanded ? 'Hide Key' : 'Show Key'}</span>
                  {isSecretKeyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isSecretKeyExpanded && (
                <div className={`p-4 pt-0 space-y-3 border-t mt-1 animate-fade-in ${
                  isLight ? 'border-[#DEC8B2]' : 'border-slate-800/80'
                }`}>
                  <div className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                    isLight
                      ? 'bg-[#FFF8F1] border-[#EAD6C4]'
                      : 'bg-slate-900/90 border-slate-700/80'
                  }`}>
                    <div className={`font-mono text-sm sm:text-base font-black tracking-widest pl-2 select-all ${
                      isLight ? 'text-[#B84A1E]' : 'text-amber-400'
                    }`}>
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
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 border ${
                          isLight
                            ? 'bg-[#F4EDE4] hover:bg-[#EAE0D5] text-[#1F1F1F] border-[#EAD6C4]'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        {keyCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className={`w-3.5 h-3.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`} />}
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

                  <div className={`flex items-center justify-between text-[11px] px-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
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
                        className={`p-1 px-2 rounded-lg transition-colors text-[10px] flex items-center gap-1 border shrink-0 ml-2 ${
                          isLight
                            ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#B84A1E] border-[#DEC8B2]'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 border-slate-700'
                        }`}
                        title="Regenerate Family Key"
                      >
                        <RotateCw className={`w-3 h-3 ${isRotatingKey ? 'animate-spin text-amber-500' : ''}`} />
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
            <div className={`p-4 rounded-3xl border-2 shadow-xl space-y-3 animate-fade-in kinora-3d-card ${
              isLight
                ? 'bg-[#FFF8EE] border-amber-400/60 text-[#1F1F1F]'
                : 'bg-amber-500/10 border-amber-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center font-bold kinora-3d-icon-box ${
                    isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                  }`}>
                    ⏳
                  </div>
                  <div>
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                      Pending Access Requests ({familyMembers.filter((m) => m.is_approved === false || m.status === 'PENDING_APPROVAL').length})
                    </h3>
                    <p className={`text-[10px] ${isLight ? 'text-[#8C5228]' : 'text-amber-300/80'}`}>
                      Members joined with Secret Key awaiting your approval
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {familyMembers
                  .filter((m) => m.is_approved === false || m.status === 'PENDING_APPROVAL')
                  .map((member) => (
                    <div
                      key={member.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 shadow-md kinora-3d-tile ${
                        isLight
                          ? 'bg-[#FFF8F1] border-[#EAD6C4]'
                          : 'bg-slate-900/90 border-amber-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={member.name}
                          className={`w-10 h-10 rounded-2xl object-cover ring-2 ${
                            isLight ? 'ring-amber-400' : 'ring-amber-500/40'
                          }`}
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{member.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                              isLight ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}>
                              PENDING
                            </span>
                          </div>
                          <div className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                            {member.relationship || 'Member'} • Role: <strong className={isLight ? 'text-[#1F1F1F]' : 'text-slate-300'}>{member.role || 'ADULT'}</strong>
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
                          className={`px-3 py-1.5 font-extrabold rounded-xl text-[11px] shadow-md transition-transform active:scale-95 ${
                            isLight
                              ? 'bg-[#F05A28] hover:bg-[#E76F3C] text-white'
                              : 'bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950'
                          }`}
                        >
                          Review & Approve
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Reject and remove access request for ${member.name}?`)) {
                              await rejectMember(member.id);
                            }
                          }}
                          className={`p-1.5 rounded-xl border text-xs transition-colors ${
                            isLight
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                              : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/30'
                          }`}
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
            <span className={`font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              Approved Family Members ({familyMembers.filter((m) => m.is_approved !== false && m.status !== 'PENDING_APPROVAL').length})
            </span>
            {canManageFamily && (
              <button
                onClick={() => setShowAddMember(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  isLight
                    ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border-amber-300 shadow-sm'
                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/30'
                }`}
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
                  className={`p-3.5 rounded-2xl border flex items-center justify-between shadow-sm kinora-3d-tile ${
                    isLight
                      ? member.id === currentUser?.id
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-[0_6px_14px_-2px_rgba(130,80,45,0.12)]'
                        : 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2]'
                      : member.id === currentUser?.id
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
                        className={`w-11 h-11 rounded-2xl object-cover ring-2 transition-all ${
                          isLight ? 'ring-[#EAD6C4] group-hover:ring-[#F05A28]' : 'ring-slate-700 group-hover:ring-amber-400'
                        }`}
                      />
                      {(canManageFamily || member.id === currentUser?.id) && (
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full shadow-md ${
                          isLight ? 'bg-[#F05A28] text-white' : 'bg-amber-500 text-slate-950'
                        }`}>
                          <Camera className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{member.name}</span>
                        {member.id === currentUser?.id && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold border ${
                            isLight
                              ? 'bg-orange-100 text-[#F05A28] border-orange-300'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}>
                            YOU
                          </span>
                        )}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold border ${
                          isLight
                            ? 'bg-[#E2D0BE] text-[#4A382A] border-[#DEC8B2]'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {member.role}
                        </span>
                      </div>
                      <div className={`text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                        <span>{member.relationship}</span>
                        {member.birth_date && (
                          <span className={`font-medium px-1.5 py-0.5 rounded border text-[10px] inline-flex items-center gap-1 ${
                            isLight
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}>
                            <span>🎂</span>
                            <span>{formatDate(member.birth_date)}</span>
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] mt-0.5 font-medium ${isLight ? 'text-[#D3542F]' : 'text-indigo-400'}`}>
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
                        className={`p-2 rounded-xl text-xs transition-colors border ${
                          isLight
                            ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4] shadow-sm'
                            : 'bg-slate-700/80 hover:bg-slate-600 text-slate-200'
                        }`}
                        title="Edit Profile & Avatar"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManageFamily && member.role !== 'FAMILY_HEAD' && (
                      <button
                        onClick={() => openPermissions(member)}
                        className={`p-2 rounded-xl text-xs border transition-colors ${
                          isLight
                            ? 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800 border-indigo-300 shadow-sm'
                            : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border-indigo-500/40'
                        }`}
                        title="Manage Permissions"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {currentUser?.role === 'FAMILY_HEAD' && member.id !== currentUser?.id && (
                      <button
                        onClick={() => setMemberToDelete(member)}
                        className={`p-2 rounded-xl text-xs border transition-colors ${
                          isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300 shadow-sm'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border-rose-500/30'
                        }`}
                        title="Remove Member from Family"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 2. FAMILY & FRIENDS DATES & REMINDERS SUBTAB */}
      {activeSubTab === 'FRIENDS' && (
        <div className="animate-fade-in -mx-4 -mt-2">
          <FamilyFriendsView />
        </div>
      )}

      {/* 3. FAMILY TREE SUBTAB */}
      {activeSubTab === 'TREE' && (
        <div className="space-y-4">
          <div className={`text-xs font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
            Interactive Generational Tree
          </div>

          <div className="space-y-4">
            {treeData.map((gen) => (
              <div
                key={gen.id}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight
                    ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-sm'
                    : 'bg-slate-800/90 border-slate-700/80'
                }`}
              >
                <div className={`flex items-center gap-2 text-xs font-bold ${isLight ? 'text-[#D3542F]' : 'text-amber-400'}`}>
                  <GitFork className="w-4 h-4" />
                  <span>{gen.title} (Generation {gen.generation})</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {gen.members?.map((m: any) => (
                    <div
                      key={m.id}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${
                        isLight
                          ? 'bg-[#FFF8F1] border-[#EAD6C4] border-t-white/90 border-b-[2px] border-b-[#DEC8B2]'
                          : 'bg-slate-900/60 border-slate-800'
                      }`}
                    >
                      <img src={m.avatar_url} alt={m.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{m.name}</div>
                        <div className={`text-[10px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>{m.relationship}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TASKS SUBTAB */}
      {activeSubTab === 'TASKS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Family Tasks & Chores</span>
            {canEditTasks && (
              <button
                onClick={() => setShowAddTask(true)}
                className={`flex items-center gap-1 font-bold ${isLight ? 'text-[#D3542F] hover:underline' : 'text-amber-400 hover:underline'}`}
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
                    ? isLight
                      ? 'bg-[#F3E3D3]/50 border-[#EAD6C4]/60 opacity-60'
                      : 'bg-slate-800/40 border-slate-800/60 opacity-60'
                    : isLight
                    ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-sm'
                    : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      task.status === 'COMPLETED'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : isLight
                        ? 'border-[#DEC8B2] bg-[#FFF8F1]'
                        : 'border-slate-600'
                    }`}
                  >
                    {task.status === 'COMPLETED' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${
                      task.status === 'COMPLETED'
                        ? isLight ? 'line-through text-[#8C7A6B]' : 'line-through text-slate-500'
                        : isLight ? 'text-[#1F1F1F]' : 'text-white'
                    }`}>
                      {task.title}
                    </div>
                    <div className={`text-[11px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                      Assigned: <span className={isLight ? 'text-[#1F1F1F] font-bold' : 'text-slate-200'}>{task.assigned_to_name}</span> • Due: {task.due_date}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.priority === 'HIGH'
                        ? isLight
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isLight
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                        : 'bg-indigo-500/20 text-indigo-300'
                    }`}
                  >
                    {task.priority}
                  </span>
                  {canEditTasks && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          isLight
                            ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4]'
                            : 'bg-slate-700/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border-transparent'
                        }`}
                        title="Edit Task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                            : 'bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-transparent'
                        }`}
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. WISH LIST SUBTAB */}
      {activeSubTab === 'WISHLIST' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              Shared Family Wish List ({groceryItems.length})
            </span>
            {canEditTasks && (
              <button
                onClick={() => setShowAddGrocery(true)}
                className={`flex items-center gap-1 font-bold ${isLight ? 'text-[#D3542F] hover:underline' : 'text-amber-400 hover:underline'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Wish List</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {groceryItems.length === 0 ? (
              <div
                onClick={() => setShowAddGrocery(true)}
                className={`p-6 rounded-3xl border border-dashed text-center cursor-pointer transition-all space-y-2 ${
                  isLight
                    ? 'bg-[#F3E3D3]/60 border-[#DEC8B2] hover:bg-[#F3E3D3]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-amber-400 hover:bg-slate-800/90'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto ${
                  isLight ? 'bg-amber-100 text-[#D3542F]' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Gift className="w-5 h-5" />
                </div>
                <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Family Wish List is Empty</div>
                <p className={`text-[11px] max-w-xs mx-auto ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                  Add items, books, gadgets, groceries, or gifts any family member wishes to get.
                </p>
                <button className={`px-3 py-1.5 border rounded-xl text-xs font-bold inline-flex items-center gap-1 ${
                  isLight
                    ? 'bg-orange-100 text-[#F05A28] border-orange-300'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}>
                  <Plus className="w-3.5 h-3.5" /> Add First Wish
                </button>
              </div>
            ) : (
              groceryItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    item.is_purchased
                      ? isLight
                        ? 'bg-[#F3E3D3]/50 border-[#EAD6C4]/60 opacity-60'
                        : 'bg-slate-800/40 border-slate-800/60 opacity-60'
                      : isLight
                      ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2] shadow-sm'
                      : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                  }`}
                >
                  <div
                    onClick={() => canEditTasks && toggleGrocery(item.id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer overflow-hidden mr-2"
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        item.is_purchased
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : isLight
                          ? 'border-[#DEC8B2] bg-[#FFF8F1]'
                          : 'border-slate-600'
                      }`}
                    >
                      {item.is_purchased && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="overflow-hidden">
                      <div className={`text-xs font-bold truncate ${
                        item.is_purchased
                          ? isLight ? 'line-through text-[#8C7A6B]' : 'line-through text-slate-500'
                          : isLight ? 'text-[#1F1F1F]' : 'text-white'
                      }`}>
                        {item.item_name}
                      </div>
                      <div className={`text-[10px] truncate mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                        Added by <span className={isLight ? 'text-[#D3542F] font-bold' : 'text-amber-300 font-semibold'}>{item.added_by_name}</span>
                        {item.estimated_cost ? (
                          <span className={`font-bold ml-1.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                            • ₹{Number(item.estimated_cost).toLocaleString('en-IN')}
                          </span>
                        ) : item.quantity && item.quantity !== '1 unit' && item.quantity !== '1 pack' ? (
                          <span className={`ml-1.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>• {item.quantity}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      isLight
                        ? 'bg-[#E2D0BE] text-[#4A382A] border-[#DEC8B2]'
                        : 'bg-slate-700 text-slate-300 border-transparent'
                    }`}>
                      {item.category?.startsWith('CAT_') ? 'Custom' : (item.category || 'WISH')}
                    </span>
                    {canEditTasks && (
                      <button
                        type="button"
                        onClick={() => setEditingGrocery(item)}
                        className={`p-1.5 rounded-lg active:scale-90 transition-all z-10 border ${
                          isLight
                            ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4]'
                            : 'bg-slate-700/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border-transparent'
                        }`}
                        title="Edit item"
                      >
                        <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                      </button>
                    )}
                    {canEditTasks && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteGrocery(item.id, e)}
                        className={`p-1.5 rounded-lg active:scale-90 transition-all z-10 border ${
                          isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                            : 'bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-transparent'
                        }`}
                        title="Delete item"
                      >
                        <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. MAINTENANCE SUBTAB */}
      {activeSubTab === 'MAINTENANCE' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className={`font-bold uppercase ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
              Household Equipment Maintenance ({maintenanceItems.length})
            </span>
            {canEditTasks && (
              <button
                onClick={() => setShowAddMaintenance(true)}
                className={`flex items-center gap-1 font-bold ${isLight ? 'text-[#D3542F] hover:underline' : 'text-amber-400 hover:underline'}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Equipment</span>
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {maintenanceItems.length === 0 ? (
              <div
                onClick={() => setShowAddMaintenance(true)}
                className={`p-6 rounded-3xl border border-dashed text-center cursor-pointer transition-all space-y-3 ${
                  isLight
                    ? 'bg-[#F3E3D3]/60 border-[#DEC8B2] hover:bg-[#F3E3D3]'
                    : 'bg-slate-800/60 border-slate-700 hover:border-amber-400 hover:bg-slate-800/90'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                  isLight ? 'bg-amber-100 text-[#D3542F]' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <div className={`text-sm font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>No Household Equipment Tracked</div>
                  <p className={`text-xs max-w-xs mx-auto mt-1 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Track service dates, filter replacements, and warranty for ACs, RO water purifiers, inverters, chimneys, and vehicles.
                  </p>
                </div>
                <button className="px-4 py-2 bg-[#F05A28] text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Equipment & Service
                </button>
              </div>
            ) : (
              maintenanceItems.map((maint) => (
                <div
                  key={maint.id}
                  className={`p-3.5 rounded-2xl border space-y-2.5 shadow-sm ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2]'
                      : 'bg-slate-800/90 border-slate-700/80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{maint.item_name}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded font-semibold uppercase border ${
                          isLight
                            ? 'bg-[#E2D0BE] text-[#4A382A] border-[#DEC8B2]'
                            : 'bg-slate-700 text-indigo-300 border-transparent'
                        }`}>
                          {maint.service_type || 'APPLIANCE'}
                        </span>
                      </div>
                      <div className={`text-[11px] mt-1 flex items-center gap-1.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                        <span>Last serviced: {maint.last_service_date ? formatDate(maint.last_service_date) : 'N/A'}</span>
                        <span>•</span>
                        <span>Every {maint.recurring_interval_months || 6}m</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isLight
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        Due: {maint.next_service_due ? formatDate(maint.next_service_due) : 'Upcoming'}
                      </span>
                      {canEditTasks && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingMaintenance(maint)}
                            className={`p-1.5 rounded-lg active:scale-90 transition-all border ${
                              isLight
                                ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4]'
                                : 'bg-slate-700/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 border-transparent'
                            }`}
                            title="Edit Equipment"
                          >
                            <Edit3 className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteMaintenance(maint.id, e)}
                            className={`p-1.5 rounded-lg active:scale-90 transition-all border ${
                              isLight
                                ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                                : 'bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-transparent'
                            }`}
                            title="Delete Equipment"
                          >
                            <Trash2 className="w-3.5 h-3.5 pointer-events-none" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {(maint.service_provider || maint.contact_phone) && (
                    <div className={`flex items-center justify-between text-[11px] p-2.5 rounded-xl border ${
                      isLight
                        ? 'bg-[#FFF8F1] border-[#EAD6C4]'
                        : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <div className={`truncate ${isLight ? 'text-[#4A382A]' : 'text-slate-300'}`}>
                        <span className={isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}>Service:</span> {maint.service_provider || 'Authorized Technician'}
                      </div>
                      {maint.contact_phone && (
                        <a
                          href={`tel:${maint.contact_phone}`}
                          className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 shrink-0 ml-2 ${
                            isLight
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <Phone className="w-3 h-3" />
                          <span>{maint.contact_phone}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {maint.notes && (
                    <div className={`text-[11px] italic p-2 rounded-lg ${
                      isLight ? 'text-[#634B3F] bg-[#FFF8F1] border border-[#EAD6C4]' : 'text-slate-400 bg-slate-800/40'
                    }`}>
                      Note: {maint.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. EMERGENCY VAULT SUBTAB */}
      {activeSubTab === 'EMERGENCY' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-3xl border space-y-3 ${
            isLight
              ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm'
              : 'bg-rose-950/40 border-rose-500/30 text-slate-300'
          }`}>
            <div className={`flex items-center gap-2 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <h3 className={`text-sm font-bold ${isLight ? 'text-rose-950' : 'text-white'}`}>Emergency Mode & Critical Cards</h3>
            </div>
            <p className={`text-xs ${isLight ? 'text-rose-800' : 'text-slate-300'}`}>
              Instant 1-tap dial for doctors, ambulance, hospital TPA, and critical allergies.
            </p>
          </div>

          {/* Quick Contacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Phone className={`w-3.5 h-3.5 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                  isLight
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300 shadow-sm'
                    : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            </div>

            {emergencyContacts.length === 0 ? (
              <div className={`p-5 rounded-2xl border text-center space-y-2.5 ${
                isLight ? 'bg-[#F3E3D3]/60 border-[#DEC8B2]' : 'bg-slate-800/60 border-slate-700/80'
              }`}>
                <div className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center border ${
                  isLight
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>No Emergency Contacts Added</div>
                  <div className={`text-[11px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Add doctors, ambulance, hospital TPA, or family members.
                  </div>
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
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-sm transition-colors ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2]'
                        : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-bold truncate ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{contact.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${
                          isLight
                            ? 'bg-[#E2D0BE] text-[#4A382A] border-[#DEC8B2]'
                            : 'bg-slate-700 text-slate-300 border-transparent'
                        }`}>
                          {contact.relationship}
                        </span>
                        {contact.type && contact.type !== 'PERSONAL' && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                            isLight
                              ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          }`}>
                            {contact.type}
                          </span>
                        )}
                        {contact.is_primary && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                            isLight
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            ★ PRIMARY
                          </span>
                        )}
                      </div>
                      <div className={`text-xs font-mono font-bold ${isLight ? 'text-[#D3542F]' : 'text-amber-400'}`}>{contact.phone}</div>
                      {contact.secondary_phone && (
                        <div className={`text-[10px] font-mono ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Alt: {contact.secondary_phone}</div>
                      )}
                      {contact.address && (
                        <div className={`text-[10px] truncate max-w-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>📍 {contact.address}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${contact.phone}`}
                        className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md flex items-center justify-center active:scale-95 transition-transform"
                        title="Call Contact"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => openEditContact(contact)}
                        className={`p-2.5 rounded-xl transition-colors border ${
                          isLight
                            ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4]'
                            : 'bg-slate-700/80 hover:bg-slate-600 text-slate-200 border-transparent'
                        }`}
                        title="Edit Contact"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteContact(contact.id, contact.name)}
                        className={`p-2.5 rounded-xl transition-colors border ${
                          isLight
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                            : 'bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-transparent'
                        }`}
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
                <ShieldCheck className={`w-3.5 h-3.5 ${isLight ? 'text-rose-600' : 'text-rose-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
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
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold transition-all active:scale-95 ${
                  isLight
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-300 shadow-sm'
                    : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border-rose-500/30'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medical Profile</span>
              </button>
            </div>

            {emergencyProfiles.length === 0 ? (
              <div className={`p-5 rounded-2xl border text-center space-y-2.5 ${
                isLight ? 'bg-[#F3E3D3]/60 border-[#DEC8B2]' : 'bg-slate-800/60 border-slate-700/80'
              }`}>
                <div className={`w-10 h-10 rounded-2xl mx-auto flex items-center justify-center border ${
                  isLight
                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>No Medical Profiles Added</div>
                  <div className={`text-[11px] mt-0.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Store blood groups, critical allergies, medications, and insurance.
                  </div>
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
                  <div
                    key={prof.id}
                    className={`p-4 rounded-2xl border space-y-2.5 shadow-sm ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#EAD6C4] border-t-white/95 border-b-[2.5px] border-b-[#DEC8B2]'
                        : 'bg-slate-800/90 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{prof.full_name}</span>
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                          isLight
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        }`}>
                          🩸 Blood: {prof.blood_group || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditProfile(prof)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            isLight
                              ? 'bg-[#FFF8F1] hover:bg-amber-100 text-[#634B3F] hover:text-[#1F1F1F] border-[#EAD6C4]'
                              : 'bg-slate-700/80 hover:bg-slate-600 text-slate-200 border-transparent'
                          }`}
                          title="Edit Medical Profile"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProfile(prof.id, prof.full_name)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            isLight
                              ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                              : 'bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border-transparent'
                          }`}
                          title="Delete Medical Profile"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {prof.allergies && (
                        <div className={`p-2 rounded-xl border ${
                          isLight
                            ? 'bg-rose-100 border-rose-300 text-rose-900'
                            : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                        }`}>
                          <strong className={isLight ? 'text-rose-900' : 'text-rose-400'}>⚠️ Critical Allergies:</strong> {prof.allergies}
                        </div>
                      )}
                      {prof.chronic_conditions && (
                        <div className={`p-2 rounded-xl border ${
                          isLight
                            ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#4A382A]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}>
                          <strong className={isLight ? 'text-[#1F1F1F]' : 'text-slate-400'}>Conditions:</strong> {prof.chronic_conditions}
                        </div>
                      )}
                      {prof.medications && (
                        <div className={`p-2 rounded-xl border ${
                          isLight
                            ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#4A382A]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}>
                          <strong className={isLight ? 'text-[#1F1F1F]' : 'text-slate-400'}>Medications:</strong> {prof.medications}
                        </div>
                      )}
                      {prof.primary_doctor && (
                        <div className={`p-2 rounded-xl border ${
                          isLight
                            ? 'bg-[#FFF8F1] border-[#EAD6C4] text-[#4A382A]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}>
                          <strong className={isLight ? 'text-[#1F1F1F]' : 'text-slate-400'}>Doctor:</strong> {prof.primary_doctor}
                        </div>
                      )}
                      {prof.insurance_summary && (
                        <div className={`p-2 rounded-xl border sm:col-span-2 ${
                          isLight
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300'
                        }`}>
                          <strong className={isLight ? 'text-indigo-800' : 'text-indigo-400'}>🛡️ Insurance Policy:</strong> {prof.insurance_summary}
                        </div>
                      )}
                    </div>

                    {prof.special_instructions && (
                      <div className={`p-2 rounded-xl border text-[10px] font-medium ${
                        isLight
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                      }`}>
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
          <div className={`w-full max-w-lg border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between pb-3 border-b shrink-0 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <img
                  src={showPermissionsModal.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={showPermissionsModal.name}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-indigo-500/50"
                />
                <div>
                  <h3 className={`text-base font-extrabold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Manage Permissions</h3>
                  <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Access for <strong className={isLight ? 'text-[#D3542F]' : 'text-amber-400'}>{showPermissionsModal.name}</strong> ({showPermissionsModal.relationship || showPermissionsModal.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSavingPermissions && setShowPermissionsModal(null)}
                className={`p-1.5 rounded-xl transition-colors ${
                  isLight ? 'bg-[#F3E3D3] hover:bg-[#E2D0BE] text-[#634B3F]' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets & Status */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Quick Presets</span>
                <span className={`text-[11px] font-bold ${isLight ? 'text-indigo-700' : 'text-indigo-400'}`}>
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
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                    isLight
                      ? 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-800'
                      : 'bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 text-indigo-300'
                  }`}
                >
                  🌟 Standard Adult
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPermissions(['TASK_VIEW', 'TASK_EDIT', 'MEMORY_VIEW', 'AI_USE'])
                  }
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                    isLight
                      ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-800'
                      : 'bg-emerald-600/20 hover:bg-emerald-600/40 border-emerald-500/30 text-emerald-300'
                  }`}
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
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                    isLight
                      ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                      : 'bg-amber-600/20 hover:bg-amber-600/40 border-amber-500/30 text-amber-300'
                  }`}
                >
                  👁️ View Only
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions(allAvailablePermissions.map((p) => p.code))}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                    isLight
                      ? 'bg-purple-100 hover:bg-purple-200 border-purple-300 text-purple-900'
                      : 'bg-purple-600/20 hover:bg-purple-600/40 border-purple-500/30 text-purple-300'
                  }`}
                >
                  👑 Full Master
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPermissions([])}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors ${
                    isLight
                      ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800'
                      : 'bg-rose-600/20 hover:bg-rose-600/40 border-rose-500/30 text-rose-300'
                  }`}
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
                        ? isLight
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 shadow-sm'
                          : 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                        : isLight
                        ? 'bg-[#F3E3D3] border-[#EAD6C4] text-[#634B3F] hover:border-[#DEC8B2]'
                        : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isChecked ? (isLight ? 'text-indigo-950' : 'text-slate-100') : (isLight ? 'text-[#1F1F1F]' : 'text-slate-300')}`}>
                          {perm.name}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold ${
                          isLight ? 'bg-[#E2D0BE] text-[#4A382A]' : 'bg-slate-700/60 text-slate-300'
                        }`}>
                          {perm.category}
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono ${isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}`}>{perm.code}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : isLight
                          ? 'border-[#DEC8B2] bg-[#FFF8F1]'
                          : 'border-slate-600 bg-slate-900/50'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className={`flex gap-2 pt-3 border-t shrink-0 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={() => setShowPermissionsModal(null)}
                className={`flex-1 py-2.5 disabled:opacity-50 rounded-xl text-xs font-semibold transition-colors ${
                  isLight
                    ? 'bg-[#E2D0BE] hover:bg-[#DEC8B2] text-[#4A382A]'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingPermissions}
                onClick={savePermissions}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div className="flex items-center gap-3">
                <img
                  src={approvingMember.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt={approvingMember.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-amber-500/50"
                />
                <div>
                  <h3 className={`text-base font-extrabold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Approve Access</h3>
                  <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Grant permissions for <strong className={isLight ? 'text-[#D3542F]' : 'text-amber-400'}>{approvingMember.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovingMember(null)}
                className={`p-1.5 rounded-xl ${
                  isLight ? 'bg-[#F3E3D3] hover:bg-[#E2D0BE] text-[#634B3F]' : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
              {/* Role & Relationship Selectors */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Family Role"
                    value={approvalRole}
                    onChange={(newRole) => {
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
                          'FINANCE_ADD',
                          'DOCUMENT_VIEW',
                          'DOCUMENT_ADD',
                          'EMERGENCY_VIEW',
                          'TASK_VIEW',
                          'TASK_EDIT',
                          'MEMORY_VIEW',
                          'MEMORY_ADD',
                          'CALENDAR_VIEW',
                          'CALENDAR_EDIT',
                          'AI_USE',
                        ]);
                      }
                    }}
                    options={[
                      { value: 'HEAD', label: '👑 Family Head (Admin)' },
                      { value: 'SPOUSE', label: '🤝 Co-Head / Spouse (Full Access)' },
                      { value: 'ADULT', label: '👤 Adult Member (Standard)' },
                      { value: 'CHILD', label: '🧒 Child / Teen (Protected)' },
                      { value: 'VIEWER', label: '👵 Elder / Viewer (Care)' },
                    ]}
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-bold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Relationship</label>
                  <input
                    type="text"
                    value={approvalRelationship}
                    onChange={(e) => setApprovalRelationship(e.target.value)}
                    placeholder="e.g. Son, Daughter, Mother"
                    className={`w-full mt-1 border rounded-xl px-2.5 py-2 text-xs focus:outline-none ${
                      isLight
                        ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className={`text-[11px] font-bold block mb-1.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                  Quick Permission Presets
                </label>
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
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      isLight
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
                    }`}
                  >
                    🌟 Standard Adult
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions(['TASK_VIEW', 'TASK_EDIT', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'AI_USE']);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      isLight
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                    }`}
                  >
                    👶 Kids / Chores Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions(['FINANCE_VIEW', 'DOCUMENT_VIEW', 'EMERGENCY_VIEW', 'MEMORY_VIEW', 'CALENDAR_VIEW', 'TASK_VIEW']);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      isLight
                        ? 'bg-slate-200 text-[#4A382A] border-slate-300 hover:bg-slate-300'
                        : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    👁️ View Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApprovalPermissions(allAvailablePermissions.map((p) => p.code));
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                      isLight
                        ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                    }`}
                  >
                    👑 Full Master
                  </button>
                </div>
              </div>

              {/* Permissions Checklist */}
              <div>
                <label className={`text-[11px] font-bold block mb-1.5 ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
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
                            ? isLight
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                              : 'bg-indigo-600/20 border-indigo-500/40 text-white'
                            : isLight
                            ? 'bg-[#F3E3D3] border-[#EAD6C4] text-[#634B3F]'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        <div>
                          <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>{perm.name}</div>
                          <div className={`text-[10px] font-mono ${isLight ? 'text-[#8C7A6B]' : 'text-slate-500'}`}>{perm.code}</div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : isLight
                              ? 'border-[#DEC8B2] bg-[#FFF8F1]'
                              : 'border-slate-600'
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

            <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <button
                onClick={() => setApprovingMember(null)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                  isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveMemberSubmit}
                disabled={isApprovingSubmitting}
                className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-extrabold rounded-xl text-xs shadow-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Add Family Task</h3>
            <form onSubmit={handleAddTask} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Service Honda City Car"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Assign To"
                    value={newTaskAssignee}
                    onChange={(val) => setNewTaskAssignee(val)}
                    options={[
                      { value: 'All Family', label: 'All Family', icon: '👨‍👩‍👧' },
                      ...familyMembers.map((m) => ({
                        value: m.name,
                        label: `${m.name} (${m.relationship || m.role})`,
                        icon: '👤',
                      })),
                    ]}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Priority"
                    value={newTaskPriority}
                    onChange={(val) => setNewTaskPriority(val as any)}
                    options={[
                      { value: 'LOW', label: 'Low', badge: '🟢' },
                      { value: 'MEDIUM', label: 'Medium', badge: '🟡' },
                      { value: 'HIGH', label: 'High', badge: '🔴' },
                    ]}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Edit Member Profile & Photo</h3>
                <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Update photo, name, and details for {editingMember.name}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
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
              capture="environment"
              className="hidden"
            />

            <form onSubmit={handleSaveMemberProfile} className="space-y-4">
              {/* Avatar Preview & Selection */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold block ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Profile Photo</label>
                
                <div className={`flex items-center gap-3 p-3 rounded-2xl border ${
                  isLight ? 'bg-[#F3E3D3] border-[#EAD6C4]' : 'bg-slate-800/80 border-slate-700/80'
                }`}>
                  <img
                    src={memberProfileForm.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt="Preview"
                    className={`w-14 h-14 rounded-2xl object-cover ring-2 shadow-md ${
                      isLight ? 'ring-[#F05A28]' : 'ring-amber-400'
                    }`}
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => editGalleryRef.current?.click()}
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isLight
                            ? 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-800'
                            : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => editCameraRef.current?.click()}
                        className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          isLight
                            ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-[#F05A28]'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </button>
                    </div>
                    {memberProfileForm.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setMemberProfileForm({ ...memberProfileForm, avatar_url: '' })}
                        className="text-[10px] text-rose-500 hover:underline block font-semibold"
                      >
                        ✕ Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Full Name</label>
                <input
                  type="text"
                  required
                  value={memberProfileForm.name}
                  onChange={(e) => setMemberProfileForm({ ...memberProfileForm, name: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Relationship</label>
                  <input
                    type="text"
                    value={memberProfileForm.relationship}
                    onChange={(e) => setMemberProfileForm({ ...memberProfileForm, relationship: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Date of Birth 🎂 *"
                    value={memberProfileForm.birth_date}
                    onChange={(newDate) => setMemberProfileForm({ ...memberProfileForm, birth_date: newDate })}
                    required
                    className={isLight ? '!bg-[#F3E3D3] !border-[#DEC8B2] mt-1' : '!bg-slate-800 !border-slate-700 mt-1'}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={memberProfileForm.phone}
                  onChange={(e) => setMemberProfileForm({ ...memberProfileForm, phone: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Profile
                </button>
              </div>

              {currentUser?.role === 'FAMILY_HEAD' && editingMember.id !== currentUser?.id && (
                <div className={`pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      const toDelete = editingMember;
                      setEditingMember(null);
                      setMemberToDelete(toDelete);
                    }}
                    className={`w-full py-2.5 border font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      isLight
                        ? 'bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-700'
                        : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-400'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Member from Family</span>
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div>
                <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Add Family Member</h3>
                <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Add a parent, grandparent, teen, or child to your family</p>
              </div>
              <button
                onClick={() => setShowAddMember(false)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
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
              capture="environment"
              className="hidden"
            />

            <form onSubmit={handleAddMember} className="space-y-3.5">
              {/* Avatar selection */}
              <div className="space-y-2">
                <label className={`text-xs font-semibold block ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Profile Photo</label>
                
                <div className={`flex items-center gap-3 p-2.5 rounded-2xl border ${
                  isLight ? 'bg-[#F3E3D3] border-[#EAD6C4]' : 'bg-slate-800/80 border-slate-700/80'
                }`}>
                  <img
                    src={newMemberData.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                    alt="Preview"
                    className={`w-12 h-12 rounded-xl object-cover ring-2 shadow ${
                      isLight ? 'ring-[#F05A28]' : 'ring-amber-400'
                    }`}
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => addGalleryRef.current?.click()}
                        className={`px-2.5 py-1.5 border rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                          isLight
                            ? 'bg-indigo-100 hover:bg-indigo-200 border-indigo-300 text-indigo-800'
                            : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Gallery</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => addCameraRef.current?.click()}
                        className={`px-2.5 py-1.5 border rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                          isLight
                            ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-[#F05A28]'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Camera</span>
                      </button>
                    </div>
                    {newMemberData.avatar_url && (
                      <button
                        type="button"
                        onClick={() => setNewMemberData({ ...newMemberData, avatar_url: '' })}
                        className="text-[10px] text-rose-500 hover:underline block font-semibold"
                      >
                        ✕ Remove Photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sharma"
                  value={newMemberData.name}
                  onChange={(e) => setNewMemberData({ ...newMemberData, name: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Relationship</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mother, Son, Dadi"
                    value={newMemberData.relationship}
                    onChange={(e) => setNewMemberData({ ...newMemberData, relationship: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Role & Permissions"
                    value={newMemberData.role}
                    onChange={(val) => setNewMemberData({ ...newMemberData, role: val })}
                    options={[
                      { value: 'SPOUSE', label: 'Co-Head / Spouse (Full Access)', icon: '🤝' },
                      { value: 'ADULT', label: 'Adult (General Access)', icon: '👤' },
                      { value: 'CHILD', label: 'Teen / Child (Protected)', icon: '🧒' },
                      { value: 'VIEWER', label: 'Grandparent / Elder (Care)', icon: '👵' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="member@example.com"
                  value={newMemberData.email}
                  onChange={(e) => setNewMemberData({ ...newMemberData, email: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Gift className={`w-5 h-5 ${isLight ? 'text-[#D3542F]' : 'text-amber-400'}`} />
                <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Add to Family Wish List</h3>
              </div>
              <button
                onClick={() => setShowAddGrocery(false)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddGrocery} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Wish Item / Product *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wireless Earbuds, Harry Potter Book, Bicycle, Milk"
                  value={newGroceryName}
                  onChange={(e) => setNewGroceryName(e.target.value)}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Category"
                    value={newGroceryCategory}
                    onChange={(val) => setNewGroceryCategory(val)}
                    options={[
                      ...availableWishCategories.map((cat) => ({
                        value: cat.id,
                        label: cat.name,
                      })),
                      { value: '__CUSTOM__', label: '➕ Add Custom Category...' },
                    ]}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Estimated Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 3500"
                    value={newGroceryPrice}
                    onChange={(e) => setNewGroceryPrice(e.target.value)}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-emerald-800 focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-amber-400'
                    }`}
                  />
                </div>
              </div>

              {newGroceryCategory === '__CUSTOM__' && (
                <div className="animate-fade-in">
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#D3542F]' : 'text-amber-300'}`}>Custom Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gaming, Gold Jewelry, Gym Equipment"
                    value={customGroceryCat}
                    onChange={(e) => setCustomGroceryCat(e.target.value)}
                    className={`w-full mt-1 px-3.5 py-2 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-orange-400 text-[#1F1F1F]'
                        : 'bg-slate-800 border-amber-400/60 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Note / Detail (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 1 unit / Birthday wish"
                  value={newGroceryQty}
                  onChange={(e) => setNewGroceryQty(e.target.value)}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div className="flex items-center gap-2">
                <Wrench className={`w-5 h-5 ${isLight ? 'text-[#D3542F]' : 'text-amber-400'}`} />
                <div>
                  <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Add Equipment & Service</h3>
                  <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Track service schedules, filter changes & warranties</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddMaintenance(false)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMaintenance} className="space-y-3.5">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Equipment / Appliance Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Living Room Daikin AC / Kent RO Purifier / Honda City"
                  value={newMaintenance.item_name}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, item_name: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Category"
                    value={newMaintenance.service_type}
                    onChange={(val) => setNewMaintenance({ ...newMaintenance, service_type: val })}
                    options={[
                      { value: 'APPLIANCE', label: 'AC / Appliance', icon: '❄️' },
                      { value: 'WATER_PURIFIER', label: 'RO Water Purifier', icon: '💧' },
                      { value: 'VEHICLE', label: 'Car / Bike Service', icon: '🚗' },
                      { value: 'ELECTRICAL', label: 'Inverter / Solar', icon: '⚡' },
                      { value: 'PLUMBING', label: 'Plumbing / Chimney', icon: '🔧' },
                      { value: 'OTHER', label: 'Other Equipment', icon: '🛠️' },
                    ]}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Service Frequency"
                    value={newMaintenance.recurring_interval_months}
                    onChange={(val) => {
                      const interval = Number(val) || 6;
                      const d = new Date(newMaintenance.last_service_date || Date.now());
                      d.setMonth(d.getMonth() + interval);
                      setNewMaintenance({
                        ...newMaintenance,
                        recurring_interval_months: val,
                        next_service_due: getLocalDateString(d),
                      });
                    }}
                    options={[
                      { value: '3', label: 'Every 3 Months' },
                      { value: '6', label: 'Every 6 Months' },
                      { value: '12', label: 'Every 1 Year (Annual)' },
                      { value: '24', label: 'Every 2 Years' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomDatePicker
                    label="Last Serviced Date"
                    value={newMaintenance.last_service_date}
                    onChange={(dateVal) => {
                      const interval = Number(newMaintenance.recurring_interval_months) || 6;
                      const d = new Date(dateVal || Date.now());
                      d.setMonth(d.getMonth() + interval);
                      setNewMaintenance({
                        ...newMaintenance,
                        last_service_date: dateVal,
                        next_service_due: getLocalDateString(d),
                      });
                    }}
                    className={isLight ? '!bg-[#F3E3D3] !border-[#DEC8B2] mt-1' : '!bg-slate-800 !border-slate-700 mt-1'}
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Next Due Date *"
                    value={newMaintenance.next_service_due}
                    onChange={(newDate) => setNewMaintenance({ ...newMaintenance, next_service_due: newDate })}
                    required
                    className={isLight ? '!bg-[#F3E3D3] !border-[#DEC8B2] mt-1' : '!bg-slate-800 !border-slate-700 mt-1'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Service Provider / Tech</label>
                  <input
                    type="text"
                    placeholder="e.g. Daikin Service / Urban Co"
                    value={newMaintenance.service_provider}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, service_provider: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Technician Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={newMaintenance.contact_phone}
                    onChange={(e) => setNewMaintenance({ ...newMaintenance, contact_phone: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Notes / Warranty Details</label>
                <input
                  type="text"
                  placeholder="e.g. Free warranty service till 2027, carbon filter model #491"
                  value={newMaintenance.notes}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setShowAddMaintenance(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div className={`flex items-center gap-2 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                <Phone className="w-5 h-5" />
                <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddContact(false);
                  setEditingContact(null);
                }}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveContact} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Contact / Doctor / Facility Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Verma / Apollo Emergency"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-emerald-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Relationship / Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pediatrician, Uncle, Hospital TPA"
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-emerald-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Category Type"
                    value={contactForm.type}
                    onChange={(val) => setContactForm({ ...contactForm, type: val as any })}
                    options={[
                      { value: 'PERSONAL', label: 'Family / Relative', icon: '👨‍👩‍👧' },
                      { value: 'DOCTOR', label: 'Doctor / Physician', icon: '👨‍⚕️' },
                      { value: 'HOSPITAL', label: 'Hospital / Clinic', icon: '🏥' },
                      { value: 'AMBULANCE', label: 'Ambulance Service', icon: '🚑' },
                      { value: 'POLICE', label: 'Police / Helpline', icon: '🚓' },
                      { value: 'INSURANCE', label: 'Insurance TPA', icon: '🛡️' },
                      { value: 'OTHER', label: 'Other Service', icon: '📞' },
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Primary Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98765 43210"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs font-mono font-bold outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-emerald-800 focus:border-emerald-600'
                        : 'bg-slate-800 border-slate-700 text-emerald-400 focus:border-emerald-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Secondary Phone</label>
                  <input
                    type="tel"
                    placeholder="Optional backup phone"
                    value={contactForm.secondary_phone}
                    onChange={(e) => setContactForm({ ...contactForm, secondary_phone: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-emerald-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Email Address</label>
                <input
                  type="email"
                  placeholder="Optional email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-emerald-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Address / Hospital Location</label>
                <input
                  type="text"
                  placeholder="e.g. Road No 36, Jubilee Hills, Hyderabad"
                  value={contactForm.address}
                  onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-emerald-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="contact_is_primary"
                  checked={contactForm.is_primary}
                  onChange={(e) => setContactForm({ ...contactForm, is_primary: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 border-gray-300 focus:ring-0"
                />
                <label htmlFor="contact_is_primary" className={`text-xs cursor-pointer ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                  Mark as Primary Emergency Contact (1-Tap Dial Priority)
                </label>
              </div>

              <div className={`flex gap-2 pt-3 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddContact(false);
                    setEditingContact(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all active:scale-95"
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
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <div className={`flex items-center gap-2 ${isLight ? 'text-rose-700' : 'text-rose-400'}`}>
                <ShieldCheck className="w-5 h-5" />
                <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  {editingProfile ? 'Edit Medical Profile' : 'Add Medical Profile & Allergies'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddProfile(false);
                  setEditingProfile(null);
                }}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Family Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh / Priya"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-rose-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                    }`}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Blood Group *"
                    value={profileForm.blood_group}
                    onChange={(val) => setProfileForm({ ...profileForm, blood_group: val })}
                    options={[
                      { value: 'A+', label: 'A Positive (A+)', badge: '🩸' },
                      { value: 'A-', label: 'A Negative (A-)', badge: '🩸' },
                      { value: 'B+', label: 'B Positive (B+)', badge: '🩸' },
                      { value: 'B-', label: 'B Negative (B-)', badge: '🩸' },
                      { value: 'O+', label: 'O Positive (O+)', badge: '🩸' },
                      { value: 'O-', label: 'O Negative (O-)', badge: '🩸' },
                      { value: 'AB+', label: 'AB Positive (AB+)', badge: '🩸' },
                      { value: 'AB-', label: 'AB Negative (AB-)', badge: '🩸' },
                      { value: 'Unknown', label: 'Unknown' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Critical Allergies ⚠️</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Dust, Sulfa drugs"
                  value={profileForm.allergies}
                  onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-rose-800 focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-rose-300 focus:border-rose-500'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Chronic Conditions</label>
                  <input
                    type="text"
                    placeholder="e.g. Type 2 Diabetes, Asthma"
                    value={profileForm.chronic_conditions}
                    onChange={(e) => setProfileForm({ ...profileForm, chronic_conditions: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-rose-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Ongoing Medications</label>
                  <input
                    type="text"
                    placeholder="e.g. Inhaler, Metformin 500mg"
                    value={profileForm.medications}
                    onChange={(e) => setProfileForm({ ...profileForm, medications: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-rose-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Primary Doctor / Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Verma (9876543210)"
                    value={profileForm.primary_doctor}
                    onChange={(e) => setProfileForm({ ...profileForm, primary_doctor: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-rose-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Insurance Policy Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Star Health #POL-8842"
                    value={profileForm.insurance_summary}
                    onChange={(e) => setProfileForm({ ...profileForm, insurance_summary: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-rose-600'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Special Instructions for EMTs</label>
                <input
                  type="text"
                  placeholder="e.g. Always carry epipen in left backpack pouch; pacemaker fitted"
                  value={profileForm.special_instructions}
                  onChange={(e) => setProfileForm({ ...profileForm, special_instructions: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-rose-600'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-rose-500'
                  }`}
                />
              </div>

              <div className={`flex gap-2 pt-3 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProfile(false);
                    setEditingProfile(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all active:scale-95"
                >
                  {editingProfile ? 'Save Medical Card' : 'Add Medical Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Edit Family Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Task Title</label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Assign To"
                    value={editingTask.assigned_to_name}
                    onChange={(val) => setEditingTask({ ...editingTask, assigned_to_name: val })}
                    options={[
                      { value: 'All Family', label: 'All Family', icon: '👨‍👩‍👧' },
                      ...familyMembers.map((m) => ({
                        value: m.name,
                        label: `${m.name} (${m.relationship || m.role})`,
                        icon: '👤',
                      })),
                    ]}
                  />
                </div>

                <div>
                  <CustomSelect
                    label="Priority"
                    value={editingTask.priority}
                    onChange={(val) => setEditingTask({ ...editingTask, priority: val as any })}
                    options={[
                      { value: 'LOW', label: 'Low', badge: '🟢' },
                      { value: 'MEDIUM', label: 'Medium', badge: '🟡' },
                      { value: 'HIGH', label: 'High', badge: '🔴' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <CustomDatePicker
                  label="Due Date"
                  value={editingTask.due_date || ''}
                  onChange={(newDate) => setEditingTask({ ...editingTask, due_date: newDate })}
                  className={isLight ? '!bg-[#F3E3D3] !border-[#DEC8B2] mt-1' : '!bg-slate-800 !border-slate-700 mt-1'}
                />
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Wishlist Modal */}
      {editingGrocery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Edit Wish List Item</h3>
              <button
                onClick={() => setEditingGrocery(null)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateGrocery} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Item Name *</label>
                <input
                  type="text"
                  required
                  value={editingGrocery.item_name}
                  onChange={(e) => setEditingGrocery({ ...editingGrocery, item_name: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={editingGrocery.estimated_cost || ''}
                    onChange={(e) => setEditingGrocery({ ...editingGrocery, estimated_cost: Number(e.target.value) })}
                    className={`w-full mt-1 px-3 py-2 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-emerald-800 focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Category"
                    value={editingGrocery.category || 'WISH'}
                    onChange={(val) => setEditingGrocery({ ...editingGrocery, category: val })}
                    options={availableWishCategories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    }))}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Notes / Links</label>
                <input
                  type="text"
                  value={editingGrocery.notes || ''}
                  onChange={(e) => setEditingGrocery({ ...editingGrocery, notes: e.target.value })}
                  className={`w-full mt-1 px-3 py-2 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setEditingGrocery(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Maintenance Modal */}
      {editingMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-md border rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
            isLight ? 'bg-[#FFF8F1] border-[#DEC8B2] text-[#1F1F1F]' : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className={`flex items-center justify-between border-b pb-3 ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Edit Household Equipment</h3>
              <button
                onClick={() => setEditingMaintenance(null)}
                className={`p-1.5 rounded-xl ${isLight ? 'bg-[#F3E3D3] text-[#634B3F] hover:bg-[#E2D0BE]' : 'text-slate-400 hover:text-white'}`}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateMaintenance} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Equipment / Appliance Name *</label>
                <input
                  type="text"
                  required
                  value={editingMaintenance.item_name}
                  onChange={(e) => setEditingMaintenance({ ...editingMaintenance, item_name: e.target.value })}
                  className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                    isLight
                      ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                      : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomSelect
                    label="Type"
                    value={editingMaintenance.service_type || 'APPLIANCE'}
                    onChange={(val) => setEditingMaintenance({ ...editingMaintenance, service_type: val as any })}
                    options={[
                      { value: 'APPLIANCE', label: 'Appliance (AC, Fridge)', icon: '❄️' },
                      { value: 'WATER_PURIFIER', label: 'Water Purifier (RO)', icon: '💧' },
                      { value: 'VEHICLE', label: 'Car / Bike / EV', icon: '🚗' },
                      { value: 'ELECTRICAL', label: 'Inverter / Solar / Geyser', icon: '⚡' },
                      { value: 'OTHER', label: 'Other Equipment', icon: '🛠️' },
                    ]}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Interval (Months)</label>
                  <input
                    type="number"
                    value={editingMaintenance.recurring_interval_months || 6}
                    onChange={(e) => setEditingMaintenance({ ...editingMaintenance, recurring_interval_months: Number(e.target.value) })}
                    className={`w-full mt-1 px-3 py-2 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <CustomDatePicker
                    label="Last Service Date"
                    value={editingMaintenance.last_service_date || ''}
                    onChange={(newDate) => setEditingMaintenance({ ...editingMaintenance, last_service_date: newDate })}
                    className={isLight ? '!bg-[#F3E3D3] !border-[#DEC8B2] mt-1' : '!bg-slate-800 !border-slate-700 mt-1'}
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Next Service Due"
                    value={editingMaintenance.next_service_due || ''}
                    onChange={(newDate) => setEditingMaintenance({ ...editingMaintenance, next_service_due: newDate })}
                    className={isLight ? '!bg-[#F3E3D3] !border-[#DEC8B2] mt-1' : '!bg-slate-800 !border-slate-700 mt-1'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Service Provider / Agency</label>
                  <input
                    type="text"
                    value={editingMaintenance.service_provider || ''}
                    onChange={(e) => setEditingMaintenance({ ...editingMaintenance, service_provider: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>Technician Phone</label>
                  <input
                    type="text"
                    value={editingMaintenance.contact_phone || ''}
                    onChange={(e) => setEditingMaintenance({ ...editingMaintenance, contact_phone: e.target.value })}
                    className={`w-full mt-1 px-3.5 py-2.5 border rounded-xl text-xs outline-none ${
                      isLight
                        ? 'bg-[#F3E3D3] border-[#DEC8B2] text-[#1F1F1F] focus:border-[#F05A28]'
                        : 'bg-slate-800 border-slate-700 text-white focus:border-amber-400'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
                <button
                  type="button"
                  onClick={() => setEditingMaintenance(null)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold ${
                    isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F05A28] hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Member Confirmation Modal (Strictly Family Head) */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm border rounded-3xl p-5 shadow-2xl space-y-4 text-center ${
            isLight ? 'bg-[#FFF8F1] border-rose-300 text-[#1F1F1F]' : 'bg-slate-900 border-rose-500/40 text-slate-100'
          }`}>
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto ${
              isLight ? 'bg-rose-100 border-rose-300 text-rose-700' : 'bg-rose-500/20 border-rose-500/40 text-rose-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className={`text-base font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>Remove {memberToDelete.name}?</h3>
              <p className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                Are you sure you want to remove <strong className={isLight ? 'text-[#1F1F1F]' : 'text-white'}>{memberToDelete.name}</strong> ({memberToDelete.relationship || memberToDelete.role}) from the family?
              </p>
              <p className={`text-[11px] pt-1 ${isLight ? 'text-rose-700 font-semibold' : 'text-rose-400/90'}`}>
                This will revoke their access to family finances, digital vault, and timeline.
              </p>
            </div>

            <div className={`flex gap-2 pt-2 border-t ${isLight ? 'border-[#EAD6C4]' : 'border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                disabled={isDeletingMember}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50 ${
                  isLight ? 'bg-[#E2D0BE] text-[#4A382A] hover:bg-[#DEC8B2]' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={isDeletingMember}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/30 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isDeletingMember ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Member</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

