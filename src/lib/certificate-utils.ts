import { Certificate, CertificateStatus, Region } from '@/types';
import { SslStatusItem, RegionCertificateData, DomainSslStatus, LocationItem, DomainCertStatus, CertStatus } from '@/types/api';
import { ApiDomain } from './api-client';
import { config } from './config';

export function calculateDaysRemaining(validTo: Date): number {
  const now = new Date();
  const diffTime = new Date(validTo).getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getCertificateStatus(daysRemaining: number): CertificateStatus {
  if (daysRemaining <= 0) {
    return CertificateStatus.EXPIRED;
  } else if (daysRemaining <= config.status.thresholds.criticalDays) {
    return CertificateStatus.CRITICAL;
  } else if (daysRemaining <= config.status.thresholds.warningDays) {
    return CertificateStatus.WARNING;
  } else {
    return CertificateStatus.NORMAL;
  }
}

export function getStatusColor(status: CertificateStatus): string {
  switch (status) {
    case CertificateStatus.NORMAL:
      return 'text-green-600 bg-green-50 border-green-200';
    case CertificateStatus.WARNING:
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case CertificateStatus.CRITICAL:
    case CertificateStatus.EXPIRED:
      return 'text-red-600 bg-red-50 border-red-200';
    case CertificateStatus.ERROR:
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getStatusText(status: CertificateStatus): string {
  switch (status) {
    case CertificateStatus.NORMAL:
      return '正常';
    case CertificateStatus.WARNING:
      return '即将过期';
    case CertificateStatus.CRITICAL:
      return '紧急';
    case CertificateStatus.EXPIRED:
      return '已过期';
    case CertificateStatus.ERROR:
      return '错误';
    default:
      return '未知';
  }
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

interface RawCertificateData {
  id?: string;
  domain: string;
  subdomain?: string;
  fullDomain?: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  serialNumber?: string;
  fingerprint?: string;
  algorithm?: string;
  keySize?: number;
  region?: string;
  lastChecked?: string;
  error?: string;
}

export function processCertificateData(rawCert: RawCertificateData): Certificate {
  const validTo = new Date(rawCert.validTo);
  const daysRemaining = calculateDaysRemaining(validTo);
  const status = getCertificateStatus(daysRemaining);

  return {
    id: rawCert.id || `${rawCert.domain}-${Date.now()}`,
    domain: rawCert.domain,
    subdomain: rawCert.subdomain,
    fullDomain: rawCert.fullDomain || rawCert.domain,
    issuer: rawCert.issuer,
    validFrom: new Date(rawCert.validFrom),
    validTo,
    daysRemaining,
    status,
    serialNumber: rawCert.serialNumber,
    fingerprint: rawCert.fingerprint,
    algorithm: rawCert.algorithm,
    keySize: rawCert.keySize,
    region: rawCert.region,
    lastChecked: new Date(rawCert.lastChecked || Date.now()),
    error: rawCert.error,
  };
}

// SSL Status API processing functions
export function parseSslResult(sslResult: string): RegionCertificateData {
  try {
    return JSON.parse(sslResult);
  } catch (error) {
    console.error('Failed to parse ssl_result:', error);
    return {};
  }
}

export function calculateMinDays(regions: RegionCertificateData): number {
  let minDays = Infinity;
  
  Object.values(regions).forEach(records => {
    records.forEach(record => {
      const days = parseInt(record.remaining_days, 10);
      if (!isNaN(days) && days < minDays) {
        minDays = days;
      }
    });
  });
  
  return minDays === Infinity ? 0 : minDays;
}

export function processSslStatusItem(item: SslStatusItem): DomainSslStatus {
  if (item.status === 'no_data') {
    return {
      domain: item.domain,
      status: 'no_data',
      minDays: 0,
      regions: {},
      error: item.error || 'No metrics data available'
    };
  }
  
  if (item.status === 'success' && item.ssl_result) {
    const regions = parseSslResult(item.ssl_result);
    const minDays = calculateMinDays(regions);
    
    return {
      domain: item.domain,
      status: 'success',
      minDays,
      regions
    };
  }
  
  return {
    domain: item.domain,
    status: 'error',
    minDays: 0,
    regions: {},
    error: 'Invalid data format'
  };
}

// Location/Region processing functions
export function processLocationItem(item: LocationItem | import('@/types/api').AdminLocation): Region {
  // Check if this is AdminLocation (has 'enabled' field and ISO date strings)
  const isAdminLocation = 'enabled' in item && typeof item.created_at === 'string';

  if (isAdminLocation) {
    // Handle AdminLocation format (new API)
    const adminItem = item as import('@/types/api').AdminLocation;
    return {
      id: adminItem.id.toString(),
      name: adminItem.name,
      code: adminItem.name.replace(/[^\u4e00-\u9fa5A-Za-z]/g, '').substring(0, 6).toUpperCase(),
      subnet: adminItem.subnet,
      isActive: adminItem.enabled,
      createdAt: new Date(adminItem.created_at), // Parse ISO 8601 date string
      updatedAt: new Date(adminItem.updated_at)
    };
  } else {
    // Handle LocationItem format (old API)
    const oldItem = item as LocationItem;
    return {
      id: oldItem.id.toString(),
      name: oldItem.name,
      code: oldItem.name.replace(/[^\u4e00-\u9fa5A-Za-z]/g, '').substring(0, 6).toUpperCase(),
      subnet: oldItem.subnet,
      isActive: true, // Old API doesn't provide this field, default to true
      createdAt: new Date(oldItem.created_at * 1000), // Convert Unix timestamp to Date
      updatedAt: new Date(oldItem.updated_at * 1000)
    };
  }
}

// Domain processing functions
export function processDomainItem(item: ApiDomain | import('@/types/api').AdminDomain): import('@/types').Domain {
  // Check if this is AdminDomain (has 'enabled' field and ISO date strings)
  const isAdminDomain = 'enabled' in item && typeof item.created_at === 'string';

  if (isAdminDomain) {
    // Handle AdminDomain format (new API)
    const adminItem = item as import('@/types/api').AdminDomain;
    return {
      id: adminItem.id.toString(),
      name: adminItem.domain,
      isActive: adminItem.enabled,
      checkInterval: 60, // API doesn't provide this field, default to 60 minutes
      createdAt: new Date(adminItem.created_at), // Parse ISO 8601 date string
      updatedAt: new Date(adminItem.updated_at)
    };
  } else {
    // Handle ApiDomain format (old API)
    const oldItem = item as ApiDomain;
    return {
      id: oldItem.id.toString(),
      name: oldItem.domain,
      isActive: true, // Old API doesn't provide this field, default to true
      checkInterval: 60, // API doesn't provide this field, default to 60 minutes
      createdAt: new Date(oldItem.created_at * 1000), // Convert Unix timestamp to Date
      updatedAt: new Date(oldItem.updated_at * 1000)
    };
  }
}

// NEW API Format processing functions
/**
 * Process new API format: DomainCertStatus -> DomainSslStatus
 * Converts from provider-based format to region-based format
 */
export function processDomainCertStatus(item: DomainCertStatus): DomainSslStatus {
  // Group certificate statuses by provider (treating provider as region)
  const regions: RegionCertificateData = {};

  item.cert_status.forEach((cert: CertStatus) => {
    const regionKey = cert.provider;

    if (!regions[regionKey]) {
      regions[regionKey] = [];
    }

    regions[regionKey].push({
      record: cert.record,
      remaining_days: cert.remaining_days.toString()
    });
  });

  // Calculate minimum remaining days
  const minDays = item.cert_status.length > 0
    ? Math.min(...item.cert_status.map(c => c.remaining_days))
    : 0;

  return {
    domain: item.domain,
    status: item.cert_status.length > 0 ? 'success' : 'no_data',
    minDays,
    regions
  };
}

/**
 * Calculate minimum days from CertStatus array
 */
export function calculateMinDaysFromCertStatus(certStatuses: CertStatus[]): number {
  if (certStatuses.length === 0) return 0;
  return Math.min(...certStatuses.map(cert => cert.remaining_days));
}

/**
 * Get certificate status from CertStatus based on minimum days
 */
export function getCertificateStatusFromCertStatus(certStatuses: CertStatus[]): CertificateStatus {
  const minDays = calculateMinDaysFromCertStatus(certStatuses);
  return getCertificateStatus(minDays);
}