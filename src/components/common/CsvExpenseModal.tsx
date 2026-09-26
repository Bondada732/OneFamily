import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X, RefreshCw, FileText, Check, Trash2 } from 'lucide-react';
import { Expense } from '../../types/index.js';
import { formatCurrency } from '../../utils/formatters.js';

interface CsvExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLight: boolean;
  expenses: Expense[];
  familyId: string;
  categories: any[];
  onImportSuccess: (newExpenses: Expense[]) => void;
  apiCall: (url: string, options?: any) => Promise<any>;
}

interface ParsedExpenseRow {
  date: string;
  category_name: string;
  merchant: string;
  amount: number;
  payment_method: string;
  paid_by_name: string;
  notes: string;
  location: string;
  isValid: boolean;
  error?: string;
}

export const CSV_TEMPLATE_CONTENT = `Date,Category,Merchant,Amount,PaymentMethod,PaidBy,Notes,Location
2026-09-25,Groceries & Kirana,D-Mart Supermarket,2450,UPI,Rambabu,Monthly ration and snacks,Gachibowli
2026-09-24,Food & Dining / Swiggy,Swiggy Biryani Order,680,UPI,Rambabu,Weekend dinner,Home
2026-09-23,Utilities & Bills,Electricity Bill (TSSPDCL),1850,CREDIT_CARD,Rambabu,August power bill,Online
2026-09-22,Transport & Fuel,Indian Oil Petrol Pump,1500,UPI,Rambabu,Full tank petrol,Madhapur
2026-09-20,Healthcare & Pharmacy,Apollo Pharmacy,420,CASH,Rambabu,Regular vitamins and medicines,Kondapur
2026-09-18,Shopping & Apparel,Trends Family Wear,3200,CREDIT_CARD,Rambabu,Festival dresses,Inorbit Mall`;

export const downloadCsvFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportExpensesToCsv = (expenses: Expense[], familyName: string = 'Family') => {
  const headers = ['Date', 'Category', 'Merchant', 'Amount', 'PaymentMethod', 'PaidBy', 'Notes', 'Location'];
  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = expenses.map((exp) => [
    escapeCsv(exp.date),
    escapeCsv(exp.category_name || 'Miscellaneous'),
    escapeCsv(exp.merchant || 'Expense'),
    escapeCsv(exp.amount || 0),
    escapeCsv(exp.payment_method || 'UPI'),
    escapeCsv(exp.paid_by_name || 'Family'),
    escapeCsv(exp.notes || ''),
    escapeCsv(exp.location || ''),
  ]);

  const csvString = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadCsvFile(csvString, `${familyName.toLowerCase().replace(/\s+/g, '_')}_expenses_${dateStr}.csv`);
};

export const downloadSampleTemplate = () => {
  downloadCsvFile(CSV_TEMPLATE_CONTENT, 'kinora_expenses_template.csv');
};

export const CsvExpenseModal: React.FC<CsvExpenseModalProps> = ({
  isOpen,
  onClose,
  isLight,
  expenses,
  familyId,
  onImportSuccess,
  apiCall,
}) => {
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'DOWNLOAD'>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedExpenseRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseCsvText = (text: string): ParsedExpenseRow[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let insideQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (insideQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === ',' && !insideQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const rawHeaders = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    const getIndex = (aliases: string[]) => {
      return rawHeaders.findIndex((h) => aliases.some((a) => h.includes(a)));
    };

    const dateIdx = getIndex(['date', 'time', 'day']);
    const catIdx = getIndex(['category', 'type', 'group']);
    const merchIdx = getIndex(['merchant', 'store', 'description', 'title', 'item', 'vendor', 'name', 'payee']);
    const amtIdx = getIndex(['amount', 'price', 'cost', 'total', 'inr', 'rupees', 'val']);
    const payMethodIdx = getIndex(['paymentmethod', 'method', 'mode', 'payment', 'paidvia']);
    const paidByIdx = getIndex(['paidby', 'paidbyname', 'user', 'member', 'by']);
    const notesIdx = getIndex(['notes', 'note', 'remark', 'remarks', 'comment', 'description']);
    const locIdx = getIndex(['location', 'city', 'place', 'address']);

    const validPaymentMethods: Record<string, 'UPI' | 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'WALLET'> = {
      upi: 'UPI',
      cash: 'CASH',
      credit: 'CREDIT_CARD',
      creditcard: 'CREDIT_CARD',
      debit: 'DEBIT_CARD',
      debitcard: 'DEBIT_CARD',
      card: 'CREDIT_CARD',
      netbanking: 'BANK_TRANSFER',
      bank: 'BANK_TRANSFER',
      banktransfer: 'BANK_TRANSFER',
      wallet: 'WALLET',
      paytm: 'WALLET',
    };

    const parsed: ParsedExpenseRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      const cols = parseLine(line);

      let rawDate = dateIdx >= 0 && cols[dateIdx] ? cols[dateIdx] : new Date().toISOString().split('T')[0];
      if (rawDate.includes('/') || (rawDate.includes('-') && rawDate.split('-')[0].length <= 2)) {
        const parts = rawDate.split(/[-/]/);
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            rawDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else if (parts[2].length === 4) {
            rawDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      const rawCat = catIdx >= 0 && cols[catIdx] ? cols[catIdx] : 'Miscellaneous';
      const rawMerchant = merchIdx >= 0 && cols[merchIdx] ? cols[merchIdx] : (cols[0] || 'Expense');
      const rawAmtStr = amtIdx >= 0 && cols[amtIdx] ? cols[amtIdx].replace(/[^0-9.]/g, '') : '0';
      const amount = parseFloat(rawAmtStr) || 0;

      const rawPayMethod = payMethodIdx >= 0 && cols[payMethodIdx] ? cols[payMethodIdx].toLowerCase().replace(/[^a-z]/g, '') : 'upi';
      const payment_method = validPaymentMethods[rawPayMethod] || 'UPI';

      const paid_by_name = paidByIdx >= 0 && cols[paidByIdx] ? cols[paidByIdx] : 'Family';
      const notes = notesIdx >= 0 && cols[notesIdx] ? cols[notesIdx] : '';
      const location = locIdx >= 0 && cols[locIdx] ? cols[locIdx] : '';

      const isValid = amount > 0 && !isNaN(amount) && Boolean(rawMerchant.trim());
      let error = '';
      if (amount <= 0) error = 'Invalid amount';
      else if (!rawMerchant.trim()) error = 'Missing description';

      parsed.push({
        date: rawDate,
        category_name: rawCat,
        merchant: rawMerchant,
        amount,
        payment_method,
        paid_by_name,
        notes,
        location,
        isValid,
        error,
      });
    }

    return parsed;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setUploadError('');
    setUploadSuccess('');
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCsvText(text);
        if (rows.length === 0) {
          setUploadError('No data rows found in this file. Please ensure it follows the template.');
        }
        setParsedRows(rows);
      } catch (err: any) {
        setUploadError(`Failed to read CSV file: ${err.message || 'Check file format'}`);
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Error opening file. Please try again.');
      setIsParsing(false);
    };
    reader.readAsText(selected);
  };

  const handleUploadSubmit = async () => {
    const validItems = parsedRows.filter((r) => r.isValid);
    if (validItems.length === 0) {
      setUploadError('Please select a valid CSV file with expense records.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      // Primary route: /api/expenses/:familyId/bulk-upload
      let res;
      try {
        res = await apiCall(`/expenses/${familyId}/bulk-upload`, {
          method: 'POST',
          body: JSON.stringify({ items: validItems, family_id: familyId }),
        });
      } catch (err1) {
        // Fallback route: /api/expenses/:familyId/expenses/bulk-upload
        res = await apiCall(`/expenses/${familyId}/expenses/bulk-upload`, {
          method: 'POST',
          body: JSON.stringify({ items: validItems, family_id: familyId }),
        });
      }

      if (res && res.success) {
        setUploadSuccess(`Uploaded ${res.count} expense(s) totaling ${formatCurrency(res.totalAmount)}!`);
        if (res.expenses && Array.isArray(res.expenses)) {
          onImportSuccess(res.expenses);
        }
        setTimeout(() => {
          onClose();
        }, 1600);
      } else {
        setUploadError(res?.error || 'Failed to upload expenses. Please try again.');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Server connection error during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const totalAmountToUpload = parsedRows.filter((r) => r.isValid).reduce((sum, r) => sum + r.amount, 0);

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div
        className={`w-full max-w-lg ${
          isLight
            ? 'bg-[#F3E3D3] border-2 border-[#EAD6C4] text-[#1F1F1F]'
            : 'bg-[#0b1329] border border-slate-700 text-slate-100'
        } rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b ${isLight ? 'border-[#DEC8B2]' : 'border-slate-800'} pb-3`}>
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${
                isLight ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#F05A28]' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                Upload & Download Expenses
              </h3>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                Add multiple expenses via CSV, or download current records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-[#FFF8F1] border border-[#DEC8B2] text-[#634B3F] hover:text-[#1F1F1F]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Simple Upload / Download */}
        <div className={`grid grid-cols-2 p-1 rounded-2xl border ${isLight ? 'bg-[#EBDCD0] border-[#DEC8B2]' : 'bg-slate-900 border-slate-800'}`}>
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'UPLOAD'
                ? isLight
                  ? 'bg-[#FFF8F1] text-[#B84A1E] shadow-sm'
                  : 'bg-slate-800 text-amber-400 shadow-sm'
                : isLight
                ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Expenses</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DOWNLOAD')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'DOWNLOAD'
                ? isLight
                  ? 'bg-[#FFF8F1] text-[#B84A1E] shadow-sm'
                  : 'bg-slate-800 text-amber-400 shadow-sm'
                : isLight
                ? 'text-[#634B3F] hover:text-[#1F1F1F]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Expenses</span>
          </button>
        </div>

        {/* Notifications */}
        {uploadError && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/35 rounded-2xl text-xs text-rose-500 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{uploadError}</span>
          </div>
        )}
        {uploadSuccess && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/35 rounded-2xl text-xs text-emerald-600 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="leading-snug">{uploadSuccess}</span>
          </div>
        )}

        {/* TAB 1: UPLOAD EXPENSES */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5">
            {/* Download Template Card */}
            <div
              className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isLight ? 'bg-[#FFF8F1] border-[#DEC8B2]' : 'bg-slate-800/70 border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${isLight ? 'text-[#F05A28]' : 'text-amber-400'}`} />
                  <span className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                    CSV Template Format
                  </span>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isLight
                      ? 'bg-[#F3E3D3] hover:bg-[#EBDCD0] border-[#DEC8B2] text-[#B84A1E]'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'} leading-relaxed`}>
                Required columns: <b>Date</b>, <b>Category</b>, <b>Merchant</b>, <b>Amount</b>, <b>PaymentMethod</b>, <b>PaidBy</b>, <b>Notes</b>, <b>Location</b>
              </p>
            </div>

            {/* File Dropzone */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                isLight
                  ? 'bg-[#FFF8F1] border-[#DEC8B2] hover:border-[#F05A28]'
                  : 'bg-slate-800/40 border-slate-700 hover:border-amber-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isLight ? 'bg-[#F3E3D3] text-[#F05A28]' : 'bg-slate-700 text-amber-400'
                }`}
              >
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  {file ? file.name : 'Tap to Select Expenses CSV File'}
                </div>
                <div className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                  {file ? `${(file.size / 1024).toFixed(1)} KB • Tap to choose another file` : 'Supports .csv files from Excel or Sheets'}
                </div>
              </div>
            </div>

            {/* Parsing Spinner */}
            {isParsing && (
              <div className="flex items-center justify-center gap-2 p-3">
                <RefreshCw className="w-4 h-4 animate-spin text-[#F05A28]" />
                <span className={`text-xs font-semibold ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                  Reading CSV records...
                </span>
              </div>
            )}

            {/* Parsed Rows Stats & Submit */}
            {parsedRows.length > 0 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className={`p-2 rounded-xl border ${isLight ? 'bg-[#FFF8F1] border-[#DEC8B2]' : 'bg-slate-800/80 border-slate-700'}`}>
                    <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>Ready to Upload</div>
                    <div className="text-sm font-bold text-emerald-600">{validCount} rows</div>
                  </div>
                  <div className={`p-2 rounded-xl border ${isLight ? 'bg-[#FFF8F1] border-[#DEC8B2]' : 'bg-slate-800/80 border-slate-700'}`}>
                    <div className={`text-[10px] uppercase font-bold ${isLight ? 'text-[#B84A1E]' : 'text-amber-400'}`}>Total Amount</div>
                    <div className={`text-sm font-bold ${isLight ? 'text-[#C24419]' : 'text-amber-400'}`}>{formatCurrency(totalAmountToUpload)}</div>
                  </div>
                </div>

                {/* Table Preview (max height 160px for clean mobile view) */}
                <div className={`border rounded-2xl overflow-hidden max-h-40 overflow-y-auto ${isLight ? 'border-[#DEC8B2]' : 'border-slate-700'}`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className={`sticky top-0 text-[10px] font-bold uppercase ${isLight ? 'bg-[#EBDCD0] text-[#634B3F]' : 'bg-slate-800 text-slate-300'}`}>
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Merchant</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isLight ? 'divide-[#DEC8B2] bg-[#FFF8F1]' : 'divide-slate-800 bg-slate-900/60'}`}>
                      {parsedRows.map((row, idx) => (
                        <tr key={idx} className={row.isValid ? '' : isLight ? 'bg-rose-50/50' : 'bg-rose-950/20'}>
                          <td className="p-2 whitespace-nowrap text-[11px]">{row.date}</td>
                          <td className="p-2 font-semibold truncate max-w-[120px]">{row.merchant}</td>
                          <td className={`p-2 font-bold whitespace-nowrap ${isLight ? 'text-[#C24419]' : 'text-amber-400'}`}>
                            ₹{row.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            {row.isValid ? (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600">
                                ✓ Ready
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-500">
                                ✕ Error
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={handleUploadSubmit}
                  disabled={isUploading || validCount === 0}
                  className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                    isLight
                      ? 'bg-gradient-to-r from-[#F05A28] to-[#FF7A45] text-white shadow-[#F05A28]/25 hover:opacity-95'
                      : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-indigo-500/25 hover:opacity-95'
                  } disabled:opacity-50`}
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Uploading {validCount} Expenses...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload {validCount} Expenses ({formatCurrency(totalAmountToUpload)})</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOWNLOAD EXPENSES */}
        {activeTab === 'DOWNLOAD' && (
          <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5">
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isLight ? 'bg-[#FFF8F1] border-[#DEC8B2]' : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    isLight ? 'bg-[#F3E3D3] text-[#F05A28]' : 'bg-slate-700 text-amber-400'
                  }`}
                >
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className={`text-sm font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                    Download All Family Expenses
                  </div>
                  <div className={`text-xs ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                    Total Records: <span className="font-bold">{expenses.length}</span> (
                    {formatCurrency(expenses.reduce((s, e) => s + (e.amount || 0), 0))})
                  </div>
                </div>
              </div>

              <p className={`text-xs leading-relaxed ${isLight ? 'text-[#634B3F]' : 'text-slate-300'}`}>
                Download all your family expense history as a CSV file compatible with Microsoft Excel and Google Sheets.
              </p>

              <button
                type="button"
                onClick={() => exportExpensesToCsv(expenses, 'OneFamily')}
                disabled={expenses.length === 0}
                className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isLight
                    ? 'bg-gradient-to-r from-[#F05A28] to-[#FF7A45] text-white shadow-[#F05A28]/25 hover:opacity-95'
                    : 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-indigo-500/25 hover:opacity-95'
                } disabled:opacity-50`}
              >
                <Download className="w-4 h-4" />
                <span>Download Expenses CSV ({expenses.length} records)</span>
              </button>
            </div>

            {/* Template Shortcut Card */}
            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-[#FFF8F1] border-[#DEC8B2]' : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div>
                <div className={`text-xs font-bold ${isLight ? 'text-[#1F1F1F]' : 'text-white'}`}>
                  Sample CSV Template
                </div>
                <div className={`text-[11px] ${isLight ? 'text-[#634B3F]' : 'text-slate-400'}`}>
                  Download blank sample template
                </div>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#F3E3D3] hover:bg-[#EBDCD0] border-[#DEC8B2] text-[#B84A1E]'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
