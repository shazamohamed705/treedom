import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { computeStatus, markCoachSessionStarted, sessionAlreadyStarted } from "../org/SessionsPage";
import { startSessionForRole } from "../../services/api";
import { getUserRole, hasPermission } from "../../services/auth";
import { useToast } from "./ToastProvider";

const PAGE_SIZE  = 3;
const CYCLE_MS   = 3000;

const SORTS = [
  { key: "soonest", label: "الأقرب أولاً" },
  { key: "latest",  label: "الأبعد أولاً" },
  { key: "live",    label: "الجارية أولاً" },
  { key: "name",    label: "حسب الاسم" },
  { key: "program", label: "حسب البرنامج" },
];

const FILTERS = [
  { key: "all",   label: "الكل" },
  { key: "live",  label: "جارية الآن" },
  { key: "soon",  label: "مجدولة" },
];

function sessionMs(s) {
  try {
    const base = new Date(s.date || Date.now());
    const [h, m] = String(s.time || "00:00").split(":").map(Number);
    base.setHours(h || 0, m || 0, 0, 0);
    return base.getTime();
  } catch { return 0; }
}

function sessionTimeStatus(s) {
  return computeStatus({
    date: s.date,
    starts_at: s.time ?? s.starts_at ?? s.timeFrom,
    ends_at: s.timeTo ?? s.ends_at,
    status: s.status,
  });
}

function isLive(s) {
  if (s?.status === "ended" || s?.status === "completed" || s?.status === "انتهت") return false;
  if (s?.is_live === true || s?.status === "running" || s?.status === "جارية") return true;
  return sessionTimeStatus(s) === "live";
}

function canStartSession(s) {
  if (s?.status === "ended" || s?.status === "completed" || s?.status === "انتهت") return false;
  if (isCoachRole()) {
    if (!isLive(s) && sessionTimeStatus(s) !== "live") return false;
    return !sessionAlreadyStarted(s);
  }
  if (s?.can_start === true || s?.canStart === true) return true;
  if (s?.can_start === false || s?.canStart === false) return false;
  return isLive(s);
}

function applySort(list, sort) {
  const copy = [...list];
  if (sort === "latest")  return copy.sort((a, b) => sessionMs(b) - sessionMs(a));
  if (sort === "name")    return copy.sort((a, b) => String(a.title ?? "").localeCompare(String(b.title ?? ""), "ar"));
  if (sort === "program") return copy.sort((a, b) => String(a.program ?? "").localeCompare(String(b.program ?? ""), "ar"));
  if (sort === "live")    return copy.sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || sessionMs(a) - sessionMs(b));
  return copy.sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || sessionMs(a) - sessionMs(b));
}

function applyFilter(list, filter) {
  if (filter === "live") return list.filter(isLive);
  if (filter === "soon") return list.filter(s => !isLive(s));
  return list;
}

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoList() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8"  y1="6"  x2="21" y2="6"/>
      <line x1="8"  y1="12" x2="21" y2="12"/>
      <line x1="8"  y1="18" x2="21" y2="18"/>
      <line x1="3"  y1="6"  x2="3.01" y2="6"/>
      <line x1="3"  y1="12" x2="3.01" y2="12"/>
      <line x1="3"  y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}
function IcoFilter() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function IcoSort() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8"  y1="6"  x2="21" y2="6"/>
      <line x1="8"  y1="12" x2="21" y2="12"/>
      <line x1="8"  y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IcoCal() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IcoCalSm() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8"  y1="2" x2="8"  y2="6"/>
      <line x1="3"  y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IcoClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcoPlus({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  );
}

// ── single session row in the timeline ───────────────────────────────────────
function isCoachRole() {
  const role = getUserRole();
  return role === "coach" || role === "trainer";
}

function SessionRow({ session, isLast, onView, onStart, starting }) {
  const live = isLive(session);
  const canStart = canStartSession(session);

  return (
    <div className="flex" style={{ direction: "ltr" }}>
      {/* timeline dot + line */}
      <div className="flex flex-col items-center" style={{ width: 24, minWidth: 24 }}>
        <div className={`w-3 h-3 rounded-full border-2 mt-1 shrink-0
          ${live ? "bg-red-500 border-red-500" : "bg-white border-slate-300"}`} />
        {!isLast && (
          <div className="w-px flex-1 bg-slate-200 mt-1" style={{ minHeight: 80 }} />
        )}
      </div>

      {/* content */}
      <div className="flex-1 pb-7 pr-3" dir="rtl">
        {/* "when" pill */}
        <div className="flex items-center justify-end mb-2">
          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-3 py-0.5 rounded-full">
            {live ? "تبدأ الآن" : (session.date || "قادمة")}
          </span>
        </div>

        <p className="text-sm font-semibold text-slate-800 text-right">{session.title}</p>
        <p className="text-sm font-bold text-[#024677] mt-0.5 text-right">{session.program}</p>
        <p className="text-xs text-slate-400 mt-0.5 text-right">{session.trainer}</p>

        {/* date + time */}
        <div className="flex items-center justify-start gap-5 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <IcoCalSm /> {session.date}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-600">
            <IcoClock /> {session.time}
          </span>
        </div>

        {/* live actions */}
        {(live || canStart) && (
          <div className="flex items-center gap-2 mt-3" style={{ direction: "rtl" }}>
            {canStart && (
              <button
                type="button"
                disabled={starting}
                onClick={() => onStart?.(session)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 text-center hover:border-[#024677] hover:text-[#024677] transition disabled:opacity-50">
                {starting ? "جاري البدء..." : "بدء الجلسة"}
              </button>
            )}
            <button
              type="button"
              onClick={() => onView?.(session)}
              className="w-9 h-9 rounded-xl border border-slate-200 shrink-0 flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition">
              <IcoList />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function UpcomingSessions({ sessions = [], onView, onRefresh }) {
  const navigate   = useNavigate();
  const showToast  = useToast();
  const [startingId, setStartingId] = useState(null);
  const [, setNowTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNowTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const handleStart = async (session) => {
    if (!session?.id || startingId) return;
    setStartingId(session.id);
    try {
      await startSessionForRole(session.id);
      markCoachSessionStarted(session.id);
      showToast("تم بدء الجلسة بنجاح", "success");
      onRefresh?.();
      onView?.(session);
    } catch (err) {
      showToast(err.message || "تعذر بدء الجلسة", "error");
      onView?.(session);
    } finally {
      setStartingId(null);
    }
  };
  const [sort,   setSort]   = useState("soonest");
  const [filter, setFilter] = useState("all");
  const [menu,   setMenu]   = useState(null);
  const menuRef = useRef(null);

  const list  = applySort(applyFilter(
    sessions.filter(s => {
      if (s?.is_live === true || s?.status === "running" || s?.status === "جارية") return true;
      const st = computeStatus({
        date: s.date,
        starts_at: s.time ?? s.starts_at ?? s.timeFrom,
        ends_at: s.timeTo ?? s.ends_at,
      });
      return st === "live" || st === "upcoming";
    }),
    filter
  ), sort);
  const total = list.length;
  const canSlide = total > PAGE_SIZE;

  const [offset, setOffset] = useState(0);
  const [fade,   setFade]   = useState(true);
  const timerRef = useRef(null);

  const sessionKey = list.map(s => s.id).join(",") + `|${sort}|${filter}`;

  useEffect(() => { setOffset(0); setFade(true); }, [sessionKey]);

  useEffect(() => {
    if (!canSlide) setFade(true);
  }, [canSlide]);

  useEffect(() => {
    if (!canSlide) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setOffset(prev => (prev + 1) % total);
        setFade(true);
      }, 280);
    }, CYCLE_MS);
    return () => clearInterval(timerRef.current);
  }, [canSlide, total, sessionKey]);

  useEffect(() => {
    const close = e => { if (!menuRef.current?.contains(e.target)) setMenu(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const visible = Array.from({ length: Math.min(PAGE_SIZE, total) }, (_, i) =>
    list[(offset + i) % total]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100" dir="rtl">

      {/* header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2">
          <IcoCal />
          <h2 className="text-xl font-bold text-slate-800">الجلسات القادمة</h2>
          {total > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "#EFF6FF", color: "#024677" }}>
              {total}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2" ref={menuRef}>
          <div className="relative">
            <button type="button" onClick={() => setMenu(m => m === "sort" ? null : "sort")}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition
                ${menu === "sort" || sort !== "soonest" ? "border-teal-400 text-teal-500" : "border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500"}`}>
              <IcoSort />
            </button>
            {menu === "sort" && (
              <div className="absolute top-full left-0 mt-1.5 z-40 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-lg py-1" dir="rtl">
                {SORTS.map(o => (
                  <button key={o.key} type="button"
                    onClick={() => { setSort(o.key); setMenu(null); }}
                    className={`w-full text-right px-3 py-2 text-xs transition
                      ${sort === o.key ? "bg-[#0246770D] text-[#024677] font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setMenu(m => m === "filter" ? null : "filter")}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition
                ${menu === "filter" || filter !== "all" ? "border-teal-400 text-teal-500" : "border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500"}`}>
              <IcoFilter />
            </button>
            {menu === "filter" && (
              <div className="absolute top-full left-0 mt-1.5 z-40 min-w-[140px] bg-white border border-slate-200 rounded-xl shadow-lg py-1" dir="rtl">
                {FILTERS.map(o => (
                  <button key={o.key} type="button"
                    onClick={() => { setFilter(o.key); setMenu(null); }}
                    className={`w-full text-right px-3 py-2 text-xs transition
                      ${filter === o.key ? "bg-[#0246770D] text-[#024677] font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {hasPermission("sessions.create") && (
        <div className="px-5 pb-5">
          <button
            onClick={() => {
              const role = getUserRole();
              navigate(role === "coach" || role === "trainer"
                ? "/dashboard/trainer-add-session"
                : "/dashboard/add-session");
            }}
            className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-xl transition hover:opacity-90"
            style={{ background: "#024677" }}>
            <IcoPlus size={15} /> إضافة جلسة جديدة
          </button>
        </div>
      )}

      {/* session timeline */}
      <div className="px-5 pb-4 transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}>
        {visible.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">لا توجد جلسات قادمة</p>
        ) : (
          visible.map((s, i) => (
            <SessionRow
              key={s.id ?? `${offset}-${i}`}
              session={s}
              isLast={i === visible.length - 1}
              onView={onView}
              onStart={handleStart}
              starting={startingId === s.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
