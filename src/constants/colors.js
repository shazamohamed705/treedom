/**
 * Treedom Design Tokens — Single source of truth for all brand colors.
 *
 * Usage in JSX:
 *   import { BRAND, TEAL, COLORS } from "../constants/colors";
 *   style={{ color: BRAND }}
 *   style={{ background: COLORS.teal.light }}
 *
 * Usage in Tailwind arbitrary values (until we add a tailwind plugin):
 *   className={`text-[${BRAND}]`}   ← dynamic, but readable
 */

// ── Primary brand palette ─────────────────────────────────────────────────────
export const BRAND   = "#024677";   // primary blue
export const TEAL    = "#14b8a6";   // primary teal / accent
export const TEAL_LIGHT = "#5AEACF"; // sparkline / chart teal

// ── Semantic colors ───────────────────────────────────────────────────────────
export const SUCCESS  = "#16a34a";
export const ERROR    = "#dc2626";
export const WARNING  = "#d97706";
export const INFO     = "#3b82f6";
export const PURPLE   = "#8b5cf6";
export const AMBER    = "#f59e0b";
export const PINK     = "#e879f9";
export const ORANGE   = "#fb923c";

// ── Text / neutral palette ────────────────────────────────────────────────────
export const TEXT_PRIMARY   = "#1D293D";
export const TEXT_SECONDARY = "#64748b";  // slate-500
export const TEXT_MUTED     = "#94a3b8";  // slate-400
export const BORDER_DEFAULT = "#e2e8f0";  // slate-200
export const BORDER_LIGHT   = "#CADAE8";
export const BG_BRAND_LIGHT = "#0246770D"; // brand blue at 5% opacity — icon backgrounds

// ── Chart / donut color palette (consistent across all dashboards) ─────────────
export const DONUT_COLORS = [
  TEAL,      // #14b8a6
  INFO,      // #3b82f6
  PURPLE,    // #8b5cf6
  AMBER,     // #f59e0b
  PINK,      // #e879f9
  ORANGE,    // #fb923c
];

// ── Stat card chart colors (sparklines) ────────────────────────────────────────
export const CHART_COLORS = {
  teal:   TEAL_LIGHT,   // #5AEACF
  blue:   "#60a5fa",
  purple: "#a78bfa",
  green:  "#34d399",
};

// ── Notification dot colors ────────────────────────────────────────────────────
export const NOTIF_COLORS = {
  session_check_in: TEAL,
  session_reminder: ERROR,
  session_notify:   ERROR,
  session_started:  ERROR,
  session_live:     ERROR,
  program_enrolled: SUCCESS,
  program_approved: SUCCESS,
  program_rejected: ERROR,
  request_approved: SUCCESS,
  request_rejected: ERROR,
  invoice_created:  PURPLE,
  invoice_paid:     SUCCESS,
  invoice_overdue:  ERROR,
  warning:          WARNING,
  info:             TEAL,
  reminder:         INFO,
  success:          SUCCESS,
  error:            ERROR,
};

// ── Grouped object (optional convenience) ────────────────────────────────────
export const COLORS = {
  brand:   BRAND,
  teal:    TEAL,
  success: SUCCESS,
  error:   ERROR,
  warning: WARNING,
  info:    INFO,
  purple:  PURPLE,
  amber:   AMBER,
};
