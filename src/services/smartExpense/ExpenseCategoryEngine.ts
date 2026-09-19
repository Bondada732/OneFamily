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
    mcdonalds: 'Food & Dining',
    kfc: 'Food & Dining',
    "domino's pizza": 'Food & Dining',
    dominos: 'Food & Dining',
    'pizza hut': 'Food & Dining',
    pizzahut: 'Food & Dining',
    'burger king': 'Food & Dining',
    burgerking: 'Food & Dining',
    subway: 'Food & Dining',
    haldiram: 'Food & Dining',
    haldirams: 'Food & Dining',
    chaayos: 'Food & Dining',
    'chai point': 'Food & Dining',
    chaipoint: 'Food & Dining',
    barbeque: 'Food & Dining',
    'barbeque nation': 'Food & Dining',
    behrouz: 'Food & Dining',
    faasos: 'Food & Dining',
    ovenstory: 'Food & Dining',
    eatfit: 'Food & Dining',
    freshmenu: 'Food & Dining',

    // Groceries
    blinkit: 'Groceries',
    zepto: 'Groceries',
    instamart: 'Groceries',
    bigbasket: 'Groceries',
    bbdaily: 'Groceries',
    bbinstant: 'Groceries',
    dmart: 'Groceries',
    jiomart: 'Groceries',
    'reliance fresh': 'Groceries',
    'reliance smart': 'Groceries',
    'reliance retail': 'Groceries',
    ratnadeep: 'Groceries',
    'more retail': 'Groceries',
    'more supermarket': 'Groceries',
    'nature basket': 'Groceries',
    "nature's basket": 'Groceries',
    spencers: 'Groceries',
    'star bazaar': 'Groceries',
    milkbasket: 'Groceries',
    'country delight': 'Groceries',
    suprdaily: 'Groceries',
    dunzo: 'Groceries',

    // Transport & Fuel
    uber: 'Transport',
    'ola cabs': 'Transport',
    ola: 'Transport',
    rapido: 'Transport',
    'namma yatri': 'Transport',
    hpcl: 'Transport',
    bpcl: 'Transport',
    iocl: 'Transport',
    'indian oil': 'Transport',
    'bharat petroleum': 'Transport',
    'hindustan petroleum': 'Transport',
    shell: 'Transport',
    nayara: 'Transport',
    fastag: 'Transport',
    'nhai toll': 'Transport',
    'metro rail': 'Transport',
    dmrc: 'Transport',

    // Travel
    irctc: 'Travel',
    makemytrip: 'Travel',
    goibibo: 'Travel',
    cleartrip: 'Travel',
    easemytrip: 'Travel',
    yatra: 'Travel',
    redbus: 'Travel',
    abhibus: 'Travel',
    indigo: 'Travel',
    airindia: 'Travel',
    spicejet: 'Travel',
    akasa: 'Travel',
    booking: 'Travel',
    agoda: 'Travel',

    // Shopping
    amazon: 'Shopping',
    amazonpay: 'Shopping',
    flipkart: 'Shopping',
    myntra: 'Shopping',
    ajio: 'Shopping',
    meesho: 'Shopping',
    nykaa: 'Shopping',
    'tata cliq': 'Shopping',
    tatacliq: 'Shopping',
    zudio: 'Shopping',
    max: 'Shopping',
    pantaloons: 'Shopping',
    westside: 'Shopping',
    decathlon: 'Shopping',
    lenskart: 'Shopping',
    croma: 'Shopping',
    'reliance digital': 'Shopping',
    vijaysales: 'Shopping',
    ikea: 'Shopping',
    urbanladder: 'Shopping',

    // Healthcare & Pharmacy
    'apollo pharmacy': 'Healthcare',
    apollo: 'Healthcare',
    pharmeasy: 'Healthcare',
    medplus: 'Healthcare',
    '1mg': 'Healthcare',
    'tata 1mg': 'Healthcare',
    netmeds: 'Healthcare',
    practo: 'Healthcare',
    lalpathlabs: 'Healthcare',
    drpathlabs: 'Healthcare',
    metropolis: 'Healthcare',
    thyrocare: 'Healthcare',

    // Entertainment / Subscriptions
    netflix: 'Entertainment',
    spotify: 'Entertainment',
    'disney+ hotstar': 'Entertainment',
    hotstar: 'Entertainment',
    'amazon prime': 'Entertainment',
    prime: 'Entertainment',
    youtube: 'Entertainment',
    applemusic: 'Entertainment',
    gaana: 'Entertainment',
    wynk: 'Entertainment',
    pvr: 'Entertainment',
    inox: 'Entertainment',
    cinepolis: 'Entertainment',
    bookmyshow: 'Entertainment',

    // Utilities & Bills
    airtel: 'Utilities',
    jio: 'Utilities',
    'vodafone idea': 'Utilities',
    vi: 'Utilities',
    bsnl: 'Utilities',
    'tata power': 'Utilities',
    bescom: 'Utilities',
    tneb: 'Utilities',
    tsspdcl: 'Utilities',
    mahadiscom: 'Utilities',
    uppcl: 'Utilities',
    adani: 'Utilities',
    igl: 'Utilities',
    mgl: 'Utilities',
    indane: 'Utilities',
    bharatgas: 'Utilities',
    hpgas: 'Utilities',
    'act fibernet': 'Utilities',
    actcorp: 'Utilities',
    hathway: 'Utilities',
    tatasky: 'Utilities',
    tataplay: 'Utilities',
    dishtv: 'Utilities',
    cred: 'Utilities',

    // Personal Care & Fitness
    cult: 'Personal Care',
    'cult.fit': 'Personal Care',
    gym: 'Personal Care',
    enrich: 'Personal Care',
    jawedhabib: 'Personal Care',
    naturals: 'Personal Care',
    urbancompany: 'Personal Care',

    // Insurance
    lic: 'Insurance',
    starhealth: 'Insurance',
    'hdfc ergo': 'Insurance',
    'icici lombard': 'Insurance',
    'hdfc life': 'Insurance',
    'icici pru': 'Insurance',
    'sbi life': 'Insurance',
    'max life': 'Insurance',
    'bajaj allianz': 'Insurance',
    policybazaar: 'Insurance',

    // Investments
    zerodha: 'Investments',
    groww: 'Investments',
    upstox: 'Investments',
    'angel one': 'Investments',
    angelone: 'Investments',
    kuvera: 'Investments',
    indmoney: 'Investments',
    etmoney: 'Investments',
    smallcase: 'Investments',
  };

  private static KEYWORD_RULES: Array<{ pattern: RegExp; category: string; confidence: number }> = [
    { pattern: /(?:restaurant|cafe|bakery|dhaba|bites|kitchen|biryani|sweets|hotel|grill|roll|shawarma|tiffin|mess|canteen|food|pizza|burger|chai|tea|coffee|dine|dinning|curry|rasoi|eatery)/i, category: 'Food & Dining', confidence: 0.88 },
    { pattern: /(?:supermarket|mart|grocery|kirana|provisions|veggies|vegetable|fruits|milk|dairy|fresh|bazaar|hypermarket|organic|store|daily|provisions|ration)/i, category: 'Groceries', confidence: 0.90 },
    { pattern: /(?:fuel|petrol|diesel|cng|hpcl|bpcl|iocl|shell|parking|toll|fastag|metro|auto|cab|taxi|ride|challan|rapido|uber|ola|gas station)/i, category: 'Transport', confidence: 0.92 },
    { pattern: /(?:pharma|medical|clinic|hospital|doctor|pathology|diagnostic|dentist|dental|opticals|eyecare|meds|medicine|pharmacy|chemist|lab|scan)/i, category: 'Healthcare', confidence: 0.90 },
    { pattern: /(?:electric|power|bescom|tneb|tsspdcl|water|gas|indane|bharatgas|hpgas|broadband|wifi|recharge|dth|postpaid|prepaid|bill|utility|cylinder)/i, category: 'Utilities', confidence: 0.90 },
    { pattern: /(?:school|college|tuition|academy|course|books|stationery|fees|exam|coaching|class|university|udemy|coursera)/i, category: 'Education', confidence: 0.85 },
    { pattern: /(?:cinema|theatre|movie|pvr|inox|cinepolis|gaming|playstation|game|tickets|concert|show|ott|stream)/i, category: 'Entertainment', confidence: 0.88 },
    { pattern: /(?:salon|spa|beauty|parlour|hair|cosmetics|barber|makeup|nail|skincare|fitness|gym|workout|cult)/i, category: 'Personal Care', confidence: 0.85 },
    { pattern: /(?:lic|policy|insurance|hdfclife|icicipru|starhealth|premium|mediclaim)/i, category: 'Insurance', confidence: 0.92 },
    { pattern: /(?:flight|train|irctc|bus|hotel stay|resort|vacation|tour|travel|makemytrip|goibibo|cleartrip|yatra)/i, category: 'Travel', confidence: 0.90 },
    { pattern: /(?:cloth|fashion|apparel|shopping|retail|footwear|shoes|electronics|mall|garments|wear|trends|zudio)/i, category: 'Shopping', confidence: 0.85 },
    { pattern: /(?:sip|mutual fund|zerodha|groww|stocks|demat|invest|shares|upstox|coin)/i, category: 'Investments', confidence: 0.90 },
    { pattern: /(?:rent|maintenance|society|flat maintenance|landlord|hostel)/i, category: 'Housing', confidence: 0.88 },
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

    // Also check if any known merchant key is a substring in normLower
    for (const [k, cat] of Object.entries(this.KNOWN_CATEGORY_MAPPINGS)) {
      if (k.length >= 3 && normLower.includes(k)) {
        return {
          category: cat,
          confidence: 0.92,
          source: 'KNOWN_MERCHANT',
        };
      }
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

