export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdOn: string;
  roles: string[];
}

export interface LoginResponse {
  accessToken: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
