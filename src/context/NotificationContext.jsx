import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { fetchNotifications, fetchCompanyDashboard, fetchDashboard } from "../services/api";
import { getUserRole, getToken, getUser, isIndeCoach } from "../services/auth";
import { dashboardToNotifs } from "../components/companyFollowUp";
import { activityLogFromDashboard } from "../components/orgActivityLog";

// ── context ───────────────────────────────────────────────────────────────────
export const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 60_000;
const TRAINEE_POLL_MS  = 12_000;

function activityReadStorageKey() {
  const u = getUser();
  const id = u?.id ?? u?.user_id ?? u?.email ?? "anon";
  return `indeActivityReadIds:${id}`;
}

function loadActivityReadIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(activityReadStorageKey()) || "[]");
    return new Set(Array.isArray(raw) ? raw.map(String) : []);
  } catch {
    return new Set();
  }
}

function saveActivityReadIds(ids) {
  try {
    localStorage.setItem(activityReadStorageKey(), JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

export function isUrgentSessionNotif(n) {
  if (!n || n.is_read) return false;
  const type = String(n.type ?? "").toLowerCase();
  const text = `${n.title ?? ""} ${n.body ?? ""} ${n.text ?? ""}`;
  if (
    type.includes("session") ||
    type.includes("notify") ||
    type.includes("reminder") ||
    type.includes("live") ||
    type.includes("meeting") ||
    type.includes("zoom")
  ) return true;
  return /جلسة|أونلاين|اونلاين|زووم|zoom|مباشر|تنبيه الطلاب|سجّل حضور|سجل حضور/i.test(text);
}

/**
 * Extracts the notifications array from different API response shapes:
 *   { data: { notifications: [...] } }         — provider / trainer / company
 *   { data: { data: [...] } }                  — some endpoints
 *   { data: [...] }                            — bare array
 */
function extractList(res) {
  const d = res?.data ?? {};
  if (Array.isArray(d.notifications)) return d.notifications;
  if (Array.isArray(d.data))          return d.data;
  if (Array.isArray(d))               return d;
  return [];
}

/**
 * Extracts the unread count from the API response.
 * Prefers the server-provided unread_count (accurate across pages),
 * and falls back to counting unread items in the current list.
 */
function extractUnreadCount(res, list) {
  const d = res?.data ?? {};
  if (typeof d.unread_count === "number") return d.unread_count;
  return list.filter(n => !n.is_read).length;
}

function clearNotifState(setUnreadState, setRecentList, setUrgent, seenUrgent) {
  setUnreadState(0);
  setRecentList([]);
  setUrgent(null);
  seenUrgent.current = new Set();
}

// ── provider ──────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
  const [unread,      setUnreadState] = useState(0);
  const [recentList,  setRecentList]  = useState([]); // for dropdown preview
  const [loading,     setLoading]     = useState(false);
  const [urgent,      setUrgent]      = useState(null);
  const timerRef = useRef(null);
  const seenUrgent = useRef(new Set());
  const readIdsRef = useRef(loadActivityReadIds());
  const roleRef = useRef(getUserRole());

  const refresh = useCallback(async () => {
    // No token → nothing to fetch; leave list empty without throwing
    if (!getToken()) {
      clearNotifState(setUnreadState, setRecentList, setUrgent, seenUrgent);
      setLoading(false);
      return;
    }

    // Always use the live login role — never a UI preview / forced org default
    const role = getUserRole();
    if (!role) {
      clearNotifState(setUnreadState, setRecentList, setUrgent, seenUrgent);
      setLoading(false);
      return;
    }

    // Role/system changed → drop previous system's notifications immediately
    if (roleRef.current !== role) {
      roleRef.current = role;
      clearNotifState(setUnreadState, setRecentList, setUrgent, seenUrgent);
    }

    try {
      let list = [];
      if (role === "company") {
        const res  = await fetchCompanyDashboard();
        const data = res?.data ?? res ?? {};
        list = dashboardToNotifs(data);
        setRecentList(list);
        setUnreadState(list.filter(n => n.is_read === false).length);
      } else if (isIndeCoach()) {
        // Independent trainer bell: activity_log from provider dashboard (not /notifications)
        readIdsRef.current = loadActivityReadIds();
        const res = await fetchDashboard({
          upcoming_sessions_limit: 3,
          active_programs_per_page: 10,
        });
        list = activityLogFromDashboard(res).map(a => {
          const id = String(a.id);
          return {
            ...a,
            is_read: readIdsRef.current.has(id) || a.is_read === true,
          };
        });
        setRecentList(list);
        setUnreadState(list.filter(n => !n.is_read).length);
      } else if (role === "org" || role === "trainee" || role === "employee" || role === "trainer" || role === "coach") {
        const res  = await fetchNotifications({ page: 1, per_page: 15, role });
        list = extractList(res);
        setRecentList(list);
        setUnreadState(extractUnreadCount(res, list));
      } else {
        // Unknown role — do not hit هيئة API
        clearNotifState(setUnreadState, setRecentList, setUrgent, seenUrgent);
        setLoading(false);
        return;
      }
      const nextUrgent = list.find(isUrgentSessionNotif);
      if (nextUrgent && !seenUrgent.current.has(String(nextUrgent.id))) {
        seenUrgent.current.add(String(nextUrgent.id));
        setUrgent(nextUrgent);
      }
    } catch { /* silent — don't crash the app */ }
    finally  { setLoading(false); }
  }, []);

  // initial load + polling (faster for trainee / employee — live session alerts)
  // Re-bind when login role changes so the correct system API is used
  const sessionRole = getUserRole();
  useEffect(() => {
    setLoading(true);
    refresh();
    const role = getUserRole();
    const ms = (role === "trainee" || role === "employee") ? TRAINEE_POLL_MS : POLL_INTERVAL_MS;
    timerRef.current = setInterval(refresh, ms);
    return () => clearInterval(timerRef.current);
  }, [refresh, sessionRole]);

  const decrementUnread = useCallback(() =>
    setUnreadState(n => Math.max(0, n - 1)), []);

  const setUnread = useCallback((n) =>
    setUnreadState(Math.max(0, n)), []);

  /** Persist one activity item as read (inde coach) and update list state. */
  const markLocalRead = useCallback((id) => {
    const key = String(id);
    if (!readIdsRef.current.has(key)) {
      readIdsRef.current.add(key);
      saveActivityReadIds(readIdsRef.current);
    }
    setRecentList(prev => prev.map(n =>
      String(n.id) === key ? { ...n, is_read: true } : n
    ));
    setUnreadState(n => Math.max(0, n - 1));
  }, []);

  /** Persist all current activity items as read (inde coach). */
  const markAllLocalRead = useCallback(() => {
    setRecentList(prev => {
      prev.forEach(n => readIdsRef.current.add(String(n.id)));
      saveActivityReadIds(readIdsRef.current);
      return prev.map(n => ({ ...n, is_read: true }));
    });
    setUnreadState(0);
  }, []);

  return (
    <NotificationContext.Provider value={{
      unread,
      recentList,
      loading,
      urgent,
      dismissUrgent: () => setUrgent(null),
      refresh,
      decrementUnread,
      setUnread,
      markLocalRead,
      markAllLocalRead,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ── convenience hook ──────────────────────────────────────────────────────────
export function useNotifications() {
  return useContext(NotificationContext);
}
