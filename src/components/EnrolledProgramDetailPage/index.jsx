import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchCompanyEnrolledProgram,
  fetchCompanyEnrolledProgramMembers,
  addCompanyEnrolledProgramMembers,
  fetchCompanyEmployees,
  fetchCompanyProgramDetail,
} from "../../services/api";

// ─── palette (from design) ───────────────────────────────────────────────────
const C_PRIMARY  = "#005A8D";
const C_DARK     = "#004B73";
const C_TEAL     = "#42DCC3";
const C_LIGHT    = "#F3F6F8";
const C_BORDER   = "#E5E9ED";
const C_TEXT     = "#33475B";
const C_SUBTITLE = "#8A9AA8";
const C_AMBER    = "#B7791F";
const C_AMBER_BG = "#FFF6E6";

// ─── icons (lucide-style) ────────────────────────────────────────────────────
const I = ({ d, size = 16, color = "currentColor", sw = 2, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}{children}</svg>
);
const IcoGrad     = ({ size = 16, color = C_TEAL }) => <I size={size} color={color} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoUsers    = ({ size = 16, color = "currentColor" }) => <I size={size} color={color} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoSearch  = ({ size = 14, color = "#8A9AA8" }) => <I size={size} color={color} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoPlus    = ({ size = 14, color = "currentColor" }) => <I size={size} color={color} sw={2.4} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoFilter  = ({ size = 14, color = "#5A7184" }) => <I size={size} color={color} d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>} />;
const IcoRefresh = ({ size = 14, color = "#5A7184" }) => <I size={size} color={color} d={<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>} />;
const IcoCalendar= ({ size = 18, color = C_DARK }) => <I size={size} color={color} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoSeats   = ({ size = 18, color = C_DARK }) => <I size={size} color={color} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />;
const IcoBack    = ({ size = 14, color = C_DARK }) => <I size={size} color={color} sw={2.4} d={<polyline points="15 18 9 12 15 6"/>} />;
const IcoClose   = ({ size = 16, color = "#8A9AA8" }) => <I size={size} color={color} d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />;
const IcoCheck   = ({ size = 14, color = "currentColor" }) => <I size={size} color={color} sw={3} d={<polyline points="20 6 9 17 4 12"/>} />;

const FONT_CSS = "'IBM Plex Sans Arabic', 'Cairo', 'Segoe UI', Arial, sans-serif";

// ─── helpers ─────────────────────────────────────────────────────────────────
const nameOf = (n) => {
  if (n == null) return "—";
  if (typeof n === "object") return n?.ar ?? n?.en ?? "—";
  return String(n);
};
const dateOf = (iso) => {
  if (!iso) return null;
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
  } catch { return null; }
};
const statusLabel = (s) => {
  if (s === "approved" || s === "paid" || s === 1) return { label: "مقبول", color: "#0E9F8A", bg: "#DCFAF3" };
  if (s === "rejected") return { label: "مرفوض", color: "#C9505D", bg: "#FBE9EA" };
  return { label: "قيد المراجعة", color: C_AMBER, bg: C_AMBER_BG };
};

// ─── add-employee modal ──────────────────────────────────────────────────────
function AddEmployeeModal({ id, onClose, onAdded }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    fetchCompanyEmployees({ per_page: 100 })
      .then(res => { if (on) setEmployees(res?.data?.data ?? res?.data ?? []); })
      .catch(() => { if (on) setEmployees([]); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim();
    return employees.filter(e =>
      !q || String(e.name ?? "").includes(q) || String(e.email ?? "").includes(q.toLowerCase())
    );
  }, [employees, query]);

  const toggle = (empId) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(empId)) next.delete(empId); else next.add(empId);
      return next;
    });
  };

  const submit = () => {
    if (selected.size === 0) return;
    setSubmitting(true);
    setError("");
    addCompanyEnrolledProgramMembers(id, [...selected])
      .then(res => { onAdded(res?.message); onClose(); })
      .catch(e => { setError(e?.message || "تعذر إضافة الموظفين"); setSubmitting(false); });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,32,55,0.55)" }} dir="rtl">
      <div className="w-full max-w-[820px] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ border: `1px solid ${C_BORDER}`, fontFamily: FONT_CSS, maxHeight: "90vh" }}>
        {/* ── header ───────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b" style={{ borderColor: C_BORDER }}>
          <div className="flex items-center justify-between gap-3">
            {/* breadcrumb */}
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "#EBF7F5", color: C_TEAL }}>
                <IcoUsers size={14} color={C_TEAL} />
              </span>
              <nav className="flex items-center gap-2 text-[13px] whitespace-nowrap flex-wrap">
                <span style={{ color: "#B6C3CF" }}>البرامج المسجلة</span>
                <span style={{ color: "#C6D0D8" }}>/</span>
                <span style={{ color: "#B6C3CF" }}>تفاصيل البرنامج</span>
                <span style={{ color: "#C6D0D8" }}>/</span>
                <span className="font-bold" style={{ color: C_PRIMARY }}>تسجيل موظف</span>
              </nav>
            </div>
            {/* close */}
            <button onClick={onClose} className="shrink-0 p-1 hover:opacity-70 transition" aria-label="إغلاق">
              <IcoClose size={20} color={C_PRIMARY} />
            </button>
          </div>

          {/* section title */}
          <div className="mt-3 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#EBF7F5", color: C_TEAL }}>
              <IcoUsers size={16} color={C_TEAL} />
            </span>
            <h3 className="text-[15px] font-bold" style={{ color: C_DARK }}>قائمة الموظفين</h3>
          </div>
        </div>

        {/* ── body container ────────────────────────────────────────────────── */}
        <div className="m-4 rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${C_BORDER}` }}>

          {/* toolbar row */}
          <div className="flex items-center gap-2 px-3 sm:px-3.5 py-3 border-b flex-wrap"
            style={{ borderColor: C_BORDER, background: "#FBFCFD" }}>
            <div className="relative flex-1 min-w-[140px]">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoSearch /></span>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="بحث عن موظف"
                className="w-full h-9 pr-9 pl-3 rounded-lg border text-[12px] bg-white
                  focus:outline-none focus:ring-2 focus:ring-[#005A8D]/15 transition placeholder:text-slate-300"
                style={{ borderColor: "#2E90FA", color: C_TEXT }} />
            </div>
            <button type="button" aria-label="فلاتر"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border hover:bg-slate-50 transition shrink-0"
              style={{ borderColor: C_BORDER }}><IcoFilter /></button>
          </div>

          {/* scrollable employees table */}
          <div className="modal-employees-scroll overflow-y-auto" style={{ maxHeight: 340 }}>
            {loading && (
              <div className="flex items-center justify-center gap-2 py-10 text-sm" style={{ color: C_SUBTITLE }}>
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#005A8D] animate-spin" />
                جارٍ تحميل الموظفين...
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: C_SUBTITLE }}>
                لا يوجد موظفون مطابقون
              </p>
            )}
            {!loading && filtered.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-[13px]" style={{ minWidth: 640, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: C_LIGHT }}>
                      {["تحديد", "اسم الموظف", "البريد", "المسمى الوظيفي"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-[12px] font-bold whitespace-nowrap"
                          style={{ color: C_DARK, borderBottom: `1px solid ${C_BORDER}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => {
                      const checked = selected.has(e.id);
                      return (
                        <tr key={e.id} onClick={() => toggle(e.id)} className="cursor-pointer"
                          style={{ background: i % 2 === 1 ? "#F9FBFC" : "#FFFFFF" }}>
                          <td className="px-4 py-2.5 text-center whitespace-nowrap">
                            <span className={`w-[18px] h-[18px] rounded-[5px] flex items-center justify-center border mx-auto shrink-0 ${checked ? "bg-[#004B73] border-[#004B73]" : "bg-white border-[#8FBFE8]"}`}>
                              {checked && <IcoCheck size={11} color="#fff" />}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                                style={{ background: "#EBF2F7", color: C_DARK }}>{(e.name ?? "م")[0]}</span>
                              <span className="text-[13px] font-bold whitespace-nowrap" style={{ color: C_TEXT }}>{e.name ?? "—"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-[12px] whitespace-nowrap"
                            style={{ color: C_SUBTITLE }} dir="ltr">{e.email ?? "—"}</td>
                          <td className="px-4 py-2.5 text-[12px] whitespace-nowrap"
                            style={{ color: C_SUBTITLE }}>{e.job_title ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── footer (fixed) ────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t flex items-center gap-3"
          style={{ borderColor: C_BORDER, background: "#FBFCFD" }}>
          {error && <p className="flex-1 text-[12px]" style={{ color: "#C9505D" }}>{error}</p>}
          <div className="flex items-center gap-3">
            <button type="button" onClick={submit} disabled={selected.size === 0 || submitting}
              className="h-10 px-6 rounded-xl text-[13px] font-bold text-white flex items-center gap-1.5 transition
                disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              style={{ background: C_PRIMARY }}>
              {submitting ? "جارٍ التسجيل..." : "تسجيل الموظفين"}
            </button>
            <button type="button" onClick={onClose}
              className="h-10 px-5 rounded-xl text-[13px] font-semibold bg-white border hover:bg-slate-50 transition shrink-0"
              style={{ borderColor: "#B9D3E8", color: "#5A7184" }}>إلغاء</button>
          </div>
        </div>
      </div>

      <style>{`
        .modal-employees-scroll::-webkit-scrollbar { width: 6px; }
        .modal-employees-scroll::-webkit-scrollbar-track { background: transparent; }
        .modal-employees-scroll::-webkit-scrollbar-thumb { background: #D5DEE4; border-radius: 999px; }
      `}</style>
    </div>
  );
}

// ─── success popup (API message after adding employees) ─────────────────────
function SuccessModal({ message, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setVisible(true), 30);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,32,55,0.5)" }} dir="rtl">
      <div className={`w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 text-center transition-all duration-200 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        style={{ border: `1px solid ${C_BORDER}`, fontFamily: FONT_CSS }}>
        <span className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "#DCFAF3", color: "#0E9F8A" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <div>
          <p className="text-[15px] font-extrabold mb-1" style={{ color: C_DARK }}>تم بنجاح</p>
          <p className="text-[13px] leading-relaxed" style={{ color: C_TEXT }}>{message}</p>
        </div>
        <button onClick={onClose}
          className="min-w-[120px] h-10 px-6 rounded-xl text-[13px] font-bold text-white transition hover:opacity-90"
          style={{ background: C_PRIMARY }}>حسناً</button>
      </div>
    </div>
  );
}

// ─── stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, progress, progressWidth }) {
  return (
    <div className="bg-white rounded-2xl px-3 sm:px-4 py-3 sm:py-4 flex flex-col justify-between gap-2 sm:gap-3"
      style={{ border: `1px solid ${C_BORDER}`, minHeight: 90 }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] sm:text-[12px] font-semibold leading-tight" style={{ color: C_SUBTITLE }}>{label}</p>
        {icon}
      </div>
      {typeof progress === "number" ? (
        <div>
          <p className="text-[18px] sm:text-[22px] font-extrabold leading-none" style={{ color: C_DARK }}>{value}</p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: C_LIGHT }}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, progressWidth))}%`, background: C_PRIMARY }} />
          </div>
        </div>
      ) : (
        <p className="text-[20px] sm:text-[26px] font-extrabold leading-none" style={{ color: C_DARK }}>{value}</p>
      )}
    </div>
  );
}

// ─── tab ─────────────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="relative px-3 sm:px-5 py-3 text-[13px] sm:text-[14px] font-bold transition-colors whitespace-nowrap"
      style={{ color: active ? C_PRIMARY : C_SUBTITLE }}>
      {label}
      {active && <span className="absolute bottom-0 right-0 left-0 h-[2.5px]" style={{ background: C_PRIMARY }} />}
    </button>
  );
}

// ─── info row (about) ────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  // resolve object values like { value, text } or { ar, en }
  let display = value;
  if (display != null && typeof display === "object") {
    display = display.text ?? display.ar ?? display.en ?? display.name ?? String(display);
  }
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[#EEF1F4] last:border-0">
      <span className="text-[11px] sm:text-[12px] shrink-0" style={{ color: C_SUBTITLE }}>{label}</span>
      <span className="text-[12px] sm:text-[13px] font-semibold text-left truncate max-w-[55%]" style={{ color: C_TEXT }}>{display || "—"}</span>
    </div>
  );
}

// ─── session status badge ────────────────────────────────────────────────────
function SessionBadge({ s }) {
  // Normalise status — API may return string or {value,text} object or numeric
  const rawStatus = s.status?.value ?? s.status;
  const statusStr = rawStatus != null ? String(rawStatus).toLowerCase() : "";

  // Check if session date == today (used as fallback when status is unclear)
  const isToday = (() => {
    const d = s.date ?? s.start_date ?? (s.starts_at ?? "").split("T")[0];
    if (!d) return false;
    try {
      const sd = new Date(d.includes("T") ? d : `${d}T00:00:00`);
      const now = new Date();
      return sd.toDateString() === now.toDateString();
    } catch { return false; }
  })();

  // Check if session date is in the past
  const isPast = (() => {
    const d = s.date ?? s.start_date ?? (s.starts_at ?? "").split("T")[0];
    if (!d) return false;
    try {
      const sd = new Date(d.includes("T") ? d : `${d}T00:00:00`);
      // set to start of today for comparison
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      return sd < todayStart;
    } catch { return false; }
  })();

  // completed / done
  if (
    statusStr === "completed" || statusStr === "done" || statusStr === "1" ||
    rawStatus === 1 || rawStatus === true
  )
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ background: "#DCFAF3", color: "#0E9F8A" }}>مكتملة</span>;

  // cancelled
  if (statusStr === "cancelled" || statusStr === "canceled")
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ background: "#FBE9EA", color: "#C9505D" }}>ملغاة</span>;

  // today (explicit status or date match)
  if (statusStr === "today" || statusStr === "ongoing" || isToday)
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ background: "#EBF7F5", color: C_TEAL }}>اليوم</span>;

  // if no explicit status but date already passed → treat as completed
  if (isPast && !statusStr)
    return <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ background: "#DCFAF3", color: "#0E9F8A" }}>مكتملة</span>;

  // default → upcoming
  return <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap" style={{ background: C_LIGHT, color: C_SUBTITLE }}>قادمة</span>;
}

// ─── about tab content ───────────────────────────────────────────────────────
function AboutTab({ prog }) {
  if (!prog) return (
    <div className="px-3 sm:px-6 py-10 text-center text-[13px]" style={{ color: C_SUBTITLE }}>
      لا توجد بيانات
    </div>
  );

  const sessions  = prog.sessions  ?? [];
  // "ما ستكسبه" — use outcomes / objectives / checklist labels as numbered points
  const outcomes  = prog.outcomes ?? prog.objectives ?? prog.what_you_learn ?? [];
  const checklist = prog.checklist ?? [];
  const points    = outcomes.length > 0
    ? outcomes.map(o => (typeof o === "string" ? o : o.text ?? o.label ?? o.name ?? ""))
    : checklist.map(c => c.label ?? "");

  const description = nameOf(prog.description_translations ?? prog.description);

  return (
    <div dir="rtl" className="px-3 sm:px-6 pb-6">

      {/* ── وصف البرنامج ─────────────────────────────────────────────────── */}
      <div className="pt-5">
        <h3 className="text-[14px] font-extrabold mb-3" style={{ color: C_DARK }}>وصف البرنامج</h3>
        <p className="text-[13px] leading-[2]" style={{ color: C_TEXT }}>
          {description && description !== "—" ? description : "لا يوجد وصف."}
        </p>
      </div>

      {/* ── ما ستكسبه من البرنامج ────────────────────────────────────────── */}
      {points.filter(Boolean).length > 0 && (
        <div className="pt-5">
          <h3 className="text-[14px] font-extrabold mb-3" style={{ color: C_DARK }}>ما ستكسبه من البرنامج</h3>
          <div className="flex flex-col gap-0" style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            {points.filter(Boolean).map((point, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white"
                style={{ borderBottom: i === points.filter(Boolean).length - 1 ? "none" : `1px solid ${C_LIGHT}` }}>
                {/* number circle */}
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
                  style={{ background: C_LIGHT, color: C_PRIMARY }}>{i + 1}</span>
                <span className="text-[13px]" style={{ color: C_TEXT }}>{point}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── الجلسات ──────────────────────────────────────────────────────── */}
      <div className="pt-5">
        <h3 className="text-[14px] font-extrabold mb-3" style={{ color: C_DARK }}>الجلسات</h3>
        {sessions.length === 0 ? (
          <p className="text-[13px] text-center py-8" style={{ color: C_SUBTITLE }}>
            لا توجد جلسات مسجلة بعد
          </p>
        ) : (
          <div style={{ border: `1px solid ${C_BORDER}`, borderRadius: 12, overflow: "hidden" }}>
            {sessions.map((s, i) => {
              const title   = nameOf(s.title ?? s.name);
              const dateStr = dateOf(s.date ?? s.starts_at ?? s.start_date);
              const timeStr = (() => {
                const raw = s.starts_at ?? s.start_time ?? s.time ?? "";
                if (!raw) return "";
                // if it's a full ISO string take time portion
                const t = raw.includes("T") ? raw.split("T")[1]?.slice(0, 5) : raw.slice(0, 5);
                // convert 24h to 12h Arabic
                try {
                  const [hh, mm] = t.split(":").map(Number);
                  const period = hh >= 12 ? "م" : "ص";
                  const h12 = ((hh % 12) || 12);
                  return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${period}`;
                } catch { return t; }
              })();

              return (
                <div key={s.id ?? i}
                  className="flex items-center gap-3 px-4 py-3.5 bg-white"
                  style={{ borderBottom: i === sessions.length - 1 ? "none" : `1px solid ${C_LIGHT}` }}>

                  {/* number */}
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
                    style={{ background: C_LIGHT, color: C_PRIMARY }}>{i + 1}</span>

                  {/* title + date/time */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold leading-tight truncate" style={{ color: C_TEXT }}>
                      {title}
                    </p>
                    {(dateStr || timeStr) && (
                      <p className="text-[11px] mt-0.5" style={{ color: C_SUBTITLE }} dir="rtl">
                        {[dateStr, timeStr].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* status badge */}
                  <SessionBadge s={s} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function EnrolledProgramDetailPage({ program, onBack }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("enrolled");
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // program details from /company/programs/:id
  const [progDetail, setProgDetail] = useState(null);
  const [progDetailLoading, setProgDetailLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [search, setSearch] = useState("");
  const [filterDept,     setFilterDept]     = useState("all");
  const [filterTitle,    setFilterTitle]    = useState("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);

  const id = program?.id ?? program?.programId ?? localStorage.getItem("enrolledProgramId") ?? null;
  // The actual program id to fetch details from /company/programs/:id
  const programId = program?.program_id ?? program?.programId ?? id;

  // close filter menu on outside click
  useEffect(() => {
    const handler = e => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target))
        setShowFilterMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // survive refresh: remember last viewed enrolled-program id
  useEffect(() => {
    const pid = program?.id ?? program?.programId;
    if (pid !== undefined && pid !== null) localStorage.setItem("enrolledProgramId", String(pid));
  }, [program]);

  useEffect(() => {
    if (id === null || id === undefined) return undefined;
    let on = true;
    fetchCompanyEnrolledProgram(id)
      .then(res => { if (on) setD(res?.data ?? null); })
      .catch(e => { if (on) setError(e?.message || "تعذر تحميل تفاصيل البرنامج"); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [id]);

  // fetch real program details from /company/programs/:id
  useEffect(() => {
    const pid = programId;
    if (pid === null || pid === undefined) return undefined;
    let on = true;
    setProgDetailLoading(true);
    fetchCompanyProgramDetail(pid)
      .then(res => { if (on) setProgDetail(res?.data ?? null); })
      .catch(() => { /* silently ignore — fallback to enrolled data */ })
      .finally(() => { if (on) setProgDetailLoading(false); });
    return () => { on = false; };
  }, [programId]);

  // members come from a separate paginated endpoint
  useEffect(() => {
    if (id === null || id === undefined) return undefined;
    let on = true;
    fetchCompanyEnrolledProgramMembers(id, { per_page: 100 })
      .then(res => {
        if (!on) return;
        setMembers(res?.data?.data ?? []);
        setMembersTotal(res?.data?.total ?? res?.data?.data?.length ?? 0);
      })
      .catch(() => { if (on) setMembers([]); })
      .finally(() => { if (on) setMembersLoading(false); });
    return () => { on = false; };
  }, [id]);

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };
  const refreshMembers = () => {
    setMembersLoading(true);
    fetchCompanyEnrolledProgramMembers(id, { per_page: 100 })
      .then(res => {
        setMembers(res?.data?.data ?? []);
        setMembersTotal(res?.data?.total ?? res?.data?.data?.length ?? 0);
      })
      .catch(() => { setMembers([]); })
      .finally(() => setMembersLoading(false));
  };
  const onAdded = (msg) => {
    setSuccessMsg(msg || "تم إضافة الموظفين بنجاح.");
    refreshMembers();
    window.setTimeout(() => setSuccessMsg(""), 4000);
  };

  // ── derived stats ────────────────────────────────────────────────────────
  const completion = Math.round(Number(d?.completion_rate ?? 0));
  const sessionsLeft = Math.max(0, Number(d?.sessions_total ?? 0) - Number(d?.sessions_completed ?? 0));
  const registered = d?.registered_employees ?? d?.active_members_count ?? membersTotal ?? 0;
  const seatsLeft = d?.remaining_seats ?? d?.available_seats ?? 0;

  // ── members table data ─────────────────────────────────────────────────────
  const rows = members ?? [];

  const uniqueDepts = useMemo(() => {
    const s = new Set(rows.map(m => {
      return typeof m.employee?.department === "object"
        ? m.employee.department?.name
        : (m.employee?.department ?? m.department ?? "");
    }).filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b, "ar"));
  }, [rows]);

  const uniqueTitles = useMemo(() => {
    const s = new Set(rows.map(m => m.employee?.job_title ?? m.job_title ?? "").filter(Boolean));
    return [...s].sort((a, b) => a.localeCompare(b, "ar"));
  }, [rows]);

  const isFilterActive = filterDept !== "all" || filterTitle !== "all";

  const filteredRows = rows.filter(m => {
    const name  = m.employee?.name ?? m.name ?? "";
    const dept  = typeof m.employee?.department === "object"
      ? m.employee.department?.name
      : (m.employee?.department ?? m.department ?? "");
    const title = m.employee?.job_title ?? m.job_title ?? "";
    const matchSearch = !search.trim() ||
      String(name).toLowerCase().includes(search.trim().toLowerCase()) ||
      String(dept).toLowerCase().includes(search.trim().toLowerCase());
    const matchDept  = filterDept  === "all" || dept  === filterDept;
    const matchTitle = filterTitle === "all" || title === filterTitle;
    return matchSearch && matchDept && matchTitle;
  });

  // ── loading / error / no-id states ────────────────────────────────────────
  if (id === null || id === undefined) {
    return (
      <main className="flex-1 overflow-y-auto bg-white flex items-center justify-center" dir="rtl" style={{ fontFamily: FONT_CSS }}>
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
          style={{ border: `1px solid ${C_BORDER}` }}>
          <p className="text-[13px]" style={{ color: C_SUBTITLE }}>لم يتم العثور على البرنامج المسجل</p>
          <button onClick={handleBack}
            className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white hover:opacity-90 transition"
            style={{ background: C_PRIMARY }}>رجوع</button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-white flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#005A8D] animate-spin" />
          <p className="text-[13px]" style={{ color: C_SUBTITLE }}>جارٍ تحميل تفاصيل البرنامج...</p>
        </div>
      </main>
    );
  }

  if (error || !d) return (
    <main className="flex-1 overflow-y-auto bg-white flex items-center justify-center" dir="rtl" style={{ fontFamily: FONT_CSS }}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
        style={{ border: `1px solid ${C_BORDER}` }}>
        <p className="text-[13px]" style={{ color: C_SUBTITLE }}>
          {error || "تعذر تحميل تفاصيل البرنامج"}
        </p>
        <button onClick={handleBack}
          className="px-4 py-2.5 rounded-xl text-[12px] font-bold text-white hover:opacity-90 transition"
          style={{ background: C_PRIMARY }}>رجوع</button>
      </div>
    </main>
  );

  const pd = d.program_details ?? {};
  const sd = d.program ?? {};
  const programName = nameOf(
    progDetail?.name_translations ?? progDetail?.name ??
    sd.name ?? pd.name ?? program?.name
  );

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="rtl" style={{ fontFamily: FONT_CSS }}>
      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── breadcrumb ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#EBF7F5", color: C_TEAL }}>
              <IcoGrad size={14} />
            </span>
            <nav className="flex items-center gap-1.5 text-[12px] sm:text-[13px] min-w-0">
              <span className="shrink-0" style={{ color: C_SUBTITLE }}>البرامج التدريبية</span>
              <span className="shrink-0" style={{ color: "#C6D0D8" }}>/</span>
              <span className="font-bold truncate" style={{ color: C_DARK }}>تفاصيل البرنامج</span>
            </nav>
          </div>
          <button onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold bg-white border hover:bg-slate-50 transition shrink-0"
            style={{ borderColor: C_BORDER, color: C_DARK }}>
            <IcoBack />
            رجوع
          </button>
        </div>

        {/* ── title ─────────────────────────────────────────────────────────── */}
        <h1 className="mt-4 sm:mt-5 text-[17px] sm:text-[22px] font-extrabold leading-snug"
          style={{ color: C_DARK, lineHeight: 1.45 }}>{programName}</h1>

        {/* ── stats cards ───────────────────────────────────────────────────── */}
        <div className="mt-4 sm:mt-5 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5">
          <StatCard label="نسبة الإتمام" value={`${completion}%`} progress={completion} progressWidth={completion} />
          <StatCard label="اللقاءات المتبقية" value={sessionsLeft}
            icon={<span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EBF2F7" }}><IcoCalendar /></span>} />
          <StatCard label="المقاعد المتاحة" value={seatsLeft}
            icon={<span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "#EBF2F7" }}><IcoSeats /></span>} />
        </div>

        {/* ── tabs ──────────────────────────────────────────────────────────── */}
        <div className="mt-6 flex items-center border-b" style={{ borderColor: C_BORDER }}>
          <Tab label="الموظفون المسجلون" active={tab === "enrolled"} onClick={() => setTab("enrolled")} />
          <Tab label="عن البرنامج" active={tab === "about"} onClick={() => setTab("about")} />
        </div>

        {tab === "about" ? (
          <div className="mt-1 bg-white" style={{ border: `1px solid ${C_BORDER}`, borderRadius: 16 }}>
            {progDetailLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-[13px]" style={{ color: C_SUBTITLE }}>
                <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#005A8D] animate-spin" />
                جارٍ تحميل تفاصيل البرنامج...
              </div>
            ) : (
              <AboutTab prog={progDetail ?? (d?.program ?? d?.program_details ?? null)} />
            )}
          </div>
        ) : (
          <>
            {/* ── section toolbar ──────────────────────────────────────── */}
            <div className="mt-5">
              <div className="flex items-center gap-2 flex-wrap">
                {/* icon + title + count */}
                <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#EBF7F5", color: C_TEAL }}>
                  <IcoUsers size={16} color={C_TEAL} />
                </span>
                <h2 className="text-[14px] sm:text-[15px] font-bold shrink-0" style={{ color: C_DARK }}>الموظفون المسجلون</h2>
                <span className="text-[12px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: C_LIGHT, color: C_SUBTITLE }}>{rows.length}</span>

                {/* registered badge */}
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-semibold shrink-0"
                  style={{ background: "#EBF2F7", color: C_DARK }}>
                  <IcoUsers size={13} color={C_DARK} />
                  {registered} موظف مسجل
                </span>

                {/* search */}
                <div className="relative flex-1 min-w-[140px] max-w-xs">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoSearch /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="البحث عن موظف"
                    className="w-full h-9 pr-9 pl-3 rounded-lg border text-[12px] bg-white
                      focus:outline-none focus:ring-2 focus:ring-[#005A8D]/15 focus:border-[#005A8D] transition placeholder:text-slate-300"
                    style={{ borderColor: C_BORDER, color: C_TEXT }} />
                </div>

                {/* filter */}
                <div className="relative" ref={filterMenuRef}>
                  <button type="button" aria-label="فلاتر"
                    onClick={() => setShowFilterMenu(o => !o)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center border transition shrink-0"
                    style={{
                      borderColor: isFilterActive ? C_PRIMARY : C_BORDER,
                      background:  isFilterActive ? "#EBF2F7"  : "#fff",
                    }}>
                    <IcoFilter color={isFilterActive ? C_PRIMARY : "#5A7184"} />
                  </button>
                  {showFilterMenu && (
                    <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-lg z-50 overflow-hidden min-w-[190px] max-h-72 overflow-y-auto"
                      style={{ border: `1px solid ${C_BORDER}` }}>
                      <p className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: C_SUBTITLE }}>القسم</p>
                      {["all", ...uniqueDepts].map(dep => (
                        <button key={dep} onClick={() => setFilterDept(dep)}
                          className="w-full text-right px-3 py-2 text-[12px] hover:bg-slate-50 transition"
                          style={{ color: filterDept === dep ? C_PRIMARY : C_TEXT, fontWeight: filterDept === dep ? 700 : 400 }}>
                          {dep === "all" ? "كل الأقسام" : dep}
                        </button>
                      ))}
                      {uniqueTitles.length > 0 && (
                        <>
                          <div className="h-px mx-3 my-1" style={{ background: C_BORDER }} />
                          <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: C_SUBTITLE }}>المسمى الوظيفي</p>
                          {["all", ...uniqueTitles].map(t => (
                            <button key={t} onClick={() => setFilterTitle(t)}
                              className="w-full text-right px-3 py-2 text-[12px] hover:bg-slate-50 transition"
                              style={{ color: filterTitle === t ? C_PRIMARY : C_TEXT, fontWeight: filterTitle === t ? 700 : 400 }}>
                              {t === "all" ? "كل المسميات" : t}
                            </button>
                          ))}
                        </>
                      )}
                      {isFilterActive && (
                        <button onClick={() => { setFilterDept("all"); setFilterTitle("all"); setShowFilterMenu(false); }}
                          className="w-full text-right px-3 py-2.5 text-[12px] border-t hover:bg-red-50 transition"
                          style={{ borderColor: C_BORDER, color: "#ef4444" }}>
                          إلغاء الفلاتر
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* refresh */}
                <button type="button" aria-label="تحديث"
                  onClick={refreshMembers}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border hover:bg-slate-50 transition shrink-0"
                  style={{ borderColor: C_BORDER }}>
                  <IcoRefresh color={membersLoading ? C_PRIMARY : "#5A7184"} />
                </button>

                <button type="button" onClick={() => setShowAdd(true)}
                  className="h-9 px-3 sm:px-4 rounded-lg text-white text-[12px] font-bold flex items-center gap-1.5 transition hover:opacity-90 shrink-0 whitespace-nowrap"
                  style={{ background: C_PRIMARY }}>
                  <IcoPlus color="#fff" />
                  <span className="hidden xs:inline">إضافة موظف جديد</span>
                  <span className="xs:hidden">إضافة</span>
                </button>
              </div>
            </div>

            {/* ── employees table ───────────────────────────────────────────── */}
            <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${C_BORDER}` }}>
              <div className="enrolled-scroll overflow-y-auto" style={{ maxHeight: 400 }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[13px]" style={{ minWidth: 660, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: C_LIGHT }}>
                        {["اسم الموظف", "القسم", "المسمى الوظيفي", "الجلسات المتبقية", "#"].map((h) => (
                          <th key={h} className="px-4 py-3 text-[12px] font-bold whitespace-nowrap"
                            style={{ color: C_DARK, borderBottom: `1px solid ${C_BORDER}` }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((m, i) => {
                        const emp = m.employee ?? {};
                        const name = emp.name ?? m.name ?? "—";
                        const dept = typeof emp.department === "object" ? emp.department?.name
                          : (emp.department ?? m.department ?? "—");
                        const title = emp.job_title ?? m.job_title ?? "—";
                        const left = m.sessions_left ?? m.sessions_remaining ?? m.remaining_sessions;
                        return (
                          <tr key={m.id ?? i} style={{ background: i % 2 === 1 ? "#F9FBFC" : "#FFFFFF" }}>
                            <td className="px-4 py-3 font-semibold whitespace-nowrap"
                              style={{ color: C_TEXT }}>{name}</td>
                            <td className="px-4 py-3 text-[12px] whitespace-nowrap"
                              style={{ color: C_SUBTITLE }}>{dept}</td>
                            <td className="px-4 py-3 text-[12px] whitespace-nowrap"
                              style={{ color: C_SUBTITLE }}>{title}</td>
                            <td className="px-4 py-3 text-[12px] font-semibold whitespace-nowrap"
                              style={{ color: C_SUBTITLE }}>
                              {left === undefined || left === null ? "—" : `${left} ${left === 1 || left === 2 ? "جلسة" : left <= 10 ? "جلسات" : "جلسة"}`}
                            </td>
                            <td className="px-4 py-3 text-[12px] font-semibold whitespace-nowrap"
                              style={{ color: "#B3BEC7" }}>{i + 1}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {membersLoading && (
                    <div className="flex items-center justify-center gap-2 py-8 text-[12px]" style={{ color: C_SUBTITLE }}>
                      <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-[#005A8D] animate-spin" />
                      جارٍ تحميل الموظفين...
                    </div>
                  )}
                  {!membersLoading && filteredRows.length === 0 && (
                    <div className="py-10 text-center text-[12px]" style={{ color: C_SUBTITLE }}>
                      {rows.length === 0 ? "لم يتم تسجيل موظفين بعد" : "لا توجد نتائج تطابق البحث"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── add-employee modal ──────────────────────────────────────────────── */}
      {showAdd && <AddEmployeeModal id={id} onClose={() => setShowAdd(false)} onAdded={onAdded} />}

      {/* ── success popup with the API message ──────────────────────────────── */}
      {successMsg && <SuccessModal message={successMsg} onClose={() => setSuccessMsg("")} />}

      {/* thin scrollbar for the table area */}
      <style>{`
        .enrolled-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .enrolled-scroll::-webkit-scrollbar-track { background: transparent; }
        .enrolled-scroll::-webkit-scrollbar-thumb { background: #D5DEE4; border-radius: 999px; }
        .enrolled-scroll::-webkit-scrollbar-thumb:hover { background: #BCC9D2; }
        .enrolled-scroll { -webkit-scrollbar-width: thin; }
      `}</style>
    </main>
  );
}