import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { translations } from '../../i18n/index.js';
import { apiRequest } from '../../utils/api.js';
import { DocumentRecord } from '../../types/index.js';
import { FolderLock, FileText, ShieldAlert, Sparkles, Plus, Camera, Search, Download, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, Eye } from 'lucide-react';

export const VaultView: React.FC = () => {
  const { currentUser, family, activeLanguage, hasPermission } = useAuth();
  const t = translations[activeLanguage];

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Upload State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showOCRResult, setShowOCRResult] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  const [newDoc, setNewDoc] = useState({
    title: '',
    category_id: 'doc_identity',
    owner_name: currentUser?.name || 'Raj Sharma',
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
        body: JSON.stringify(newDoc),
      });
      setDocuments([created, ...documents]);
      setShowUploadModal(false);
      setShowOCRResult(null);
      setNewDoc({
        title: '',
        category_id: 'doc_identity',
        owner_name: currentUser?.name || 'Raj Sharma',
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

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = selectedCategory === 'ALL' || doc.category_id === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.tags && doc.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.owner_name.toLowerCase().includes(searchQuery.toLowerCase());
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
            onClick={() => setShowUploadModal(true)}
            className="p-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white rounded-xl text-xs flex items-center gap-1 font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-transform"
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

              {/* Status Badge */}
              <div className="text-right shrink-0">
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Document Preview / Details Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">{previewDoc.title}</h3>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Simulated Document Preview Card */}
            <div className="h-44 rounded-2xl overflow-hidden relative border border-slate-700 bg-slate-950">
              <img src={previewDoc.file_url} alt={previewDoc.title} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-3">
                <div className="text-xs text-slate-300 font-mono">
                  Verified Family Record • Encrypted with AES-256
                </div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700">
              <div><strong>Owner:</strong> {previewDoc.owner_name}</div>
              <div><strong>Document Number:</strong> {previewDoc.document_number || 'Confidential'}</div>
              <div><strong>Issuer:</strong> {previewDoc.issuer}</div>
              {previewDoc.expiry_date && <div><strong>Expiry Date:</strong> {previewDoc.expiry_date}</div>}
              {previewDoc.notes && <div><strong>Notes:</strong> {previewDoc.notes}</div>}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert(`Simulated secure download for ${previewDoc.title}`)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Copy</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload & AI OCR Scanner Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 text-slate-100 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Store Document in Vault</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* OCR Preset trigger buttons */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">AI OCR Scanner (Auto-Extract):</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSimulateOCRUpload('passport.pdf')}
                  className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-center text-xs text-slate-200"
                >
                  🛂 Passport
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateOCRUpload('insurance.pdf')}
                  className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-center text-xs text-slate-200"
                >
                  🛡️ Insurance
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulateOCRUpload('aadhaar.pdf')}
                  className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-center text-xs text-slate-200"
                >
                  🪪 Aadhaar
                </button>
              </div>
            </div>

            {showOCRResult && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-xs text-indigo-300">
                ✨ AI extracted {showOCRResult.documentType} ({showOCRResult.documentNumber}). Expiry: {showOCRResult.expiryDate || 'N/A'}.
              </div>
            )}

            <form onSubmit={handleSaveDocument} className="space-y-3 overflow-y-auto pr-1">
              <div>
                <label className="text-xs text-slate-300 font-semibold">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indian Passport — Raj"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Owner</label>
                  <input
                    type="text"
                    value={newDoc.owner_name}
                    onChange={(e) => setNewDoc({ ...newDoc, owner_name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-semibold">Expiry Date</label>
                  <input
                    type="date"
                    value={newDoc.expiry_date}
                    onChange={(e) => setNewDoc({ ...newDoc, expiry_date: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-semibold">Document / Policy Number</label>
                <input
                  type="text"
                  placeholder="e.g. Z4928104"
                  value={newDoc.document_number}
                  onChange={(e) => setNewDoc({ ...newDoc, document_number: e.target.value })}
                  className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoRem"
                  checked={newDoc.auto_create_reminder}
                  onChange={(e) => setNewDoc({ ...newDoc, auto_create_reminder: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-500"
                />
                <label htmlFor="autoRem" className="text-xs text-slate-300">
                  Automatically set renewal reminder before expiry date
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg"
                >
                  Save to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
