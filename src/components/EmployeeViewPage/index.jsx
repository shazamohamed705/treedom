import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCompanyEmployee } from "../../services/api";

// ─── brand colours ────────────────────────────────────────────────────────────
const BRAND = "#024677";
const TEAL  = "#14b8a6";
const GOLD  = "#f59e0b";

// ─── icon helper ──────────────────────────────────────────────────────────────
const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block" }}>
    {d}
  </svg>
);
const IcoUsers    = ({ size = 18 }) => <I size={size} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoUser     = ({ size = 18 }) => <I size={size} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const IcoBack     = ({ size = 18 }) => <I size={size} sw={2} d={<><polyline points="15 18 9 12 15 6"/></>} />;
const IcoEdit     = ({ size = 16 }) => <I size={size} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />;

// ─── skeleton ─────────────────────────────────────────────────────────────────
const Sk = ({ w = "w-full", h = "h-4", r = "rounded-lg" }) => (
  <div className={`${w} ${h} ${r} bg-slate-200 animate-pulse`} />
);

// ─── progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value }) {
  const v = Math.min(100, Math.max(0, value ?? 0));
  const barColor = v === 100 ? TEAL : v >= 60 ? TEAL : GOLD;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold w-9 text-right" style={{ color: barColor }}>{v}%</span>
      <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: barColor }} />
      </div>
    </div>
  );
}

// ─── status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ statusLabel, status }) {
  const color = status === "complete"     ? TEAL
              : status === "in_progress"  ? GOLD
              : "#94a3b8";
  return <span className="text-xs font-bold" style={{ color }}>{statusLabel}</span>;
}

// ─── tab button ───────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2.5 text-sm font-bold transition-all relative whitespace-nowrap"
      style={{ color: active ? BRAND : "#94a3b8" }}
    >
      {label}
      {active && (
        <span className="absolute bottom-0 right-0 left-0 h-0.5 rounded-full"
          style={{ background: BRAND }} />
      )}
    </button>
  );
}

// ─── personal info tab ────────────────────────────────────────────────────────
function PersonalTab({ personal, loading }) {
  if (loading) {
    return (
      <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-0" dir="rtl">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex flex-col py-4 border-b border-[#F0F0F0] gap-2">
            <Sk w="w-24" h="h-3" />
            <Sk w="w-40" h="h-4" />
          </div>
        ))}
      </div>
    );
  }

  const fields = [
    { label: "الاسم الكامل",       value: personal?.name,                dir: "rtl" },
    { label: "رقم الهوية الوطنية", value: personal?.national_id,         dir: "ltr" },
    { label: "البريد الإلكتروني",  value: personal?.email,               dir: "ltr" },
    { label: "رقم الجوال",         value: personal?.phone ?? "—",        dir: "ltr" },
    { label: "المسمى الوظيفي",     value: personal?.job_title ?? "—",    dir: "rtl" },
    { label: "القسم",              value: personal?.department?.name ?? "—", dir: "rtl" },
  ];

  return (
    <div className="p-6" dir="rtl">
      <div className="grid grid-cols-2 gap-x-6 gap-y-0">
        {fields.map((f, i) => (
          <div key={i} className="flex flex-col py-4 border-b border-[#F0F0F0]">
            <span className="text-xs mb-1.5" style={{ color: "#94a3b8" }}>{f.label}</span>
            <span className="text-sm font-bold" style={{ color: "#1D293D" }} dir={f.dir}>
              {f.value ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── programs tab ─────────────────────────────────────────────────────────────
function ProgramsTab({ programs, loading }) {
  const COLS = ["البرنامج", "الحالة", "التقدم", "الجلسات", "تاريخ الانتهاء"];

  if (loading) {
    return (
      <div dir="rtl" className="p-6 flex flex-col gap-3">
        {[...Array(3)].map((_, i) => <Sk key={i} h="h-10" r="rounded-xl" />)}
      </div>
    );
  }

  if (!programs?.length) {
    return (
      <div dir="rtl" className="p-10 text-center text-sm text-slate-400">
        لا توجد برامج مسجلة
      </div>
    );
  }

  return (
    <div dir="rtl" className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: 580 }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
            {COLS.map((h, i) => (
              <th key={i}
                className="text-right text-xs font-bold px-5 py-3.5 whitespace-nowrap"
                style={{ color: BRAND }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {programs.map((p, i) => (
            <tr key={p.enrolled_program_id}
              className="border-b border-[#F5F5F5] last:border-0"
              style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              <td className="px-5 py-3.5 font-semibold" style={{ color: "#1D293D" }}>
                {p.name}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status={p.status} statusLabel={p.status_label} />
              </td>
              <td className="px-5 py-3.5">
                <ProgressBar value={p.progress_percent} />
              </td>
              <td className="px-5 py-3.5 text-xs" style={{ color: "#64748b" }}>
                {p.sessions_completed} / {p.sessions_total}
              </td>
              <td className="px-5 py-3.5 text-sm" style={{ color: "#64748b" }}>
                {p.end_date ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── attendance tab ───────────────────────────────────────────────────────────
function AttendanceTab({ records, loading }) {
  const COLS = ["اسم الجلسة", "اسم البرنامج", "التاريخ", "الحالة", "الحضور"];

  if (loading) {
    return (
      <div dir="rtl" className="p-6 flex flex-col gap-3">
        {[...Array(3)].map((_, i) => <Sk key={i} h="h-10" r="rounded-xl" />)}
      </div>
    );
  }

  if (!records?.length) {
    return (
      <div dir="rtl" className="p-10 text-center text-sm text-slate-400">
        لا يوجد سجل حضور
      </div>
    );
  }

  return (
    <div dir="rtl" className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: 640 }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
            {COLS.map((h, i) => (
              <th key={i}
                className="text-right text-xs font-bold px-5 py-3.5 whitespace-nowrap"
                style={{ color: BRAND }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.session_id}
              className="border-b border-[#F5F5F5] last:border-0"
              style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
              <td className="px-5 py-3.5 font-semibold" style={{ color: "#1D293D" }}>
                {r.session_name}
              </td>
              <td className="px-5 py-3.5" style={{ color: "#64748b" }}>
                {r.program_name}
              </td>
              <td className="px-5 py-3.5" style={{ color: "#64748b" }}>
                {r.date}
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs font-bold" style={{ color: "#94a3b8" }}>
                  {r.status_label && typeof r.status_label === "object" ? (r.status_label.text ?? r.status_label.value ?? "—") : (r.status_label ?? "—")}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <span className="text-xs font-bold"
                  style={{ color: r.attended ? TEAL : "#ef4444" }}>
                  {r.attended ? "حضر" : "غائب"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function EmployeeViewPage({ employee, onBack, onEdit }) {
  const navigate  = useNavigate();
  const [tab, setTab]   = useState("personal");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // The employee prop carries at minimum { id, name }
  const empId = employee?.id;

  useEffect(() => {
    if (!empId) { setLoading(false); return; }
    setLoading(true);
    setError("");
    fetchCompanyEmployee(empId)
      .then(res => setData(res?.data ?? null))
      .catch(e  => setError(e?.message || "تعذّر تحميل بيانات الموظف."))
      .finally(() => setLoading(false));
  }, [empId]);

  // Convenience aliases
  const personal   = data?.personal   ?? null;
  const stats      = data?.stats      ?? {};
  const programs   = data?.programs   ?? [];
  const attendance = data?.attendance ?? [];

  // Display name: prefer API data, fall back to prop
  const displayName = personal?.name ?? employee?.name ?? "—";

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <main className="flex-1 overflow-y-auto bg-white p-3 sm:p-4" dir="rtl">
      <div className="max-w-[1100px] mx-auto space-y-4">

        {/* ── breadcrumb ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0246770D", color: BRAND }}>
              <IcoUsers size={14} />
            </div>
            <span className="text-sm whitespace-nowrap" style={{ color: "#94a3b8" }}>قائمة الموظفين/</span>
            <span className="text-sm font-bold whitespace-nowrap" style={{ color: BRAND }}>عرض الموظف</span>
          </div>

          {/* action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                text-white transition hover:opacity-90"
              style={{ background: BRAND }}>
              <IcoBack size={14} />
              رجوع
            </button>
          </div>
        </div>

        {/* ── error banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* ── employee name row ── */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#0246770D", color: BRAND }}>
            <IcoUser size={18} />
          </div>
          {loading
            ? <Sk w="w-40" h="h-6" r="rounded-lg" />
            : <span className="text-base font-extrabold truncate" style={{ color: BRAND }}>
                {displayName}
              </span>
          }
        </div>

        {/* ── card ── */}
        <div className="bg-white rounded-2xl border border-[#E1E1E1] overflow-hidden">

          {/* ── stats row ── */}
          <div className="grid grid-cols-3 border-b border-[#F0F0F0]">
            {[
              { key: "avg",  value: loading ? null : `${stats.average_completion ?? 0}%`, label: "متوسط الإتمام",  color: "#1D293D" },
              { key: "prg",  value: loading ? null : stats.registered_programs ?? 0,       label: "البرامج المسجلة", color: "#1D293D" },
              { key: "att",  value: loading ? null : `${stats.attendance_rate ?? 0}%`,     label: "نسبة الحضور",    color: TEAL  },
            ].map((s, i) => (
              <div key={s.key}
                className="flex flex-col items-center justify-center py-4 sm:py-6 gap-1 min-w-0 px-1"
                style={i < 2 ? { borderLeft: "1px solid #F0F0F0" } : {}}>
                {loading
                  ? <Sk w="w-16" h="h-8" r="rounded-lg" />
                  : <span className="text-2xl sm:text-4xl font-extrabold leading-none truncate max-w-full"
                      style={{ color: s.color }}>{s.value}</span>
                }
                <span className="text-[11px] sm:text-xs mt-1 text-center" style={{ color: "#94a3b8" }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* ── tabs ── */}
          <div className="flex items-center border-b border-[#F0F0F0] px-2 sm:px-4 overflow-x-auto">
            <Tab label="البيانات الشخصية" active={tab === "personal"}   onClick={() => setTab("personal")} />
            <Tab label="البرامج والتقدم"  active={tab === "programs"}   onClick={() => setTab("programs")} />
            <Tab label="سجل الحضور"       active={tab === "attendance"} onClick={() => setTab("attendance")} />
          </div>

          {/* ── tab content ── */}
          {tab === "personal"   && <PersonalTab   personal={personal}   loading={loading} />}
          {tab === "programs"   && <ProgramsTab   programs={programs}   loading={loading} />}
          {tab === "attendance" && <AttendanceTab records={attendance}  loading={loading} />}

        </div>
      </div>
    </main>
  );
}
