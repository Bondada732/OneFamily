import { DetectedTransaction } from './types.js';

export class TransactionDuplicateDetector {
  /**
   * Generates a fast SHA-256-like unique hex hash for normalized message contents
   */
  public static generateHash(message: string): string {
    let hash = 0;
    const str = message.toLowerCase().replace(/[\s\r\n]+/g, ' ').trim();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    const hex = Math.abs(hash).toString(16);
    return `hash_${hex}_${str.length}`;
  }

  /**
   * Detects whether candidate transaction is a duplicate of any existing transaction
   */
  public static isDuplicate(
    candidate: {
      amount: number;
      merchantNormalized: string;
      transactionReference?: string;
      rawSourceHash?: string;
      transactionDateTime?: string;
    },
    existingList: DetectedTransaction[]
  ): { isDuplicate: boolean; duplicateId?: string; confidence: number; reason?: string } {
    if (!candidate || !existingList || existingList.length === 0) {
      return { isDuplicate: false, confidence: 0 };
    }

    const candTime = new Date(candidate.transactionDateTime || Date.now()).getTime();

    for (const item of existingList) {
      // Rule 1: Exact transaction reference match (Highest confidence 1.0)
      if (
        candidate.transactionReference &&
        item.transactionReference &&
        candidate.transactionReference.trim() === item.transactionReference.trim()
      ) {
        return {
          isDuplicate: true,
          duplicateId: item.id,
          confidence: 1.0,
          reason: 'MATCHED_REFERENCE_NUMBER',
        };
      }

      // Rule 2: Exact source hash match
      if (
        candidate.rawSourceHash &&
        item.rawSourceHash &&
        candidate.rawSourceHash === item.rawSourceHash
      ) {
        return {
          isDuplicate: true,
          duplicateId: item.id,
          confidence: 0.98,
          reason: 'MATCHED_RAW_SOURCE_HASH',
        };
      }

      // Rule 3: Amount + Normalized Merchant + within ±5 minutes time window
      if (
        Math.abs(item.amount - candidate.amount) < 0.01 &&
        item.merchantNormalized.toLowerCase() === candidate.merchantNormalized.toLowerCase()
      ) {
        const itemTime = new Date(item.transactionDateTime || item.detectedAt).getTime();
        const diffMs = Math.abs(itemTime - candTime);

        if (diffMs <= 5 * 60 * 1000) {
          return {
            isDuplicate: true,
            duplicateId: item.id,
            confidence: 0.90,
            reason: 'MATCHED_TIME_AMOUNT_MERCHANT',
          };
        }
      }
    }

    return { isDuplicate: false, confidence: 0 };
  }
}
