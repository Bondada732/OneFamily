/**
 * Formats currency in Indian numbering system (Lakhs and Crores) or standard format
 */
export function formatCurrency(amount: number | null | undefined, short = false): string {
  if (amount === null || amount === undefined) return '—';

  if (short) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(0)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  return `₹${amount.toLocaleString('en-IN')}`;
}

/**
 * Returns YYYY-MM-DD in user's local timezone (avoiding UTC offset day shifts)
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

export function formatRelativeDays(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === -1) return 'Expired yesterday';
    if (diffDays < 0) return `Expired ${Math.abs(diffDays)} days ago`;
    return `in ${diffDays} days`;
  } catch {
    return dateStr;
  }
}

/**
 * Builds a clean WhatsApp-friendly message format with emojis
 */
export function buildWhatsAppMessage(type: 'REMINDER' | 'TASK' | 'CHECKLIST' | 'GOAL', title: string, details?: string): string {
  const header = `*ONE FAMILY* 🏡\n_${type}_: ${title}\n`;
  const body = details ? `\n${details}\n` : '';
  const footer = `\n_Shared from One Family App_`;
  return encodeURIComponent(`${header}${body}${footer}`);
}
