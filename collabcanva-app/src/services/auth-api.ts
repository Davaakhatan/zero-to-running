/**
 * Auth API Client for CollabCanva - uses backend API instead of Firebase
 */

// API URL - supports multiple environments
const getApiBaseUrl = (): string => {
  // If running in browser (client-side)
  if (typeof window !== 'undefined') {
    // ALWAYS use localhost for port-forwarding (highest priority)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3003';
    }
    
    // Check if we have a configured API URL (from build-time env var) - only use if not localhost
    const envApiUrl = import.meta.env.VITE_API_URL;
    if (envApiUrl && !envApiUrl.includes('localhost') && !envApiUrl.includes('127.0.0.1') && !envApiUrl.includes('backend-service')) {
      return envApiUrl;
    }
    
    // If accessing via AWS LoadBalancer, use backend LoadBalancer URL
    const hostname = window.location.hostname;
    if (hostname.includes('.elb.amazonaws.com')) {
      // Backend LoadBalancer URL should be set via VITE_API_URL at build time
      // For now, we'll need to rebuild with the correct URL
      // Fallback: try to get from window (runtime injection)
      const runtimeBackendUrl = (window as any).__BACKEND_URL__;
      if (runtimeBackendUrl) {
        return runtimeBackendUrl;
      }
      
      // If VITE_API_URL is set and contains elb.amazonaws.com, use it
      if (envApiUrl && envApiUrl.includes('.elb.amazonaws.com')) {
        return envApiUrl;
      }
      
      // Last resort: construct from current hostname (won't work, but won't break)
      console.warn('Backend LoadBalancer URL not configured. API calls will fail.');
      return 'http://localhost:3003'; // Will fail, but won't break the build
    }
    
    // Running via custom domain/ingress - construct API URL from current hostname
    const protocol = window.location.protocol;
    
    if (hostname.includes('collabcanva')) {
      // Replace collabcanva with api subdomain
      const domainParts = hostname.split('.');
      if (domainParts.length > 1) {
        domainParts[0] = 'api';
        return `${protocol}//${domainParts.join('.')}`;
      }
    }
    
    // Fallback: try api subdomain on same domain
    const domainParts = hostname.split('.');
    if (domainParts.length > 1) {
      domainParts[0] = 'api';
      return `${protocol}//${domainParts.join('.')}`;
    }
    
    // Last resort: same origin (if API is proxied)
    return `${protocol}//${hostname}`;
  }
  
  // Server-side (shouldn't happen with Vite, but just in case)
  const envApiUrl = import.meta.env.VITE_API_URL;
  return envApiUrl || 'http://backend-service:3003';
};

const API_BASE_URL = getApiBaseUrl();

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLoginAt?: Date;
  isOnline: boolean;
}

interface SignupResponse {
  user: AuthUser;
  message: string;
}

interface LoginResponse {
  user: AuthUser;
  message: string;
}

interface UserResponse {
  user: AuthUser;
}

/**
 * Sign up a new user
 */
export async function signup(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, displayName }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sign up');
  }
  
  const data: SignupResponse = await response.json();
  return data.user;
}

/**
 * Log in a user
 */
export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to log in');
  }
  
  const data: LoginResponse = await response.json();
  return data.user;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<AuthUser | null> {
  const response = await fetch(`${API_BASE_URL}/api/auth/user/${userId}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to get user');
  }
  
  const data: UserResponse = await response.json();
  return data.user;
}

/**
 * Store user in localStorage
 */
export function storeUser(user: AuthUser): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

/**
 * Get user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  const stored = localStorage.getItem('auth_user');
  if (!stored) return null;
  
  try {
    const user = JSON.parse(stored);
    // Convert date strings back to Date objects
    user.createdAt = new Date(user.createdAt);
    if (user.lastLoginAt) {
      user.lastLoginAt = new Date(user.lastLoginAt);
    }
    return user;
  } catch {
    return null;
  }
}

/**
 * Remove user from localStorage
 */
export function clearStoredUser(): void {
  localStorage.removeItem('auth_user');
}

