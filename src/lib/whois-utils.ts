import type { WhoisStatusItem, DomainWhoisStatus, WhoisDomainStatusNew } from '@/types/api';

/**
 * Calculate days until domain expiry
 */
export function calculateDaysUntilExpiry(expiryDate: string): number {
  try {
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    console.warn('Failed to calculate days until expiry:', error);
    return -1;
  }
}

/**
 * Process whois status item from API response
 */
export function processWhoisStatusItem(item: WhoisStatusItem): DomainWhoisStatus {
  if (item.status === 'error' || !item.whois_result) {
    return {
      domain: item.domain,
      status: item.status,
      error: item.error,
    };
  }

  // Use remaining_days from backend if available, otherwise calculate
  const daysUntilExpiry = item.whois_result.remaining_days ?? 
    calculateDaysUntilExpiry(item.whois_result.expiration_date);

  return {
    domain: item.domain,
    status: item.status,
    expiryDate: item.whois_result.expiration_date,
    daysUntilExpiry,
  };
}

/**
 * Get status color class based on days until expiry
 */
export function getWhoisStatusColor(status: string, daysUntilExpiry?: number): string {
  if (status === 'error') {
    return 'text-red-600';
  }
  
  if (status === 'checking') {
    return 'text-yellow-600';
  }
  
  if (daysUntilExpiry === undefined || daysUntilExpiry < 0) {
    return 'text-gray-600';
  }
  
  if (daysUntilExpiry <= 7) {
    return 'text-red-600'; // Critical - expires within a week
  }
  
  if (daysUntilExpiry <= 30) {
    return 'text-orange-600'; // Warning - expires within a month
  }
  
  if (daysUntilExpiry <= 90) {
    return 'text-yellow-600'; // Attention - expires within 3 months
  }
  
  return 'text-green-600'; // Good - more than 3 months
}

/**
 * Get status badge variant based on days until expiry
 */
export function getWhoisStatusBadge(status: string, daysUntilExpiry?: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'error') {
    return 'destructive';
  }
  
  if (status === 'checking') {
    return 'secondary';
  }
  
  if (daysUntilExpiry === undefined || daysUntilExpiry < 0) {
    return 'outline';
  }
  
  if (daysUntilExpiry <= 30) {
    return 'destructive';
  }
  
  if (daysUntilExpiry <= 90) {
    return 'secondary';
  }
  
  return 'default';
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

// NEW API Format processing functions
/**
 * Process new API format: WhoisDomainStatusNew -> DomainWhoisStatus
 * Handles the new format from /whois endpoint
 */
export function processWhoisDomainStatusNew(item: WhoisDomainStatusNew): DomainWhoisStatus {
  if (item.status === 'error' || !item.expiration_date || item.remaining_days === null) {
    return {
      domain: item.domain,
      status: 'error',
      // error: 'Failed to fetch WHOIS data or domain not found',
    };
  }

  return {
    domain: item.domain,
    status: 'success',
    expiryDate: item.expiration_date,
    daysUntilExpiry: item.remaining_days,
    // registrationDate is not provided in new format
  };
}

/**
 * Format ISO 8601 date string to readable format
 */
export function formatISODate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDateString;
  }
}

/**
 * Get status text for WHOIS status
 */
export function getWhoisStatusText(status: string): string {
  switch (status) {
    case 'success':
      return '正常';
    case 'error':
      return '错误';
    case 'checking':
      return '检查中';
    default:
      return '未知';
  }
}