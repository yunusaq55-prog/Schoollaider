import { Role } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  naam: string;
  role: Role;
  tenantId: string;
  schoolId: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  userId: string;
  tenantId: string;
  role: Role;
  schoolId: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: Omit<User, 'createdAt' | 'updatedAt'>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  naam: string;
  role: Role;
  schoolId?: string;
}

export interface RefreshResponse {
  accessToken: string;
}
