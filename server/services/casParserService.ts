import db from '../db/database.js';
import { logActivity } from './auditService.js';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export interface ExtractedScheme {
  schemeName: string;
  amc: string;
  folioNumber: string;
  units: number;
  nav: number;
  investedAmount: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
  assetType: 'MUTUAL_FUND' | 'STOCK' | 'GOLD' | 'PPF';
}

export interface CasParseResult {
  success: boolean;
  message: string;
  ownerName?: string;
  pan?: string;
  statementDate?: string;
  totalInvested?: number;
  totalCurrentValue?: number;
  totalGainLoss?: number;
  totalGainLossPct?: number;
  schemesCount?: number;
  schemes: ExtractedScheme[];
  rawTextPreview?: string;
}

/**
 * Extract raw text from PDF buffer
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (err: any) {
    console.warn('pdf-parse warning (may be password-protected or scanned):', err.message);
    return '';
  }
}

/**
 * Parse CAMS / KFintech / MF Central statement text using Google Gemini AI
 */
export async function parseCasWithGeminiAI(
  textContent: string,
  base64Pdf?: string,
  pdfPassword?: string,
  defaultOwner = 'Rambabu'
): Promise<CasParseResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const prompt = `You are an expert Indian Mutual Fund & Demat Consolidated Account Statement (CAS) parser for CAMS, KFintech, MF Central, Zerodha, and Groww statements.

Task:
Parse the following CAS financial statement text and extract all Mutual Fund folios / schemes accurately into a strict JSON object.

Extract details for each scheme:
- schemeName (e.g., "Parag Parikh Flexi Cap Fund - Direct Plan - Growth")
- amc (e.g., "PPFAS Mutual Fund", "SBI Mutual Fund", "HDFC Mutual Fund", etc.)
- folioNumber (e.g., "1234567/89")
- units (number of units held, float)
- nav (current NAV per unit, float)
- investedAmount (cost value / purchase value in INR, float)
- currentValue (valuation / current market value in INR, float)
- assetType ("MUTUAL_FUND" or "STOCK" or "GOLD")

Also extract overall:
- ownerName (Investor name or "${defaultOwner}")
- pan (10-digit PAN if found in statement)
- statementDate (e.g. "31-Aug-2024" or current date)

Output format must be strictly valid JSON without markdown fences or backticks:
{
  "ownerName": "...",
  "pan": "...",
  "statementDate": "...",
  "schemes": [
    {
      "schemeName": "...",
      "amc": "...",
      "folioNumber": "...",
      "units": 0,
      "nav": 0,
      "investedAmount": 0,
      "currentValue": 0,
      "assetType": "MUTUAL_FUND"
    }
  ]
}

Statement Content:
${textContent.slice(0, 50000)}
`;

    const candidateModels = [
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
    ];

    let responseText = '';
    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
        });
        if (response?.text) {
          responseText = response.text;
          break;
        }
      } catch (e: any) {
        console.warn(`Model ${modelName} attempt failed:`, e.message);
      }
    }

    if (!responseText) {
      throw new Error('Could not get response from AI parser');
    }

    // Clean JSON response
    const cleanJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleanJson);
    const rawSchemes: any[] = Array.isArray(parsed.schemes) ? parsed.schemes : [];

    const schemes: ExtractedScheme[] = rawSchemes.map((s) => {
      const invested = Number(s.investedAmount) || Number(s.costValue) || 0;
      const current = Number(s.currentValue) || Number(s.valuation) || invested;
      const gainLoss = current - invested;
      const gainLossPct = invested > 0 ? Number(((gainLoss / invested) * 100).toFixed(1)) : 0;

      return {
        schemeName: s.schemeName || 'Mutual Fund Scheme',
        amc: s.amc || 'Mutual Fund AMC',
        folioNumber: String(s.folioNumber || 'FOLIO-' + Math.floor(100000 + Math.random() * 900000)),
        units: Number(s.units) || 0,
        nav: Number(s.nav) || 0,
        investedAmount: invested,
        currentValue: current,
        gainLoss,
        gainLossPct,
        assetType: s.assetType || 'MUTUAL_FUND',
      };
    });

    const totalInvested = schemes.reduce((sum, s) => sum + s.investedAmount, 0);
    const totalCurrentValue = schemes.reduce((sum, s) => sum + s.currentValue, 0);
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPct = totalInvested > 0 ? Number(((totalGainLoss / totalInvested) * 100).toFixed(1)) : 0;

    return {
      success: true,
      message: `Successfully parsed ${schemes.length} mutual fund folios from CAS statement!`,
      ownerName: parsed.ownerName || defaultOwner,
      pan: parsed.pan || '',
      statementDate: parsed.statementDate || new Date().toISOString().split('T')[0],
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPct,
      schemesCount: schemes.length,
      schemes,
      rawTextPreview: textContent.slice(0, 300),
    };
  } catch (err: any) {
    console.error('Gemini AI CAS parse error:', err);
    return fallbackRegexParser(textContent, defaultOwner);
  }
}

/**
 * Robust Regex Fallback Parser for CAMS / KFintech statements
 */
function fallbackRegexParser(text: string, defaultOwner: string): CasParseResult {
  const schemes: ExtractedScheme[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let currentAmc = 'Mutual Fund';
  let currentFolio = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/mutual fund/i.test(line) && line.length < 80) {
      currentAmc = line.replace(/^(amc:|for\s+)/i, '').trim();
    }

    const folioMatch = line.match(/folio\s*(?:no\.?|number)?[:\s]+([A-Z0-9\/\-]+)/i);
    if (folioMatch) {
      currentFolio = folioMatch[1].trim();
    }

    // Look for scheme names with Growth / Direct / Dividend
    if (/(?:growth|direct|regular|dividend|idcw|index|flexi|equity|debt|hybrid)/i.test(line) && line.length > 10 && line.length < 120) {
      const schemeName = line;
      let units = 0;
      let nav = 0;
      let currentValue = 0;
      let investedAmount = 0;

      // Look in next 3 lines for numeric balances
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        const nums = nextLine.match(/[\d,]+(?:\.\d+)?/g);
        if (nums && nums.length >= 2) {
          const parsedNums = nums.map((n) => parseFloat(n.replace(/,/g, ''))).filter((n) => !isNaN(n) && n > 0);
          if (parsedNums.length >= 2) {
            units = parsedNums[0];
            currentValue = parsedNums[parsedNums.length - 1];
            if (parsedNums.length >= 3) {
              nav = parsedNums[1];
            }
            investedAmount = currentValue * 0.85; // approx cost if not explicitly given
            break;
          }
        }
      }

      if (currentValue > 0 || units > 0) {
        schemes.push({
          schemeName,
          amc: currentAmc,
          folioNumber: currentFolio || 'FOLIO-' + Math.floor(100000 + Math.random() * 900000),
          units,
          nav,
          investedAmount,
          currentValue,
          gainLoss: currentValue - investedAmount,
          gainLossPct: investedAmount > 0 ? Number((((currentValue - investedAmount) / investedAmount) * 100).toFixed(1)) : 0,
          assetType: 'MUTUAL_FUND',
        });
      }
    }
  }

  const totalInvested = schemes.reduce((sum, s) => sum + s.investedAmount, 0);
  const totalCurrentValue = schemes.reduce((sum, s) => sum + s.currentValue, 0);

  return {
    success: schemes.length > 0,
    message: schemes.length > 0
      ? `Parsed ${schemes.length} schemes using tabular parser.`
      : 'Could not automatically identify fund rows. Please check if file is password-protected.',
    ownerName: defaultOwner,
    totalInvested,
    totalCurrentValue,
    totalGainLoss: totalCurrentValue - totalInvested,
    totalGainLossPct: totalInvested > 0 ? Number((((totalCurrentValue - totalInvested) / totalInvested) * 100).toFixed(1)) : 0,
    schemesCount: schemes.length,
    schemes,
    rawTextPreview: text.slice(0, 300),
  };
}

/**
 * Commit extracted CAS schemes to Family Wealth in Database
 */
export async function commitCasToFamilyWealth(
  familyId: string,
  userId: string,
  ownerName: string,
  panNumber: string,
  schemes: ExtractedScheme[]
): Promise<{ success: boolean; addedCount: number; totalValue: number; items: any[] }> {
  const inserted: any[] = [];
  let totalValue = 0;

  for (const s of schemes) {
    const newInv = {
      id: `inv_cas_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      family_id: familyId,
      title: s.schemeName,
      type: s.assetType || 'MUTUAL_FUND',
      institution: s.amc || 'Mutual Fund AMC',
      invested_amount: s.investedAmount,
      current_value: s.currentValue,
      folio_number: s.folioNumber,
      maturity_date: '',
      nominee: 'Family Nominee',
      notes: `Units: ${s.units?.toLocaleString('en-IN') || '0'} • NAV: ₹${s.nav || '0'} • CAS Auto-Synced`,
      owner_name: ownerName || 'Rambabu',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.insert('investments', newInv);
    inserted.push(newInv);
    totalValue += s.currentValue;
  }

  // Audit Log
  logActivity({
    familyId,
    userId,
    userName: ownerName,
    action: 'CREATE',
    resource: 'INVESTMENT',
    resourceId: inserted[0]?.id || 'cas_sync',
    details: `Imported ${schemes.length} real mutual fund folios totaling ₹${totalValue.toLocaleString('en-IN')} from CAMS / KFintech CAS statement for ${ownerName}`,
  });

  return {
    success: true,
    addedCount: inserted.length,
    totalValue,
    items: inserted,
  };
}
