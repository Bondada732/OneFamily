import { Direction } from './types.js';

export class TransactionDirectionClassifier {
  private static DEBIT_KEYWORDS = [
    /\bdebited\b/i,
    /\bpaid\b/i,
    /\bspent\b/i,
    /\bsent\b/i,
    /\bwithdrawn\b/i,
    /\bpurchase\b/i,
    /\bcharged\b/i,
    /\btransferred\s*to\b/i,
  ];

  private static CREDIT_KEYWORDS = [
    /\bcredited\b/i,
    /\breceived\b/i,
    /\brefund\b/i,
    /\bcashback\b/i,
    /\bdeposited\b/i,
    /\btransferred\s*from\b/i,
  ];

  public static classify(messageBody: string): Direction {
    if (!messageBody) return 'DEBIT';

    let isDebit = false;
    let isCredit = false;

    for (const pattern of this.DEBIT_KEYWORDS) {
      if (pattern.test(messageBody)) {
        isDebit = true;
        break;
      }
    }

    for (const pattern of this.CREDIT_KEYWORDS) {
      if (pattern.test(messageBody)) {
        isCredit = true;
        break;
      }
    }

    // If both occur (e.g., "debited from A/c and credited to VPA"), check primary account debit
    if (isDebit && isCredit) {
      if (/debited\s+from/i.test(messageBody) || /paid\s+to/i.test(messageBody)) {
        return 'DEBIT';
      }
      if (/credited\s+to/i.test(messageBody) && !/debited/i.test(messageBody)) {
        return 'CREDIT';
      }
    }

    return isCredit && !isDebit ? 'CREDIT' : 'DEBIT';
  }
}
