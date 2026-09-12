export interface ExtractedReceiptData {
  merchant: string;
  amount: number;
  date: string;
  category: string;
  tax: number;
  items: Array<{ name: string; price: number; qty?: number }>;
  paymentMethod?: string;
  confidenceScore: number;
}

export interface ExtractedDocumentData {
  documentType: string;
  documentNumber: string;
  holderName: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  suggestedReminderDays?: number;
  confidenceScore: number;
}

export function extractReceiptData(fileName: string, mimeType?: string): ExtractedReceiptData {
  const lower = fileName.toLowerCase();
  
  if (lower.includes('ratnadeep') || lower.includes('grocery') || lower.includes('mart') || lower.includes('dmart')) {
    return {
      merchant: 'Ratnadeep Supermarket',
      amount: 3450,
      date: new Date().toISOString().split('T')[0],
      category: 'Groceries',
      tax: 172.5,
      items: [
        { name: 'Fortune Sunlite Oil 5L', price: 650, qty: 1 },
        { name: 'India Gate Basmati Rice 5kg', price: 580, qty: 1 },
        { name: 'Nandini GoodLife Milk Pack', price: 240, qty: 4 },
        { name: 'Fresh Fruits & Vegetables', price: 890, qty: 1 },
        { name: 'Surf Excel Matic Liquid', price: 420, qty: 1 },
        { name: 'Dry Fruits Selection', price: 670, qty: 1 },
      ],
      paymentMethod: 'UPI',
      confidenceScore: 0.96,
    };
  }

  if (lower.includes('fuel') || lower.includes('petrol') || lower.includes('indian oil') || lower.includes('hp')) {
    return {
      merchant: 'Indian Oil Petrol Pump',
      amount: 3200,
      date: new Date().toISOString().split('T')[0],
      category: 'Transport & Fuel',
      tax: 480,
      items: [{ name: 'XP95 Petrol (29.6 Litres)', price: 3200, qty: 1 }],
      paymentMethod: 'CREDIT_CARD',
      confidenceScore: 0.98,
    };
  }

  if (lower.includes('swiggy') || lower.includes('zomato') || lower.includes('restaurant') || lower.includes('dining')) {
    return {
      merchant: 'Chutneys Restaurant',
      amount: 1840,
      date: new Date().toISOString().split('T')[0],
      category: 'Food & Dining',
      tax: 92,
      items: [
        { name: 'Guntur Idli Platter', price: 380, qty: 2 },
        { name: 'MLA Pesarattu Special', price: 420, qty: 2 },
        { name: 'Filter Coffee Pot', price: 260, qty: 4 },
      ],
      paymentMethod: 'UPI',
      confidenceScore: 0.94,
    };
  }

  return {
    merchant: 'Apollo Pharmacy & Store',
    amount: 1450,
    date: new Date().toISOString().split('T')[0],
    category: 'Healthcare & Medicine',
    tax: 72.5,
    items: [
      { name: 'Telmisartan 40mg (15 strips)', price: 420, qty: 1 },
      { name: 'Shelcal 500 Calcium Tablets', price: 380, qty: 1 },
      { name: 'Dettol Antiseptic Solution', price: 210, qty: 1 },
      { name: 'First Aid Bandages & Spray', price: 440, qty: 1 },
    ],
    paymentMethod: 'UPI',
    confidenceScore: 0.92,
  };
}

export function extractDocumentData(fileName: string, categoryHint?: string): ExtractedDocumentData {
  const lower = fileName.toLowerCase();

  if (lower.includes('passport')) {
    return {
      documentType: 'Passport',
      documentNumber: 'Z4928104',
      holderName: 'Raj Sharma',
      issuer: 'Ministry of External Affairs, Govt of India',
      issueDate: '2016-10-25',
      expiryDate: '2026-10-24',
      suggestedReminderDays: 45,
      confidenceScore: 0.97,
    };
  }

  if (lower.includes('insurance') || lower.includes('policy')) {
    return {
      documentType: 'Vehicle Insurance Policy',
      documentNumber: 'ICICI-MOT-882910',
      holderName: 'Raj Sharma / Honda City TS09FA4021',
      issuer: 'ICICI Lombard General Insurance',
      issueDate: '2025-09-21',
      expiryDate: '2026-09-21',
      suggestedReminderDays: 12,
      confidenceScore: 0.99,
    };
  }

  if (lower.includes('aadhaar')) {
    return {
      documentType: 'Aadhaar Card',
      documentNumber: '•••• •••• 8492',
      holderName: 'Raj Sharma',
      issuer: 'UIDAI',
      issueDate: '2018-02-10',
      confidenceScore: 0.95,
    };
  }

  return {
    documentType: 'Family Document Record',
    documentNumber: `DOC-${Math.floor(100000 + Math.random() * 900000)}`,
    holderName: 'Sharma Family',
    issuer: 'Authorized Organization',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: '2027-12-31',
    suggestedReminderDays: 30,
    confidenceScore: 0.91,
  };
}
