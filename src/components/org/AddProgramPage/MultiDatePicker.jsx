import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ── multi-date picker calendar ────────────────────────────────────────────────
export default function MultiDatePicker({ selected = [], onChange }) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 288 });
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const ref = useRef();
  const btnRef = useRef();

  // detect mobile (≤ 640px)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // calculate desktop dropdown position
  const calcPos = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const dropW = 288;
    const vpW = window.innerWidth;
    let left = rect.right - dropW;
    if (left < 8) left = 8;
    if (left + dropW > vpW - 8) left = vpW - dropW - 8;
    const top = rect.bottom + window.scrollY + 6;
    setDropPos({ top, left, width: dropW });
  };

  // close on outside click (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isMobile]);

  // lock body scroll when mobile sheet is open
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, open]);

  const AR_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const AR_DAYS   = ["ح","ن","ث","ر","خ","ج","س"];

  const toKey = (y, m, d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  const toggleDate = (key) => {
    if (safeSelected.includes(key)) onChange(safeSelected.filter(k => k !== key));
    else onChange([...safeSelected, key].sort());
  };

  const prevMonth = () => setViewDate(v => {
    const m = v.month === 0 ? 11 : v.month - 1;
    const y = v.month === 0 ? v.year - 1 : v.year;
    return { year: y, month: m };
  });
  const nextMonth = () => setViewDate(v => {
    const m = v.month === 11 ? 0 : v.month + 1;
    const y = v.month === 11 ? v.year + 1 : v.year;
    return { year: y, month: m };
  });

  const firstDay = new Date(viewDate.year, viewDate.month, 1).getDay();
  const daysInMonth = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const label = safeSelected.length === 0
    ? "اختر التواريخ"
    : safeSelected.length === 1
      ? safeSelected[0]
      : `${safeSelected.length} تواريخ مختارة`;

  // ── shared calendar UI ──────────────────────────────────────────────────────
  const CalendarBody = () => (
    <div dir="rtl">
      {/* month nav */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={nextMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition text-slate-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-base font-bold text-slate-700">
          {AR_MONTHS[viewDate.month]} {viewDate.year}
        </span>
        <button type="button" onClick={prevMonth}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition text-slate-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* day headers */}
      <div className="grid grid-cols-7 mb-1">
        {AR_DAYS.map(d => (
          <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const key = toKey(viewDate.year, viewDate.month, day);
          const isSelected = safeSelected.includes(key);
          const isToday = (() => {
            const t = new Date();
            return t.getFullYear() === viewDate.year && t.getMonth() === viewDate.month && t.getDate() === day;
          })();
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggleDate(key)}
              className="w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm transition font-medium"
              style={
                isSelected
                  ? { background: "#ef4444", color: "#fff" }
                  : isToday
                  ? { background: "#F0F7FF", color: "#024677", fontWeight: 700 }
                  : { color: "#475569" }
              }
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f1f5f9"; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? "#F0F7FF" : ""; }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* selected chips */}
      {safeSelected.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {safeSelected.map(k => (
              <span key={k}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#FEE2E2", color: "#b91c1c" }}>
                {k}
                <button type="button" onClick={() => onChange(safeSelected.filter(s => s !== k))}
                  className="hover:text-red-700 transition leading-none text-base">×</button>
              </span>
            ))}
          </div>
          <button type="button" onClick={() => onChange([])}
            className="mt-2 text-xs text-slate-400 hover:text-red-400 transition">
            مسح الكل
          </button>
        </div>
      )}
    </div>
  );

  // ── mobile bottom sheet ─────────────────────────────────────────────────────
  const MobileSheet = () => createPortal(
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999 }}
      onClick={() => setOpen(false)}
    >
      {/* backdrop */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.45)",
        animation: "fadeIn 0.2s ease",
      }} />

      {/* sheet */}
      <div
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "0 16px 32px",
          maxHeight: "92vh",
          overflowY: "auto",
          animation: "slideUp 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* handle bar */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#e2e8f0" }} />
        </div>

        {/* header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingBottom: 12, marginBottom: 4,
          borderBottom: "1px solid #f1f5f9",
        }} dir="rtl">
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1e293b" }}>تواريخ مستثناة (إجازات)</span>
          <button type="button" onClick={() => setOpen(false)}
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#f1f5f9", border: "none", cursor: "pointer",
              fontSize: 18, color: "#64748b",
            }}>×</button>
        </div>

        <CalendarBody />

        {/* done button */}
        <button type="button" onClick={() => setOpen(false)}
          style={{
            marginTop: 16, width: "100%", padding: "14px",
            borderRadius: 14, fontSize: 15, fontWeight: 700,
            color: "#fff", background: "#024677", border: "none", cursor: "pointer",
          }}>
          تم {safeSelected.length > 0 && `(${safeSelected.length})`}
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>,
    document.body
  );

  // ── desktop dropdown ────────────────────────────────────────────────────────
  const DesktopDropdown = () => createPortal(
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: "fixed",
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 9999,
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
        padding: 16,
      }}
    >
      <CalendarBody />
      <button type="button" onClick={() => setOpen(false)}
        style={{
          marginTop: 12, width: "100%", padding: "10px",
          borderRadius: 12, fontSize: 13, fontWeight: 700,
          color: "#fff", background: "#024677", border: "none", cursor: "pointer",
        }}>
        تم
      </button>
    </div>,
    document.body
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* trigger button */}
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (!isMobile) calcPos();
          setOpen(o => !o);
        }}
        className="w-full flex items-center justify-between border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white hover:border-teal-400 focus:outline-none focus:border-teal-400 transition"
        style={{ direction: "rtl" }}
      >
        <span className={safeSelected.length === 0 ? "text-slate-400" : "text-slate-700 font-medium"}>
          {label}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {open && (isMobile ? <MobileSheet /> : <DesktopDropdown />)}
    </div>
  );
}
