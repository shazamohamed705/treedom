import { useState, useEffect, useRef, useMemo } from "react";
import { hasPermission } from "../services/auth";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoFilter({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function IcoSort({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6"  x2="21" y2="6"/>
      <line x1="8" y1="12" x2="15" y2="12"/>
      <line x1="8" y1="18" x2="11" y2="18"/>
    </svg>
  );
}
function IcoSearch({ size = 13, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      className={className}>
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IcoPlus({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcoUsers() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

// ── circular progress ring ────────────────────────────────────────────────────
function ProgressRing({ value = 0 }) {
  const r    = 16;
  const circ = 2 * Math.PI * r;
  const arc  = ((value ?? 0) / 100) * circ;

  const color =
    value >= 80 ? "#14b8a6" :
    value >= 50 ? "#f59e0b" :
                  "#94a3b8";

  return (
    <div className="inline-flex items-center gap-1.5">
      <svg width="38" height="38" viewBox="0 0 38 38">
        <circle cx="19" cy="19" r={r} fill="none" stroke="#f1f5f9" strokeWidth="3.5"/>
        <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
          transform="rotate(-90 19 19)"/>
        <text x="19" y="23" textAnchor="middle" fontSize="9" fontWeight="700" fill={color}>
          {value}%
        </text>
      </svg>
    </div>
  );
}

// ── tab definitions (progress bands) ──────────────────────────────────────────
const TABS = [
  { key: "all",      label: "الكل"        },
  { key: "approved", label: "عالي التقدم" },
  { key: "review",   label: "متوسط"       },
  { key: "edit",     label: "منخفض"       },
];

const FILTERS = [
  { key: "all",       label: "كل البرامج" },
  { key: "remaining", label: "جلسات متبقية" },
  { key: "finished",  label: "اكتملت الجلسات" },
  { key: "trainees",  label: "لديها متدربين" },
  { key: "empty",     label: "بدون متدربين" },
];

const SORTS = [
  { key: "progress_desc",  label: "الأعلى تقدماً" },
  { key: "progress_asc",   label: "الأقل تقدماً" },
  { key: "trainees_desc",  label: "الأكثر متدربين" },
  { key: "trainees_asc",   label: "الأقل متدربين" },
  { key: "remaining_desc", label: "الأكثر جلسات متبقية" },
  { key: "name_asc",       label: "الاسم أ → ي" },
  { key: "name_desc",      label: "الاسم ي → أ" },
];

function parseSessionsCount(p) {
  if (typeof p.sessions === "number") return p.sessions;
  const m = String(p.sessions ?? "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

function applyExtraFilter(list, filter) {
  if (filter === "remaining") return list.filter(p => (p.remaining ?? 0) > 0);
  if (filter === "finished")  return list.filter(p => (p.remaining ?? 0) <= 0);
  if (filter === "trainees")  return list.filter(p => (p.trainees ?? 0) > 0);
  if (filter === "empty")     return list.filter(p => (p.trainees ?? 0) <= 0);
  return list;
}

function applySort(list, sort) {
  const arr = [...list];
  const byName = (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? ""), "ar");
  switch (sort) {
    case "progress_asc":   return arr.sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
    case "trainees_desc":  return arr.sort((a, b) => (b.trainees ?? 0) - (a.trainees ?? 0));
    case "trainees_asc":   return arr.sort((a, b) => (a.trainees ?? 0) - (b.trainees ?? 0));
    case "remaining_desc": return arr.sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0));
    case "name_asc":       return arr.sort(byName);
    case "name_desc":      return arr.sort((a, b) => byName(b, a));
    case "progress_desc":
    default:               return arr.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
  }
}

// ── main ──────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;

export default function ProgramsTable({ programs = [], onAddProgram }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(0);
  const [filter,    setFilter]    = useState("all");
  const [sort,      setSort]      = useState("progress_desc");
  const [menu,      setMenu]      = useState(null); // "filter" | "sort" | null
  const menuRef = useRef(null);

  const list = Array.isArray(programs) ? programs : [];

  const filtered = useMemo(() => {
    const byTab = list.filter(p => {
      const matchTab =
        activeTab === "all"      ? true :
        activeTab === "approved" ? (p.progress ?? 0) >= 80 :
        activeTab === "review"   ? (p.progress ?? 0) >= 50 && (p.progress ?? 0) < 80 :
        /* edit */                 (p.progress ?? 0) < 50;
      const q = search.trim();
      const matchSearch = !q || String(p.name ?? "").includes(q);
      return matchTab && matchSearch;
    });
    return applySort(applyExtraFilter(byTab, filter), sort);
  }, [list, activeTab, search, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => { setPage(0); }, [activeTab, search, filter, sort]);

  useEffect(() => {
    if (filtered.length <= PAGE_SIZE) return;
    const timer = setInterval(() => {
      setPage(p => (p + 1) % Math.ceil(filtered.length / PAGE_SIZE));
    }, 6000);
    return () => clearInterval(timer);
  }, [filtered.length, activeTab, search, filter, sort]);

  useEffect(() => {
    const close = e => { if (!menuRef.current?.contains(e.target)) setMenu(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  // tab counts (from full list, before extra filter/sort)
  const counts = {
    all:      list.length,
    approved: list.filter(p => (p.progress ?? 0) >= 80).length,
    review:   list.filter(p => (p.progress ?? 0) >= 50 && (p.progress ?? 0) < 80).length,
    edit:     list.filter(p => (p.progress ?? 0) < 50).length,
  };

  const filterActive = filter !== "all";
  const sortActive   = sort !== "progress_desc";

  return (
    <div className="bg-white rounded-2xl border border-slate-100" dir="rtl">

      {/* ── header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-1 gap-2 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-slate-800">البرامج النشطة</h2>
        <div className="flex items-center gap-2" ref={menuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenu(m => m === "sort" ? null : "sort")}
              title="ترتيب"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition
                ${menu === "sort" || sortActive
                  ? "border-teal-400 text-teal-500"
                  : "border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500"}`}>
              <IcoSort size={15} />
            </button>
            {menu === "sort" && (
              <div className="absolute top-full left-0 mt-1.5 z-40 min-w-[180px] bg-white border border-slate-200 rounded-xl shadow-lg py-1" dir="rtl">
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
            <button
              type="button"
              onClick={() => setMenu(m => m === "filter" ? null : "filter")}
              title="فلترة"
              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition
                ${menu === "filter" || filterActive
                  ? "border-teal-400 text-teal-500"
                  : "border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500"}`}>
              <IcoFilter size={15} />
            </button>
            {menu === "filter" && (
              <div className="absolute top-full left-0 mt-1.5 z-40 min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-lg py-1" dir="rtl">
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

      {/* ── toolbar ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-0 gap-3 flex-wrap">

        {/* search + add */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="relative">
            <IcoSearch size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="بحث..."
              className="pr-8 pl-3 py-1.5 text-xs bg-white border border-slate-200
                rounded-xl w-32 focus:outline-none focus:border-teal-400
                transition placeholder:text-slate-400 text-slate-700" />
          </div>
          {hasPermission("programs.create") && <button
            onClick={onAddProgram}
            className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600
            text-white text-xs font-semibold px-4 py-2 rounded-xl
            transition shadow-sm shadow-teal-100 whitespace-nowrap">
            <IcoPlus size={13} /> إضافة
          </button>}
        </div>

        {/* tab filter */}
        <div className="flex items-center gap-0 flex-wrap">
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium
                  border-b-2 transition-all whitespace-nowrap
                  ${active
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                {tab.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center
                  ${active ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* active filter/sort chips */}
      {(filterActive || sortActive) && (
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-2 flex-wrap">
          {filterActive && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#EFF6FF", color: "#024677", border: "1px solid #BFDBFE" }}>
              {FILTERS.find(f => f.key === filter)?.label}
              <button type="button" onClick={() => setFilter("all")}
                className="hover:text-red-400 transition" aria-label="إزالة الفلتر">×</button>
            </span>
          )}
          {sortActive && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "#F0FDFA", color: "#0f766e", border: "1px solid #99F6E4" }}>
              {SORTS.find(s => s.key === sort)?.label}
              <button type="button" onClick={() => setSort("progress_desc")}
                className="hover:text-red-400 transition" aria-label="إعادة الترتيب">×</button>
            </span>
          )}
        </div>
      )}

      <div className="h-px bg-slate-100 mx-0 mt-2" />

      {/* ── desktop table ── */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="text-right text-xs font-semibold text-slate-500 px-6 py-3">اسم البرنامج</th>
              <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">المتدربين</th>
              <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">الجلسات</th>
              <th className="text-center text-xs font-semibold text-slate-500 px-4 py-3">الجلسات المتبقية</th>
              <th className="text-center text-xs font-semibold text-slate-500 px-6 py-3">التقدم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {visible.map((p, i) => (
              <tr key={p.id ?? i} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-6 py-3.5">
                  <span className="text-sm text-slate-700 group-hover:text-teal-600 transition-colors">
                    {p.name}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span className="text-sm text-slate-600 flex items-center justify-center gap-1">
                    {p.trainees} <IcoUsers />
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center text-sm text-slate-600">
                  {typeof p.sessions === "number" ? p.sessions : (parseSessionsCount(p) || p.sessions)}
                </td>
                <td className="px-4 py-3.5 text-center text-sm text-slate-600">{p.remaining}</td>
                <td className="px-6 py-3.5">
                  <div className="flex justify-center">
                    <ProgressRing value={p.progress} />
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">
                  {list.length === 0 ? "لا توجد برامج حتى الآن" : "لا توجد برامج مطابقة"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── mobile cards ── */}
      <div className="sm:hidden divide-y divide-slate-50 px-4">
        {visible.map((p, i) => (
          <div key={p.id ?? i} className="py-3.5 flex flex-col gap-2.5">
            <span className="text-sm text-slate-700 font-semibold">{p.name}</span>
            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1">
                <IcoUsers /> {p.trainees} متدرب
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1">
                {typeof p.sessions === "number" ? p.sessions : (parseSessionsCount(p) || p.sessions)} جلسة
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-1">
                {p.remaining} متبقية
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-slate-600">التقدم</span>
              <ProgressRing value={p.progress} />
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">لا توجد برامج مطابقة</div>
        )}
      </div>

      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-center gap-2 py-3">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              className="rounded-full transition-all"
              style={{
                width:      i === page ? 20 : 10,
                height:     10,
                background: i === page ? "#14b8a6" : "#cbd5e1",
              }}
              aria-label={`صفحة ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
