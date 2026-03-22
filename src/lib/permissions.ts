import type { User } from "./api";

export function hasPermission(user: User | null, permission: string): boolean {
  return Boolean(user?.role?.permissions?.includes(permission));
}

export function isSystemAdmin(user: User | null): boolean {
  return user?.role?.role_name === "system_admin";
}

export function isSecurityAdmin(user: User | null): boolean {
  return user?.role?.role_name === "security_admin" || isSystemAdmin(user);
}

export function canManagePolicies(user: User | null): boolean {
  return hasPermission(user, "policies");
}

export function canViewOrgConversations(user: User | null): boolean {
  return hasPermission(user, "view_org_conversations");
}

export function canViewAllConversations(user: User | null): boolean {
  return hasPermission(user, "view_all_conversations");
}

/**
 * System admins always manage orgs/users (matches `role_name` in nav).
 * Permission strings are still used for non–system-admin if you extend roles later.
 */
export function canManageOrganizations(user: User | null): boolean {
  if (isSystemAdmin(user)) return true;
  return hasPermission(user, "manage_organizations");
}

export function canManageUsers(user: User | null): boolean {
  if (isSystemAdmin(user)) return true;
  return hasPermission(user, "manage_users");
}

/** Human-readable dashboard title by backend role_name */
export function roleDashboardCopy(roleName: string | undefined): {
  title: string;
  subtitle: string;
} {
  switch (roleName) {
    case "clinician":
      return {
        title: "Clinician workspace",
        subtitle: "Use PHI-safe AI chat and quick PHI scans on clinical text.",
      };
    case "security_admin":
      return {
        title: "Security & compliance",
        subtitle: "Review PHI policies, audit activity, and run guarded AI workflows.",
      };
    case "system_admin":
      return {
        title: "System administration",
        subtitle: "Organization-wide policies, audit visibility, and platform controls.",
      };
    default:
      return {
        title: "ClinGuard",
        subtitle: "Clinical AI with PHI detection and redaction.",
      };
  }
}

export function roleLabel(roleName: string | undefined): string {
  switch (roleName) {
    case "clinician":
      return "Clinician";
    case "security_admin":
      return "Security admin";
    case "system_admin":
      return "System admin";
    default:
      return "User";
  }
}
