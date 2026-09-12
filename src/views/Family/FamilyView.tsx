import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { FamilyMember, TaskItem, GroceryItem, MaintenanceItem, EmergencyContact, EmergencyProfile } from '../../types/index.js';
import { Users, CheckSquare, ShoppingCart, Wrench, ShieldAlert, Phone, Plus, Check, ShieldCheck, Heart, UserPlus, GitFork, ChevronRight, Lock } from 'lucide-react';

export const FamilyView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission, familyMembers, switchActiveMember } = useAuth();
  const t = translations[activeLanguage];

  const [activeSubTab, setActiveSubTab] = useState<'MEMBERS' | 'TREE' | 'TASKS' | 'GROCERY' | 'MAINTENANCE' | 'EMERGENCY'>('MEMBERS');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [emergencyProfiles, setEmergencyProfiles] = useState<EmergencyProfile[]>([]);
  const [treeData, setTreeData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & form states
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddGrocery, setShowAddGrocery] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<FamilyMember | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newGroceryName, setNewGroceryName] = useState('');

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
          priority: 'MEDIUM',
          assigned_to_name: currentUser?.name.split(' ')[0] || 'All Family',
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

  const handleAddGrocery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroceryName.trim()) return;

    try {
      const created = await apiRequest(`/tasks/${family?.id}/grocery`, {
        method: 'POST',
        body: JSON.stringify({
          item_name: newGroceryName,
          quantity: '1 pack',
          category: 'STAPLES',
        }),
      });
      setGroceryItems([...groceryItems, created]);
      setNewGroceryName('');
      setShowAddGrocery(false);
    } catch (err) {
      console.error(err);
    }
  };

  const openPermissions = (member: FamilyMember) => {
    setShowPermissionsModal(member);
    setSelectedPermissions(member.permissions || []);
  };

  const savePermissions = async () => {
    if (!showPermissionsModal) return;
    try {
      await apiRequest(`/families/${family?.id}/members/${showPermissionsModal.id}/permissions`, {
        method: 'PUT',
        body: JSON.stringify({ permissions: selectedPermissions }),
      });
      setShowPermissionsModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  const allAvailablePermissions = [
    { code: 'FINANCE_VIEW', name: 'View Finances & Spending' },
    { code: 'FINANCE_EDIT', name: 'Record & Manage Expenses' },
    { code: 'INVESTMENT_VIEW', name: 'View Wealth & Net Worth' },
    { code: 'DOCUMENT_VIEW', name: 'View Vault Documents' },
    { code: 'DOCUMENT_UPLOAD', name: 'Upload & Scan Documents' },
    { code: 'EMERGENCY_VIEW', name: 'View Emergency Vault & Medical' },
    { code: 'MEMORY_VIEW', name: 'View Family Memories & Albums' },
    { code: 'CALENDAR_VIEW', name: 'View Shared Calendar' },
    { code: 'TASK_VIEW', name: 'View Tasks & Grocery List' },
    { code: 'TASK_EDIT', name: 'Manage Tasks & Grocery Items' },
    { code: 'AI_USE', name: 'Use FamilyAI Assistant' },
    { code: 'FAMILY_MANAGE', name: 'Family Admin (Manage Members)' },
  ];

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-12">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Family Hub</h2>
          <p className="text-xs text-slate-400">Members, tree, chores, grocery & emergency</p>
        </div>
        <button
          onClick={() => setActiveSubTab('EMERGENCY')}
          className="flex items-center gap-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-md shadow-rose-900/40 active:scale-95 transition-transform"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Emergency Vault</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 overflow-x-auto scrollbar-none">
        {(['MEMBERS', 'TREE', 'TASKS', 'GROCERY', 'MAINTENANCE', 'EMERGENCY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSubTab(tab)}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeSubTab === tab
                ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 1. MEMBERS SUBTAB */}
      {activeSubTab === 'MEMBERS' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Family Members ({familyMembers.length})</span>
            {canManageFamily && (
              <span className="text-amber-400 font-semibold">Tap member to edit permissions</span>
            )}
          </div>

          <div className="space-y-2.5">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={member.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={member.name}
                    className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-700"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{member.name}</span>
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-md font-semibold">
                        {member.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{member.relationship}</div>
                    <div className="text-[10px] text-indigo-400 mt-0.5">
                      {member.permissions?.length || 0} permissions granted
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => switchActiveMember(member.id)}
                    className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-[11px] font-semibold transition-colors"
                  >
                    Switch To
                  </button>
                  {canManageFamily && (
                    <button
                      onClick={() => openPermissions(member)}
                      className="p-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-xs border border-indigo-500/40"
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

      {/* 4. GROCERY SUBTAB */}
      {activeSubTab === 'GROCERY' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-400 uppercase">Shared Grocery List ({groceryItems.length})</span>
            <button
              onClick={() => setShowAddGrocery(true)}
              className="flex items-center gap-1 text-amber-400 hover:underline font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>

          <div className="space-y-2">
            {groceryItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleGrocery(item.id)}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                  item.is_purchased
                    ? 'bg-slate-800/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                      item.is_purchased ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'
                    }`}
                  >
                    {item.is_purchased && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${item.is_purchased ? 'line-through text-slate-500' : 'text-white'}`}>
                      {item.item_name}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.quantity} • Added by {item.added_by_name}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. MAINTENANCE SUBTAB */}
      {activeSubTab === 'MAINTENANCE' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase">Household Equipment Maintenance</div>

          <div className="space-y-2.5">
            {maintenanceItems.map((maint) => (
              <div key={maint.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white">{maint.item_name}</div>
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    Due: {maint.next_service_due}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Provider: {maint.service_provider} • Phone: {maint.contact_phone}
                </div>
                {maint.notes && <div className="text-[10px] text-slate-500 italic">Notes: {maint.notes}</div>}
              </div>
            ))}
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
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Emergency Contacts</div>
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{contact.name}</div>
                  <div className="text-[11px] text-slate-400">{contact.relationship}</div>
                  <div className="text-xs text-amber-400 font-mono font-bold mt-0.5">{contact.phone}</div>
                </div>
                <a
                  href={`tel:${contact.phone}`}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* Medical Profiles & Critical Allergy Warning */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase">Medical Profiles & Allergies</div>
            {emergencyProfiles.map((prof) => (
              <div key={prof.id} className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{prof.full_name}</span>
                  <span className="text-[11px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md">
                    Blood: {prof.blood_group}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <strong className="text-slate-400">Allergies:</strong> {prof.allergies || 'None'}
                </div>
                <div className="text-[11px] text-slate-300">
                  <strong className="text-slate-400">Medications:</strong> {prof.medications || 'None'}
                </div>
                {prof.special_instructions && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium">
                    ⚠️ {prof.special_instructions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Permissions Management Modal (Family Head Only) */}
      {showPermissionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div>
              <h3 className="text-base font-bold text-white">Manage Permissions</h3>
              <p className="text-xs text-slate-400">
                Configure role access for <strong className="text-amber-400">{showPermissionsModal.name}</strong> ({showPermissionsModal.role})
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
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
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked ? 'bg-indigo-600/20 border-indigo-500/40 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'
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

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowPermissionsModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={savePermissions}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
              >
                Save Permissions
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
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Grocery Modal */}
      {showAddGrocery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add Grocery Item</h3>
            <form onSubmit={handleAddGrocery} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Almond Milk 1L"
                  value={newGroceryName}
                  onChange={(e) => setNewGroceryName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddGrocery(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs"
                >
                  Add to List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
