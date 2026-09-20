import { getUser, getUserRole, isIndeCoach } from "./auth";

/**
 * Access groups used by frontend route authorization.
 * Built from the stored login role — not the UI preview switcher.
 *
 *   provider / org          → "org"
 *   coach / trainer         → "trainer"
 *   company                 → "company"
 *   employee / staff        → "employee"
 *   trainee / user          → "user"
 */
export const ACCESS_ROLES = {
  ORG: "org",
  TRAINER: "trainer",
  COMPANY: "company",
  EMPLOYEE: "employee",
  USER: "user",
};

const ALL = [
  ACCESS_ROLES.ORG,
  ACCESS_ROLES.TRAINER,
  ACCESS_ROLES.COMPANY,
  ACCESS_ROLES.EMPLOYEE,
  ACCESS_ROLES.USER,
];

/**
 * Maps the logged-in user to an access group.
 * Uses explicit API type/role first, then getUserRole().
 */
export function getAccessRole() {
  const user = getUser();
  if (!user) return null;

  const t = user.type ?? user.role ?? null;

  if (t === "provider" || t === "org" || t === "inde_coach") return ACCESS_ROLES.ORG;
  if (t === "company") return ACCESS_ROLES.COMPANY;
  if (t === "coach" || t === "trainer") return ACCESS_ROLES.TRAINER;
  if (t === "trainee" || t === "user") return ACCESS_ROLES.USER;
  if (t === "employee" || t === "staff") return ACCESS_ROLES.EMPLOYEE;

  const role = getUserRole();
  if (role === "coach" || role === "trainer") return ACCESS_ROLES.TRAINER;
  if (role === "company") return ACCESS_ROLES.COMPANY;
  if (role === "employee") return ACCESS_ROLES.EMPLOYEE;
  if (role === "trainee") return ACCESS_ROLES.USER;
  if (role === "org") return ACCESS_ROLES.ORG;

  return null;
}

/**
 * First URL segment under /dashboard → allowed access groups.
 * Only routes that are clearly owned in App.jsx / nav are listed.
 */
export const ROUTE_ACCESS = {
  "": ALL,
  dashboard: ALL,
  notifications: ALL,
  "activity-log": ["org"],

  programs: ["org", "company", "employee", "user"],
  sessions: ["org", "employee", "user"],
  quizzes: ["org"],

  "trainer-dashboard": ["trainer"],
  "trainer-programs": ["trainer"],
  "trainer-program-view": ["trainer"],
  "trainer-program-edit": ["trainer"],
  "coach-add-program": ["trainer"],
  "coach-add-session": ["trainer"],
  "trainer-sessions": ["trainer"],
  "trainer-add-session": ["trainer"],
  "trainer-session-view": ["trainer"],
  "trainer-requests": ["trainer"],
  profile: ["trainer"],
  "my-requests": ["trainer"],

  attendance: ["org"],
  "session-view": ["org", "trainer"],

  "my-programs": ["employee", "user"],
  "user-program-view": ["employee", "user"],
  "user-program-session": ["employee", "user"],
  "user-profile": ["employee", "user"],
  "training-record": ["employee", "user"],
  favorites: ["employee", "user"],
  support: ["employee", "user"],
  payments: ["employee", "user"],
  "user-session-view": ["employee", "user"],
  "finance-requests": ["employee"],

  "negotiation-requests": ["company"],
  "employee-programs": ["company"],
  employees: ["company"],
  "employee-view": ["company"],
  "enrolled-program-detail": ["company"],
  "browse-programs": ["company"],
  "program-detail": ["company"],
  "custom-request": ["company"],
  "company-payments": ["company"],
  "funding-requests": ["company"],
  "funding-request-detail": ["company"],
  "funding-request-locked": ["company"],
  "funding-request-review": ["company"],
  "settings-security": ["company"],
  "settings-users": ["company"],
  "settings-company": ["company"],

  "add-program": ["org", "company"],

  "edit-program": ["org"],
  "view-program": ["org"],
  "add-session": ["org"],
  "session-edit": ["org"],
  "today-sessions": ["org"],
  trainers: ["org"],
  "add-trainer": ["org"],
  "trainer-profile": ["org"],
  trainees: ["org"],
  finance: ["org"],
  review: ["org"],
  settings: ["org"],
};

export function getDashboardSegment(pathname) {
  const raw = String(pathname || "");
  const withoutBase = raw.replace(/^\/dashboard\/?/, "");
  return withoutBase.split("/")[0] || "";
}

/**
 * Home (/dashboard) is always allowed for an authenticated user.
 * Listed routes require a matching access group.
 * Unlisted segments are denied (no guessing).
 */
export function canAccessDashboardPath(pathname, accessRole) {
  const segment = getDashboardSegment(pathname);
  if (segment === "" || segment === "dashboard") return true;

  if (isIndeCoach() && (segment === "trainers" || segment === "add-trainer" || segment === "trainer-profile")) {
    return false;
  }

  const allowed = ROUTE_ACCESS[segment];
  if (!allowed) return false;
  if (!accessRole) return false;
  return allowed.includes(accessRole);
}
