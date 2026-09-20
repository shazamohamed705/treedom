/**
 * API system isolation — each login role may only call its own API namespace.
 * Prevents org (/provider) traffic from running while another system is active
 * (e.g. notifications polling /provider/notifications for a trainee/company session).
 */

import { getToken, getUserRole, isIndeCoach } from "./auth";

/** Paths allowed without a session (login / register / public catalogs). */
const PUBLIC_PREFIXES = [
  "/account-types",
  "/specializations",
  "/provider/auth/",
  "/company/auth/",
  "/trainer/auth/",
  "/trainee/auth/",
];

/**
 * Role → allowed path prefixes (first match wins for more specific prefixes).
 * Keep lists tight so هيئة APIs cannot leak into other systems.
 */
function allowedPrefixesForSession() {
  const role = getUserRole();
  if (!role) return null;

  if (role === "trainee") {
    return ["/trainee/"];
  }
  if (role === "employee") {
    return ["/company/employee/"];
  }
  if (role === "company") {
    return [
      "/company/",
      // company program builder still reads shared catalogs from provider
      "/provider/coaches",
      "/provider/fields",
      "/provider/programs",
    ];
  }
  if (role === "coach") {
    return [
      "/trainer/",
      "/provider/coach",
      "/provider/coach-",
      "/provider/coach-permissions",
      "/provider/fields",
      "/provider/programs",
      "/provider/sessions",
      "/provider/coach-sessions",
      "/provider/coach-programs",
    ];
  }
  if (role === "trainer") {
    return ["/trainer/"];
  }
  // org / provider — inde coach also uses /trainer/* for programs & sessions
  if (role === "org") {
    return isIndeCoach() ? ["/provider/", "/trainer/"] : ["/provider/"];
  }
  return null;
}

function pathOnly(path) {
  const raw = String(path || "");
  const noQuery = raw.split("?")[0] || "";
  return noQuery.startsWith("/") ? noQuery : `/${noQuery}`;
}

export function isPublicApiPath(path) {
  const p = pathOnly(path);
  return PUBLIC_PREFIXES.some((prefix) => p === prefix.replace(/\/$/, "") || p.startsWith(prefix));
}

/**
 * Returns true if the authenticated session is allowed to call this API path.
 * Unauthenticated / public paths are always allowed.
 */
export function isApiPathAllowed(path) {
  const p = pathOnly(path);
  if (isPublicApiPath(p)) return true;
  if (!getToken()) return true;

  const prefixes = allowedPrefixesForSession();
  if (!prefixes) return false;

  // company must not use employee namespace
  if (getUserRole() === "company" && p.startsWith("/company/employee/")) {
    return false;
  }

  return prefixes.some((prefix) => {
    if (prefix.endsWith("-") || prefix.endsWith("/")) return p.startsWith(prefix);
    // exact resource prefix like /provider/coaches or /provider/fields
    return p === prefix || p.startsWith(`${prefix}/`) || p.startsWith(`${prefix}?`);
  });
}

/**
 * Throws if the current session must not call this path.
 * Used by the shared request() helper.
 */
export function assertApiPathAllowed(path) {
  if (isApiPathAllowed(path)) return;
  const role = getUserRole() ?? "unknown";
  throw new Error(
    `طلب API غير مسموح لهذا النظام (دور: ${role}). المسار خارج نطاق الجلسة الحالية.`
  );
}

/**
 * Notification endpoint role must match the logged-in system.
 * Never silently fall back to هيئة /provider.
 */
export function resolveNotificationRole(requestedRole) {
  const actual = getUserRole();
  if (!actual) return null;

  // coach UI often passes "trainer" for the same /trainer/notifications API
  if (actual === "coach" && (requestedRole === "trainer" || requestedRole === "coach")) {
    return "coach";
  }
  if (requestedRole && requestedRole !== actual) {
    return actual;
  }
  return actual;
}
