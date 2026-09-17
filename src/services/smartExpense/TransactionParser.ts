import { ParsedTransactionResult, TransactionType } from './types.js';
import { FinancialMessageDetector } from './FinancialMessageDetector.js';
import { AmountParser } from './AmountParser.js';
import { TransactionDirectionClassifier } from './TransactionDirectionClassifier.js';
import { MerchantNormalizer } from './MerchantNormalizer.js';
import { ExpenseCategoryEngine } from './ExpenseCategoryEngine.js';
import { TransactionDuplicateDetector } from './TransactionDuplicateDetector.js';

export interface ITransactionParser {
  name: string;
  canParse(message: string, sender?: string): boolean;
  parse(message: string, sender?: string, userPreferences?: { [key: string]: string }): ParsedTransactionResult | null;
}

// 1. Generic UPI Parser
export class GenericUpiParser implements ITransactionParser {
  name = 'GenericUpiParser';

  canParse(message: string): boolean {
    return /\b(?:upi|vpa|via\s+upi)\b/i.test(message);
  }

  parse(message: string, sender: string = '', userPreferences = {}): ParsedTransactionResult | null {
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
      transactionDateTime: new Date().toISOString(),
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

  parse(message: string, sender: string = '', userPreferences = {}): ParsedTransactionResult | null {
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
      transactionDateTime: new Date().toISOString(),
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

  parse(message: string, sender: string = '', userPreferences = {}): ParsedTransactionResult | null {
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
      transactionDateTime: new Date().toISOString(),
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

  parse(message: string, sender: string = '', userPreferences = {}): ParsedTransactionResult | null {
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
      transactionDateTime: new Date().toISOString(),
      categorySuggested: catResult.category,
      categoryConfidence: catResult.confidence,
      parserUsed: this.name,
      rawSourceHash: TransactionDuplicateDetector.generateHash(message),
    };
  }
}

// 5. Generic Bank & Debit Fallback Parser
export class GenericDebitParser implements ITransactionParser {
  name = 'GenericDebitParser';

  canParse(): boolean {
    return true; // Fallback handles anything that passed FinancialMessageDetector
  }

  parse(message: string, sender: string = '', userPreferences = {}): ParsedTransactionResult | null {
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
      transactionDateTime: new Date().toISOString(),
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
    new GenericUpiParser(),
    new GenericDebitParser(),
  ];

  public static parse(
    message: string,
    sender: string = '',
    userPreferences = {}
  ): ParsedTransactionResult | null {
    if (!FinancialMessageDetector.isFinancialMessage(message, sender)) {
      return null;
    }

    for (const parser of this.parsers) {
      if (parser.canParse(message, sender)) {
        const result = parser.parse(message, sender, userPreferences);
        if (result && result.amount && result.amount > 0) {
          return result;
        }
      }
    }

    return null;
  }
}

export const TransactionParser = TransactionParserPipeline;
