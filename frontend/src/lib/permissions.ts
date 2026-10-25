type PrivilegeSource = {
  privileges?: unknown;
} | null | undefined;

export const REPORT_READ_PRIVILEGES = [
  "patient:read",
  "appointment:read",
  "billing:read",
  "pharmacy:read",
  "laboratory:read",
] as const;

export function hasPrivilege(
  user: PrivilegeSource,
  privilege: string,
): boolean {
  return (
    Array.isArray(user?.privileges) &&
    user.privileges.some((item) => item === privilege)
  );
}

export function hasAnyPrivilege(
  user: PrivilegeSource,
  privileges: readonly string[],
): boolean {
  return privileges.some((privilege) => hasPrivilege(user, privilege));
}
