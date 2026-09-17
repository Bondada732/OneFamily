/**
 * AmountParser
 * Robust parsing of Indian currency formats (₹, Rs., INR, /-) into clean numeric values.
 */

export class AmountParser {
  private static AMOUNT_REGEX_PREFIX = /(?:(?:rs\.?|inr|₹)\s*|amount\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*)([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;
  private static AMOUNT_REGEX_POSTFIX = /([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)\s*(?:(?:rs\.?|inr|₹|\/-))/i;

  public static parse(messageBody: string): { amount: number; currency: string } | null {
    if (!messageBody) return null;

    let match = this.AMOUNT_REGEX_PREFIX.exec(messageBody);
    if (!match || !match[1]) {
      match = this.AMOUNT_REGEX_POSTFIX.exec(messageBody);
    }
    if (!match || !match[1]) return null;

    const rawNumberStr = match[1].replace(/,/g, '').trim();
    const parsedAmount = parseFloat(rawNumberStr);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return null;
    }

    if (parsedAmount > 100000000 && !rawNumberStr.includes('.')) {
      return null;
    }

    return {
      amount: Math.round(parsedAmount * 100) / 100,
      currency: 'INR',
    };
  }
}
