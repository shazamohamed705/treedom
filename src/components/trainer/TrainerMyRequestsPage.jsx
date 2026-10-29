import { useState, useEffect } from "react";
import { fetchTrainerSessions } from "../../services/api";
import { computeStatus } from "../org/SessionsPage";

// ── icons ─────────────────────────────────────────────────────────────────────
const I = ({ d, size = 15, stroke = "currentColor", sw = 2, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoBriefcase = () => <I size={18} stroke="#14b8a6" d={<><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>}/>;
const IcoSearch    = () => <I d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoCalendar  = () => <I d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoClock     = () => <I d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const IcoUsers     = () => <I d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
const IcoVideo     = () => <I d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>;
const IcoPin       = () => <I d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;

// ── status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    live:     { label: "جارية الآن", color: "#16a34a", bg: "#f0fdf4" },
    upcoming: { label: "قادمة",      color: "#2563eb", bg: "#eff6ff" },
    ended:    { label: "منتهية",     color: "#64748b", bg: "#f8fafc" },
  };
  const s = map[status] || map.upcoming;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── type badge ────────────────────────────────────────────────────────────────
function TypeBadge({ session }) {
  const isOnline = session.delivery_mode === "online" || session.type?.delivery_mode === "online";
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg
      ${isOnline ? "text-[#0ea5e9] bg-[#e0f2fe]" : "text-[#f59e0b] bg-[#fef3c7]"}`}>
      {isOnline ? <IcoVideo /> : <IcoPin />}
      {isOnline ? "أونلاين" : "حضوري"}
    </span>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function TrainerMyRequestsPage({ onViewSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [tab,      setTab]      = useState("all");

  useEffect(() => {
    fetchTrainerSessions()
      .then(res => {
        const list = res?.data?.sessions?.data
                  ?? res?.data?.data
                  ?? res?.data
                  ?? [];
        setSessions(Array.isArray(list) ? list : []);
      })
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const TABS = [
    { key: "all",      label: "الكل"       },
    { key: "upcoming", label: "قادمة"       },
    { key: "live",     label: "جارية"       },
    { key: "ended",    label: "منتهية"      },
  ];

  const filtered = sessions.filter(s => {
    const st = computeStatus(s);
    const matchTab = tab === "all" || st === tab;
    const q = search.trim().toLowerCase();
    const matchSearch = !q ||
      (s.title || "").toLowerCase().includes(q) ||
      (s.program?.name || "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 px-4 sm:px-5 py-5 space-y-5" dir="rtl">
      <div className="w-full max-w-[1020px] mx-auto space-y-4">

        {/* header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <IcoBriefcase />
            <div>
              <h1 className="text-lg font-bold" style={{ color: "#024677" }}>جلساتي</h1>
              <p className="text-xs text-slate-400">جميع الجلسات المسندة إليك</p>
            </div>
          </div>
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن جلسة..."
              className="pr-9 pl-4 h-[34px] text-xs bg-white border border-slate-200 rounded-xl w-52 focus:outline-none focus:border-teal-400 transition"
            />
          </div>
        </div>

        {/* tabs */}
        <div className="flex w-fit rounded-xl p-1 gap-1" style={{ background: "#F2F5F8" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="min-w-[80px] whitespace-nowrap px-4 h-[32px] rounded-lg text-xs font-bold transition"
              style={tab === t.key
                ? { background: "#5AEACF", color: "#024677" }
                : { color: "#64748b" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <svg className="animate-spin" width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-sm text-slate-400">لا توجد جلسات مطابقة</p>
          ) : (
            <table className="w-full text-sm" dir="rtl" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#024677" }}>
                  {["الجلسة", "البرنامج", "النوع", "التاريخ", "الوقت", "المتدربون", "الحالة", ""].map(h => (
                    <th key={h} className="text-right text-xs font-bold text-white px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const st = computeStatus(s);
                  return (
                    <tr key={s.id}
                      className="hover:bg-slate-50 transition"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <td className="px-4 py-3 font-semibold text-slate-800 max-w-[160px] truncate">
                        {s.title}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[140px] truncate">
                        {s.program?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3"><TypeBadge session={s} /></td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{s.date}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap" dir="ltr">
                        {s.starts_at}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600 font-semibold">
                        {s.trainees_count ?? 0}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={st} /></td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onViewSession?.(s)}
                          className="text-xs font-semibold border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition whitespace-nowrap">
                          عرض
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}
