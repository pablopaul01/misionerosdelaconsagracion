// Roles del sistema — nunca usar strings literales directamente
export const USER_ROLES = {
  ADMIN: 'admin',
  SECRETARIO_CONSAGRACION: 'secretario_consagracion',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
