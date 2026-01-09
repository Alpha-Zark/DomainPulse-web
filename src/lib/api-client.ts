// API client for backend communication
import { config } from './config';
import type {
  WhoisStatusResponse,
  DomainsCertResponse,
  WhoisStatusResponseNew,
  AdminDomain,
  AdminLocation,
  AdminWhoisDomain,
  AdminUser,
  AdminResponse,
  AdminListResponse,
  AdminDeleteResponse,
  LoginRequest,
  LoginResponse
} from '@/types/api';

// API response types based on backend documentation
export interface ApiDomain {
  id: number;
  domain: string;
  created_at: number;
  updated_at: number;
}

export interface DomainsResponse {
  domains: ApiDomain[];
}

export interface ApiLocation {
  id: number;
  name: string;
  subnet: string;
  created_at: number;
  updated_at: number;
}

export interface LocationsResponse {
  locations: ApiLocation[];
}

export interface SslStatusItem {
  domain: string;
  status: 'success' | 'no_data' | 'error' | 'checking';
  ssl_result?: string;
  error?: string;
}

export interface SslStatusResponse {
  ssl_status: SslStatusItem[];
}

export interface CacheStatusResponse {
  cache_enabled: boolean;
  cache_size: number;
  message: string;
}

// Generic API error
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Global 401 error handler
let onUnauthorizedCallback: (() => void) | null = null;

/**
 * Set global callback for 401 Unauthorized errors
 */
export function setUnauthorizedHandler(callback: () => void) {
  onUnauthorizedCallback = callback;
}

/**
 * Clear the unauthorized handler
 */
export function clearUnauthorizedHandler() {
  onUnauthorizedCallback = null;
}

/**
 * Generic API request function with error handling and retry logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${config.api.baseUrl}${endpoint}`;

  // 获取请求方法，默认为 GET
  const method = (options.method || 'GET').toUpperCase();

  // 只为 POST/PUT/PATCH 等需要发送 body 的请求添加 Content-Type
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // GET 和 DELETE 请求不需要 Content-Type
  if (method !== 'GET' && method !== 'DELETE' && method !== 'HEAD') {
    headers['Content-Type'] = 'application/json';
  }

  // 添加 Authorization header（如果有 token）
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(config.auth.sessionKey);
      if (stored) {
        const authData = JSON.parse(stored);
        if (authData.token) {
          headers['Authorization'] = `Bearer ${authData.token}`;
        }
      }
    } catch (error) {
      console.error('Failed to read auth token:', error);
    }
  }

  const requestOptions: RequestInit = {
    ...options,
    headers,
  };

  // Create AbortController for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  requestOptions.signal = controller.signal;

  let lastError: Error | null = null;
  
  // Retry logic
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          // Call the global unauthorized handler if set
          if (onUnauthorizedCallback) {
            // Use setTimeout to avoid blocking the current execution
            setTimeout(() => onUnauthorizedCallback?.(), 0);
          }
        }

        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }
      
      const data = await response.json();
      clearTimeout(timeoutId);
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.status && error.status < 500) {
        throw error;
      }
      
      // Wait before retry (except last attempt)
      if (attempt < 3) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  // All attempts failed
  throw lastError || new ApiError('Unknown API error');
}

/**
 * Domains API (Admin Management)
 */
export const domainsApi = {
  // Get SSL certificate status for all domains (Status API)
  async getCertStatus(refreshCache: boolean = false): Promise<DomainsCertResponse> {
    const endpoint = refreshCache ? '/status/cert?refresh_cache=true' : '/status/cert';
    return apiRequest<DomainsCertResponse>(endpoint);
  },

  // Get all domains (Admin API)
  async getAll(): Promise<AdminListResponse<AdminDomain>> {
    return apiRequest<AdminListResponse<AdminDomain>>('/admin/domain/list');
  },

  // Create domain (Admin API)
  async create(domain: string): Promise<AdminResponse<AdminDomain>> {
    return apiRequest<AdminResponse<AdminDomain>>('/admin/domain/add', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  // Update domain (Admin API)
  async update(id: number, domain: string, enabled: boolean): Promise<AdminResponse<AdminDomain>> {
    return apiRequest<AdminResponse<AdminDomain>>('/admin/domain/edit', {
      method: 'PUT',
      body: JSON.stringify({ id, domain, enabled }),
    });
  },

  // Delete domain (Admin API)
  async delete(id: number): Promise<AdminDeleteResponse> {
    return apiRequest<AdminDeleteResponse>(`/admin/domain/delete?id=${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Regions/Locations API (Admin Management)
 */
export const regionsApi = {
  // Get all locations (Admin API)
  async getAll(): Promise<AdminListResponse<AdminLocation>> {
    return apiRequest<AdminListResponse<AdminLocation>>('/admin/location/list');
  },

  // Create location (Admin API)
  async create(name: string, subnet: string): Promise<AdminResponse<AdminLocation>> {
    return apiRequest<AdminResponse<AdminLocation>>('/admin/location/add', {
      method: 'POST',
      body: JSON.stringify({ name, subnet }),
    });
  },

  // Update location (Admin API)
  async update(id: number, name: string, subnet: string, enabled: boolean): Promise<AdminResponse<AdminLocation>> {
    return apiRequest<AdminResponse<AdminLocation>>('/admin/location/edit', {
      method: 'PUT',
      body: JSON.stringify({ id, name, subnet, enabled }),
    });
  },

  // Delete location (Admin API)
  async delete(id: number): Promise<AdminDeleteResponse> {
    return apiRequest<AdminDeleteResponse>(`/admin/location/delete?id=${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Locations API (Alias for regionsApi - Admin Management)
 */
export const locationsApi = regionsApi;

/**
 * SSL API
 */
export const sslApi = {
  // Get SSL status for all domains
  async getStatus(): Promise<SslStatusResponse> {
    return apiRequest<SslStatusResponse>('/ssl/status');
  },

  // Check SSL for specific domain
  async checkDomain(domain: string): Promise<SslStatusItem> {
    return apiRequest<SslStatusItem>(`/ssl/check/${domain}`);
  },

  // Force recheck all SSL certificates
  async recheckAll(): Promise<SslStatusResponse & { message: string }> {
    return apiRequest<SslStatusResponse & { message: string }>('/ssl/recheck', {
      method: 'POST',
    });
  },
};

/**
 * Cache API
 */
export const cacheApi = {
  // Get cache status
  async getStatus(): Promise<CacheStatusResponse> {
    return apiRequest<CacheStatusResponse>('/cache/status');
  },

  // Clear cache
  async clear(): Promise<{ message: string; cache_size: number }> {
    return apiRequest<{ message: string; cache_size: number }>('/cache/clear', {
      method: 'POST',
    });
  },

  // Refresh cache
  async refresh(): Promise<{ message: string; cache_size: number }> {
    return apiRequest<{ message: string; cache_size: number }>('/cache/refresh', {
      method: 'POST',
    });
  },
};

/**
 * Whois Domains API (Admin Management)
 */
export const whoisDomainsApi = {
  // Get all whois domains (Admin API)
  async getAll(): Promise<AdminListResponse<AdminWhoisDomain>> {
    return apiRequest<AdminListResponse<AdminWhoisDomain>>('/admin/whois/list');
  },

  // Create whois domain (Admin API)
  async create(domain: string): Promise<AdminResponse<AdminWhoisDomain>> {
    return apiRequest<AdminResponse<AdminWhoisDomain>>('/admin/whois/add', {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  },

  // Update whois domain (Admin API)
  async update(id: number, domain: string, enabled: boolean): Promise<AdminResponse<AdminWhoisDomain>> {
    return apiRequest<AdminResponse<AdminWhoisDomain>>('/admin/whois/edit', {
      method: 'PUT',
      body: JSON.stringify({ id, domain, enabled }),
    });
  },

  // Delete whois domain (Admin API)
  async delete(id: number): Promise<AdminDeleteResponse> {
    return apiRequest<AdminDeleteResponse>(`/admin/whois/delete?id=${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Whois Query API
 */
export const whoisApi = {
  // Get whois status for all domains (legacy format)
  async getStatus(): Promise<WhoisStatusResponse> {
    return apiRequest<WhoisStatusResponse>('/whois');
  },

  // Get whois status for all domains (NEW API format)
  async getStatusNew(refreshCache: boolean = false): Promise<WhoisStatusResponseNew> {
    const endpoint = refreshCache ? '/status/whois?refresh_cache=true' : '/status/whois';
    return apiRequest<WhoisStatusResponseNew>(endpoint);
  },

  // Get whois information for specific domain
  async getDomainInfo(domain: string): Promise<WhoisStatusResponse> {
    return apiRequest<WhoisStatusResponse>(`/whois/${domain}`);
  },
};

/**
 * Auth API
 */
export const authApi = {
  // User login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

/**
 * Users API (Admin Management)
 */
export const usersApi = {
  // Get all users (Admin API)
  async getAll(): Promise<AdminListResponse<AdminUser>> {
    return apiRequest<AdminListResponse<AdminUser>>('/admin/user/list');
  },

  // Create user (Admin API)
  async create(name: string, email: string, password: string, enabled: boolean = true): Promise<AdminResponse<AdminUser>> {
    return apiRequest<AdminResponse<AdminUser>>('/admin/user/add', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, enabled }),
    });
  },

  // Update user (Admin API)
  async update(id: string, name: string, email: string, enabled: boolean, password?: string): Promise<AdminResponse<AdminUser>> {
    const body: { id: string; name: string; email: string; enabled: boolean; password?: string } = {
      id,
      name,
      email,
      enabled,
    };

    // Only include password if provided
    if (password) {
      body.password = password;
    }

    return apiRequest<AdminResponse<AdminUser>>('/admin/user/edit', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // Delete user (Admin API)
  async delete(id: string): Promise<AdminDeleteResponse> {
    return apiRequest<AdminDeleteResponse>(`/admin/user/delete?id=${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Settings API (System Configuration)
 */
export const settingsApi = {
  // Cron configuration
  cron: {
    async get(): Promise<{ cron_expr: string }> {
      return apiRequest<{ cron_expr: string }>('/admin/settings/cronjob/');
    },

    async update(cronExpr: string): Promise<{ message: string; cron_expr: string }> {
      return apiRequest<{ message: string; cron_expr: string }>('/admin/settings/cronjob/', {
        method: 'PUT',
        body: JSON.stringify({ cron_expr: cronExpr }),
      });
    },
  },

  // Alert configuration
  alert: {
    async get(): Promise<{
      alertmanager: {
        enabled: boolean;
        cert: { warning: number; critical: number };
        whois: { warning: number; critical: number };
        check_interval: number;
      };
    }> {
      return apiRequest('/admin/settings/alert/');
    },

    async update(config: {
      alertmanager: {
        enabled: boolean;
        cert: { warning: number; critical: number };
        whois: { warning: number; critical: number };
        check_interval: number;
      };
    }): Promise<{
      message: string;
      data: {
        alertmanager: {
          enabled: boolean;
          cert: { warning: number; critical: number };
          whois: { warning: number; critical: number };
          check_interval: number;
        };
      };
    }> {
      return apiRequest('/admin/settings/alert/', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },

    async test(): Promise<{ message: string }> {
      return apiRequest<{ message: string }>('/admin/settings/alert/test', {
        method: 'POST',
      });
    },
  },

  // SendGrid configuration
  sendgrid: {
    async get(): Promise<{
      sendgrid: {
        enabled: boolean;
        api_key: string;
        from_email: string;
        from_name: string;
        to_emails: string;
      };
    }> {
      return apiRequest('/admin/settings/sendgrid/');
    },

    async update(config: {
      sendgrid: {
        enabled: boolean;
        api_key: string;
        from_email: string;
        from_name: string;
        to_emails: string;
      };
    }): Promise<{
      message: string;
      data: {
        sendgrid: {
          enabled: boolean;
          api_key: string;
          from_email: string;
          from_name: string;
          to_emails: string;
        };
      };
    }> {
      return apiRequest('/admin/settings/sendgrid/', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    },
  },
};

/**
 * Utility function to check if backend API is available
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    // Try to get cache status as a health check
    await cacheApi.getStatus();
    return true;
  } catch (error) {
    console.warn('Backend API health check failed:', error);
    return false;
  }
}