import { useState } from "react";

// ── sessions accordion (preview sidebar) ─────────────────────────────────────
export default function SessionsAccordion({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4">
        <span className="text-base font-bold text-slate-800">
          المحتوى التدريبي
          {sessions.length > 0 && (
            <span className="mr-2 text-sm font-normal text-slate-400">({sessions.length} جلسة)</span>
          )}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
          className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-right">لا توجد جلسات مضافة بعد.</p>
          ) : sessions.map((s, i) => (
            <div key={s.id ?? i}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-right">
              <span className="text-xs text-slate-400">{s.date ?? ""}</span>
              <span className="text-sm font-semibold text-slate-700">{s.title || `جلسة ${i + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
