export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BESTUUR_ADMIN = 'BESTUUR_ADMIN',
  BESTUUR_GEBRUIKER = 'BESTUUR_GEBRUIKER',
  SCHOOL_DIRECTEUR = 'SCHOOL_DIRECTEUR',
  SCHOOL_GEBRUIKER = 'SCHOOL_GEBRUIKER',
}

export type Permission =
  | 'tenants:manage'
  | 'schools:manage'
  | 'users:manage'
  | 'users:manage_own_school'
  | 'documents:upload'
  | 'schools:view_all'
  | 'school:view_own'
  | 'kwaliteit:manage'
  | 'kwaliteit:view'
  | 'hr:manage'
  | 'hr:view';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    'tenants:manage',
    'schools:manage',
    'users:manage',
    'documents:upload',
    'schools:view_all',
    'school:view_own',
    'kwaliteit:manage',
    'kwaliteit:view',
    'hr:manage',
    'hr:view',
  ],
  [Role.BESTUUR_ADMIN]: [
    'schools:manage',
    'users:manage',
    'documents:upload',
    'schools:view_all',
    'school:view_own',
    'kwaliteit:manage',
    'kwaliteit:view',
    'hr:manage',
    'hr:view',
  ],
  [Role.BESTUUR_GEBRUIKER]: [
    'documents:upload',
    'schools:view_all',
    'school:view_own',
    'kwaliteit:view',
    'hr:view',
  ],
  [Role.SCHOOL_DIRECTEUR]: [
    'users:manage_own_school',
    'documents:upload',
    'school:view_own',
    'kwaliteit:manage',
    'kwaliteit:view',
    'hr:manage',
    'hr:view',
  ],
  [Role.SCHOOL_GEBRUIKER]: [
    'documents:upload',
    'school:view_own',
    'kwaliteit:view',
    'hr:view',
  ],
};
