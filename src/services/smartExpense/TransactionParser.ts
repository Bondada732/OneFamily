import { ParsedTransactionResult, TransactionType } from './types.js';
import { FinancialMessageDetector } from './FinancialMessageDetector.js';
import { AmountParser } from './AmountParser.js';
import { TransactionDirectionClassifier } from './TransactionDirectionClassifier.js';
import { MerchantNormalizer } from './MerchantNormalizer.js';
import { ExpenseCategoryEngine } from './ExpenseCategoryEngine.js';
import { TransactionDuplicateDetector } from './TransactionDuplicateDetector.js';

export class TransactionDateParser {
  private static MONTHS: { [key: string]: number } = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    january: 0, february: 1, march: 2, april: 3, may_full: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  public static parse(message: string, fallbackTimestamp?: string | number): string {
    // 1. If explicit timestamp from SMS received metadata is valid, prioritize or prepare it
    let receivedDate: Date | null = null;
    if (fallbackTimestamp) {
      const num = Number(fallbackTimestamp);
      if (!isNaN(num) && num > 100000000000) {
        receivedDate = new Date(num);
      } else {
        const d = new Date(fallbackTimestamp);
        if (!isNaN(d.getTime())) receivedDate = d;
      }
    }

    if (!message && receivedDate) return receivedDate.toISOString();
    if (!message) return new Date().toISOString();

    // 2. Try to extract explicit date and time from the SMS body
    // Pattern: DD-Mon-YY or DD-Mon-YYYY or DDMonYY (e.g. 17-Sep-26, 17Sep26, 17 September 2026)
    const textDateMatch = /(?:on\s+)?(\d{1,2})[-/\s]?([a-zA-Z]{3,9})[-/\s]?(\d{2,4})(?:\s+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i.exec(message);
    if (textDateMatch) {
      const day = parseInt(textDateMatch[1], 10);
      const monStr = textDateMatch[2].toLowerCase();
      let year = parseInt(textDateMatch[3], 10);
      if (year < 100) year += 2000;

      const month = this.MONTHS[monStr];
      if (month !== undefined && day >= 1 && day <= 31) {
        let hour = textDateMatch[4] ? parseInt(textDateMatch[4], 10) : receivedDate ? receivedDate.getHours() : 12;
        const min = textDateMatch[5] ? parseInt(textDateMatch[5], 10) : receivedDate ? receivedDate.getMinutes() : 0;
        const sec = textDateMatch[6] ? parseInt(textDateMatch[6], 10) : receivedDate ? receivedDate.getSeconds() : 0;
        const ampm = textDateMatch[7]?.toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      }
    }

    // 3. Pattern: DD-MM-YYYY or DD/MM/YY (e.g. 17/09/2026, 17-09-26)
    const numDateMatch = /(?:on\s+)?(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})(?:\s+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?/i.exec(message);
    if (numDateMatch) {
      const day = parseInt(numDateMatch[1], 10);
      const month = parseInt(numDateMatch[2], 10) - 1;
      let year = parseInt(numDateMatch[3], 10);
      if (year < 100) year += 2000;

      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        let hour = numDateMatch[4] ? parseInt(numDateMatch[4], 10) : receivedDate ? receivedDate.getHours() : 12;
        const min = numDateMatch[5] ? parseInt(numDateMatch[5], 10) : receivedDate ? receivedDate.getMinutes() : 0;
        const sec = numDateMatch[6] ? parseInt(numDateMatch[6], 10) : receivedDate ? receivedDate.getSeconds() : 0;
        const ampm = numDateMatch[7]?.toLowerCase();
        if (ampm === 'pm' && hour < 12) hour += 12;
        if (ampm === 'am' && hour === 12) hour = 0;

        const d = new Date(year, month, day, hour, min, sec);
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      }
    }

    // 4. Fallback to SMS received timestamp from carrier
    if (receivedDate && !isNaN(receivedDate.getTime())) {
      return receivedDate.toISOString();
    }

    return new Date().toISOString();
  }
}

export interface ITransactionParser {
  name: string;
  canParse(message: string, sender?: string): boolean;
  parse(
    message: string,
    sender?: string,
    userPreferences?: { [key: string]: string },
    timestamp?: string | number
  ): ParsedTransactionResult | null;
}

// 1. Generic UPI Parser
export class GenericUpiParser implements ITransactionParser {
  name = 'GenericUpiParser';

  canParse(message: string): boolean {
    return /\b(?:upi|vpa|via\s+upi)\b/i.test(message);
  }

  parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    const amountData = AmountParser.parse(message);
    if (!amountData) return null;

    const direction = TransactionDirectionClassifier.classify(message);

    // Extract Account Last 4 digits
    const acctMatch = /(?:a\/?c|acct|account|card)\s*(?:no\.?|ending)?\s*[:*xX]*(\d{3,4})\b/i.exec(message);
    const accountLast4 = acctMatch ? acctMatch[1] : undefined;

    // Extract UPI Reference / Txn ID
    const refMatch = /(?:ref(?:\s*no|\s*id)?|upi\s*ref|rrn|txn\s*id)\s*[:#]?\s*([0-9a-zA-Z]{6,16})/i.exec(message);
    const transactionReference = refMatch ? refMatch[1] : undefined;

    // Extract Payee / Merchant / VPA
    let rawMerchant = '';
    const vpaMatch = /([a-zA-Z0-9._-]+@[a-zA-Z0-9_-]+)/.exec(message);
    if (vpaMatch) {
      rawMerchant = vpaMatch[1];
    } else {
      const toMatch = /(?:to|paid\s+to|transfer(?:red)?\s+to|towards)\s+([a-zA-Z0-9\s&.'-]+?)(?:\s+(?:via|ref|on|a\/c|using|upi|\.)|$)/i.exec(message);
      if (toMatch && toMatch[1]) {
        rawMerchant = toMatch[1].trim();
      }
    }

    const { normalized } = MerchantNormalizer.normalize(rawMerchant);
    const catResult = ExpenseCategoryEngine.suggestCategory(normalized, message, userPreferences);
    const txDate = TransactionDateParser.parse(message, timestamp);

    return {
      isFinancial: true,
      amount: amountData.amount,
      currency: amountData.currency,
      direction,
      transactionType: 'UPI' as TransactionType,
      merchantRaw: rawMerchant || 'UPI Merchant',
      merchantNormalized: normalized,
      upiId: vpaMatch ? vpaMatch[1] : undefined,
      accountLast4,
      transactionReference,
      transactionDateTime: txDate,
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// 2. SBI Bank Parser
export class SbiParser implements ITransactionParser {
  name = 'SbiParser';

  canParse(message: string, sender: string = ''): boolean {
    return /sbi/i.test(sender) || /sbi/i.test(message) || /state\s*bank/i.test(message);
  }

  parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    const amountData = AmountParser.parse(message);
    if (!amountData) return null;

    const direction = TransactionDirectionClassifier.classify(message);
    const acctMatch = /(?:a\/?c|account|acct|card)\s*(?:no\.?|ending|is)?\s*[:*xX\s]*(\d{3,4})\b/i.exec(message);
    const refMatch = /(?:ref|txn|rrn|upi)\s*(?:no\.?|id)?\s*[:#]?\s*([0-9a-zA-Z]{6,16})/i.exec(message);

    let rawMerchant = '';
    const toMatch = /(?:transfer\s+to|paid\s+to|to)\s+([a-zA-Z0-9\s&.'-]+?)(?:\s+(?:ref|on|val|bal|\.)|$)/i.exec(message);
    if (toMatch) {
      rawMerchant = toMatch[1].trim();
    }

    const { normalized } = MerchantNormalizer.normalize(rawMerchant);
    const catResult = ExpenseCategoryEngine.suggestCategory(normalized, message, userPreferences);
    const txDate = TransactionDateParser.parse(message, timestamp);

    return {
      isFinancial: true,
      amount: amountData.amount,
      currency: amountData.currency,
      direction,
      transactionType: /upi/i.test(message) ? 'UPI' : 'BANK_TRANSFER',
      merchantRaw: rawMerchant || 'SBI Merchant',
      merchantNormalized: normalized,
      bankName: 'State Bank of India',
      accountLast4: acctMatch ? acctMatch[1] : undefined,
      transactionReference: refMatch ? refMatch[1] : undefined,
      transactionDateTime: txDate,
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// 3. HDFC Bank Parser
export class HdfcParser implements ITransactionParser {
  name = 'HdfcParser';

  canParse(message: string, sender: string = ''): boolean {
    return /hdfc/i.test(sender) || /hdfc/i.test(message);
  }

  parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    const amountData = AmountParser.parse(message);
    if (!amountData) return null;

    const direction = TransactionDirectionClassifier.classify(message);
    const acctMatch = /(?:a\/?c|account|acct|card)\s*(?:no\.?|ending|is)?\s*[:*xX\s]*(\d{3,4})\b/i.exec(message);
    const refMatch = /(?:ref|info|upi:?|rrn|txn)\s*[:/#]?\s*([0-9a-zA-Z]{6,16})/i.exec(message);

    let rawMerchant = '';
    const toMatch = /(?:to|at|towards|vpa)\s+([a-zA-Z0-9\s&.'-]+?)(?:\s+(?:on|info|ref|\.)|$)/i.exec(message);
    if (toMatch) {
      rawMerchant = toMatch[1].trim();
    }

    const { normalized } = MerchantNormalizer.normalize(rawMerchant);
    const catResult = ExpenseCategoryEngine.suggestCategory(normalized, message, userPreferences);
    const txDate = TransactionDateParser.parse(message, timestamp);

    return {
      isFinancial: true,
      amount: amountData.amount,
      currency: amountData.currency,
      direction,
      transactionType: /upi/i.test(message) ? 'UPI' : /card/i.test(message) ? 'CARD' : 'BANK_TRANSFER',
      merchantRaw: rawMerchant || 'HDFC Merchant',
      merchantNormalized: normalized,
      bankName: 'HDFC Bank',
      accountLast4: acctMatch ? acctMatch[1] : undefined,
      transactionReference: refMatch ? refMatch[1] : undefined,
      transactionDateTime: txDate,
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// 4. ICICI Bank Parser
export class IciciParser implements ITransactionParser {
  name = 'IciciParser';

  canParse(message: string, sender: string = ''): boolean {
    return /icici/i.test(sender) || /icici/i.test(message);
  }

  parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    const amountData = AmountParser.parse(message);
    if (!amountData) return null;

    const direction = TransactionDirectionClassifier.classify(message);
    const acctMatch = /(?:a\/?c|account|acct|card)\s*(?:no\.?|ending|is)?\s*[:*xX\s]*(\d{3,4})\b/i.exec(message);
    const refMatch = /(?:upi|ref|rrn|txn)\s*[:/#]?\s*([0-9a-zA-Z]{6,16})/i.exec(message);

    let rawMerchant = '';
    const creditedMatch = /([a-zA-Z0-9\s&.'-]+?)\s+credited/i.exec(message);
    if (creditedMatch) {
      rawMerchant = creditedMatch[1].trim();
    } else {
      const toMatch = /(?:to|at|towards)\s+([a-zA-Z0-9\s&.'-]+?)(?:\s+(?:on|upi|\.)|$)/i.exec(message);
      if (toMatch) rawMerchant = toMatch[1].trim();
    }

    const { normalized } = MerchantNormalizer.normalize(rawMerchant);
    const catResult = ExpenseCategoryEngine.suggestCategory(normalized, message, userPreferences);
    const txDate = TransactionDateParser.parse(message, timestamp);

    return {
      isFinancial: true,
      amount: amountData.amount,
      currency: amountData.currency,
      direction,
      transactionType: /upi/i.test(message) ? 'UPI' : 'BANK_TRANSFER',
      merchantRaw: rawMerchant || 'ICICI Merchant',
      merchantNormalized: normalized,
      bankName: 'ICICI Bank',
      accountLast4: acctMatch ? acctMatch[1] : undefined,
      transactionReference: refMatch ? refMatch[1] : undefined,
      transactionDateTime: txDate,
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// 5. Paytm & Paytm Payments Bank Parser
export class PaytmParser implements ITransactionParser {
  name = 'PaytmParser';

  canParse(message: string, sender: string = ''): boolean {
    return /paytm/i.test(sender) || /paytm/i.test(message);
  }

  parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    const amountData = AmountParser.parse(message);
    if (!amountData) return null;

    const direction = TransactionDirectionClassifier.classify(message);
    const acctMatch = /(?:a\/?c|wallet|card|account)\s*(?:no\.?|ending|is)?\s*[:*xX\s]*(\d{3,4})\b/i.exec(message);
    const refMatch = /(?:ref|txn|rrn|upi|id)\s*(?:no\.?|id)?\s*[:#]?\s*([0-9a-zA-Z]{6,16})/i.exec(message);

    let rawMerchant = '';
    const vpaMatch = /([a-zA-Z0-9._-]+@[a-zA-Z0-9_-]+)/.exec(message);
    if (vpaMatch) {
      rawMerchant = vpaMatch[1];
    } else {
      const toMatch = /(?:to|paid\s+to|transfer(?:red)?\s+to|sent\s+to|towards)\s+([a-zA-Z0-9\s&.'-]+?)(?:\s+(?:using|via|on|ref|a\/c|upi|\.)|$)/i.exec(message);
      if (toMatch && toMatch[1]) {
        rawMerchant = toMatch[1].trim();
      }
    }

    const { normalized } = MerchantNormalizer.normalize(rawMerchant || 'Paytm Transfer');
    const catResult = ExpenseCategoryEngine.suggestCategory(normalized, message, userPreferences);
    const txDate = TransactionDateParser.parse(message, timestamp);

    return {
      isFinancial: true,
      amount: amountData.amount,
      currency: amountData.currency,
      direction,
      transactionType: 'UPI',
      merchantRaw: rawMerchant || 'Paytm Payee',
      merchantNormalized: normalized,
      bankName: 'Paytm Payments Bank',
      upiId: vpaMatch ? vpaMatch[1] : undefined,
      accountLast4: acctMatch ? acctMatch[1] : undefined,
      transactionReference: refMatch ? refMatch[1] : undefined,
      transactionDateTime: txDate,
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// 6. Generic Bank & Debit Fallback Parser
export class GenericDebitParser implements ITransactionParser {
  name = 'GenericDebitParser';

  canParse(): boolean {
    return true; // Fallback handles anything that passed FinancialMessageDetector
  }

  parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    const amountData = AmountParser.parse(message);
    if (!amountData) return null;

    const direction = TransactionDirectionClassifier.classify(message);
    const acctMatch = /(?:a\/?c|account|acct|card)\s*(?:no\.?|ending|is)?\s*[:*xX\s]*(\d{3,4})\b/i.exec(message);
    const refMatch = /(?:ref|rrn|txn|id)\s*[:#]?\s*([0-9a-zA-Z]{6,16})/i.exec(message);

    let rawMerchant = '';
    const toMatch = /(?:to|at|paid\s+to|transfer\s+to|towards)\s+([a-zA-Z0-9\s&.'-]+?)(?:\s+(?:on|ref|a\/c|\.)|$)/i.exec(message);
    if (toMatch) {
      rawMerchant = toMatch[1].trim();
    }

    const { normalized } = MerchantNormalizer.normalize(rawMerchant);
    const catResult = ExpenseCategoryEngine.suggestCategory(normalized, message, userPreferences);
    const txDate = TransactionDateParser.parse(message, timestamp);

    return {
      isFinancial: true,
      amount: amountData.amount,
      currency: amountData.currency,
      direction,
      transactionType: /upi/i.test(message) ? 'UPI' : /card/i.test(message) ? 'CARD' : 'BANK_TRANSFER',
      merchantRaw: rawMerchant || 'Merchant',
      merchantNormalized: normalized,
      accountLast4: acctMatch ? acctMatch[1] : undefined,
      transactionReference: refMatch ? refMatch[1] : undefined,
      transactionDateTime: txDate,
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// Master Transaction Parser Pipeline
export class TransactionParserPipeline {
  private static parsers: ITransactionParser[] = [
    new SbiParser(),
    new HdfcParser(),
    new IciciParser(),
    new PaytmParser(),
    new GenericUpiParser(),
    new GenericDebitParser(),
  ];

  public static parse(
    message: string,
    sender: string = '',
    userPreferences = {},
    timestamp?: string | number
  ): ParsedTransactionResult | null {
    if (!FinancialMessageDetector.isFinancialMessage(message, sender)) {
      return null;
    }

    for (const parser of this.parsers) {
      if (parser.canParse(message, sender)) {
        const result = parser.parse(message, sender, userPreferences, timestamp);
        if (result && result.amount && result.amount > 0) {
          return result;
        }
      }
    }

    return null;
  }
}

export const TransactionParser = TransactionParserPipeline;
