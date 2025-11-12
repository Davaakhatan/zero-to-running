// Authentication-related type definitions

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastLoginAt?: Date;
  isOnline: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    showOnlineStatus: boolean;
    showLastSeen: boolean;
    allowDirectMessages: boolean;
  };
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  displayName?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface AuthService {
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (credentials: RegisterCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  resetPassword: (data: PasswordResetData) => Promise<void>;
  updatePassword: (data: PasswordUpdateData) => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<AuthUser>;
  sendEmailVerification: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}
