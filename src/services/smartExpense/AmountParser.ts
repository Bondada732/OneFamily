/**
 * AmountParser
 * Robust parsing of Indian currency formats (₹, Rs., INR, /-) into clean numeric values.
 */

export class AmountParser {
  private static AMOUNT_REGEX_PREFIX = /(?:(?:rs\.?|inr|₹)\s*|amount\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*|amt\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*)([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  private static AMOUNT_REGEX_POSTFIX = /([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:(?:rs\.?|inr|₹|\/-))/i;
  private static AMOUNT_REGEX_VERB = /(?:paid|debited|spent|transferred|sent|received|withdrawn|credited|payment\s+of|txn\s+of)\s+(?:of\s+)?(?:(?:rs\.?|inr|₹)\s*)?([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  private static AMOUNT_REGEX_GENERAL = /\b([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\b/;

  public static parse(messageBody: string): { amount: number; currency: string } | null {
    if (!messageBody) return null;

    let match = this.AMOUNT_REGEX_PREFIX.exec(messageBody);
    if (!match || !match[1]) {
      match = this.AMOUNT_REGEX_POSTFIX.exec(messageBody);
    }
    if (!match || !match[1]) {
      match = this.AMOUNT_REGEX_VERB.exec(messageBody);
    }
    if (!match || !match[1]) {
      // Check if there is any currency symbol in the text and extract first number
      if (/(?:rs\.?|inr|₹|\/-)/i.test(messageBody)) {
        match = this.AMOUNT_REGEX_GENERAL.exec(messageBody);
      }
    }
    if (!match || !match[1]) return null;

    const rawNumberStr = match[1].replace(/,/g, '').trim();
    const parsedAmount = parseFloat(rawNumberStr);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return null;
    }

    // Ignore 10-digit phone numbers or 12-digit UPI reference numbers as amounts
    if (parsedAmount > 100000000 && !rawNumberStr.includes('.')) {
      return null;
    }

    return {
      amount: Math.round(parsedAmount * 100) / 100,
      currency: 'INR',
    };
  }
}
