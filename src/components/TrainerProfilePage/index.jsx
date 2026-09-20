import { useState, useEffect } from "react";
import { fetchCoachProfile, deleteCoach } from "../../services/api";

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  );
}
function IcoStar({ filled }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24"
      fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b"
      strokeWidth="2" strokeLinecap="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function IcoDelete() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  );
}
function IcoEmail() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#64748b" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-10 7L2 7"/>
    </svg>
  );
}
function IcoPhone() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#64748b" strokeWidth="2" strokeLinecap="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.19 11.9 19.79 19.79 0 0 1 1.12 3.22 2 2 0 0 1 3.11 1h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  );
}
function IcoExp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcoCal() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#64748b" strokeWidth="2" strokeLinecap="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
function IcoSpinner({ size = 28 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

// ── mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ color = "#5AEACF" }) {
  const id   = `sp-${color.replace("#", "")}`;
  const path = "M300 42 C270 34 250 50 220 40 S165 30 140 42 S85 52 50 38 S15 28 0 34";
  return (
    <svg width="100%" height="36" viewBox="0 0 300 80" fill="none"
      preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={`${path} L0 80 L300 80 Z`} fill={`url(#${id})`}/>
      <path d={path} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// ── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#14b8a6" }}/>
      </div>
      <span className="text-xs font-semibold" style={{ color: "#14b8a6" }}>{pct}%</span>
    </div>
  );
}

// ── mini stat card (inside the 2×2 grid) ─────────────────────────────────────
function MiniStatCard({ value, label, color }) {
  return (
    <div className="rounded-2xl flex flex-col items-center justify-center p-4 min-h-[90px]"
      style={{ background: "#F0F4F8", border: "1px solid #E2E8F0" }}>
      <span className="text-2xl font-extrabold" style={{ color }}>{value}</span>
      <span className="text-xs text-slate-500 mt-1.5 text-center">{label}</span>
    </div>
  );
}

// ── stat card (top row) ───────────────────────────────────────────────────────
function StatCard({ icon, title, value, sub, spark, growth }) {
  return (
    <article className="bg-white rounded-2xl flex flex-col overflow-hidden transition hover:shadow-md"
      style={{ border: "1px solid #E2E8F0" }} dir="rtl">
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#0246770D" }}>
            {icon}
          </div>
          {growth
            ? <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{growth}</span>
            : <span />
          }
        </div>
        <div>
          <p className="text-xs text-slate-500">{title}</p>
          <p className="text-3xl font-extrabold mt-0.5" style={{ color: "#1D293D" }}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </div>
      <Sparkline color={spark} />
    </article>
  );
}

// ── tabs bar ──────────────────────────────────────────────────────────────────
function TabsBar({ tabs, active, onChange }) {
  return (
    <div className="flex items-center gap-6 px-6 py-1 rounded-t-2xl" dir="rtl"
      style={{ background: "#024677" }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          className="px-1 py-3 text-sm font-semibold transition whitespace-nowrap relative"
          style={active === tab.key ? { color: "#fff" } : { color: "#cbd5e1" }}>
          {tab.label}
          <span className="absolute bottom-0 right-0 h-[3.84px] rounded-full"
            style={{ background: "#47CFCF", width: active === tab.key ? "100%" : "0%", transition: "width 0.35s ease" }} />
        </button>
      ))}
    </div>
  );
}

// ── table helpers ─────────────────────────────────────────────────────────────
const TH = ({ children }) => (
  <th className="text-right text-xs font-semibold text-slate-500 px-4 py-3 whitespace-nowrap border-b border-slate-100"
    style={{ background: "#F0F4F8" }}>{children}</th>
);
const TD = ({ children, ltr }) => (
  <td className="px-4 py-3.5 border-b border-slate-50 text-sm text-right align-middle"
    dir={ltr ? "ltr" : undefined}>{children}</td>
);

// ── programs table ────────────────────────────────────────────────────────────
function ProgramsTable({ rows = [] }) {
  return (
    <table className="w-full" dir="rtl" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: "650px" }}>
      <colgroup>
        <col style={{ width: "20%" }} /><col style={{ width: "10%" }} />
        <col style={{ width: "13%" }} /><col style={{ width: "22%" }} />
        <col style={{ width: "17%" }} /><col style={{ width: "18%" }} />
      </colgroup>
      <thead>
        <tr><TH>اسم البرنامج</TH><TH>الحالة</TH><TH>عدد الجلسات</TH><TH>نسبة الحضور</TH><TH>تاريخ البدء</TH><TH>تاريخ الانتهاء</TH></tr>
      </thead>
      <tbody>
        {rows.length === 0 && (
          <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">لا توجد برامج</td></tr>
        )}
        {rows.map((p, i) => (
          <tr key={i} className="hover:bg-slate-50 transition">
            <TD><span className="font-semibold text-slate-700">{p.name}</span></TD>
            <TD>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold
                ${p.activity_status?.value === "active" || p.status?.text === "نشط"
                  ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                {p.activity_status?.text ?? p.status?.text ?? "—"}
              </span>
            </TD>
            <TD><span className="text-slate-600">{p.sessions_count} جلسة</span></TD>
            <TD><ProgressBar pct={p.attendance_rate ?? 0} /></TD>
            <TD ltr>{p.start_date}</TD>
            <TD ltr>{p.end_date}</TD>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── requests table ────────────────────────────────────────────────────────────
const REQUEST_STATUS = { 0: "مسودة", 1: "قيد المراجعة", 2: "معتمد", 3: "مرفوض" };

function RequestsTable({ rows = [] }) {
  return (
    <table className="w-full" dir="rtl" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: "500px" }}>
      <colgroup>
        <col style={{ width: "20%" }} /><col style={{ width: "35%" }} />
        <col style={{ width: "22%" }} /><col style={{ width: "23%" }} />
      </colgroup>
      <thead>
        <tr><TH>نوع الطلب</TH><TH>اسم البرنامج</TH><TH>تاريخ الطلب</TH><TH>الحالة</TH></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.id ?? i} className="hover:bg-slate-50 transition">
            <TD><span className="text-teal-600 font-semibold">{r.type_label}</span></TD>
            <TD><span className="font-semibold text-slate-700">{r.program_name}</span></TD>
            <TD ltr>{r.request_date}</TD>
            <TD>
              <span className={`text-xs font-bold
                ${r.status?.value === 2 ? "text-emerald-600" : r.status?.value === 3 ? "text-red-500" : "text-amber-500"}`}>
                {r.status?.text ?? REQUEST_STATUS[r.status] ?? "—"}
              </span>
            </TD>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={4} className="text-center py-8 text-slate-400 text-sm">لا توجد طلبات</td></tr>
        )}
      </tbody>
    </table>
  );
}

// ── sessions table ────────────────────────────────────────────────────────────
function SessionsTable({ rows = [] }) {
  return (
    <table className="w-full" dir="rtl" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: "600px" }}>
      <colgroup>
        <col style={{ width: "22%" }} /><col style={{ width: "18%" }} />
        <col style={{ width: "14%" }} /><col style={{ width: "12%" }} />
        <col style={{ width: "18%" }} /><col style={{ width: "16%" }} />
      </colgroup>
      <thead>
        <tr><TH>اسم الجلسة</TH><TH>البرنامج</TH><TH>التاريخ</TH><TH>الحالة</TH><TH>نوع الجلسة</TH><TH>حضور المدرب</TH></tr>
      </thead>
      <tbody>
        {rows.map((s, i) => (
          <tr key={s.id ?? i} className="hover:bg-slate-50 transition">
            <TD><span className="font-semibold text-slate-700 truncate block">{s.title}</span></TD>
            <TD><span className="text-slate-500 truncate block text-xs">{s.program?.name ?? "—"}</span></TD>
            <TD ltr>{s.date}</TD>
            <TD>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-600">
                {s.status?.text ?? "—"}
              </span>
            </TD>
            <TD><span className="text-slate-600 text-xs">{s.type?.text ?? "—"}</span></TD>
            <TD>
              <span className={`text-xs font-bold
                ${s.coach_attendance?.status_key === "present" ? "text-emerald-600" : "text-red-500"}`}>
                {s.coach_attendance?.status_label ?? "—"}
              </span>
            </TD>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">لا توجد جلسات</td></tr>
        )}
      </tbody>
    </table>
  );
}

// ── attendance log ────────────────────────────────────────────────────────────
function AttendanceLog({ rows = [], summary = {} }) {
  const stats = [
    { label: "إجمالي الجلسات",    value: summary.total_sessions     ?? 0,    color: "#1D293D" },
    { label: "نسبة الحضور",        value: (summary.attendance_rate   ?? 0) + "%", color: "#7c3aed" },
    { label: "أونلاين مكتملة",     value: summary.completed_online   ?? 0,    color: "#0ea5e9" },
    { label: "أوفلاين مكتملة",     value: summary.completed_offline  ?? 0,    color: "#f59e0b" },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" dir="rtl" style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: "600px" }}>
          <colgroup>
            <col style={{ width: "15%" }} /><col style={{ width: "18%" }} />
            <col style={{ width: "13%" }} /><col style={{ width: "17%" }} />
            <col style={{ width: "18%" }} /><col style={{ width: "19%" }} />
          </colgroup>
          <thead>
            <tr><TH>البرنامج</TH><TH>الجلسة</TH><TH>النوع</TH><TH>التاريخ والوقت</TH><TH>الحالة</TH><TH>الإجراء</TH></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isOnline = r.type?.delivery_mode === "online";
              const [date, time] = (r.datetime ?? "").split(" ");
              return (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <TD><span className="truncate block text-slate-500 text-xs">{r.program_name}</span></TD>
                  <TD><span className="truncate block font-medium text-slate-700 text-xs">{r.session_title}</span></TD>
                  <TD>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full
                      ${isOnline ? "text-[#0ea5e9] bg-[#e0f2fe]" : "text-[#f59e0b] bg-[#fef3c7]"}`}>
                      {r.type?.text ?? (isOnline ? "أونلاين" : "أوفلاين")}
                    </span>
                  </TD>
                  <TD ltr>
                    <div className="font-medium text-slate-700 text-xs">{date}</div>
                    <div className="text-slate-400 text-xs">{time}</div>
                  </TD>
                  <TD>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold
                      ${r.status_key === "present" ? "text-emerald-600" : "text-red-500"}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0
                        ${r.status_key === "present" ? "bg-emerald-500" : "bg-red-500"}`}/>
                      {r.status_label}
                    </span>
                  </TD>
                  <TD>
                    <button className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition whitespace-nowrap"
                      style={{ border: "1.5px solid #024677", color: "#024677", background: "transparent" }}>
                      عرض الجلسة
                    </button>
                  </TD>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">لا يوجد سجل حضور</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function TrainerProfilePage({ trainer, onBack }) {
  const [apiData,       setApiData]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("programs");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // load from API
  useEffect(() => {
    const id = trainer?.id ?? localStorage.getItem("viewTrainerId");
    if (!id) { setLoading(false); return; }
    fetchCoachProfile(id)
      .then(res => setApiData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [trainer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    const id = trainer?.id ?? localStorage.getItem("viewTrainerId");
    if (!id) return;
    setDeleting(true);
    try {
      await deleteCoach(id);
      setShowDeleteModal(false);
      onBack?.();
    } catch { /* noop */ }
    finally { setDeleting(false); }
  };

  // ── merge API + prop data ──────────────────────────────────────────────────
  const raw  = apiData?.coach ?? trainer ?? {};
  const stats = apiData?.statistics ?? {};
  const attendanceSummary = apiData?.attendance_summary ?? {};

  const trainerData = {
    name:              raw.name               ?? trainer?.name     ?? "",
    avatar:            raw.image              ?? trainer?.avatar   ?? "",
    email:             raw.email              ?? trainer?.email    ?? "",
    phone:             (raw.country_code ? `+${raw.country_code} ` : "") + (raw.phone ?? trainer?.phone ?? ""),
    exp:               raw.years_of_experience ?? trainer?.exp     ?? 0,
    joinDate:          raw.join_date           ?? trainer?.joinDate ?? "",
    rating:            raw.avg_rate            ?? trainer?.rating  ?? 0,
    specialization:    raw.specialization?.name ?? trainer?.specialization ?? "",
    bio:               raw.bio                ?? "",
    activeSessions:    stats.active_sessions    ?? trainer?.activeSessions    ?? 0,
    completedSessions: stats.completed_sessions ?? trainer?.completedSessions ?? 0,
    avgRating:         (stats.average_rating ?? 0) + "/5",
    avgAttendance:     (stats.attendance_rate ?? 0) + "%",
  };

  const programs     = apiData?.programs      ?? [];
  const requests     = apiData?.requests      ?? [];
  const sessions     = apiData?.sessions      ?? [];
  const attendanceLog = apiData?.attendance_log ?? [];

  const tabs = [
    { key: "programs",   label: `البرامج المرتبطة (${programs.length})`   },
    { key: "attendance", label: `سجل الحضور (${attendanceLog.length})`    },
    { key: "requests",   label: `الطلبات (${requests.length})`            },
    { key: "sessions",   label: `الجلسات (${sessions.length})`            },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-white px-4 sm:px-6 py-4" dir="rtl">
      <div className="w-full max-w-[1100px] mx-auto space-y-8">

        {/* back button */}
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition">
          <IcoBack /> العودة لإدارة المدربين
        </button>

        {/* loading */}
        {loading && <div className="flex justify-center py-16"><IcoSpinner /></div>}

        {!loading && (
          <>
            {/* ── header ── */}
            <div className="flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-4">
                {/* avatar */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-[3px] border-white shadow-md">
                    {trainerData.avatar
                      ? <img src={trainerData.avatar} alt={trainerData.name} className="w-full h-full object-cover"/>
                      : <div className="w-full h-full bg-teal-400 flex items-center justify-center text-xl font-bold text-white">
                          {trainerData.name.trim().charAt(0)}
                        </div>
                    }
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                </div>

                {/* name + stars */}
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">{trainerData.name}</h1>
                  {trainerData.specialization && (
                    <p className="text-xs text-slate-400 mt-0.5">{trainerData.specialization}</p>
                  )}
                  <div className="flex items-center gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <IcoStar key={i} filled={i <= Math.round(trainerData.rating || 0)} />
                    ))}
                    <span className="text-xs font-bold text-slate-600 mr-1">{trainerData.rating}</span>
                  </div>
                </div>
              </div>

              {/* delete button */}
              <button onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition hover:bg-red-50"
                style={{ borderColor: "#fca5a5", color: "#ef4444", background: "#fff5f5" }}>
                <IcoDelete /> حذف المدرب
              </button>
            </div>

            {/* ── info + mini stats ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* contact info */}
              <div className="bg-white rounded-2xl p-5 space-y-3"
                style={{ border: "1px solid #E2E8F0" }} dir="rtl">
                <h2 className="text-sm font-bold text-slate-700">بيانات التواصل</h2>
                <div className="flex items-center gap-2 text-sm text-slate-600 flex-row-reverse justify-end">
                  <span dir="ltr">{trainerData.email}</span>
                  <IcoEmail />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 flex-row-reverse justify-end">
                  <span dir="ltr">{trainerData.phone}</span>
                  <IcoPhone />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 flex-row-reverse justify-end">
                  <span><span className="font-semibold text-slate-700">{trainerData.exp}</span> سنوات خبرة</span>
                  <IcoExp />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 flex-row-reverse justify-end">
                  <span>تاريخ الانضمام: <span className="font-semibold text-slate-700" dir="ltr">{trainerData.joinDate}</span></span>
                  <IcoCal />
                </div>
                {trainerData.bio && (
                  <div className="pt-1 border-t border-slate-100">
                    <p className="text-xs text-slate-500 leading-relaxed">{trainerData.bio}</p>
                  </div>
                )}
              </div>

              {/* mini stat grid */}
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <MiniStatCard value={trainerData.activeSessions}    label="الجلسات النشطة"    color="#1D293D"  />
                  <MiniStatCard value={trainerData.completedSessions} label="الجلسات المكتملة"  color="#3b82f6"  />
                  <MiniStatCard value={trainerData.avgRating}         label="متوسط التقييم"      color="#F59E0B"  />
                  <MiniStatCard value={trainerData.avgAttendance}     label="متوسط الحضور"       color="#14b8a6"  />
                </div>
              </div>
            </div>

            {/* ── tabs ── */}
            <div className="rounded-2xl overflow-hidden border border-slate-100">
              <TabsBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
              <div className="bg-white overflow-x-auto">
                {activeTab === "programs"   && <ProgramsTable   rows={programs}      />}
                {activeTab === "requests"   && <RequestsTable   rows={requests}      />}
                {activeTab === "sessions"   && <SessionsTable   rows={sessions}      />}
                {activeTab === "attendance" && <AttendanceLog   rows={attendanceLog} summary={attendanceSummary} />}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── delete modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[380px] p-7 flex flex-col items-center text-center gap-4"
            dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "#fff1f2" }}>
              <IcoDelete />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">حذف المدرب</h3>
              <p className="text-sm text-slate-500 mt-1">
                هل أنت متأكد من حذف <span className="font-semibold text-slate-700">{trainerData.name}</span>؟
                <br />لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "#ef4444" }}>
                {deleting ? "جاري الحذف..." : "نعم، احذف"}
              </button>
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
