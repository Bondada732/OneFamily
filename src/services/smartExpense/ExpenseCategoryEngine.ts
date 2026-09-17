/**
 * ExpenseCategoryEngine
 * 5-Level Categorization Hierarchy:
 * Level 1: User Merchant Preferences
 * Level 2: Known Merchant Direct Mapping
 * Level 3: Keyword Rule-Based Engine
 * Level 4: Contextual Heuristics
 * Level 5: Other / Ask User (Confidence < 0.60)
 */

export class ExpenseCategoryEngine {
  private static KNOWN_CATEGORY_MAPPINGS: { [merchantLower: string]: string } = {
    // Food & Dining
    swiggy: 'Food & Dining',
    zomato: 'Food & Dining',
    starbucks: 'Food & Dining',
    "mcdonald's": 'Food & Dining',
    kfc: 'Food & Dining',
    "domino's pizza": 'Food & Dining',
    'pizza hut': 'Food & Dining',

    // Groceries
    blinkit: 'Groceries',
    zepto: 'Groceries',
    instamart: 'Groceries',
    bigbasket: 'Groceries',
    dmart: 'Groceries',
    jiomart: 'Groceries',

    // Transport & Travel
    uber: 'Transport',
    'ola cabs': 'Transport',
    rapido: 'Transport',
    irctc: 'Travel',
    makemytrip: 'Travel',
    goibibo: 'Travel',
    cleartrip: 'Travel',

    // Shopping
    amazon: 'Shopping',
    flipkart: 'Shopping',
    myntra: 'Shopping',
    ajio: 'Shopping',
    'tata cliq': 'Shopping',

    // Healthcare
    'apollo pharmacy': 'Healthcare',
    pharmeasy: 'Healthcare',
    medplus: 'Healthcare',

    // Entertainment / Subscriptions
    netflix: 'Entertainment',
    spotify: 'Entertainment',
    'disney+ hotstar': 'Entertainment',
    'amazon prime': 'Entertainment',

    // Utilities & Bills
    airtel: 'Utilities',
    jio: 'Utilities',
    'vodafone idea': 'Utilities',
    'tata power': 'Utilities',
    bescom: 'Utilities',
    cred: 'Utilities',
  };

  private static KEYWORD_RULES: Array<{ pattern: RegExp; category: string; confidence: number }> = [
    { pattern: /(?:restaurant|cafe|bakery|dhaba|bites|kitchen|biryani|sweets|hotel)/i, category: 'Food & Dining', confidence: 0.88 },
    { pattern: /(?:supermarket|mart|grocery|kirana|provisions|veggies|fruits|milk|dairy)/i, category: 'Groceries', confidence: 0.90 },
    { pattern: /(?:fuel|petrol|diesel|cng|hpcl|bpcl|iocl|shell|parking|toll|fastag|metro)/i, category: 'Transport', confidence: 0.92 },
    { pattern: /(?:pharma|medical|clinic|hospital|doctor|pathology|diagnostic|dentist)/i, category: 'Healthcare', confidence: 0.90 },
    { pattern: /(?:electric|power|bescom|tneb|water|gas|indane|bharatgas|broadband|wifi|recharge|dth)/i, category: 'Utilities', confidence: 0.90 },
    { pattern: /(?:school|college|tuition|academy|course|books|stationery|fees|exam)/i, category: 'Education', confidence: 0.85 },
    { pattern: /(?:cinema|theatre|movie|pvr|inox|cinepolis|gaming|playstation)/i, category: 'Entertainment', confidence: 0.88 },
    { pattern: /(?:salon|spa|beauty|parlour|hair|cosmetics)/i, category: 'Personal Care', confidence: 0.85 },
    { pattern: /(?:lic|policy|insurance|hdfclife|icicipru|starhealth)/i, category: 'Insurance', confidence: 0.92 },
  ];

  public static suggestCategory(
    merchantNormalized: string,
    rawText: string = '',
    userPreferences: { [merchantLower: string]: string } = {}
  ): { category: string; confidence: number; source: 'USER_PREFERENCE' | 'KNOWN_MERCHANT' | 'RULE' | 'FALLBACK' } {
    const normLower = (merchantNormalized || '').toLowerCase().trim();

    // LEVEL 1: User's saved merchant preference
    if (userPreferences[normLower]) {
      return {
        category: userPreferences[normLower],
        confidence: 0.98,
        source: 'USER_PREFERENCE',
      };
    }

    // LEVEL 2: Known merchant direct dictionary
    if (this.KNOWN_CATEGORY_MAPPINGS[normLower]) {
      return {
        category: this.KNOWN_CATEGORY_MAPPINGS[normLower],
        confidence: 0.95,
        source: 'KNOWN_MERCHANT',
      };
    }

    // LEVEL 3: Rule-based keyword matching across merchant & message body
    const combinedText = `${merchantNormalized} ${rawText}`;
    for (const rule of this.KEYWORD_RULES) {
      if (rule.pattern.test(combinedText)) {
        return {
          category: rule.category,
          confidence: rule.confidence,
          source: 'RULE',
        };
      }
    }

    // LEVEL 4 & 5: Generic Fallback (Confidence < 0.60 triggers "Choose category" UI)
    return {
      category: 'Miscellaneous',
      confidence: 0.50,
      source: 'FALLBACK',
    };
  }
}
