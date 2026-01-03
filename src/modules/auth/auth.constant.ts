import { Role } from '../../../prisma/generated/prisma/enums';

/**
 * User roles enum
 */
export const USER_ROLES = {
  CUSTOMER: Role.CUSTOMER,
  ADMIN: Role.ADMIN,
} as const;

/**
 * Type for user roles
 */
export type UserRole = Role;
