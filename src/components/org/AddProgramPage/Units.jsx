import { useState } from "react";

// ── unit accordion row (in main content area) ────────────────────────────────
export function UnitAccordionRow({ unit, index, onSelectLesson, selectedLesson }) {
  const [open, setOpen] = useState(false);
  const lessonList = unit.lessonNames?.length > 0
    ? unit.lessonNames
    : Array.from({ length: unit.lessons || 0 }, (_, j) => `درس ${j + 1}`);

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden" dir="rtl">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition cursor-pointer">
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-sm font-semibold text-slate-700">{unit.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">({unit.lessons ?? 0} دروس)</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {lessonList.length === 0 ? (
            <p className="text-xs text-slate-400 px-6 py-3 text-right">لا توجد دروس في هذه الوحدة</p>
          ) : lessonList.map((name, j) => {
            const lessonKey = `${unit.id ?? index}-${j}`;
            const isSelected = selectedLesson?.key === lessonKey;
            return (
              <div key={j}
                onClick={() => onSelectLesson?.({ key: lessonKey, name, unitTitle: unit.title, unitIndex: index, lessonIndex: j })}
                className="flex items-center gap-3 px-6 py-2.5 cursor-pointer transition"
                style={{ background: isSelected ? "#EFF6FF" : "white" }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "white"; }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: isSelected ? "#024677" : "#14b8a6" }}>{j + 1}</span>
                <span className="text-sm text-right flex-1"
                  style={{ color: isSelected ? "#024677" : "#475569", fontWeight: isSelected ? 600 : 400 }}>
                  {name}
                </span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function UnitsSidebar({ units = [], onSelectLesson, selectedLesson }) {
  const [openUnit, setOpenUnit] = useState(null);

  return (
    <div className="w-64 shrink-0 border border-slate-200 rounded-2xl overflow-hidden bg-white" dir="rtl">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-sm font-bold text-slate-700 text-right">قائمة الوحدات</p>
      </div>
      <div className="p-2 space-y-1">
        {units.map((unit, i) => {
          const isOpen = openUnit === (unit.id ?? i);
          const lessonList = unit.lessonNames?.length > 0
            ? unit.lessonNames
            : Array.from({ length: unit.lessons || 0 }, (_, j) => `درس ${j + 1}`);
          return (
            <div key={unit.id ?? i}>
              {/* unit row */}
              <div
                onClick={() => setOpenUnit(isOpen ? null : (unit.id ?? i))}
                className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 transition"
                style={isOpen ? { background: "#EFF6FF" } : {}}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ background: "#024677" }}>{i + 1}</span>
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs font-semibold text-slate-700 truncate">{unit.title}</p>
                  <p className="text-[10px] text-slate-400">{unit.lessons ?? 0} دروس • {unit.hours ?? 0} ساعات</p>
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"
                  className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
              {/* lessons list */}
              {isOpen && (
                <div className="pr-4 pb-1 space-y-0.5">
                  {lessonList.length === 0 ? (
                    <p className="text-[10px] text-slate-400 px-3 py-1.5 text-right">لا توجد دروس</p>
                  ) : lessonList.map((name, j) => {
                    const lessonKey = `${unit.id ?? i}-${j}`;
                    const isSelected = selectedLesson?.key === lessonKey;
                    return (
                      <div key={j}
                        onClick={() => onSelectLesson?.({ key: lessonKey, name, unitTitle: unit.title, unitIndex: i, lessonIndex: j })}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer transition"
                        style={{ background: isSelected ? "#EFF6FF" : "transparent" }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "#f8fafc"; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: isSelected ? "#024677" : "#14b8a6" }}>{j + 1}</span>
                        <p className="text-[11px] font-medium text-right truncate flex-1"
                          style={{ color: isSelected ? "#024677" : "#475569" }}>{name}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── non-responsive units section (fixed 2-col grid, no breakpoints) ─────────
export function UnitsSection({ units = [], onSelectLesson, selectedLesson }) {
  const lessonCount = (u) => u.lessonNames?.length ?? u.lessons ?? 0;
  const lessonList = (u) =>
    u.lessonNames?.length > 0
      ? u.lessonNames
      : Array.from({ length: u.lessons || 0 }, (_, j) => `درس ${j + 1}`);

  return (
    <div dir="rtl" style={{ width: "100%", overflowX: "auto" }}>
      {/* fixed-width grid that never collapses */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 420px)",
          gap: "20px",
          width: "max-content",
          minWidth: "100%",
          padding: "4px",
        }}
      >
        {units.map((unit, i) => {
          const lessons = lessonList(unit);
          return (
            <div
              key={unit.id ?? i}
              style={{
                width: "420px",
                border: "1px solid #e2e8f0",
                borderRadius: "16px",
                background: "#fff",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {/* unit header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "14px 16px",
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <span
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#fff",
                    background: "#024677",
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#334155",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    textAlign: "right",
                  }}
                >
                  {unit.title}
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8", flexShrink: 0 }}>
                  ({lessonCount(unit)} دروس)
                </span>
              </div>

              {/* unit stats row */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "10px 16px",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: "12px",
                  color: "#64748b",
                }}
              >
                <span>📚 {lessonCount(unit)} دروس</span>
                <span>🕒 {unit.hours ?? 0} ساعات</span>
              </div>

              {/* lessons list */}
              <div style={{ padding: "6px" }}>
                {lessons.length === 0 ? (
                  <p style={{ fontSize: "12px", color: "#94a3b8", padding: "12px 16px", textAlign: "right" }}>
                    لا توجد دروس في هذه الوحدة
                  </p>
                ) : (
                  lessons.map((name, j) => {
                    const lessonKey = `${unit.id ?? i}-${j}`;
                    const isSelected = selectedLesson?.key === lessonKey;
                    const label = typeof name === "object" ? name.name : name;
                    return (
                      <div
                        key={j}
                        onClick={() =>
                          onSelectLesson?.({
                            key: lessonKey,
                            name: label,
                            unitTitle: unit.title,
                            unitIndex: i,
                            lessonIndex: j,
                          })
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "background 0.15s",
                          background: isSelected ? "#EFF6FF" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span
                          style={{
                            width: "20px",
                            height: "20px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#fff",
                            background: isSelected ? "#024677" : "#14b8a6",
                            flexShrink: 0,
                          }}
                        >
                          {j + 1}
                        </span>
                        <span
                          style={{
                            fontSize: "13px",
                            flex: 1,
                            textAlign: "right",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            color: isSelected ? "#024677" : "#475569",
                            fontWeight: isSelected ? 600 : 400,
                          }}
                        >
                          {label}
                        </span>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#cbd5e1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          style={{ flexShrink: 0 }}
                        >
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
