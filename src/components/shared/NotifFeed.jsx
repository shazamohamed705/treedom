import { useState, useEffect, useRef } from "react";
import { SUCCESS, TEAL, INFO, WARNING, ERROR, PURPLE } from "../../constants/colors";

// ── constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 4;
const CYCLE_MS  = 3500;

// ── dot color + bg per notif type ─────────────────────────────────────────────
const TYPE_CFG = {
  success:  { dot: SUCCESS, bg: "#f0fdf4" },
  info:     { dot: TEAL,    bg: "#f0fdfa" },
  reminder: { dot: INFO,    bg: "#eff6ff" },
  warning:  { dot: WARNING, bg: "#fffbeb" },
  error:    { dot: ERROR,   bg: "#fef2f2" },
  // API types
  program:  { dot: SUCCESS, bg: "#f0fdf4" },
  session:  { dot: TEAL,    bg: "#f0fdfa" },
  coach:    { dot: INFO,    bg: "#eff6ff" },
  session_check_in: { dot: TEAL,    bg: "#f0fdfa" },
  session_reminder: { dot: INFO,    bg: "#eff6ff" },
  program_enrolled: { dot: SUCCESS, bg: "#f0fdf4" },
  program_approved: { dot: SUCCESS, bg: "#f0fdf4" },
  program_rejected: { dot: ERROR,   bg: "#fef2f2" },
  request_approved: { dot: SUCCESS, bg: "#f0fdf4" },
  request_rejected: { dot: ERROR,   bg: "#fef2f2" },
  invoice_created:  { dot: PURPLE,  bg: "#f5f3ff" },
  invoice_paid:     { dot: SUCCESS, bg: "#f0fdf4" },
  invoice_overdue:  { dot: ERROR,   bg: "#fef2f2" },
};
function cfg(type) { return TYPE_CFG[type] ?? TYPE_CFG.info; }

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoBell({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function IcoCheck({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IcoX({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function IcoWarning({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function NotifIcon({ type }) {
  const { dot } = cfg(type);
  const t = type ?? "";
  if (t === "success" || t.includes("approved") || t.includes("enrolled") || t === "program")
    return <IcoCheck color={dot} />;
  if (t === "error"   || t.includes("rejected"))
    return <IcoX color={dot} />;
  if (t === "warning")
    return <IcoWarning color={dot} />;
  return <IcoBell color={dot} />;
}

// ── single row ────────────────────────────────────────────────────────────────
function NotifRow({ notif }) {
  const { dot, bg } = cfg(notif.type);
  const label = notif.title ?? notif.text ?? "";
  const sub   = notif.body  ?? notif.description ?? "";
  const time  = notif.time  ?? notif.created_at  ?? "";

  return (
    <div className="notif-row-enter flex items-start gap-3 py-3 border-b border-slate-100 last:border-0" dir="rtl">
      {/* icon bubble */}
      <div className="shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: bg }}>
        <NotifIcon type={notif.type} />
      </div>

      {/* text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 leading-snug text-right truncate">
          {label}
        </p>
        {sub && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 leading-relaxed text-right">
            {sub}
          </p>
        )}
        {time && (
          <p className="text-[11px] text-slate-400 mt-1 text-right">{time}</p>
        )}
      </div>

      {/* colored dot */}
      <span className="w-2 h-2 rounded-full shrink-0 mt-2 notif-dot-pulse"
        style={{ background: dot }} />
    </div>
  );
}

// ── skeleton row ──────────────────────────────────────────────────────────────
function SkRow() {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0" dir="rtl">
      <div className="w-7 h-7 rounded-full bg-slate-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-100 rounded animate-pulse w-3/4" />
        <div className="h-2.5 bg-slate-100 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
/**
 * @param {Array}    notifications  — activity_log items from dashboard API
 * @param {Function} onViewAll      — callback to navigate to the activity log page
 */
export default function NotifFeed({ notifications = [], onViewAll }) {
  const total = notifications.length;

  const [start, setStart] = useState(0);
  const [fade,  setFade]  = useState(true);
  const timerRef = useRef(null);

  // restart cycle whenever list changes
  useEffect(() => {
    clearInterval(timerRef.current);
    setStart(0);
    setFade(true);
    if (total <= PAGE_SIZE) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStart(prev => (prev + PAGE_SIZE) % total);
        setFade(true);
      }, 280);
    }, CYCLE_MS);
    return () => clearInterval(timerRef.current);
  }, [total]);

  // visible slice (circular)
  const visible = [];
  for (let i = 0; i < Math.min(PAGE_SIZE, total); i++) {
    visible.push(notifications[(start + i) % total]);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 flex flex-col" dir="rtl">

      {/* header */}
      <div className="flex items-center justify-between gap-2 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">سجل النشاطات</h2>
          <p className="text-xs text-slate-400 mt-0.5">آخر التحديثات التي تحتاج انتباهك</p>
        </div>
        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
          {total}
        </span>
      </div>

      {/* list */}
      <div className="px-5 flex-1 transition-opacity duration-300" style={{ opacity: fade ? 1 : 0 }}>
        {total === 0 ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => <SkRow key={i} />)
        ) : (
          visible.map((notif, i) => (
            <NotifRow key={`${start}-${notif?.id ?? i}`} notif={notif} />
          ))
        )}
      </div>

      {/* pager dots */}
      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-1 px-5 py-2">
          {Array.from({ length: Math.ceil(total / PAGE_SIZE) }).map((_, i) => {
            const active = Math.floor(start / PAGE_SIZE) === i;
            return (
              <span key={i} className="rounded-full transition-all duration-300"
                style={{ width: active ? 14 : 6, height: 6, background: active ? "#14b8a6" : "#e2e8f0" }} />
            );
          })}
        </div>
      )}

      {/* footer — view all */}
      {onViewAll && (
        <div className="border-t border-slate-100 px-5 py-3 text-center">
          <button
            onClick={onViewAll}
            className="text-xs font-semibold transition"
            style={{ color: "#024677" }}
            onMouseEnter={e => e.currentTarget.style.color = "#14b8a6"}
            onMouseLeave={e => e.currentTarget.style.color = "#024677"}
          >
            عرض كل النشاطات ←
          </button>
        </div>
      )}
    </div>
  );
}
