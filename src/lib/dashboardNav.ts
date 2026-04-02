import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  PieChart,
  ScanSearch,
  Shield,
  Users,
} from "lucide-react";

export type DashboardSectionId =
  | "home"
  | "clinical"
  | "phi"
  | "policies"
  | "audit"
  | "reports"
  | "organizations"
  | "users";

export type NavItem = {
  id: DashboardSectionId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  description: string;
};

const ALL: Record<DashboardSectionId, Omit<NavItem, "id">> = {
  home: {
    label: "Overview",
    shortLabel: "Home",
    icon: LayoutDashboard,
    description: "Summary and shortcuts",
  },
  clinical: {
    label: "Clinical AI",
    shortLabel: "AI chat",
    icon: MessageSquare,
    description: "PHI-safe chat and history",
  },
  phi: {
    label: "PHI scan",
    shortLabel: "Scan",
    icon: ScanSearch,
    description: "Detection-only analysis",
  },
  policies: {
    label: "Policies",
    shortLabel: "Policies",
    icon: Shield,
    description: "PHI policy rules and thresholds",
  },
  audit: {
    label: "Audit log",
    shortLabel: "Audit",
    icon: ClipboardList,
    description: "Compliance and activity trail",
  },
  reports: {
    label: "Reports",
    shortLabel: "Reports",
    icon: PieChart,
    description: "Role-based metrics and exports",
  },
  organizations: {
    label: "Organizations",
    shortLabel: "Orgs",
    icon: Building2,
    description: "Create and manage tenants",
  },
  users: {
    label: "Users",
    shortLabel: "Users",
    icon: Users,
    description: "Accounts and role assignment",
  },
};

function item(id: DashboardSectionId): NavItem {
  return { id, ...ALL[id] };
}

/** Navigation entries visible for this role (only what they need). */
export function navItemsForRole(roleName: string | undefined): NavItem[] {
  switch (roleName) {
    case "clinician":
      return [item("clinical"), item("phi"), item("reports")];
    case "security_admin":
      return [item("home"), item("clinical"), item("phi"), item("policies"), item("audit"), item("reports")];
    case "system_admin":
      return [
        item("home"),
        item("clinical"),
        item("phi"),
        item("policies"),
        item("audit"),
        item("reports"),
        item("organizations"),
        item("users"),
      ];
    default:
      return [item("clinical"), item("phi"), item("reports")];
  }
}

/** First screen after login. */
export function defaultSectionForRole(roleName: string | undefined): DashboardSectionId {
  if (roleName === "clinician") return "clinical";
  if (roleName === "security_admin" || roleName === "system_admin") return "home";
  return "clinical";
}
