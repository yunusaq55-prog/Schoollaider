export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BESTUUR_ADMIN = 'BESTUUR_ADMIN',
  BESTUUR_GEBRUIKER = 'BESTUUR_GEBRUIKER',
  OPERATIONEEL_MANAGER = 'OPERATIONEEL_MANAGER',
  SCHOOL_DIRECTEUR = 'SCHOOL_DIRECTEUR',
  SCHOOL_GEBRUIKER = 'SCHOOL_GEBRUIKER',
}

export type Permission =
  | 'tenants:manage'
  | 'schools:manage'
  | 'users:manage'
  | 'users:manage_own_school'
  | 'documents:upload'
  | 'documents:manage'
  | 'schools:view_all'
  | 'school:view_own'
  | 'inspectie:manage'
  | 'inspectie:view'
  | 'pdca:manage'
  | 'pdca:view'
  | 'dashboard:view_all'
  | 'dashboard:view_own'
  | 'export:inspectiedossier'
  | 'analysis:trigger'
  | 'analysis:view'
  | 'hr:manage'
  | 'hr:view'
  | 'subsidies:view'
  | 'operations:view'
  | 'operations:manage'
  | 'operations:ai_draft';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    'tenants:manage',
    'schools:manage',
    'users:manage',
    'documents:upload',
    'documents:manage',
    'schools:view_all',
    'school:view_own',
    'inspectie:manage',
    'inspectie:view',
    'pdca:manage',
    'pdca:view',
    'dashboard:view_all',
    'dashboard:view_own',
    'export:inspectiedossier',
    'analysis:trigger',
    'analysis:view',
    'hr:manage',
    'hr:view',
    'subsidies:view',
    'operations:view',
    'operations:manage',
    'operations:ai_draft',
  ],
  [Role.BESTUUR_ADMIN]: [
    'schools:manage',
    'users:manage',
    'documents:upload',
    'documents:manage',
    'schools:view_all',
    'school:view_own',
    'inspectie:manage',
    'inspectie:view',
    'pdca:manage',
    'pdca:view',
    'dashboard:view_all',
    'dashboard:view_own',
    'export:inspectiedossier',
    'analysis:trigger',
    'analysis:view',
    'hr:manage',
    'hr:view',
    'subsidies:view',
    'operations:view',
    'operations:manage',
    'operations:ai_draft',
  ],
  [Role.OPERATIONEEL_MANAGER]: [
    'schools:view_all',
    'school:view_own',
    'dashboard:view_all',
    'dashboard:view_own',
    'documents:upload',
    'documents:manage',
    'inspectie:view',
    'pdca:view',
    'analysis:view',
    'analysis:trigger',
    'hr:view',
    'export:inspectiedossier',
    'subsidies:view',
    'operations:view',
    'operations:manage',
    'operations:ai_draft',
  ],
  [Role.BESTUUR_GEBRUIKER]: [
    'documents:upload',
    'schools:view_all',
    'school:view_own',
    'inspectie:view',
    'pdca:view',
    'dashboard:view_all',
    'analysis:view',
    'hr:view',
  ],
  [Role.SCHOOL_DIRECTEUR]: [
    'users:manage_own_school',
    'documents:upload',
    'documents:manage',
    'school:view_own',
    'inspectie:manage',
    'inspectie:view',
    'pdca:manage',
    'pdca:view',
    'dashboard:view_own',
    'export:inspectiedossier',
    'analysis:trigger',
    'analysis:view',
    'hr:manage',
    'hr:view',
  ],
  [Role.SCHOOL_GEBRUIKER]: [
    'documents:upload',
    'school:view_own',
    'inspectie:view',
    'pdca:view',
    'dashboard:view_own',
    'analysis:view',
  ],
};
