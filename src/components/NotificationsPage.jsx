import { useState, useEffect, useCallback, useContext } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/api";
import { getUserRole } from "../services/auth";
import { NotificationContext, isUrgentSessionNotif } from "../context/NotificationContext";

// ── type config ───────────────────────────────────────────────────────────────
const TYPE_CFG = {
  session_check_in: { dot: "#14b8a6", bg: "#f0fdfa",  icon: "bell"    },
  session_reminder: { dot: "#dc2626", bg: "#fef2f2",  icon: "warning" },
  session_notify:   { dot: "#dc2626", bg: "#fef2f2",  icon: "warning" },
  session_started:  { dot: "#dc2626", bg: "#fef2f2",  icon: "warning" },
  session_live:     { dot: "#dc2626", bg: "#fef2f2",  icon: "warning" },
  program_enrolled: { dot: "#16a34a", bg: "#f0fdf4",  icon: "check"   },
  program_approved: { dot: "#16a34a", bg: "#f0fdf4",  icon: "check"   },
  program_rejected: { dot: "#dc2626", bg: "#fef2f2",  icon: "x"       },
  request_approved: { dot: "#16a34a", bg: "#f0fdf4",  icon: "check"   },
  request_rejected: { dot: "#dc2626", bg: "#fef2f2",  icon: "x"       },
  invoice_created:  { dot: "#7c3aed", bg: "#f5f3ff",  icon: "bell"    },
  invoice_paid:     { dot: "#16a34a", bg: "#f0fdf4",  icon: "check"   },
  invoice_overdue:  { dot: "#dc2626", bg: "#fef2f2",  icon: "x"       },
  warning:          { dot: "#d97706", bg: "#fffbeb",  icon: "warning" },
  info:             { dot: "#14b8a6", bg: "#f0fdfa",  icon: "bell"    },
  reminder:         { dot: "#3b82f6", bg: "#eff6ff",  icon: "bell"    },
  success:          { dot: "#16a34a", bg: "#f0fdf4",  icon: "check"   },
  error:            { dot: "#dc2626", bg: "#fef2f2",  icon: "x"       },
};

function getTypeCfg(type) {
  return TYPE_CFG[type] ?? TYPE_CFG.info;
}

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoBell({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function IcoCheck({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoX({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IcoWarning({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function NotifIcon({ type, color }) {
  switch (type) {
    case "check":   return <IcoCheck   color={color} />;
    case "x":       return <IcoX       color={color} />;
    case "warning": return <IcoWarning color={color} />;
    default:        return <IcoBell    color={color} />;
  }
}

// ── single row ────────────────────────────────────────────────────────────────
function NotifRow({ notif, role, onRead }) {
  const urgent = !notif.is_read && isUrgentSessionNotif(notif);
  const cfg = urgent
    ? { dot: "#dc2626", bg: "#fef2f2", icon: "warning" }
    : getTypeCfg(notif.type);

  const handleClick = async () => {
    if (notif.is_read) return;
    try {
      await markNotificationRead(notif.id, role);
      onRead(notif.id);
    } catch { /* silent */ }

    if (notif.url) window.open(notif.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-0
                  transition-colors cursor-pointer
                  ${notif.is_read ? "bg-white hover:bg-slate-50" : urgent ? "bg-red-50 hover:bg-red-100" : "bg-teal-50/40 hover:bg-teal-50/70"}`}
      dir="rtl"
    >
      {/* icon bubble */}
      <div className="shrink-0 mt-0.5 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: cfg.bg }}>
        <NotifIcon type={cfg.icon} color={cfg.dot} />
      </div>

      {/* text block */}
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] leading-snug text-right ${notif.is_read ? "text-slate-600" : "text-slate-800 font-semibold"}`}>
          {notif.title ?? notif.text ?? ""}
        </p>
        {notif.body && (
          <p className="text-xs text-slate-500 mt-1 text-right leading-relaxed">
            {notif.body}
          </p>
        )}
        <p className="text-[11px] text-slate-400 mt-1.5 text-right">{notif.created_at ?? notif.time ?? ""}</p>
      </div>

      {/* unread dot */}
      {!notif.is_read && (
        <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-2" style={{ background: cfg.dot }} />
      )}
    </div>
  );
}

// ── skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-100 animate-pulse">
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-3/4 mr-auto" />
        <div className="h-3 bg-slate-100 rounded w-1/2 mr-auto" />
        <div className="h-2.5 bg-slate-100 rounded w-1/4 mr-auto" />
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function NotificationsPage({ forceRole } = {}) {
  // Prefer live session role so a forced "org" cannot leak هيئة API into other systems
  const sessionRole = getUserRole();
  const role = sessionRole ?? forceRole ?? null;
  const ctx  = useContext(NotificationContext);

  const [notifications, setNotifications] = useState([]);
  const [pagination,    setPagination]    = useState(null);
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [markingAll,    setMarkingAll]    = useState(false);
  const [error,         setError]         = useState(null);

  const load = useCallback(async (p = 1) => {
    if (!role) {
      setError("لا يمكن تحميل الإشعارات: الجلسة غير مرتبطة بنظام");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetchNotifications({ page: p, per_page: 20, role });
      const data = res?.data ?? {};
      const list = data.notifications ?? [];
      setNotifications(prev => p === 1 ? list : [...prev, ...list]);
      setPagination(data.pagination ?? null);
      setPage(p);
    } catch (err) {
      setError(err?.message ?? "حدث خطأ أثناء تحميل الإشعارات");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { load(1); }, [load]);

  const handleRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    ctx?.decrementUnread();
  }, [ctx]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead(role);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      ctx?.setUnread(0);
    } catch { /* silent */ }
    finally { setMarkingAll(false); }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasMore     = pagination
    ? page < (pagination.total_pages ?? 1)
    : false;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-5" dir="rtl">
      <div className="w-full">

        {/* ── page header ── */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div>
            <h1 className="text-lg font-bold text-slate-800">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">
                {unreadCount} إشعار غير مقروء
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* refresh button */}
            <button
              onClick={() => load(1)}
              disabled={loading}
              title="تحديث"
              className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 hover:border-[#31AFEA] hover:text-[#31AFEA] transition text-slate-400 disabled:opacity-40"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                className={loading ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markingAll}
                className="text-xs font-semibold px-4 py-2 rounded-xl transition disabled:opacity-60"
                style={{ background: "#024677", color: "#fff" }}
              >
                {markingAll ? "جاري..." : "تحديد الكل كمقروء"}
              </button>
            )}
          </div>
        </div>

        {/* ── card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">

          {/* error */}
          {error && (
            <div className="px-4 py-5 text-sm text-red-500 text-center">{error}</div>
          )}

          {/* skeleton on initial load */}
          {loading && notifications.length === 0 && (
            <>
              {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
            </>
          )}

          {/* empty state */}
          {!loading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p className="text-sm text-slate-400">لا توجد إشعارات حتى الآن</p>
            </div>
          )}

          {/* list */}
          {notifications.map(n => (
            <NotifRow key={n.id} notif={n} role={role} onRead={handleRead} />
          ))}

          {/* load more */}
          {hasMore && (
            <div className="px-4 py-3 text-center border-t border-slate-100">
              <button
                onClick={() => load(page + 1)}
                disabled={loading}
                className="text-sm font-medium text-teal-600 hover:text-teal-700 transition disabled:opacity-50"
              >
                {loading ? "جاري التحميل..." : "تحميل المزيد"}
              </button>
            </div>
          )}

          {/* bottom skeleton while loading more */}
          {loading && notifications.length > 0 && (
            <SkeletonRow />
          )}
        </div>

      </div>
    </main>
  );
}
