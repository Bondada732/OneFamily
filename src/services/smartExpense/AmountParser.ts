/**
 * AmountParser
 * Robust parsing of Indian currency formats (₹, Rs., INR) into clean numeric values.
 */

export class AmountParser {
  // Regex to match Indian currency amounts with optional decimals and thousand commas
  private static AMOUNT_REGEX = /(?:(?:rs\.?|inr|₹)\s*|amount\s*(?:of\s*)?(?:rs\.?|inr|₹)?\s*)([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i;

  public static parse(messageBody: string): { amount: number; currency: string } | null {
    if (!messageBody) return null;

    const match = this.AMOUNT_REGEX.exec(messageBody);
    if (!match || !match[1]) return null;

    // Clean out commas
    const rawNumberStr = match[1].replace(/,/g, '').trim();
    const parsedAmount = parseFloat(rawNumberStr);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return null;
    }

    // Safety checks: reject numbers that resemble full 12-digit ref numbers or 6-digit OTPs without decimals
    if (parsedAmount > 100000000 && !rawNumberStr.includes('.')) {
      return null;
    }

    return {
      amount: Math.round(parsedAmount * 100) / 100,
      currency: 'INR',
    };
  }
}
