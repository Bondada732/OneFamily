/**
 * FinancialMessageDetector
 * Determines whether a message is genuinely a financial transaction
 * and filters out OTPs, promotional/marketing messages, and general chats.
 */

import { AmountParser } from './AmountParser.js';

export class FinancialMessageDetector {
  private static OTP_PATTERNS = [
    /\bOTP\b/i,
    /one\s*time\s*password/i,
    /verification\s*code/i,
    /security\s*code/i,
    /login\s*code/i,
    /passcode/i,
    /do\s*not\s*share/i,
    /never\s*share\s*your\s*otp/i,
    /is\s*your\s*secret\s*code/i,
  ];

  private static MARKETING_PATTERNS = [
    /get\s+(?:rs\.?|inr|₹)\s*\d+\s+cashback\s+when/i,
    /pre-?approved\s+(?:personal\s+)?loan/i,
    /apply\s+(?:now|online|for)/i,
    /congratulations\s+you\s+(?:have\s+)?won/i,
    /avail\s+discount/i,
    /flat\s+\d+%\s+off/i,
    /use\s+coupon\s+code/i,
    /zero\s+down\s*payment/i,
    /hurry\s+offer\s+ends/i,
    /limited\s+period\s+offer/i,
  ];

  private static FINANCIAL_KEYWORDS = [
    /\bdebited\b/i,
    /\bcredited\b/i,
    /\bpaid\b/i,
    /\bspent\b/i,
    /\btransferred\b/i,
    /\bsent\b/i,
    /\breceived\b/i,
    /\bwithdrawn\b/i,
    /\bpurchase\b/i,
    /\bupi\b/i,
    /\bvpa\b/i,
    /\bpaytm\b/i,
    /\bgpay\b/i,
    /\bphonepe\b/i,
    /\bupi\s*(?:ref|txn|id)\b/i,
    /\bref(?:\s*no|\s*id)?\s*[:#]?\s*\d+/i,
    /\ba\/?c\b/i,
    /\bacct\b/i,
    /\baccount\b/i,
    /\bavbl\s*bal\b/i,
    /\bbal\b/i,
    /\bbalance\b/i,
    /\bpayment\b/i,
    /\bcard\b/i,
    /\binr\b/i,
    /\brs\.?\b/i,
  ];

  public static isFinancialMessage(messageBody: string, sender: string = ''): boolean {
    if (!messageBody || typeof messageBody !== 'string') return false;
    const body = messageBody.trim();
    if (body.length < 8) return false;

    // 1. Immediately reject OTP messages
    for (const pattern of this.OTP_PATTERNS) {
      if (pattern.test(body)) {
        return false;
      }
    }

    // 2. Reject marketing / promotional / cashback pitch messages
    for (const pattern of this.MARKETING_PATTERNS) {
      if (pattern.test(body)) {
        return false;
      }
    }

    // 3. Must contain an amount
    const parsedAmount = AmountParser.parse(body);
    if (!parsedAmount || !parsedAmount.amount || parsedAmount.amount <= 0) {
      return false;
    }

    // 4. Must match financial keywords
    let keywordMatchCount = 0;
    for (const pattern of this.FINANCIAL_KEYWORDS) {
      if (pattern.test(body)) {
        keywordMatchCount++;
      }
    }

    // Sender hint
    const isBankSender = /^[A-Z]{2}-[A-Z0-9]{5,8}$/i.test(sender) || /(?:sbi|hdfc|icici|axis|kotak|pnb|bob|canara|paytm|airtel|jio|union|idbi|indusind|yes)/i.test(sender);

    return keywordMatchCount >= 1 || isBankSender;
  }
}
