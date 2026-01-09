export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

// SSL Status API Types
export interface SslCertificateRecord {
  record: string;
  remaining_days: string;
}

export interface SslStatusItem {
  domain: string;
  status: 'success' | 'no_data' | 'error' | 'checking';
  ssl_result?: string; // JSON string containing region data
  error?: string;
}

export interface SslStatusResponse {
  ssl_status: SslStatusItem[];
}

// Parsed SSL Result (from ssl_result JSON string)
export interface RegionCertificateData {
  [region: string]: SslCertificateRecord[];
}

// Domain-level data for table display
export interface DomainSslStatus {
  domain: string;
  status: 'success' | 'no_data' | 'error';
  minDays: number;
  regions: RegionCertificateData;
  error?: string;
}

// Locations API Types
export interface LocationItem {
  id: number;
  name: string;
  subnet: string;
  created_at: number;
  updated_at: number;
}

export interface LocationsResponse {
  locations: LocationItem[];
}

// Whois Domain Types
export interface WhoisDomainItem {
  id: number;
  domain: string;
  expiry_date?: number; // Unix timestamp for domain expiration date
  created_at: number;
  updated_at: number;
}

export interface WhoisDomainsResponse {
  whois_domains: WhoisDomainItem[];
}

// Whois Query Result Types
export interface WhoisResult {
  domain: string;
  expiration_date: string;
  remaining_days: number;
  status: string;
}

export interface WhoisStatusItem {
  domain: string;
  status: 'success' | 'error' | 'checking';
  whois_result?: WhoisResult;
  error?: string;
}

export interface WhoisStatusResponse {
  whois_status: WhoisStatusItem[];
}

// Domain Whois Status for display
export interface DomainWhoisStatus {
  domain: string;
  status: 'success' | 'error' | 'checking';
  expiryDate?: string;
  daysUntilExpiry?: number;
  error?: string;
}

// New API Format Types - /status/cert endpoint
export interface CertStatus {
  provider: string;
  record: string;
  remaining_days: number;
}

export interface DomainCertStatus {
  domain: string;
  cert_status: CertStatus[];
}

export interface DomainsCertResponse {
  data: DomainCertStatus[];
}

// New API Format Types - WHOIS endpoint
export interface WhoisDomainStatusNew {
  domain: string;
  expiration_date: string | null;
  remaining_days: number | null;
  status: 'success' | 'error';
}

export interface WhoisStatusResponseNew {
  data: WhoisDomainStatusNew[];
}

// Admin API Types - New Management Endpoints
export interface AdminDomain {
  id: number;
  domain: string;
  enabled: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface AdminLocation {
  id: number;
  name: string;
  subnet: string;
  enabled: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface AdminWhoisDomain {
  id: number;
  domain: string;
  enabled: boolean;
  created_at: string; // ISO 8601 format
  updated_at: string; // ISO 8601 format
}

export interface AdminUser {
  id: string; // 9-digit string ID
  name: string;
  email: string;
  enabled: boolean;
}

// Admin API Response Types
export interface AdminResponse<T> {
  message: string;
  data: T;
}

export interface AdminListResponse<T> {
  data: T[];
}

export interface AdminDeleteResponse {
  message: string;
}

// Login API Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    enabled: boolean;
  };
}