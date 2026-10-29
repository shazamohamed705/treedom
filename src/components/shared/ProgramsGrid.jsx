import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchPrograms } from "../../services/api";
import { contentTypeUiKey } from "../../services/sessionType";
import Pagination from "./Pagination";

// ── normalise raw API program ─────────────────────────────────────────────────
function normalise(p) {
  return {
    id:              p.id,
    name:            p.name?.ar ?? p.name ?? "—",
    description:     p.description?.ar ?? p.description ?? "",
    status:          p.status ?? 0,
    statusKey:       (() => {
      const s = p.status ?? 0;
      if (s === 2) return "approved";
      if (s === 1) return "review";
      if (s === 3) return "rejected";
      return "draft";
    })(),
    statusText:      p.status_text ?? p.status_label?.text ?? p.activity_status?.text ?? "—",
    coach:           p.trainer?.name ?? p.coach?.name ?? "—",
    coachAvatar:     (p.trainer?.name ?? p.coach?.name ?? "م").charAt(0),
    trainees:        p.trainees_count ?? 0,
    sessions:        p.sessions_count_planned ?? p.sessions_count ?? 0,
    weeks:           p.weeks ?? Math.ceil((p.sessions_count_planned ?? p.sessions_count ?? 0) / 2),
    remaining:       p.remaining_sessions_count ?? 0,
    progress:        p.progress_percent ?? 0,
    startDate:       p.start_date ?? "",
    endDate:         p.end_date ?? "",
    createdAt:       p.created_at ?? p.start_date ?? "",
    field:           p.field?.name ?? p.category?.name ?? "",
    price:           p.price_amount ?? "",
    currency:        p.currency ?? "SAR",
    contentType:     p.content_type?.text ?? "",
    contentTypeKey:  contentTypeUiKey(p.content_type?.value) || p.content_type?.value || "",
    rejectionReason: p.rejection_reason ?? "",
    rating:          p.rating ?? null,
    programState:    p.progress_percent === 100 ? "مكتمل" : (p.status === 2 ? "نشط" : null),
  };
}

// ── mock fallback ─────────────────────────────────────────────────────────────
const MOCK_PROGRAMS = [
  { id:"m1", name:"برنامج القيادة الإدارية المتقدمة",   description:"تطوير مهارات القيادة والإدارة",          status:2, statusKey:"approved", statusText:"معتمد",        coach:"م. أحمد الزهراني",  coachAvatar:"أ", trainees:35, sessions:12, weeks:6, remaining:2,  progress:86,  startDate:"2025-01-10", endDate:"2025-07-10", field:"إدارة وقيادة",  price:"1500", currency:"SAR", contentType:"أونلاين",    contentTypeKey:"interactive", rejectionReason:"", rating:4.7, programState:"نشط"   },
  { id:"m2", name:"برنامج إدارة المشاريع الاحترافية",   description:"أساليب وأدوات إدارة المشاريع",           status:2, statusKey:"approved", statusText:"معتمد",        coach:"م. سارة القحطاني",  coachAvatar:"س", trainees:22, sessions:10, weeks:5, remaining:4,  progress:65,  startDate:"2025-02-01", endDate:"2025-08-01", field:"إدارة مشاريع", price:"1200", currency:"SAR", contentType:"حضوري",      contentTypeKey:"offline",     rejectionReason:"", rating:4.5, programState:"نشط"   },
  { id:"m3", name:"برنامج الذكاء الاصطناعي للمديرين",  description:"تطبيقات الذكاء الاصطناعي في الأعمال",    status:1, statusKey:"review",   statusText:"قيد المراجعة", coach:"م. فيصل العتيبي",   coachAvatar:"ف", trainees:0,  sessions:8,  weeks:4, remaining:8,  progress:0,   startDate:"2025-03-15", endDate:"2025-09-15", field:"تقنية",         price:"1800", currency:"SAR", contentType:"أونلاين",    contentTypeKey:"interactive", rejectionReason:"", rating:null, programState:null   },
  { id:"m4", name:"برنامج التطوير الذاتي والنجاح",     description:"مهارات شخصية وتطوير الذات",              status:2, statusKey:"approved", statusText:"معتمد",        coach:"م. نورة الحارثي",   coachAvatar:"ن", trainees:18, sessions:8,  weeks:4, remaining:0,  progress:100, startDate:"2024-10-01", endDate:"2025-02-01", field:"تطوير ذاتي",   price:"900",  currency:"SAR", contentType:"كورس مسجل",  contentTypeKey:"recorded",    rejectionReason:"", rating:4.9, programState:"مكتمل" },
  { id:"m5", name:"برنامج ريادة الأعمال",               description:"مهارات ريادة الأعمال والابتكار",         status:3, statusKey:"rejected",  statusText:"مرفوض",        coach:"م. خالد السبيعي",   coachAvatar:"خ", trainees:27, sessions:9,  weeks:5, remaining:9,  progress:0,   startDate:"2025-01-20", endDate:"2025-06-20", field:"ريادة أعمال",   price:"1100", currency:"SAR", contentType:"",           contentTypeKey:"",             rejectionReason:"المحتوى يحتاج مراجعة", rating:null, programState:null },
  { id:"m6", name:"برنامج التواصل الفعّال",             description:"مهارات الاتصال والتفاوض",               status:1, statusKey:"review",   statusText:"قيد المراجعة", coach:"م. منى العبدالله",  coachAvatar:"م", trainees:14, sessions:6,  weeks:3, remaining:3,  progress:45,  startDate:"2025-04-01", endDate:"2025-07-01", field:"تواصل",         price:"800",  currency:"SAR", contentType:"جلسات تفاعلية", contentTypeKey:"interactive", rejectionReason:"", rating:null, programState:null },
];

// ── status config ─────────────────────────────────────────────────────────────
const STATUS = {
  approved: {
    label: "معتمد",         color: "#16a34a", bg: "#f0fdf4",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  review: {
    label: "قيد المراجعة", color: "#64748b", bg: "#f8fafc",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  },
  rejected: {
    label: "مرفوض",         color: "#dc2626", bg: "#fef2f2",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  },
  draft: {
    label: "مسودة",         color: "#64748b", bg: "#f8fafc",
    icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
};

// ── content type config ───────────────────────────────────────────────────────
const TYPE = {
  recorded:    { label: "كورس مسجل",       color: "#64748b", bg: "#f1f5f9", icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
  offline:     { label: "حضوري",            color: "#64748b", bg: "#f1f5f9", icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
  interactive: { label: "جلسات تفاعلية",   color: "#7c3aed", bg: "#ede9fe", icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
};

const STATE_COLOR = { "نشط": "#16a34a", "مكتمل": "#2563eb" };

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoGrad() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IcoSort() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="15" y2="12"/><line x1="8" y1="18" x2="11" y2="18"/>
    </svg>
  );
}
function IcoGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function IcoList() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  );
}
function IcoFilter() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcoCal() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IcoClock() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function IcoTrend() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
}
function IcoUsers() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function IcoStar() {
  return <svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24"
      fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

// ── progress bar ──────────────────────────────────────────────────────────────
function Bar({ value }) {
  const bg = value >= 80 ? "#14b8a6" : value >= 50 ? "#3b82f6" : "#f59e0b";
  return (
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: bg }}/>
    </div>
  );
}

// ── program card ──────────────────────────────────────────────────────────────
function ProgramCard({ program: p, onEdit, layout = "grid" }) {
  const st  = STATUS[p.statusKey] ?? STATUS.draft;
  const typ = p.contentTypeKey ? TYPE[p.contentTypeKey] : null;

  if (layout === "list") {
    return (
      <div
        className="rounded-2xl border border-slate-200 hover:shadow-md transition-shadow"
        style={{ background: "#F2F5F86B" }}
        dir="rtl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4 py-4">
          {/* main info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: st.color }}>
                {st.icon}{st.label}
              </span>
              {typ && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md"
                  style={{ background: typ.bg, color: typ.color }}>
                  {typ.icon}{typ.label}
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold leading-snug" style={{ color: "#024677" }}>{p.name}</h3>
            {p.description && (
              <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
            )}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: "#E8F4FB", color: "#024677" }}>
                {p.coachAvatar}
              </div>
              <span className="text-[11px] text-slate-500">{p.coach}</span>
            </div>
          </div>

          {/* meta */}
          <div className="flex flex-wrap sm:flex-col gap-x-3 gap-y-1 text-[11px] text-slate-500 sm:items-end shrink-0">
            {p.startDate && (
              <div className="flex items-center gap-1.5"><IcoCal /><span>{p.startDate}</span></div>
            )}
            <div className="flex items-center gap-1.5">
              <IcoClock />
              <span>{p.sessions} جلسة{p.weeks ? ` · ${p.weeks} أسابيع` : ""}</span>
            </div>
            {p.trainees > 0 && (
              <div className="flex items-center gap-1.5">
                <IcoUsers /><span>{p.trainees} متدرب</span>
              </div>
            )}
            {p.progress > 0 && (
              <div className="flex items-center gap-1.5">
                <Bar value={p.progress} />
                <span className="font-semibold text-slate-600">{p.progress}%</span>
              </div>
            )}
          </div>

          {/* action */}
          <button
            onClick={() => onEdit?.(p)}
            className="h-9 px-4 rounded-xl text-xs font-semibold text-white transition hover:opacity-90 shrink-0 self-start sm:self-center"
            style={{ background: "#024677" }}>
            {p.statusKey === "rejected" ? "عرض سبب الرفض" : "عرض البرنامج"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-slate-200 hover:shadow-md transition-shadow flex flex-col"
      style={{ background: "#F2F5F86B" }}
      dir="rtl"
    >
      <div className="flex flex-col flex-1 px-4 pt-4 pb-3 gap-2">

        {/* badges row */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: st.color }}>
            {st.icon}{st.label}
          </span>
          {typ && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-md"
              style={{ background: typ.bg, color: typ.color }}>
              {typ.icon}{typ.label}
            </span>
          )}
        </div>

        {/* title */}
        <h3 className="text-sm font-bold leading-snug" style={{ color: "#024677" }}>{p.name}</h3>

        {/* description */}
        {p.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
        )}

        {/* coach */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: "#E8F4FB", color: "#024677" }}>
            {p.coachAvatar}
          </div>
          <span className="text-[11px] text-slate-500">{p.coach}</span>
        </div>

        {/* meta */}
        <div className="flex flex-col sm:flex-row sm:gap-4 gap-2 mt-1">
          <div className="flex-1 space-y-1.5 text-[11px] text-slate-500">
            {p.startDate && (
              <div className="flex items-center gap-1.5"><IcoCal /><span>تاريخ البدء: {p.startDate}</span></div>
            )}
            <div className="flex items-center gap-1.5">
              <IcoClock />
              <span>المدة: {p.sessions} جلسة{p.weeks ? ` — ${p.weeks} أسابيع` : ""}</span>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 text-[11px] text-slate-500">
            {p.programState && (
              <div className="flex items-center gap-1.5">
                <IcoTrend />
                <span>حالة البرنامج: </span>
                <span className="font-semibold" style={{ color: STATE_COLOR[p.programState] }}>{p.programState}</span>
              </div>
            )}
            {p.progress > 0 && (
              <div className="flex items-center gap-1.5">
                <IcoTrend />
                <span className="shrink-0">التقدم:</span>
                <Bar value={p.progress} />
                <span className="shrink-0 font-semibold text-slate-600">{p.progress}%</span>
              </div>
            )}
            {p.programState && p.remaining > 0 && (
              <div className="flex items-center gap-1.5">
                <span>الجلسات المتبقية: {p.remaining} جلسة</span>
              </div>
            )}
            {p.trainees > 0 && (
              <div className="flex items-center gap-1.5">
                <IcoUsers />
                <span>{p.trainees} متدرب</span>
                {p.rating && (
                  <span className="flex items-center gap-0.5 mr-1">
                    <IcoStar /><span className="text-amber-500 font-semibold">{p.rating}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* rejection reason */}
        {p.statusKey === "rejected" && p.rejectionReason && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-1">
            <p className="text-[11px] text-red-500 font-semibold">سبب الرفض</p>
            <p className="text-[11px] text-red-600 mt-0.5">{p.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* footer button */}
      <div className="px-3 pb-3 pt-1">
        <button
          onClick={() => onEdit?.(p)}
          className="w-full h-9 rounded-xl text-xs font-semibold text-white transition hover:opacity-90"
          style={{ background: "#024677" }}>
          {p.statusKey === "rejected" ? "عرض سبب الرفض" : "عرض البرنامج"}
        </button>
      </div>
    </div>
  );
}

// ── tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: "all",      label: "الكل"           },
  { key: "approved", label: "معتمدة"         },
  { key: "review",   label: "قيد المراجعة"   },
  { key: "rejected", label: "مرفوضة"         },
  { key: "draft",    label: "مسودة"           },
];

// ── API tab → status param ────────────────────────────────────────────────────
const TAB_STATUS = { all: "", approved: "2", review: "1", rejected: "3", draft: "0" };

// ── main ──────────────────────────────────────────────────────────────────────
export default function ProgramsGrid({ onAddProgram, onEditProgram }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search,    setSearch]    = useState("");
  const [programs,  setPrograms]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page,      setPage]      = useState(1);
  const [view,      setView]      = useState("grid");   // grid | list
  const [sortBy,    setSortBy]    = useState("recent"); // recent | name | trainees
  const [tabCounts, setTabCounts] = useState({});       // { all: N, approved: N, ... }

  // fetch total count for each tab without loading all records
  const loadCounts = useCallback((q) => {
    const tabKeys = ["all", "approved", "review", "rejected", "draft"];
    Promise.all(
      tabKeys.map(tab => {
        const params = { page: 1, per_page: 1, search: q ?? "" };
        if (TAB_STATUS[tab]) params.status = TAB_STATUS[tab];
        return fetchPrograms(params)
          .then(res => {
            const paginObj = res?.data?.pagination ?? null;
            return [tab, paginObj?.total_items ?? paginObj?.total ?? null];
          })
          .catch(() => [tab, null]);
      })
    ).then(results => {
      setTabCounts(Object.fromEntries(results));
    });
  }, []);

  const load = useCallback((tab, q, p) => {
    setLoading(true);
    const params = { page: p, per_page: 12, search: q ?? "" };
    if (TAB_STATUS[tab]) params.status = TAB_STATUS[tab];
    params.search = q ?? "";

    fetchPrograms(params)
      .then(res => {
        // request() returns the parsed JSON directly (not wrapped in .data)
        // shape: { status, message, data: { programs: [...], pagination: {...} } }
        const inner    = res?.data ?? {};
        const list     = inner?.programs ?? (Array.isArray(inner) ? inner : []);
        const paginObj = inner?.pagination ?? null;

        setPrograms(list.map(normalise));

        if (paginObj) {
          setPagination({
            current_page: paginObj.current_page,
            total_pages:  paginObj.total_pages,
          });
        } else {
          setPagination(null);
        }
      })
      .catch(() => {
        setPrograms(MOCK_PROGRAMS);
        setPagination(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(activeTab, search, 1); setPage(1); }, [activeTab]);
  useEffect(() => { loadCounts(""); }, []);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearch(q);
    setPage(1);
    load(activeTab, q, 1);
    loadCounts(q);
  };

  // count from API (accurate totals per tab, not just current page)
  const counts = {
    all:      tabCounts.all      ?? programs.length,
    approved: tabCounts.approved ?? programs.filter(p => p.statusKey === "approved").length,
    review:   tabCounts.review   ?? programs.filter(p => p.statusKey === "review").length,
    rejected: tabCounts.rejected ?? programs.filter(p => p.statusKey === "rejected").length,
    draft:    tabCounts.draft    ?? programs.filter(p => p.statusKey === "draft").length,
  };

  // ── sorting ──
  const SORTS = [
    { key: "recent",  label: "الأحدث",        fn: (a, b) => (b.createdAt || "").localeCompare(a.createdAt || "") },
    { key: "name",    label: "الاسم",         fn: (a, b) => a.name.localeCompare(b.name, "ar") },
    { key: "trainees",label: "الأكثر تسجيلًا", fn: (a, b) => (b.trainees ?? 0) - (a.trainees ?? 0) },
  ];
  const activeSort = SORTS.find(s => s.key === sortBy) ?? SORTS[0];
  const sorted = useMemo(() => [...programs].sort(activeSort.fn), [programs, sortBy]);

  const cycleSort = () => {
    const idx = SORTS.findIndex(s => s.key === sortBy);
    setSortBy(SORTS[(idx + 1) % SORTS.length].key);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white p-4 sm:p-5" dir="rtl">

      {/* ── header ── */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IcoGrad />
          <h1 className="text-xl font-bold text-slate-800">البرامج التدريبية</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch />
            </span>
            <input
              type="search"
              value={search}
              onChange={handleSearch}
              placeholder="ابحث عن برنامج..."
              className="pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl
                w-36 sm:w-44 focus:outline-none focus:border-teal-400 transition
                placeholder:text-slate-400 text-slate-700"
            />
          </div>

          {/* toolbar: sort + view toggle */}
          <button
            type="button"
            onClick={cycleSort}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-teal-400 transition text-[11px] font-semibold"
          >
            <IcoSort />
            <span className="hidden sm:inline">{activeSort.label}</span>
          </button>

          <button
            type="button"
            onClick={() => setView("grid")}
            title="عرض شبكة"
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition"
            style={view === "grid"
              ? { background: "#14b8a6", borderColor: "#14b8a6", color: "#fff" }
              : { background: "#fff", borderColor: "#e2e8f0", color: "#94a3b8" }}>
            <IcoGrid />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            title="عرض قائمة"
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition"
            style={view === "list"
              ? { background: "#14b8a6", borderColor: "#14b8a6", color: "#fff" }
              : { background: "#fff", borderColor: "#e2e8f0", color: "#94a3b8" }}>
            <IcoList />
          </button>

          {/* add program */}
          <button
            onClick={onAddProgram}
            className="flex items-center gap-1.5 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl transition hover:opacity-90 whitespace-nowrap"
            style={{ background: "#024677" }}>
            <IcoPlus /> <span className="hidden xs:inline">إضافة برنامج جديد</span><span className="xs:hidden">إضافة</span>
          </button>
        </div>
      </div>

      {/* ── tabs ── */}
      <div className="mb-5 overflow-x-auto scrollbar-none">
        <div className="inline-flex border border-slate-200 rounded-xl divide-x divide-x-reverse divide-slate-200 overflow-hidden">
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5
                  text-xs font-semibold transition-all whitespace-nowrap"
                style={active
                  ? { background: "#14b8a6", color: "#fff" }
                  : { background: "#fff",    color: "#475569" }}>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={active
                    ? { background: "rgba(255,255,255,.25)", color: "#fff" }
                    : { background: "#f1f5f9",               color: "#64748b" }}>
                  {counts[tab.key] ?? 0}
                </span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <IcoSpinner />
        </div>
      ) : (
        <>
          <div className={view === "list"
            ? "flex flex-col gap-3"
            : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
            {sorted.map(p => (
              <ProgramCard key={p.id} program={p} layout={view} onEdit={() => onEditProgram?.(p)} />
            ))}
            {sorted.length === 0 && (
              <div className={view === "list" ? "text-center py-16 text-slate-400 text-sm" : "col-span-full text-center py-16 text-slate-400 text-sm"}>
                لا توجد برامج
              </div>
            )}
          </div>

          {/* pagination */}
          {pagination && pagination.total_pages > 1 && (
            <Pagination
              page={page}
              totalPages={pagination.total_pages}
              onChange={p => { setPage(p); load(activeTab, search, p); }} />
          )}
        </>
      )}
    </main>
  );
}
