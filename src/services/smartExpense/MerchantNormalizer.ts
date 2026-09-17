/**
 * MerchantNormalizer
 * Normalizes raw merchant strings, VPAs, and messy bank descriptions into canonical merchant names.
 */

export class MerchantNormalizer {
  // Common Indian Merchant Alias mappings
  private static KNOWN_MERCHANTS: { [key: string]: string } = {
    swiggy: 'Swiggy',
    zomato: 'Zomato',
    uber: 'Uber',
    ola: 'Ola Cabs',
    rapido: 'Rapido',
    blinkit: 'Blinkit',
    zepto: 'Zepto',
    instamart: 'Instamart',
    bbdaily: 'BigBasket',
    bigbasket: 'BigBasket',
    amazon: 'Amazon',
    amazonpay: 'Amazon',
    flipkart: 'Flipkart',
    myntra: 'Myntra',
    ajio: 'Ajio',
    netflix: 'Netflix',
    spotify: 'Spotify',
    hotstar: 'Disney+ Hotstar',
    prime: 'Amazon Prime',
    jiomart: 'JioMart',
    dmart: 'DMart',
    apollo: 'Apollo Pharmacy',
    pharmeasy: 'PharmEasy',
    medplus: 'MedPlus',
    tatacliq: 'Tata CLiQ',
    starbucks: 'Starbucks',
    mcdonalds: "McDonald's",
    kfc: 'KFC',
    dominos: "Domino's Pizza",
    pizza_hut: 'Pizza Hut',
    makemytrip: 'MakeMyTrip',
    goibibo: 'Goibibo',
    irctc: 'IRCTC',
    cleartrip: 'Cleartrip',
    airtel: 'Airtel',
    jio: 'Jio',
    vi: 'Vodafone Idea',
    tatapower: 'Tata Power',
    bescom: 'BESCOM',
    cred: 'CRED',
    paytm: 'Paytm',
    phonepe: 'PhonePe',
    googlepay: 'Google Pay',
  };

  public static normalize(rawMerchant: string): { normalized: string; isKnown: boolean } {
    if (!rawMerchant) {
      return { normalized: 'Unknown Merchant', isKnown: false };
    }

    let cleaned = rawMerchant.trim();

    // 1. If it's a UPI ID / VPA (e.g. swiggy@upi, amazonpay.rbi@okhdfcbank)
    if (cleaned.includes('@')) {
      const handle = cleaned.split('@')[0].toLowerCase();
      // Look for known prefix in handle (e.g. paytm-swiggy or swiggy123)
      for (const [key, canonical] of Object.entries(this.KNOWN_MERCHANTS)) {
        if (handle.includes(key)) {
          return { normalized: canonical, isKnown: true };
        }
      }
      cleaned = handle.replace(/[^a-zA-Z0-9\s_-]/g, ' ');
    }

    // 2. Strip noise words, payment gateways, and company suffixes
    cleaned = cleaned
      .replace(/\b(?:pvt|ltd|limited|llc|inc|corp|co|india|retail|store|services|payments?|gateway|pos|e-?com)\b/gi, '')
      .replace(/\b(?:upi|vpa|paytm|bharatpe|razorpay|pinelabs|billdesk|ccavenue)\b/gi, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 3. Match against known merchants dictionary
    const lowerCleaned = cleaned.toLowerCase();
    for (const [key, canonical] of Object.entries(this.KNOWN_MERCHANTS)) {
      if (lowerCleaned.includes(key)) {
        return { normalized: canonical, isKnown: true };
      }
    }

    // 4. Format to Title Case if unknown
    if (cleaned.length < 2) {
      return { normalized: 'Local Merchant', isKnown: false };
    }

    const titleCased = cleaned
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    return { normalized: titleCased, isKnown: false };
  }
}
