export enum CertificateStatus {
  NORMAL = 'normal',
  WARNING = 'warning', 
  CRITICAL = 'critical',
  EXPIRED = 'expired',
  ERROR = 'error'
}

export interface Certificate {
  id: string;
  domain: string;
  subdomain?: string;
  fullDomain: string; // e.g., "www.example.com" or "example.com"
  issuer: string;
  validFrom: Date;
  validTo: Date;
  daysRemaining: number;
  status: CertificateStatus;
  serialNumber?: string;
  fingerprint?: string;
  algorithm?: string;
  keySize?: number;
  region?: string;
  lastChecked: Date;
  error?: string;
}

export interface CertificateResponse {
  certificates: Certificate[];
  lastUpdated: Date;
  totalCount: number;
}

export interface Domain {
  id: string;
  name: string;
  isActive: boolean;
  checkInterval: number; // in minutes
  createdAt: Date;
  updatedAt: Date;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  subnet?: string; // Optional for backward compatibility
}

export interface CertificateListProps {
  certificates: Certificate[];
  loading?: boolean;
  onRefresh?: () => void;
}

export interface CertificateCardProps {
  certificate: Certificate;
  showDetails?: boolean;
}