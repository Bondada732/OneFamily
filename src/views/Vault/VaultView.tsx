import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { DocumentRecord } from '../../types/index.js';
import { 
  FolderLock, FileText, ShieldAlert, Sparkles, Plus, Camera, Search, Download, 
  AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Eye, Upload, Image as ImageIcon, 
  X, FileCheck, Edit3, Trash2, Folder, User, Calendar, Hash, Bell, CreditCard, 
  MoreHorizontal, BookOpen, Save, Shield 
} from 'lucide-react';
import { CustomDatePicker } from '../../components/common/CustomDatePicker.js';
import { CustomSelect } from '../../components/common/CustomSelect.js';

export const VaultView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission, familyMembers } = useAuth();
  const t = translations[activeLanguage];

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('Passport');
  const [showOCRResult, setShowOCRResult] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocumentRecord | null>(null);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<{
    dataUrl: string;
    name: string;
    type: 'PDF' | 'IMAGE';
    sizeKb: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [newDoc, setNewDoc] = useState({
    title: '',
    category_id: 'doc_identity',
    owner_name: currentUser?.name || 'Self',
    document_number: '',
    issue_date: '',
    expiry_date: '',
    issuer: '',
    tags: '',
    notes: '',
    auto_create_reminder: true,
  });

  const canViewDocs = hasPermission('DOCUMENT_VIEW');
  const canUploadDocs = hasPermission('DOCUMENT_UPLOAD');
  const canEditDocs = currentUser?.role === 'FAMILY_HEAD' || hasPermission('DOCUMENT_UPLOAD');
  const canDeleteDocs = currentUser?.role === 'FAMILY_HEAD' || hasPermission('DOCUMENT_DELETE');

  useEffect(() => {
    if (!canViewDocs || !family?.id) {
      setIsLoading(false);
      return;
    }

    const loadVault = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest(`/documents/${family.id}/documents`);
        setDocuments(data.documents || []);
        setCategories(data.categories || []);
      } catch (err) {
        console.error('Failed to load vault documents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadVault();
  }, [family?.id, canViewDocs, currentUser?.id]);

  if (!canViewDocs) {
    return (
      <div className="p-6 text-center space-y-4 my-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">Document Vault Restricted</h2>
        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
          {currentUser?.role === 'CHILD'
            ? "Your account does not have clearance to open private family documents like Passports, PAN, Aadhaar, or Property Deeds."
            : t.permissionDenied}
        </p>
      </div>
    );
  }

  const handleDocumentFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.includes('pdf') ? 'PDF' : 'IMAGE';
    const sizeKb = Math.round(file.size / 1024);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setUploadedFile({
        dataUrl,
        name: file.name,
        type: fileType,
        sizeKb,
      });

      // Auto-populate document title if empty
      if (!newDoc.title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setNewDoc((prev) => ({
          ...prev,
          title: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSimulateOCRUpload = async (docPreset: string) => {
    try {
      const res = await apiRequest(`/documents/${family?.id}/scan-ocr`, {
        method: 'POST',
        body: JSON.stringify({ fileName: docPreset }),
      });
      setShowOCRResult(res.extracted);
      setNewDoc({
        ...newDoc,
        title: res.extracted.documentType,
        document_number: res.extracted.documentNumber,
        owner_name: res.extracted.holderName,
        issuer: res.extracted.issuer,
        issue_date: res.extracted.issueDate || '',
        expiry_date: res.extracted.expiryDate || '',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiRequest(`/documents/${family?.id}/documents`, {
        method: 'POST',
        body: JSON.stringify({
          ...newDoc,
          file_url: uploadedFile?.dataUrl || undefined,
          file_type: uploadedFile?.type || 'PDF',
          file_size_kb: uploadedFile?.sizeKb || undefined,
        }),
      });
      setDocuments([created, ...documents]);
      setShowUploadModal(false);
      setShowOCRResult(null);
      setUploadedFile(null);
      setNewDoc({
        title: '',
        category_id: categories[0]?.id || 'doc_identity',
        owner_name: currentUser?.name || 'Self',
        document_number: '',
        issue_date: '',
        expiry_date: '',
        issuer: '',
        tags: '',
        notes: '',
        auto_create_reminder: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (docId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!family?.id) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    if (previewDoc?.id === docId) setPreviewDoc(null);
    try {
      await apiRequest(`/documents/${family.id}/documents/${docId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleUpdateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !family?.id) return;
    try {
      const updated = await apiRequest(`/documents/${family.id}/documents/${editingDoc.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editingDoc),
      });
      setDocuments((prev) => prev.map((d) => (d.id === editingDoc.id ? { ...d, ...updated } : d)));
      if (previewDoc?.id === editingDoc.id) {
        setPreviewDoc({ ...previewDoc, ...updated });
      }
      setEditingDoc(null);
    } catch (err) {
      console.error('Failed to update document:', err);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'ALL' || doc.category_id === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      (doc.title && doc.title.toLowerCase().includes(q)) ||
      (doc.tags && doc.tags.toLowerCase().includes(q)) ||
      (doc.owner_name && doc.owner_name.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  const expiringSoonDocs = documents.filter((d) => d.expiryStatus === 'EXPIRING_SOON');

  return (
    <div className="p-4 space-y-5 animate-fade-in text-slate-100 pb-12">
      {/* Title & Upload Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Family Document Vault</h2>
          <p className="text-xs text-slate-400">Encrypted records, OCR scanner & expiry alerts</p>
        </div>
        {canUploadDocs && (
          <button
            onClick={() => {
              setSelectedDocType('Passport');
              setShowUploadModal(true);
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-[#168BFF] to-[#0A56C2] hover:from-[#16C7F2] hover:to-[#168BFF] text-white rounded-xl text-xs flex items-center gap-1.5 font-bold shadow-lg shadow-[#168BFF]/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        )}
      </div>

      {/* Expiry Banner Alert */}
      {expiringSoonDocs.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs text-slate-200">
            <strong className="text-amber-300">{expiringSoonDocs.length} Documents Expiring Soon:</strong>{' '}
            {expiringSoonDocs.map((d) => `${d.title} (${d.daysUntilExpiry} days)`).join(', ')}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3 py-2 rounded-2xl">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search passport, insurance, PAN, property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-400 outline-none"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
              selectedCategory === 'ALL'
                ? 'bg-amber-400 text-slate-900 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Docs ({documents.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-semibold transition-all shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-slate-900 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="space-y-2.5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setPreviewDoc(doc)}
            className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                    {doc.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Owner: {doc.owner_name} • {doc.issuer}
                  </div>
                  {doc.document_number && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      No: {doc.document_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Badge & Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {doc.expiry_date ? (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      doc.expiryStatus === 'EXPIRING_SOON'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    Exp: {doc.expiry_date}
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    Permanent
                  </span>
                )}

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {canEditDocs && (
                    <button
                      type="button"
                      onClick={() => setEditingDoc(doc)}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 transition-colors"
                      title="Edit Document"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDeleteDocs && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDoc(doc.id, e)}
                      className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview / Details Modal */}
      {previewDoc && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-md bg-[#07132B] border border-[#168BFF]/30 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white truncate">{previewDoc.title}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            {/* Document Preview Card */}
            {previewDoc.file_url && (previewDoc.file_url.startsWith('data:image') || previewDoc.file_type === 'IMAGE') ? (
              <div className="max-h-56 rounded-2xl overflow-hidden relative border border-slate-700 bg-slate-950 flex items-center justify-center">
                <img src={previewDoc.file_url} alt={previewDoc.title} className="max-h-56 w-auto object-contain rounded-2xl" />
              </div>
            ) : (
              <div className="h-44 rounded-2xl overflow-hidden relative border border-slate-700 bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <FileText className="w-12 h-12 text-[#16C7F2] mb-2" />
                <div className="text-xs text-slate-200 font-bold truncate max-w-xs">{previewDoc.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  PDF Document • Encrypted Record
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800">
              <div><strong>Owner:</strong> {previewDoc.owner_name}</div>
              <div><strong>Document Number:</strong> {previewDoc.document_number || 'Confidential'}</div>
              <div><strong>Issuer:</strong> {previewDoc.issuer}</div>
              {previewDoc.expiry_date && <div><strong>Expiry Date:</strong> {previewDoc.expiry_date}</div>}
              {previewDoc.notes && <div><strong>Notes:</strong> {previewDoc.notes}</div>}
            </div>

            <div className="flex gap-2">
              <a
                href={previewDoc.file_url}
                download={`${previewDoc.title || 'document'}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-gradient-to-r from-[#168BFF] to-[#0A56C2] hover:from-[#16C7F2] hover:to-[#168BFF] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all text-center"
              >
                <Download className="w-4 h-4" />
                <span>Open / Download</span>
              </a>
              {canEditDocs && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDoc(previewDoc);
                  }}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-amber-500/20 border border-slate-700 text-slate-300 hover:text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              )}
              {canDeleteDocs && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteDoc(previewDoc.id, e)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-rose-500/20 border border-slate-700 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Document Modal */}
      {editingDoc && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className="w-full max-w-md bg-[#07132B] border border-[#168BFF]/30 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Edit Document Details</h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateDoc} className="space-y-3.5">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Document Title *</label>
                <input
                  type="text"
                  required
                  value={editingDoc.title}
                  onChange={(e) => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomSelect
                    label="Category"
                    value={editingDoc.category_id}
                    onChange={(val) => setEditingDoc({ ...editingDoc, category_id: val })}
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                  />
                </div>
                <div>
                  <CustomSelect
                    label="Owner / Member"
                    value={editingDoc.owner_name}
                    onChange={(val) => setEditingDoc({ ...editingDoc, owner_name: val })}
                    options={[
                      { value: 'All Family', label: 'All Family', icon: '👨‍👩‍👧' },
                      ...familyMembers.map((m) => ({
                        value: m.name,
                        label: m.name,
                        icon: '👤',
                      })),
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Document Number</label>
                  <input
                    type="text"
                    value={editingDoc.document_number || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, document_number: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Issuer Authority</label>
                  <input
                    type="text"
                    value={editingDoc.issuer || ''}
                    onChange={(e) => setEditingDoc({ ...editingDoc, issuer: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <CustomDatePicker
                    label="Issue Date"
                    value={editingDoc.issue_date || ''}
                    onChange={(newDate) => setEditingDoc({ ...editingDoc, issue_date: newDate })}
                    className="!bg-slate-800 !border-slate-700 mt-1"
                  />
                </div>
                <div>
                  <CustomDatePicker
                    label="Expiry Date"
                    value={editingDoc.expiry_date || ''}
                    onChange={(newDate) => setEditingDoc({ ...editingDoc, expiry_date: newDate })}
                    className="!bg-slate-800 !border-slate-700 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Tags / Keywords</label>
                <input
                  type="text"
                  placeholder="e.g. passport, renewal, trip"
                  value={editingDoc.tags || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, tags: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Private Notes</label>
                <input
                  type="text"
                  value={editingDoc.notes || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Upload & Add Document Modal */}
      {showUploadModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
          <div className="w-full max-w-md bg-[#07132B] border border-[#168BFF]/30 rounded-3xl p-4 sm:p-5 text-slate-100 shadow-2xl space-y-3.5 flex flex-col max-h-[92vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            
            {/* Header matching Image 2 */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#168BFF] to-[#0D59B5] text-white flex items-center justify-center shadow-lg shadow-[#168BFF]/30 shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight leading-tight">Add Document</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Securely store family documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold flex items-center gap-1 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Secure 256-bit</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hidden file inputs for file/gallery & camera scan */}
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleDocumentFileSelected}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleDocumentFileSelected}
            />

            <form onSubmit={handleSaveDocument} className="space-y-3.5 flex-1 flex flex-col justify-between">
              
              <div className="space-y-3">
                {/* Select Document Type Grid matching Image 2 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Select Document Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'Passport', label: 'Passport', icon: BookOpen, preset: 'passport.pdf', category: 'doc_identity', defaultTitle: 'Passport' },
                      { id: 'Insurance', label: 'Insurance', icon: Shield, preset: 'insurance.pdf', category: 'doc_insurance', defaultTitle: 'Health / Life Insurance' },
                      { id: 'Aadhaar', label: 'Aadhaar', icon: CreditCard, preset: 'aadhaar.pdf', category: 'doc_identity', defaultTitle: 'Aadhaar Card' },
                      { id: 'Others', label: 'Others', icon: MoreHorizontal, preset: null, category: 'doc_misc', defaultTitle: '' }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = selectedDocType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setSelectedDocType(item.id);
                            if (item.category && categories.some(c => c.id === item.category)) {
                              setNewDoc(prev => ({
                                ...prev,
                                category_id: item.category,
                                title: prev.title ? prev.title : item.defaultTitle
                              }));
                            }
                            if (item.preset) {
                              handleSimulateOCRUpload(item.preset);
                            }
                          }}
                          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#168BFF]/20 border-[#16C7F2] text-white shadow-lg shadow-[#168BFF]/20 ring-1 ring-[#16C7F2]/50'
                              : 'bg-[#030E22]/90 border-[#168BFF]/20 text-slate-400 hover:text-slate-200 hover:border-[#168BFF]/40'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-[#16C7F2]' : 'text-slate-400'}`} />
                          <span className="text-[11px] font-semibold truncate max-w-full">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Upload Document / Scan from Camera Section */}
                {!uploadedFile ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-[#030E22]/80 hover:bg-[#168BFF]/10 border border-[#168BFF]/25 rounded-xl text-center text-xs text-slate-300 flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#16C7F2]" />
                      <span>Choose File / PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-2 bg-[#030E22]/80 hover:bg-[#168BFF]/10 border border-[#168BFF]/25 rounded-xl text-center text-xs text-slate-300 flex items-center justify-center gap-1.5 font-medium transition-all cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Scan Camera</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-2.5 bg-[#030E22]/90 border border-emerald-500/40 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {uploadedFile.type === 'IMAGE' ? (
                        <img
                          src={uploadedFile.dataUrl}
                          alt="Preview"
                          className="w-9 h-9 object-cover rounded-lg shrink-0 border border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 font-bold text-[11px]">
                          PDF
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{uploadedFile.name}</div>
                        <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <FileCheck className="w-3 h-3" />
                          <span>{uploadedFile.sizeKb} KB • Ready to save</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors shrink-0 ml-2 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {showOCRResult && (
                  <div className="p-2.5 bg-[#168BFF]/15 border border-[#168BFF]/30 rounded-xl text-xs text-cyan-300 flex items-start gap-2 animate-fadeIn">
                    <Sparkles className="w-4 h-4 text-[#16C7F2] shrink-0 mt-0.5" />
                    <span>
                      AI extracted <strong className="text-white">{showOCRResult.documentType}</strong> ({showOCRResult.documentNumber}). Expiry: {showOCRResult.expiryDate || 'N/A'}.
                    </span>
                  </div>
                )}

                {/* Document Title */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                    <FileText className="w-3.5 h-3.5 text-[#16C7F2] shrink-0" />
                    <span>Document Title <span className="text-cyan-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Indian Passport — Raj"
                    value={newDoc.title}
                    onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#16C7F2] transition-all"
                  />
                </div>

                {/* Vault Folder */}
                <div>
                  <CustomSelect
                    label="Vault Folder"
                    labelIcon={Folder}
                    value={newDoc.category_id}
                    onChange={(val) => setNewDoc({ ...newDoc, category_id: val })}
                    options={categories.map((c) => ({
                      value: c.id,
                      label: c.name,
                    }))}
                    className="!bg-[#030E22]/90 !border-[#168BFF]/30"
                  />
                </div>

                {/* Owner / Holder & Expiry Date */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    {familyMembers && familyMembers.length > 0 ? (
                      <CustomSelect
                        label="Owner / Holder"
                        labelIcon={User}
                        value={newDoc.owner_name}
                        onChange={(val) => setNewDoc({ ...newDoc, owner_name: val })}
                        options={[
                          { value: 'All Family', label: 'All Family', icon: '👨‍👩‍👧' },
                          ...familyMembers.map((m) => ({
                            value: m.name,
                            label: `${m.name} (${m.relationship || m.role})`,
                            icon: '👤',
                          })),
                        ]}
                        className="!bg-[#030E22]/90 !border-[#168BFF]/30"
                      />
                    ) : (
                      <div>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                          <User className="w-3.5 h-3.5 text-[#16C7F2] shrink-0" />
                          <span>Owner / Holder</span>
                        </label>
                        <input
                          type="text"
                          value={newDoc.owner_name}
                          onChange={(e) => setNewDoc({ ...newDoc, owner_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white outline-none focus:border-[#16C7F2]"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <CustomDatePicker
                      label="Expiry Date"
                      labelIcon={Calendar}
                      value={newDoc.expiry_date}
                      onChange={(newDate) => setNewDoc({ ...newDoc, expiry_date: newDate })}
                      className="!bg-[#030E22]/90 !border-[#168BFF]/30"
                    />
                  </div>
                </div>

                {/* Document / Policy Number */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-1">
                    <Hash className="w-3.5 h-3.5 text-[#16C7F2] shrink-0" />
                    <span>Document / Policy Number</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Z4928104"
                    value={newDoc.document_number}
                    onChange={(e) => setNewDoc({ ...newDoc, document_number: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-[#16C7F2] transition-all"
                  />
                </div>

                {/* Set Renewal Reminder Card */}
                <div className="p-3 bg-[#030E22]/90 border border-[#168BFF]/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#168BFF]/20 border border-[#168BFF]/30 text-[#16C7F2] flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Set Renewal Reminder</div>
                      <div className="text-[10px] text-slate-400">Auto-reminder 30 days before expiry</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={newDoc.auto_create_reminder}
                    onClick={() => setNewDoc({ ...newDoc, auto_create_reminder: !newDoc.auto_create_reminder })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      newDoc.auto_create_reminder ? 'bg-[#168BFF]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        newDoc.auto_create_reminder ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 mt-auto shrink-0">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-[#168BFF] via-[#2F80ED] to-[#7B2CBF] hover:from-[#168BFF] hover:to-[#9D4EDD] active:scale-[0.99] text-white font-bold rounded-2xl text-xs shadow-lg shadow-[#168BFF]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4 text-white" />
                  <span>Save to Vault</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="w-full py-1.5 text-center text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
