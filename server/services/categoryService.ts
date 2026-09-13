import db from '../db/database.js';

export const DEFAULT_INDIAN_EXPENSE_CATEGORIES = [
  { slug: 'groceries', name: 'Groceries & Kirana', icon: 'ShoppingCart', color: '#10B981' },
  { slug: 'dining', name: 'Food & Dining / Swiggy', icon: 'Utensils', color: '#F59E0B' },
  { slug: 'utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#6366F1' },
  { slug: 'rent', name: 'Rent & Maintenance', icon: 'Home', color: '#8B5CF6' },
  { slug: 'education', name: 'Education & School', icon: 'GraduationCap', color: '#EC4899' },
  { slug: 'transport', name: 'Transport & Fuel', icon: 'Car', color: '#3B82F6' },
  { slug: 'healthcare', name: 'Healthcare & Pharmacy', icon: 'HeartPulse', color: '#EF4444' },
  { slug: 'shopping', name: 'Shopping & Apparel', icon: 'ShoppingBag', color: '#14B8A6' },
  { slug: 'entertainment', name: 'Entertainment & OTT', icon: 'Film', color: '#F97316' },
  { slug: 'travel', name: 'Travel & Trips', icon: 'Plane', color: '#06B6D4' },
  { slug: 'insurance', name: 'Insurance Premiums', icon: 'ShieldCheck', color: '#059669' },
  { slug: 'investments', name: 'Investments / SIP', icon: 'TrendingUp', color: '#4F46E5' },
  { slug: 'emi', name: 'Loan EMI & Debts', icon: 'CreditCard', color: '#7C3AED' },
  { slug: 'misc', name: 'Miscellaneous & Pooja', icon: 'MoreHorizontal', color: '#64748B' },
];

export function getOrCreateExpenseCategories(familyId: string) {
  if (!familyId) return [];

  let categories = db.find('expense_categories', (c: any) => c.family_id === familyId);
  if (!categories || categories.length === 0) {
    const newCategories = DEFAULT_INDIAN_EXPENSE_CATEGORIES.map((cat) => ({
      id: `cat_${cat.slug}_${familyId}`,
      family_id: familyId,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
    }));

    newCategories.forEach((c) => db.insert('expense_categories', c));
    categories = newCategories;
  }

  return categories;
}

export function addExpenseCategory(familyId: string, name: string, icon = 'Tag', color = '#6366F1') {
  const catId = `cat_custom_${Date.now()}`;
  const newCat = {
    id: catId,
    family_id: familyId,
    name: name.trim(),
    icon,
    color,
    created_at: new Date().toISOString(),
  };
  db.insert('expense_categories', newCat);
  return newCat;
}

export function deleteExpenseCategory(familyId: string, categoryId: string) {
  return db.delete('expense_categories', (c: any) => c.id === categoryId && c.family_id === familyId);
}

