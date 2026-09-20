import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProgram, fetchSessions } from "../services/api";
import Pagination from "./Pagination";

// ── program status map ────────────────────────────────────────────────────────
const PROGRAM_STATUS = {
  0: { label: "مسودة",        bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" },
  1: { label: "قيد المراجعة", bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  2: { label: "معتمد",        bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  3: { label: "مرفوض",        bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

// ── default fallback program ──────────────────────────────────────────────────
const DEFAULT_PROGRAM = {
  name: "", description: "",
  trainer: {}, trainees_count: 0,
  remaining_sessions_count: 0, progress_percent: 0,
  sessions_count_planned: 0, hours_count: 0,
  start_date: "", end_date: "",
  price_amount: "", currency: "SAR",
  content_type: null, field: null, category: null,
  keywords: [], sessions: [], status: 0,
};

// ── session status helper ─────────────────────────────────────────────────────
export function computeStatus(s) {
  if (s.status === "running" || s.is_live) return "live";
  if (s.status === "ended") return "ended";
  try {
    const now = new Date();
    if (!s.date || !s.starts_at) return "upcoming";
    const start = new Date(`${s.date}T${s.starts_at}`);
    const end   = s.ends_at ? new Date(`${s.date}T${s.ends_at}`) : null;
    if (end && now > end)  return "ended";
    if (now >= start)      return "live";
  } catch { /* noop */ }
  return "upcoming";
}

function normaliseSession(s) {
  return {
    id: s.id, title: s.title,
    program:      s.program_name   ?? "—",
    trainer:      s.coach_name     ?? "—",
    date:         s.date,
    timeFrom:     s.starts_at,
    timeTo:       s.ends_at,
    trainees:     s.trainees_count ?? 0,
    type:         s.type,
    status:       computeStatus(s),
    venue:        s.location       ?? null,
    hasRecording: !!s.video_url,
    meetingUrl:   s.meeting_url    ?? null,
    canStart:     s.can_start,
    isLive:       s.is_live,
    coachId:      s.coach_id       ?? null,
    programId:    s.program_id     ?? null,
    meeting_url:  s.meeting_url    ?? null,
  };
}

// ── icons (SVG helpers) ───────────────────────────────────────────────────────
const Ico = ({ d, size = 14, stroke = "currentColor", sw = 2, fill = "none", cls = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    className={cls}>
    {d}
  </svg>
);

const IcoGrad     = () => <Ico size={18} stroke="#14b8a6" d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoSlash    = () => <Ico d={<line x1="16" y1="4" x2="8" y2="20"/>} stroke="#cbd5e1" />;
const IcoClock    = () => <Ico size={13} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoUsers    = () => <Ico size={20} stroke="#024677" sw={1.8} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoCal      = () => <Ico size={20} stroke="#024677" sw={1.8} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoChart    = () => <Ico size={20} stroke="#024677" sw={1.8} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>} />;
const IcoSearch   = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoPlus     = () => <Ico sw={2.5} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoSort     = () => <Ico d={<path d="M8 6h13M8 12h9M8 18h5"/>} />;
const IcoFilter   = () => <Ico d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoVideo    = () => <Ico d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>} />;
const IcoLocation = () => <Ico d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />;
const IcoEdit     = () => <Ico d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;
const IcoPlay     = () => <Ico fill="#14b8a6" stroke="#14b8a6" d={<polygon points="5 3 19 12 5 21 5 3"/>} />;
const IcoLive     = () => <Ico size={20} stroke="#047857" d={<><circle cx="12" cy="12" r="9"/><polygon points="10 8.5 15.5 12 10 15.5 10 8.5"/></>} />;
const IcoCalSm    = () => <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoClockSm  = () => <Ico d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoUsers2   = () => <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoCheck    = () => <Ico stroke="#14b8a6" d={<polyline points="20 6 9 17 4 12"/>} />;
const IcoX        = () => <Ico stroke="#cbd5e1" d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;

// ── donut ring ────────────────────────────────────────────────────────────────
function DonutRing({ pct = 0, size = 64 }) {
  const r   = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const arc  = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#024677" strokeWidth="8"
        strokeDasharray={`${arc} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="54%" textAnchor="middle" fontSize="11" fontWeight="700" fill="#024677">
        {pct}%
      </text>
    </svg>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon }) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "#0246770D" }}>
        <Icon />
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold" style={{ color: "#024677" }}>{value ?? 0}</p>
      </div>
    </div>
  );
}

// ── program skeleton ──────────────────────────────────────────────────────────
function ProgramSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/3" />
      <div className="flex gap-4">
        {[1, 2, 3].map(i => <div key={i} className="flex-1 h-24 bg-slate-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-slate-200 rounded-2xl" />
    </div>
  );
}

function Checklist({ items = [], readiness }) {
  if (!items.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold" style={{ color: "#024677" }}>قائمة الاستعداد</h3>
        {readiness && (
          <span className="text-sm font-extrabold px-3 py-1 rounded-full"
            style={{ background: readiness.ready ? "#f0fdf4" : "#fffbeb", color: readiness.ready ? "#16a34a" : "#d97706" }}>
            {readiness.percent}%
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map(it => (
          <div key={it.key} className="flex items-center gap-2.5 py-1.5">
            <span className="shrink-0">{it.done ? <IcoCheck /> : <IcoX />}</span>
            <span className="text-sm" style={{ color: it.done ? "#374151" : "#9ca3af" }}>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
function SessionsAccordion({ sessions = [] }) {
  const [open, setOpen] = useState(false);

  function typeLabel(raw) {
    if (!raw) return "";
    if (typeof raw === "object") return raw.text ?? "";
    return ({ 0: "أونلاين (Zoom)", 1: "مسجلة", 2: "حضوري" })[raw] ?? "";
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" dir="ltr">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round"
          className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span className="text-base font-bold" style={{ color: "#024677" }}>
          المحتوى التدريبي ({sessions.length} جلسة)
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-right px-5 py-4">لا توجد جلسات.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {sessions.map((s, i) => (
                <div key={s.id ?? i} className="px-5 py-3 flex items-center justify-between gap-3" dir="rtl">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#14b8a6" }}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{s.title || "جلسة بدون عنوان"}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{typeLabel(s.type)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                      <p className="text-[11px] text-slate-400">{s.date ?? ""}</p>
                    <p className="text-[11px] text-slate-400">
                      {s.starts_at ?? ""}{s.ends_at ? ` — ${s.ends_at}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── session card ──────────────────────────────────────────────────────────────
const SESSION_STATUS_CFG = {
  live:     { label: "جارية الآن", color: "#16a34a", bg: "#f0fdf4" },
  upcoming: { label: "قادمة",       color: "#2563eb", bg: "#eff6ff" },
  ended:    { label: "منتهية",      color: "#64748b", bg: "#f8fafc" },
};

function SessionCard({ session, onView, onEdit }) {
  const st  = SESSION_STATUS_CFG[session.status] ?? SESSION_STATUS_CFG.upcoming;
  const isOnline = session.type === 0 || session.type?.value === 0 ||
                   session.type?.delivery_mode === "online";

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* status + type */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}>{st.label}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${isOnline ? "text-[#0ea5e9] bg-[#e0f2fe]" : "text-[#f59e0b] bg-[#fef3c7]"}`}>
              {isOnline ? "أونلاين" : "حضوري"}
            </span>
          </div>

          <p className="text-sm font-bold text-slate-800 truncate">{session.title}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{session.program}</p>

          {/* meta */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <IcoCalSm /> {session.date}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <IcoClockSm /> {session.timeFrom}
              {session.timeTo && ` — ${session.timeTo}`}
            </span>
            {session.trainees > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <IcoUsers2 /> {session.trainees} متدرب
              </span>
            )}
            {session.venue && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <IcoLocation /> {session.venue}
              </span>
            )}
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          {session.status === "live" ? (
            <button onClick={() => onView?.(session)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
              style={{ background: "#047857" }}>
              <IcoLive /> دخول مباشر
            </button>
          ) : (
            <button onClick={() => onView?.(session)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90"
              style={{ background: "#024677" }}>
              <IcoPlay /> عرض
            </button>
          )}
          {onEdit && (
            <button onClick={() => onEdit?.(session)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
              <IcoEdit /> تعديل
            </button>
          )}
          {session.hasRecording && (
            <span className="flex items-center gap-1 text-[10px] text-teal-600 font-semibold">
              <IcoVideo /> تسجيل متاح
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ProgramViewPage
// ══════════════════════════════════════════════════════════════════════════════
export default function ProgramViewPage({ programId, onBack, onEdit }) {
  const id = programId ?? sessionStorage.getItem("viewProgramId") ?? null;

  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!id) { setProgram(DEFAULT_PROGRAM); setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetchProgram(id)
      .then(res  => setProgram(res.data ?? DEFAULT_PROGRAM))
      .catch(err => { setError(err.message || "حدث خطأ أثناء جلب بيانات البرنامج"); setProgram(null); })
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const statusVal = program?.status?.value ?? program?.status;
  const statusCfg = PROGRAM_STATUS[statusVal] ?? PROGRAM_STATUS[0];
  const statusLabel = program?.status?.text ?? statusCfg.label;

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="ltr">
      <div className="pr-3 sm:pr-14 py-6 space-y-5" dir="rtl">

        {/* breadcrumb */}
        <div className="max-w-5xl ml-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <IcoGrad />
            <button onClick={onBack}
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition">
              البرامج التدريبية
            </button>
            <IcoSlash />
            <span className="text-sm font-bold text-slate-800">{program?.name ?? "..."}</span>
          </div>
          {program && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
              <IcoClock /> {statusLabel}
            </span>
          )}
        </div>

        {/* loading */}
        {loading && <ProgramSkeleton />}

        {/* error */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3 text-right">{error}</p>
        )}

        {/* content */}
        {program && !loading && (
          <>
            {/* stat cards */}
            <div className="max-w-5xl ml-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="عدد المتدربين"    value={program.trainees_count}           Icon={IcoUsers} />
              <StatCard label="الجلسات المتبقية" value={program.remaining_sessions_count} Icon={IcoCal}   />
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#0246770D" }}>
                  <IcoChart />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">التقدم</p>
                  <p className="text-2xl font-bold" style={{ color: "#024677" }}>
                    {program.progress_percent ?? 0}%
                  </p>
                </div>
                <div className="mr-auto">
                  <DonutRing pct={program.progress_percent ?? 0} />
                </div>
              </div>
            </div>

            {/* program details */}
            <div className="max-w-5xl ml-auto">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-8 space-y-5" dir="rtl">
                <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>
                  عن البرنامج
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                  {[
                    { label: "اسم البرنامج",           value: typeof program.name === "object" ? (program.name?.ar ?? program.name?.en) : program.name },
                    { label: "المدرب المسؤول",          value: typeof program.trainer === "object" ? (program.trainer?.name ?? "—") : (program.trainer ?? "—") },
                    { label: "تاريخ البدء",              value: program.start_date },
                    { label: "تاريخ الانتهاء",           value: program.end_date },
                    { label: "آخر موعد للتسجيل",        value: program.registration_deadline },
                    { label: "عدد الجلسات المخططة",     value: program.sessions_count_planned },
                    { label: "عدد الساعات",              value: program.hours_count != null ? `${program.hours_count} ساعة` : null },
                    { label: "السعر",                    value: program.price_amount ? `${parseFloat(program.price_amount)} ${program.currency ?? ""}`.trim() : null },
                    { label: "نوع المحتوى",              value: program.content_type?.text },
                    { label: "نوع الجلسة",               value: program.session_type?.text },
                    { label: "التصنيف",                  value: program.category?.name },
                    { label: "المجال",                   value: program.field?.name },
                    { label: "الطاقة الاستيعابية",       value: program.capacity_label ?? program.max_capacity },
                    { label: "حالة النشاط",              value: program.activity_status?.text },
                    { label: "مدة البرنامج",             value: program.duration_weeks != null ? `${program.duration_weeks} أسبوع` : null },
                  ].filter(item => item.value != null && item.value !== "").map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}

                  <div>
                    <p className="text-xs text-slate-400 mb-1">حالة البرنامج</p>
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
                      {statusLabel}
                    </span>
                  </div>
                </div>

                {/* description */}
                {program.description && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">وصف البرنامج</p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {typeof program.description === "object"
                        ? (program.description?.ar ?? program.description?.en ?? "")
                        : program.description}
                    </p>
                  </div>
                )}

                {/* keywords */}
                {program.keywords?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">الكلمات المفتاحية</p>
                    <div className="flex flex-wrap gap-2">
                      {program.keywords.map(kw => (
                        <span key={kw.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={{ background: "#E6F0F8", color: "#024677" }}>
                          {kw.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {program.checklist?.length > 0 && (
              <div className="max-w-5xl ml-auto">
                <Checklist items={program.checklist} readiness={program.readiness} />
              </div>
            )}

            {/* sessions accordion */}
            <div className="max-w-5xl ml-auto">
              <SessionsAccordion sessions={program.sessions ?? []} />
            </div>

            {/* edit button */}
            <button onClick={() => onEdit?.(program)}
              className="block w-full max-w-5xl ml-auto py-3.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
              style={{ background: "#024677" }}>
              تعديل البرنامج
            </button>
          </>
        )}
      </div>
    </main>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SessionsPage  (re-exported for backward compat — actual file: SessionsPage.jsx)
// ══════════════════════════════════════════════════════════════════════════════
// NOTE: This component is intentionally kept here because ProgramViewPage.jsx
// originally bundled it. App.jsx imports SessionsPage from SessionsPage.jsx directly.
export function SessionsPage({ onViewSession, onEditSession }) {
  const navigate = useNavigate();

  const [search,   setSearch]   = useState("");
  const [page,     setPage]     = useState(1);
  const [sessions, setSessions] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [loading,  setLoading]  = useState(true);

  const load = async (q, p) => {
    setLoading(true);
    try {
      const res   = await fetchSessions({ search: q, page: p });
      const paged = res.data?.all_sessions;
      setSessions((paged?.data ?? []).map(normaliseSession));
      setLastPage(paged?.meta?.last_page ?? 1);
    } catch { /* noop */ }
    finally { setLoading(false); }
  };

  // initial load
  useEffect(() => { load(search, page); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // debounced search
  useEffect(() => {
    const t = setTimeout(() => { load(search, 1); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full max-w-[1020px] mx-auto space-y-4">

      {/* header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <IcoCalSm />
          <h1 className="text-xl font-bold" style={{ color: "#024677" }}>إدارة الجلسات</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* search */}
          <div className="relative">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch />
            </span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث عن جلسة..."
              className="pr-9 pl-4 py-2 text-xs bg-white border border-slate-200 rounded-xl w-40 focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400" />
          </div>
          {/* add session */}
          <button onClick={() => navigate("/dashboard/add-session")}
            className="flex items-center gap-1.5 text-white text-xs font-bold h-[32px] px-4 rounded-lg transition hover:opacity-90"
            style={{ background: "#024677" }}>
            <IcoPlus /> إضافة جلسة جديدة
          </button>
        </div>
      </div>

      {/* sessions list */}
      <div className="rounded-lg border border-[#E6EDF2] p-3 space-y-2 !mt-10">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-base font-bold" style={{ color: "#024677" }}>الجلسات القادمة</h2>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 bg-white rounded-xl px-3 py-1.5 hover:bg-slate-50 transition">
              <IcoSort /> ترتيب الجلسات
            </button>
            <button className="flex items-center gap-1 text-xs text-slate-500 border border-slate-200 bg-white rounded-xl px-3 py-1.5 hover:bg-slate-50 transition">
              <IcoFilter /> فلترة الجلسات
            </button>
          </div>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1" style={{ maxHeight: "420px" }}>
          {loading && (
            <div className="flex justify-center py-10">
              <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24"
                fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
          )}
          {!loading && sessions.map(s => (
            <SessionCard key={s.id} session={s}
              onView={() => onViewSession?.(s)}
              onEdit={() => onEditSession?.(s)} />
          ))}
          {!loading && sessions.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">لا توجد جلسات مطابقة</div>
          )}
        </div>

        {/* pagination */}
        {lastPage > 1 && (
          <Pagination
            page={page}
            totalPages={lastPage}
            onChange={p => { setPage(p); load(search, p); }} />
        )}
      </div>
    </div>
  );
}
