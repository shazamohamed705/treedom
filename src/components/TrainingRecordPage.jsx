import { useState, useMemo, useEffect } from "react";
import { fetchMyEnrollments, fetchMyProgress } from "../services/api";
import Pagination from "./Pagination";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 15, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoRecord  = () => <Ico size={18} stroke="#31AFEA" d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></>}/>;
const IcoSearch  = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoSort    = () => <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;
const IcoChev    = ({ dir="down" }) => <Ico size={12} d={dir==="down" ? <polyline points="6 9 12 15 18 9"/> : <polyline points="18 15 12 9 6 15"/>}/>;
const IcoArrow   = () => <Ico size={12} d={<polyline points="9 18 15 12 9 6"/>}/>;
const IcoCert    = () => <Ico size={13} stroke="#024677" d={<><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></>}/>;
const IcoX       = () => <Ico size={18} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}/>;
const IcoDownload= () => <Ico size={15} stroke="#fff" d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const IcoShare   = () => <Ico size={15} d={<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}/>;

// ── certificate modal ─────────────────────────────────────────────────────────
function CertModal({ row, onClose }) {
  if (!row) return null;
  const prog = row.program?.name ?? row.program_name ?? row.program ?? "";
  const trainer = row.trainer?.name ?? row.trainer_name ?? "";
  const endDate = row.end_date ?? row.endDate ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 overflow-hidden"
        dir="rtl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold" style={{ color:"#31AFEA" }}>شهادة الإتمام</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
            <IcoX/>
          </button>
        </div>

        <div className="mx-5 mt-5 rounded-xl overflow-hidden"
          style={{ height:200, background:"linear-gradient(135deg,#0a1628 0%,#1a2a4a 60%,#0d3a5c 100%)" }}>
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 relative">
            <div className="absolute top-0 right-0 w-1.5 h-full" style={{ background:"linear-gradient(180deg,#E2BF34,#a07c10)" }}/>
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ background:"linear-gradient(180deg,#E2BF34,#a07c10)" }}/>
            <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center mb-1"
              style={{ borderColor:"#E2BF34", background:"rgba(226,191,52,0.15)" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E2BF34" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2l2.4 5.4 5.7.6-4.2 4 1.1 5.6-5-2.9-5 2.9 1.1-5.6-4.2-4 5.7-.6z"/>
              </svg>
            </div>
            <p className="text-white font-serif text-xl font-bold tracking-wide">Certificate</p>
            <p className="text-white/70 text-[11px] text-center px-8">Presented in appreciation of<br/>outstanding performance by</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-3 border-b border-slate-100">
          <p className="text-[12px] text-slate-500 text-center">
            تشهد منصة <span className="font-bold text-slate-700">Treedom</span> بأن المتدرب قد أتم بنجاح برنامج
          </p>
          <p className="text-[18px] font-extrabold text-slate-800 text-center">{prog}</p>
          {trainer && (
            <p className="text-[12px] text-slate-600 text-center">
              المقدَّم من المدرب <span className="font-bold text-slate-800">{trainer}</span>
              {endDate && <> بتاريخ <span className="font-bold text-slate-800">{endDate}</span></>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 mx-5 my-4">
          {[
            { value:`${row.progress ?? 100}%`,             label:"النسبة"   },
            { value:`${row.total_duration_hours ?? "—"} ساعة`, label:"المدة" },
            { value:`${row.total_sessions ?? "—"} جلسة`,   label:"الجلسات" },
          ].map((s,i) => (
            <div key={i} className="flex-1 flex flex-col items-center py-3 gap-0.5 rounded-xl"
              style={{ background:"#F7F9FA" }}>
              <span className="text-[14px] font-extrabold text-slate-800">{s.value}</span>
              <span className="text-[10px] text-slate-400">{s.label}</span>
            </div>
          ))}
        </div>

        {row.accreditation_number && (
          <div className="flex items-center justify-between px-5 pb-3 text-[10px] text-slate-400">
            <span style={{ color:"#31AFEA", fontWeight:600 }}>{row.accreditation_number}</span>
            <span>رقم الاعتماد</span>
          </div>
        )}

        <div className="flex items-center gap-3 px-5 pb-5">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition"
            style={{ background:"#024677" }}>
            <IcoDownload/>
            تحميل PDF
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <IcoShare/>
            مشاركة
          </button>
        </div>
      </div>
    </div>
  );
}

// ── details modal (live API) ───────────────────────────────────────────────────
function DetailsModal({ row, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!row) return;
    setData(null);
    setError(null);
    setLoading(true);
    // program_id comes from the enrollment object
    const pid = row.program_id ?? row.program?.id ?? row.id;
    fetchMyProgress(pid)
      .then(res => setData(res?.data ?? null))
      .catch(err => setError(err?.message || "حدث خطأ أثناء التحميل"))
      .finally(() => setLoading(false));
  }, [row]);

  if (!row) return null;

  const progress = data?.overall_progress_percent ?? 0;
  const barColor = progress >= 100 ? "#22c55e" : progress >= 50 ? "#f59e0b" : "#94a3b8";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:"rgba(0,0,0,0.45)", backdropFilter:"blur(2px)" }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] mx-4 overflow-hidden"
        dir="rtl" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-[15px] font-bold text-slate-800">تفاصيل التقدم</h2>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition">
            <IcoX/>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-14">
            <div className="w-7 h-7 rounded-full border-2 border-[#31AFEA] border-t-transparent animate-spin"/>
          </div>
        )}

        {!loading && error && (
          <div className="px-5 py-8 text-center text-[13px] text-red-400">{error}</div>
        )}

        {!loading && data && (
          <div className="px-5 pt-5 pb-2 space-y-4">
            {/* program info */}
            <div className="rounded-xl p-4 space-y-2" style={{ background:"#F7F9FA" }}>
              <p className="text-[15px] font-extrabold text-slate-800">{data.program_name}</p>
              {data.trainer && (
                <p className="text-[12px] text-slate-400">{data.trainer.label}</p>
              )}
              <div className="flex items-center justify-between text-[12px] text-slate-500 mt-1">
                <span className="font-bold" style={{ color: barColor }}>{progress}%</span>
                <span>التقدم الكلي</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width:`${progress}%`, background: barColor }}/>
              </div>
            </div>

            {/* stats */}
            <div className="flex items-center gap-2">
              {[
                { value: data.completion_ratio ?? "—",              label:"مكتملة"        },
                { value: `${data.total_duration_hours ?? 0} ساعة`,  label:"المدة الكلية"  },
                { value: String(data.total_sessions ?? 0),           label:"إجمالي الجلسات"},
              ].map((s,i) => (
                <div key={i} className="flex-1 flex flex-col items-center py-3 gap-0.5 rounded-xl"
                  style={{ background:"#F7F9FA" }}>
                  <span className="text-[15px] font-extrabold text-slate-800">{s.value}</span>
                  <span className="text-[10px] text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* units */}
            {data.units?.length > 0 && (
              <div>
                <p className="text-[13px] font-bold text-slate-800 mb-2">الوحدات التدريبية</p>
                <div className="space-y-2">
                  {data.units.map((u) => {
                    const hrs = Math.floor((u.duration_minutes ?? 0) / 60);
                    const min = (u.duration_minutes ?? 0) % 60;
                    const dur = [hrs > 0 ? `${hrs} س` : "", min > 0 ? `${min} د` : ""].filter(Boolean).join(" ");
                    return (
                      <div key={u.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-100">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[13px] text-slate-700">{u.title}</span>
                          {dur && <span className="text-[10px] text-slate-400">{dur}</span>}
                        </div>
                        {u.is_completed ? (
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                            style={{ background:"#024677" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                              stroke="#fff" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background:"#fef3c7", color:"#f59e0b" }}>
                            {typeof u.status_label === "object" ? (u.status_label?.text ?? u.status_label?.value ?? "—") : (u.status_label ?? "—")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* accreditation */}
            <div className="flex items-center justify-between text-[11px] border-t border-slate-100 pt-3 pb-1">
              <span className="font-semibold" style={{ color:"#31AFEA" }}>
                {data.accreditation_number ?? "--"}
              </span>
              <span className="text-slate-400">
                {data.accreditation_note ?? "رقم الاعتماد"}
              </span>
            </div>
          </div>
        )}

        <div className="px-5 pb-5 pt-3">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-[14px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function MiniBar({ value }) {
  const color = value >= 100 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#94a3b8";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width:`${value}%`, background:color }}/>
      </div>
      <span className="text-[11px] font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    completed:  { label:"مكتمل",     color:"#16a34a", bg:"#dcfce7" },
    incomplete: { label:"غير مكتمل", color:"#f59e0b", bg:"#fef3c7" },
    enrolled:   { label:"مسجل",      color:"#31AFEA", bg:"#e0f2fe" },
  };
  const c = cfg[status] ?? cfg.enrolled;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
      style={{ background:c.bg, color:c.color }}>
      {c.label}
    </span>
  );
}

// ── sort dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value:"newest",   label:"الأحدث أولاً"  },
  { value:"oldest",   label:"الأقدم أولاً"  },
  { value:"progress", label:"الأعلى تقدماً" },
  { value:"name",     label:"الاسم"          },
];

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = SORT_OPTS.find(o => o.value === value);
  return (
    <div className="relative" dir="rtl">
      <button onClick={() => setOpen(o=>!o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 font-medium hover:border-[#31AFEA] transition whitespace-nowrap">
        <IcoSort/>
        {sel?.label}
        <IcoChev dir={open?"up":"down"}/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[150px] overflow-hidden">
          {SORT_OPTS.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-right px-3 py-2 text-[11px] hover:bg-slate-50 transition
                ${value===o.value ? "text-[#31AFEA] font-bold" : "text-slate-600"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── normalize enrollment → display row ───────────────────────────────────────
function normalizeEnrollment(e) {
  // API may return different shapes; handle both
  const prog        = e.program ?? {};
  const progName    = prog.name ?? prog.name_ar ?? e.program_name ?? "—";
  const programId   = prog.id   ?? e.program_id  ?? e.id;
  const progress    = e.progress ?? e.overall_progress_percent ?? e.progress_percent ?? 0;
  const isCompleted = progress >= 100 || e.status === "completed" || e.is_completed;
  const status      = isCompleted ? "completed" : progress > 0 ? "incomplete" : "enrolled";
  const endDate     = e.end_date ?? e.completed_at ?? e.enrollment_end_date ?? null;
  const hasCert     = isCompleted && (e.has_certificate ?? e.certificate_issued ?? true);

  return {
    _raw:        e,
    id:          e.id ?? programId,
    program_id:  programId,
    program:     progName,
    progress:    Number(progress),
    status,
    endDate:     endDate ?? (isCompleted ? "مكتمل" : "—"),
    cert:        hasCert,
    // extras for CertModal
    trainer:     prog.trainer ?? e.trainer ?? null,
    program_name: progName,
    total_duration_hours: prog.hours_count ?? e.total_duration_hours ?? null,
    total_sessions:       prog.sessions_count ?? e.total_sessions ?? null,
    accreditation_number: e.accreditation_number ?? null,
  };
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function TrainingRecordPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [sort,        setSort]        = useState("newest");
  const [certRow,     setCertRow]     = useState(null);
  const [detailRow,   setDetailRow]   = useState(null);
  const [page,        setPage]        = useState(1);

  const PER_PAGE = 6;

  // ── fetch enrollments on mount ──────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchMyEnrollments({ per_page: 100 })
      .then(res => {
        // shape: { data: { data: [...] } } or { data: [...] }
        const raw = res?.data?.data ?? res?.data ?? [];
        setEnrollments(Array.isArray(raw) ? raw.map(normalizeEnrollment) : []);
      })
      .catch(err => setError(err?.message || "تعذّر تحميل السجل التدريبي"))
      .finally(() => setLoading(false));
  }, []);

  // ── filter + sort ───────────────────────────────────────────────────────────
  const list = useMemo(() => {
    let r = [...enrollments];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(x => x.program.toLowerCase().includes(q));
    }
    if (sort === "oldest")   r.sort((a,b) => a.id - b.id);
    if (sort === "newest")   r.sort((a,b) => b.id - a.id);
    if (sort === "progress") r.sort((a,b) => b.progress - a.progress);
    if (sort === "name")     r.sort((a,b) => a.program.localeCompare(b.program));
    return r;
  }, [enrollments, search, sort]);

  const totalPages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const pageItems  = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="flex-1 overflow-y-auto min-h-0" dir="rtl">
      <CertModal    row={certRow}   onClose={() => setCertRow(null)}/>
      <DetailsModal row={detailRow} onClose={() => setDetailRow(null)}/>

      <div className="w-full px-3 sm:px-8 py-6">
        <div className="rounded-2xl border border-slate-200 p-3 sm:p-6">

          {/* header */}
          <div className="flex items-center gap-2 mb-6">
            <IcoRecord/>
            <h1 className="text-[18px] font-bold" style={{ color:"#31AFEA" }}>سجلي التدريبي</h1>
          </div>

          {/* toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <IcoSearch/>
              </span>
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="ابحث في سجلك التدريبي..."
                className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-700 placeholder-slate-400 outline-none focus:border-[#31AFEA] transition text-right"
              />
            </div>
            <SortDropdown value={sort} onChange={v => { setSort(v); setPage(1); }}/>
          </div>

          {/* loading state */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#31AFEA] border-t-transparent animate-spin"/>
            </div>
          )}

          {/* error state */}
          {!loading && error && (
            <div className="py-12 text-center text-[13px] text-red-400">{error}</div>
          )}

          {/* table */}
          {!loading && !error && (
            <>
              <div className="rounded-2xl border border-slate-200 overflow-x-auto"
                style={{ boxShadow:"0 2px 12px rgba(8,15,52,0.05)" }}>
                <table className="w-full border-collapse min-w-[680px]">
                  <thead>
                    <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                      <th className="text-right px-5 py-3.5 text-[12px] font-bold text-slate-500 w-[35%]">البرنامج</th>
                      <th className="text-center px-4 py-3.5 text-[12px] font-bold text-slate-500 w-[15%]">الحالة</th>
                      <th className="text-center px-4 py-3.5 text-[12px] font-bold text-slate-500 w-[20%]">التقدم</th>
                      <th className="text-center px-4 py-3.5 text-[12px] font-bold text-slate-500 w-[18%]">تاريخ الانتهاء</th>
                      <th className="text-center px-4 py-3.5 text-[12px] font-bold text-slate-500 w-[12%]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((row, i) => (
                      <tr key={row.id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        style={{ background: i % 2 === 0 ? "#fff" : "#fafbfc" }}>

                        <td className="px-5 py-3.5 text-right">
                          <span className="text-[13px] font-semibold text-slate-700">{row.program}</span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <StatusBadge status={row.status}/>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex justify-center">
                            <MiniBar value={row.progress}/>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          <span className="text-[12px] text-slate-500">{row.endDate}</span>
                        </td>

                        <td className="px-4 py-3.5 text-center">
                          {row.cert ? (
                            <button onClick={() => setCertRow(row)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-70 transition"
                              style={{ color:"#024677" }}>
                              <IcoCert/>
                              عرض الشهادة
                              <IcoArrow/>
                            </button>
                          ) : (
                            <button onClick={() => setDetailRow(row)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold hover:opacity-70 transition"
                              style={{ color:"#f59e0b" }}>
                              عرض التفاصيل
                              <IcoArrow/>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {list.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 text-[13px]">
                          لا توجد نتائج
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-5 text-[12px] text-slate-400">
                <span>{list.length} سجل</span>
                <Pagination page={page} totalPages={totalPages} accent="#31AFEA" onChange={setPage}/>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
