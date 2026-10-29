import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionRow, computeStatus } from "./SessionsPage";
import { fetchSessions } from "../../services/api";
import Pagination from "../Pagination";

// ── icons ─────────────────────────────────────────────────────────────────────
const I = ({ d, size = 14, stroke = "currentColor", sw = 2, fill = "none", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={cls}>{d}</svg>
);
const IcoCal    = () => <I d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoSearch = () => <I d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoSort   = () => <I d={<path d="M8 6h13M8 12h9M8 18h5"/>}/>;
const IcoFilter = () => <I d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>}/>;


// ── all sessions page (table + search + pagination) ───────────────────────────
export default function AllSessionsPage({ onViewSession }) {
  const navigate = useNavigate();
  const [search,   setSearch]   = useState("");
  const [pageNo,   setPageNo]   = useState(1);
  const [sessions, setSessions] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [loading,  setLoading]  = useState(true);

  const load = async (searchVal, p) => {
    setLoading(true);
    try {
      const res = await fetchSessions({ search: searchVal, page: p });
      const data = res.data?.all_sessions;
      setSessions((data?.data ?? []).map(s => ({
        id: s.id, title: s.title, program: s.program_name ?? "—",
        trainer: s.coach_name ?? "—", date: s.date,
        timeFrom: s.starts_at, timeTo: s.ends_at,
        trainees: s.trainees_count ?? 0,
        type: s.type,
        status: computeStatus(s),
        venue: s.location ?? null, hasRecording: !!s.video_url,
      })));
      setLastPage(data?.meta?.last_page ?? 1);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(search, pageNo); }, []);
  useEffect(() => {
    const t = setTimeout(() => { load(search, 1); setPageNo(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const pages = lastPage;

  return (
    <div className="w-full max-w-[1020px] mx-auto space-y-4">

      {/* header: title + search + add */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IcoCal />
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>إدارة الجلسات</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IcoSearch /></span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPageNo(1); }}
              placeholder="ابحث عن جلسة..."
              className="pr-9 pl-4 py-2 text-xs bg-white border border-slate-200 rounded-xl w-40 max-w-full focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400" />
          </div>
          <button onClick={() => navigate("/dashboard/add-session")}
            className="flex items-center justify-center gap-1.5 text-white text-xs font-bold h-[32px] px-4 rounded-lg transition hover:opacity-90"
            style={{ background: "#024677" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            إضافة جلسة جديدة
          </button>
        </div>
      </div>

      {/* table box */}
      <div className="rounded-lg border border-[#E6EDF2] p-3 space-y-2 !mt-10">

        {/* header row: inner title + sort + filter */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-bold" style={{ color: "#024677" }}>الجلسات القادمة</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 bg-white rounded-xl px-3 py-1.5 hover:bg-slate-50 transition">
              <IcoSort />ترتيب الجلسات
            </button>
            <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 bg-white rounded-xl px-3 py-1.5 hover:bg-slate-50 transition">
              <IcoFilter />فلترة الجلسات
            </button>
          </div>
        </div>

        {/* rows */}
        <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "420px" }}>
          {loading && (
            <div className="flex justify-center py-10">
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none"
                stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            </div>
          )}
          {!loading && sessions.map(s => <SessionRow key={s.id} session={s} onView={() => onViewSession?.(s)} />)}
          {!loading && sessions.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">لا توجد جلسات مطابقة</div>
          )}
        </div>

        {/* pagination */}
        {pages > 1 && (
          <Pagination
            page={pageNo}
            totalPages={pages}
            onChange={p => { setPageNo(p); load(search, p); }} />
        )}
      </div>
    </div>
  );
}
