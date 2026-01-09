export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  VIEWER = 'viewer'
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}