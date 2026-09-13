export type LanguageCode = 'en' | 'te' | 'hi';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  home: string;
  money: string;
  family: string;
  vault: string;
  ai: string;
  familySnapshot: string;
  members: string;
  netWorth: string;
  monthlySpending: string;
  savingsGoal: string;
  needsAttention: string;
  today: string;
  familyGoals: string;
  recentMemories: string;
  aiInsight: string;
  onTrack: string;
  complete: string;
  budgetUtilization: string;
  addExpense: string;
  addGoal: string;
  uploadDocument: string;
  addTask: string;
  logMemory: string;
  emergencyVault: string;
  emergencyMode: string;
  callDoctor: string;
  callAmbulance: string;
  voiceMemories: string;
  familyTree: string;
  yearbook: string;
  groceryList: string;
  householdMaintenance: string;
  switchRole: string;
  lockApp: string;
  unlockApp: string;
  shareViaWhatsApp: string;
  permissionDenied: string;
  askFamilyAI: string;
}

const rawTranslations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'ONE FAMILY',
    tagline: 'One Home. One Family. One Future.',
    home: 'Home',
    money: 'Money',
    family: 'Family',
    vault: 'Vault',
    ai: 'FamilyAI',
    familySnapshot: 'FAMILY SNAPSHOT',
    members: 'Members',
    netWorth: 'Net Worth',
    monthlySpending: 'Monthly Spending',
    savingsGoal: 'Savings Goal',
    needsAttention: 'NEEDS YOUR ATTENTION',
    today: 'TODAY',
    familyGoals: 'FAMILY GOALS',
    recentMemories: 'RECENT MEMORIES',
    aiInsight: 'AI FAMILY INSIGHT',
    onTrack: 'On Track',
    complete: 'Complete',
    budgetUtilization: 'Budget Utilization',
    addExpense: 'Add Expense',
    addGoal: 'Create Goal',
    uploadDocument: 'Upload Document',
    addTask: 'Add Task',
    logMemory: 'Add Memory',
    emergencyVault: 'Emergency Vault',
    emergencyMode: 'Emergency Mode 🚨',
    callDoctor: 'Call Doctor',
    callAmbulance: 'Call Ambulance',
    voiceMemories: 'Grandparent Voice Stories',
    familyTree: 'Family Tree',
    yearbook: 'Family Yearbook',
    groceryList: 'Wish List',
    householdMaintenance: 'Household Maintenance',
    switchRole: 'Switch Member Role',
    lockApp: 'Lock App',
    unlockApp: 'Unlock App',
    shareViaWhatsApp: 'Share to WhatsApp',
    permissionDenied: 'You do not have permission to view this section.',
    askFamilyAI: 'Ask FamilyAI anything...',
  },
  te: {
    appName: 'వన్ ఫ్యామిలీ',
    tagline: 'ఒక ఇల్లు. ఒక కుటుంబం. ఒక భవిష్యత్తు.',
    home: 'హోమ్',
    money: 'డబ్బు & బడ్జెట్',
    family: 'కుటుంబం',
    vault: 'డాక్యుమెంట్ వాల్ట్',
    ai: 'ఫ్యామిలీ AI',
    familySnapshot: 'కుటుంబ సారాంశం',
    members: 'సభ్యులు',
    netWorth: 'నికర ఆస్తి',
    monthlySpending: 'నెలవారీ ఖర్చు',
    savingsGoal: 'పొదుపు లక్ష్యం',
    needsAttention: 'శ్రద్ధ వహించాల్సినవి',
    today: 'ఈ రోజు',
    familyGoals: 'కుటుంబ లక్ష్యాలు',
    recentMemories: 'జ్ఞాపకాలు',
    aiInsight: 'AI కుటుంబ సలహా',
    onTrack: 'సరిగ్గా ఉంది',
    complete: 'పూర్తయింది',
    budgetUtilization: 'బడ్జెట్ వినియోగం',
    addExpense: 'ఖర్చు నమోదు చేయండి',
    addGoal: 'లక్ష్యాన్ని సృష్టించండి',
    uploadDocument: 'పత్రం అప్‌లోడ్ చేయండి',
    addTask: 'పనిని జోడించండి',
    logMemory: 'జ్ఞాపకాన్ని జోడించండి',
    emergencyVault: 'అత్యవసర వాల్ట్',
    emergencyMode: 'ఎమర్జెన్సీ మోడ్ 🚨',
    callDoctor: 'డాక్టర్‌కి కాల్ చేయండి',
    callAmbulance: 'అంబులెన్స్‌కు కాల్ చేయండి',
    voiceMemories: 'నాయనమ్మ / తాతయ్య మాటలు',
    familyTree: 'వంశ వృక్షం (Family Tree)',
    yearbook: 'వార్షిక జ్ఞాపకాల పుస్తకం',
    groceryList: 'కోరికల జాబితా (Wish List)',
    householdMaintenance: 'ఇంటి నిర్వహణ',
    switchRole: 'సభ్యుడిని మార్చండి',
    lockApp: 'యాప్ లాక్ చేయండి',
    unlockApp: 'అన్‌లాక్ చేయండి',
    shareViaWhatsApp: 'వాట్సాప్‌లో పంపండి',
    permissionDenied: 'ఈ విభాగాన్ని చూసే అనుమతి మీకు లేదు.',
    askFamilyAI: 'ఫ్యామిలీ AI ని అడగండి...',
  },
  hi: {
    appName: 'वन फैमिली',
    tagline: 'एक घर। एक परिवार। एक भविष्य।',
    home: 'होम',
    money: 'पैसे व बजट',
    family: 'परिवार',
    vault: 'दस्तावेज़ वॉल्ट',
    ai: 'फैमिली AI',
    familySnapshot: 'पारिवारिक स्नैपशॉट',
    members: 'सदस्य',
    netWorth: 'कुल संपत्ति',
    monthlySpending: 'मासिक खर्च',
    savingsGoal: 'बचत लक्ष्य',
    needsAttention: 'जरूरी सूचनाएं',
    today: 'आज का दिन',
    familyGoals: 'पारिवारिक लक्ष्य',
    recentMemories: 'ताज़ा यादें',
    aiInsight: 'AI परिवार अंतर्दृष्टि',
    onTrack: 'सही दिशा में',
    complete: 'पूर्ण',
    budgetUtilization: 'बजट उपयोग',
    addExpense: 'खर्च जोड़ें',
    addGoal: 'लक्ष्य बनाएं',
    uploadDocument: 'दस्तावेज़ अपलोड करें',
    addTask: 'कार्य जोड़ें',
    logMemory: 'यादें जोड़ें',
    emergencyVault: 'आपातकालीन वॉल्ट',
    emergencyMode: 'इमरजेंसी मोड 🚨',
    callDoctor: 'डॉक्टर को कॉल करें',
    callAmbulance: 'एम्बुलेंस को कॉल करें',
    voiceMemories: 'दादी-नानी की कहानियां',
    familyTree: 'पारिवारिक वृक्ष (Family Tree)',
    yearbook: 'वार्षिक पारिवारिक किताब',
    groceryList: 'इच्छा सूची (Wish List)',
    householdMaintenance: 'घरेलू रखरखाव',
    switchRole: 'सदस्य बदलें',
    lockApp: 'ऐप लॉक करें',
    unlockApp: 'अनलॉक करें',
    shareViaWhatsApp: 'व्हाट्सएप पर शेयर करें',
    permissionDenied: 'आपके पास इस अनुभाग को देखने की अनुमति नहीं है।',
    askFamilyAI: 'फैमिली AI से कुछ भी पूछें...',
  },
};

const defaultDict = rawTranslations.en;
export const translations: Record<string, TranslationDictionary> = new Proxy(rawTranslations, {
  get(target, prop: string) {
    return target[prop as LanguageCode] || defaultDict;
  },
});
