import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import EnrollModal   from "../modals/EnrollModal";
import UploadCsvModal from "../modals/UploadCsvModal";
import ImportModal   from "../modals/ImportModal";
import SuccessModal  from "../modals/SuccessModal";
import { fetchCompanyProgramDetail, fetchCompanyEnrolledPrograms, fetchCompanyEnrolledProgramMembers } from "../../services/api";

// ─── colours ─────────────────────────────────────────────────────────────────
const BRAND = "#024677";
const TEAL  = "#14b8a6";
const GOLD  = "#f59e0b";

// ─── icon helper ─────────────────────────────────────────────────────────────
const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0 }}>{d}</svg>
);
const IcoBack     = ({ size = 15 }) => <I size={size} sw={2.2} d={<polyline points="15 18 9 12 15 6"/>} />;
const IcoGrad     = ({ size = 16 }) => <I size={size} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoUsers    = ({ size = 18 }) => <I size={size} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoSearch   = ({ size = 14 }) => <I size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoFilter   = ({ size = 14 }) => <I size={size} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoPlus     = ({ size = 14 }) => <I size={size} sw={2.5} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />;
const IcoCalendar = ({ size = 13 }) => <I size={size} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;

// ─── stat icons ───────────────────────────────────────────────────────────────
const StatIconSeat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const StatIconUsers = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const StatIconGrad = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

// ─── session status ───────────────────────────────────────────────────────────
const SESSION_STATUS = {
  "مكتملة": { color: "#fff",    bg: TEAL,      border: TEAL,      label: "مكتملة" },
  "اليوم":  { color: "#14b8a6", bg: "#EBF7F5",  border: "#14b8a6", label: "اليوم"  },
  "ملغاة":  { color: "#ef4444", bg: "#FEE2E2",  border: "#FCA5A5", label: "ملغاة"  },
  "قادمة":  { color: "#94a3b8", bg: "#fff",     border: "#E2E8F0", label: "قادمة"  },
};

// ─── mock data ────────────────────────────────────────────────────────────────
const MOCK_PROGRAM = {
  name: "الدليل الشامل لشهادة مهندس حلول AWS المعتمد – Associate SAA-C03 –",
  seatsAvailable: 20,
  enrolled: 12,
  seatsLeft: 8,
  completion: 45,
  trainerName: "م. كريم مصطفى الزيات",
  trainerOrg: "أكاديمية الريادة الخليجية",
  about: "برنامج متخصص يستهدف القادة والمدراء الراغبين في تطوير قدراتهم في التفكير الاستراتيجي وصنع القرارات في بيئات الأعمال المعقدة.",
  gains: [
    "تصميم VPC محكم مع Subnets عامة وخاصة",
    "الفرق بين Security Groups وNACLsg واستخدام كل منهما",
    "تطبيق مبدأ الصلاحيات الأدنى (Least Privilege)",
    "مراقبة حركة الشبكة عبر VPC Flow Logs",
  ],
  sessions: [
    { id: 1, title: "مقدمة: البنية التحتية السحابية",     date: "السبت، 15 أغسطس 2026",    time: "10:00 ص", status: "مكتملة" },
    { id: 2, title: "خدمات الحوسبة: EC2 و Lambda",        date: "السبت، 22 أغسطس 2026",    time: "10:00 ص", status: "مكتملة" },
    { id: 3, title: "التخزين والقواعد البيانات",            date: "السبت، 29 أغسطس 2026",    time: "10:00 ص", status: "مكتملة" },
    { id: 4, title: "إدارة التكاليف وأفضل الممارسات",      date: "الثلاثاء، 2 سبتمبر 2026", time: "3:00 م",  status: "اليوم"  },
    { id: 5, title: "الأمن والهوية وإدارة الوصول",          date: "السبت، 5 سبتمبر 2026",   time: "10:00 ص", status: "قادمة"  },
    { id: 6, title: "الشبكات المتقدمة وال VPN",             date: "السبت، 12 سبتمبر 2026",  time: "10:00 ص", status: "قادمة"  },
  ],
};

const MOCK_ENROLLED = [
  { id: 1, name: "أحمد محمد ماهر",      dept: "الإدارة التنفيذية", title: "أخصائي موارد بشرية", sessionsLeft: 6  },
  { id: 2, name: "عبدالله أحمد سعد",    dept: "الموارد البشرية",   title: "أخصائي موارد بشرية", sessionsLeft: 12 },
  { id: 3, name: "أكرم عبدالعزيز جمال", dept: "المالية",            title: "محاسب",               sessionsLeft: 3  },
  { id: 4, name: "مصطفى محمود عزالدين", dept: "المالية",            title: "محاسب",               sessionsLeft: 2  },
  { id: 5, name: "نورة سعد الحربي",     dept: "التسويق",            title: "مختص تسويق رقمي",    sessionsLeft: 5  },
  { id: 6, name: "خالد عبدالرحمن فهد",  dept: "تقنية المعلومات",   title: "مطور برمجيات",        sessionsLeft: 9  },
];

// ─── tab button ───────────────────────────────────────────────────────────────
function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      className="px-4 py-3 text-sm font-bold transition-all relative whitespace-nowrap"
      style={{ color: active ? BRAND : "#94a3b8" }}>
      {label}
      {active && (
        <span className="absolute bottom-0 right-0 left-0 h-[2.5px] rounded-full"
          style={{ background: BRAND }} />
      )}
    </button>
  );
}

// ─── "عن البرنامج" tab ────────────────────────────────────────────────────────
function AboutTab({ program, onCustomRequest }) {
  return (
    <div className="space-y-0" dir="rtl">

      {/* trainer card */}
      <div className="px-3 sm:px-6 pt-5 pb-4">
        <div className="flex items-center gap-3 px-3 sm:px-4 py-3 rounded-xl"
          style={{ background: "#F7F8FA" }}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0
            text-[12px] sm:text-[13px] font-extrabold text-white select-none"
            style={{ background: "linear-gradient(135deg,#024677 0%,#14b8a6 100%)" }}>
            {(program.trainerName ?? "م ك").split(" ").map(w => w[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-bold leading-tight truncate" style={{ color: "#1D293D" }}>
              {program.trainerName}
            </p>
            <p className="text-[10px] sm:text-xs mt-0.5 truncate" style={{ color: "#94a3b8" }}>
              • {program.trainerOrg}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[#F5F5F5]" />

      {/* description */}
      <div className="px-3 sm:px-6 py-5">
        <h3 className="text-sm font-extrabold mb-2" style={{ color: "#1D293D" }}>وصف البرنامج</h3>
        <p className="text-xs sm:text-sm leading-[1.95]" style={{ color: "#64748b" }}>{program.about}</p>
      </div>

      <div className="border-t border-[#F5F5F5]" />

      {/* gains */}
      <div className="px-3 sm:px-6 py-5">
        <h3 className="text-sm font-extrabold mb-4" style={{ color: "#1D293D" }}>ما ستكتسبه من البرنامج</h3>
        <ol className="space-y-3">
          {program.gains.map((g, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0
                text-xs font-extrabold text-white mt-0.5" style={{ background: BRAND }}>
                {i + 1}
              </span>
              <span className="text-xs sm:text-sm flex-1 leading-relaxed text-right" style={{ color: "#1D293D" }}>
                {g}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="border-t border-[#F5F5F5]" />

      {/* sessions */}
      <div className="px-3 sm:px-6 py-5">
        <h3 className="text-sm font-extrabold mb-4" style={{ color: "#1D293D" }}>الجلسات</h3>
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #EBEBEB" }}>
          {program.sessions.map((s, i) => {
            const cfg = SESSION_STATUS[s.status] ?? SESSION_STATUS["قادمة"];
            const isLast = i === program.sessions.length - 1;
            return (
              <div key={s.id} className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 bg-white"
                style={{ borderBottom: isLast ? "none" : "1px solid #F5F5F5" }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0
                  text-xs font-extrabold" style={{ background: "#F2F5F8", color: BRAND }}>
                  {s.id}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold leading-tight truncate" style={{ color: "#1D293D" }}>{s.title}</p>
                  <p className="text-[10px] sm:text-[11px] mt-0.5 truncate" style={{ color: "#94a3b8" }}>{s.date}، {s.time}</p>
                </div>
                <span className="shrink-0 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 rounded-full border whitespace-nowrap"
                  style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// ─── "الموظفون المسجلون" tab ──────────────────────────────────────────────────
function EnrolledTab({ employees }) {
  const [search, setSearch] = useState("");
  // flow: null → "enroll" → "upload" → "review" → "success"
  const [step, setStep] = useState(null);

  const filtered = employees.filter(e =>
    !search.trim() || e.name.includes(search.trim())
  );
  const COLS = ["#", "اسم الموظف", "القسم", "المسمى الوظيفي", "الجلسات المتبقية"];

  return (
    <>
      {/* ── modal flow ── */}
      {step === "enroll"  && <EnrollModal    onClose={() => setStep(null)} onConfirm={() => setStep("upload")} />}
      {step === "upload"  && <UploadCsvModal onClose={() => setStep(null)} onUploaded={() => setStep("review")} />}
      {step === "review"  && <ImportModal    onClose={() => setStep(null)} onConfirm={() => setStep("success")} />}
      {step === "success" && <SuccessModal   onClose={() => setStep(null)} />}

      <div dir="rtl">
        {/* toolbar */}
        <div className="flex flex-col gap-2 px-3 sm:px-5 py-3 border-b border-[#F0F0F0]
          sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0246770D", color: BRAND }}>
              <IcoUsers size={13} />
            </div>
            <h3 className="text-sm font-extrabold" style={{ color: BRAND }}>الموظفون المسجلون</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <IcoSearch />
              </span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن موظف"
                className="pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 w-full sm:w-40
                  focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                  transition placeholder:text-slate-300" />
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-xl border shrink-0
              border-slate-200 text-slate-500 hover:text-[#024677] hover:border-[#024677]/30 transition">
              <IcoFilter />
            </button>
            <button
              onClick={() => setStep("enroll")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shrink-0
                text-white hover:opacity-90 transition"
              style={{ background: BRAND }}>
              <IcoPlus />
              تسجيل موظف
            </button>
          </div>
        </div>

        {/* table */}
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-sm" style={{ minWidth: 500 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "1.5px solid #e2e8f0" }}>
                {COLS.map((h, i) => (
                  <th key={i} className="text-right text-xs font-bold px-3 sm:px-5 py-3 whitespace-nowrap"
                    style={{ color: BRAND }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={e.id} className="border-b border-[#F5F5F5] last:border-0"
                  style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                  <td className="px-3 sm:px-5 py-3 text-xs font-bold" style={{ color: "#94a3b8" }}>{i + 1}</td>
                  <td className="px-3 sm:px-5 py-3 font-semibold text-sm whitespace-nowrap" style={{ color: "#1D293D" }}>{e.name}</td>
                  <td className="px-3 sm:px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#64748b" }}>{e.dept}</td>
                  <td className="px-3 sm:px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#64748b" }}>{e.title}</td>
                  <td className="px-3 sm:px-5 py-3 text-xs whitespace-nowrap" style={{ color: "#64748b" }}>{e.sessionsLeft} جلسة</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-sm text-slate-400">لا توجد نتائج</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function ProgramDetailPage({ program, onBack, onCustomRequest }) {
  const navigate  = useNavigate();
  const [tab,        setTab]        = useState("about");
  const [apiData,    setApiData]    = useState(null);
  const [members,    setMembers]    = useState(null);
  const [enrolledId, setEnrolledId] = useState(null);  // enrolled_program id لو موجود
  const [loading,    setLoading]    = useState(false);

  // program_id — الـ id البرنامج العام دائماً
  const programId = program?.programId ?? program?.id;

  // 1. جلب تفاصيل البرنامج
  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    fetchCompanyProgramDetail(programId)
      .then(res => setApiData(res?.data ?? {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. تحقق هل الشركة مشتركة في هذا البرنامج عبر /company/enrolled-programs
  useEffect(() => {
    if (!programId) return;
    // لو program.programId موجود يعني جاي من enrolled context مباشرةً
    if (program?.programId) {
      setEnrolledId(program.id);  // program.id = enrolled_program_id
      return;
    }
    // جلب كل enrolled programs والبحث عن program_id مطابق
    fetchCompanyEnrolledPrograms({ per_page: 100 })
      .then(res => {
        const list = res?.data?.data ?? [];
        const match = list.find(e => String(e.program_id) === String(programId) && e.status === "active");
        if (match) setEnrolledId(match.id);
        else setEnrolledId(null);
      })
      .catch(() => setEnrolledId(null));
  }, [programId, program?.programId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. جلب الأعضاء لما يتحدد الـ enrolledId
  useEffect(() => {
    if (!enrolledId) return;
    fetchCompanyEnrolledProgramMembers(enrolledId, { per_page: 100 })
      .then(res => {
        const items = res?.data?.data ?? [];
        setMembers(items.map(m => ({
          id:           m.employee?.id   ?? m.id,
          name:         m.employee?.name ?? "—",
          dept:         m.employee?.department?.name ?? "—",
          title:        m.employee?.job_title ?? "—",
          sessionsLeft: m.remaining_sessions ?? "—",
        })));
      })
      .catch(() => setMembers([]));
  }, [enrolledId]); // eslint-disable-line react-hooks/exhaustive-deps

  const src = apiData ?? program ?? {};

  const prog = {
    ...MOCK_PROGRAM,
    ...src,
    name: (() => {
      const n = src.name_translations ?? src.name;
      if (!n) return MOCK_PROGRAM.name;
      if (typeof n === "object") return n?.ar ?? n?.en ?? MOCK_PROGRAM.name;
      return n;
    })(),
    about: (() => {
      const d = src.description_translations ?? src.description;
      if (!d) return MOCK_PROGRAM.about;
      if (typeof d === "object") return d?.ar ?? d?.en ?? MOCK_PROGRAM.about;
      return d;
    })(),
    // نسبة الإتمام — من progress_percent أو progress.completion_rate أو نحسبها من الجلسات
    completion: (() => {
      const direct = src.progress_percent ?? src.progress?.completion_rate ?? src.completion_rate;
      if (direct != null) return Math.round(Number(direct));
      // احسب من الجلسات لو موجودة
      if (Array.isArray(src.sessions) && src.sessions.length > 0) {
        const total = src.sessions.length;
        const done  = src.sessions.filter(s => {
          const rs = s.status?.value ?? s.status;
          return rs === "completed" || rs === "done" || rs === 1;
        }).length;
        return Math.round((done / total) * 100);
      }
      return MOCK_PROGRAM.completion;
    })(),
    // الموظفون المسجلون — من trainees_count
    enrolled:       src.trainees_count ?? src.seats?.registered_employees ?? MOCK_PROGRAM.enrolled,
    // المقاعد المتاحة — من max_capacity
    seatsAvailable: src.max_capacity ?? src.seats?.count ?? MOCK_PROGRAM.seatsAvailable,
    // المقاعد المتبقية — max_capacity - trainees_count لو الاتنين موجودين
    seatsLeft:      (src.max_capacity != null && src.trainees_count != null)
                      ? src.max_capacity - src.trainees_count
                      : (src.seats?.remaining ?? MOCK_PROGRAM.seatsLeft),
    trainerName: src.trainer?.name
      ?? (typeof src.trainer === "string" ? src.trainer : null)
      ?? src.trainerName ?? MOCK_PROGRAM.trainerName,
    trainerOrg:  src.provider?.name
      ?? (typeof src.provider === "string" ? src.provider : null)
      ?? src.trainerOrg ?? MOCK_PROGRAM.trainerOrg,
    gains: (() => {
      // keywords → name field
      if (Array.isArray(src.keywords) && src.keywords.length > 0)
        return src.keywords.map(k => typeof k === "object" ? (k.name ?? k.label ?? "") : k).filter(Boolean);
      // outcomes / objectives / what_you_learn
      const pts = src.outcomes ?? src.objectives ?? src.what_you_learn ?? src.checklist ?? src.gains;
      if (Array.isArray(pts) && pts.length > 0)
        return pts.map(p => typeof p === "object" ? (p.text ?? p.label ?? p.name ?? "") : p).filter(Boolean);
      return MOCK_PROGRAM.gains;
    })(),
    sessions: Array.isArray(src.sessions) && src.sessions.length > 0
      ? src.sessions.map((s, i) => {
          // ── resolve status from API ──────────────────────────────────
          const rawStatus = s.status?.value ?? s.status;
          const statusStr = rawStatus != null ? String(rawStatus).toLowerCase() : "";

          // date for today/past checks
          const dateRaw = s.date ?? s.start_date ?? (s.starts_at ?? "").split("T")[0];
          const sessionDate = dateRaw
            ? (() => { try { return new Date(dateRaw.includes("T") ? dateRaw : `${dateRaw}T00:00:00`); } catch { return null; } })()
            : null;
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
          const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);

          let resolvedStatus = "قادمة";
          if (statusStr === "completed" || statusStr === "done" || rawStatus === 1 || rawStatus === true) {
            resolvedStatus = "مكتملة";
          } else if (statusStr === "cancelled" || statusStr === "canceled") {
            resolvedStatus = "ملغاة";
          } else if (statusStr === "today" || statusStr === "ongoing") {
            resolvedStatus = "اليوم";
          } else if (sessionDate) {
            if (sessionDate >= todayStart && sessionDate < tomorrowStart) resolvedStatus = "اليوم";
            else if (sessionDate < todayStart) resolvedStatus = "مكتملة";
          }

          // ── resolve time string ──────────────────────────────────────
          const rawTime = s.starts_at ?? s.start_time ?? s.time ?? "";
          const timeStr = (() => {
            if (!rawTime) return "—";
            const t = rawTime.includes("T") ? rawTime.split("T")[1]?.slice(0, 5) : rawTime.slice(0, 5);
            try {
              const [hh, mm] = t.split(":").map(Number);
              const period = hh >= 12 ? "م" : "ص";
              const h12 = ((hh % 12) || 12);
              return `${String(h12).padStart(2, "0")}:${String(mm).padStart(2, "0")} ${period}`;
            } catch { return rawTime; }
          })();

          // ── resolve date string ──────────────────────────────────────
          const dateStr = (() => {
            if (!dateRaw || dateRaw === "—") return "—";
            try {
              const d = new Date(dateRaw.includes("T") ? dateRaw : `${dateRaw}T00:00:00`);
              return d.toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
            } catch { return dateRaw; }
          })();

          return {
            id:     s.id ?? i + 1,
            title:  typeof s.title === "object" ? (s.title?.ar ?? s.title?.en ?? `جلسة ${i + 1}`) : (s.title ?? s.name ?? `جلسة ${i + 1}`),
            date:   dateStr,
            time:   timeStr,
            status: resolvedStatus,
          };
        })
      : MOCK_PROGRAM.sessions,
  };

  // الأعضاء: API members > mock
  const enrolledEmployees = members ?? MOCK_ENROLLED;

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto bg-[#F7F8FA] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#024677] animate-spin" />
          <p className="text-sm text-slate-400">جارٍ تحميل التفاصيل...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto bg-[#F7F8FA]" dir="rtl">
      <div className="p-2 sm:p-3">
        <div className="max-w-[900px] mx-auto space-y-3">

          {/* ── breadcrumb + title — NO card wrapper ── */}
          <div className="bg-white rounded-2xl border border-[#E1E1E1] overflow-hidden">

            {/* breadcrumb row */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#F0F0F0]">
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#0246770D", color: BRAND }}>
                  <IcoGrad size={14} />
                </div>
                <span className="text-xs sm:text-sm shrink-0" style={{ color: "#94a3b8" }}>البرامج المسجلة /</span>
                <span className="text-xs sm:text-sm font-bold truncate" style={{ color: BRAND }}>تفاصيل البرنامج</span>
              </div>
              <button onClick={handleBack}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                  text-white hover:opacity-90 transition shrink-0"
                style={{ background: BRAND }}>
                <IcoBack />
                <span className="hidden xs:inline">رجوع</span>
                <span className="xs:hidden">رجوع</span>
              </button>
            </div>

            {/* program title */}
            <div className="px-4 sm:px-6 py-4">
              <h1 className="text-sm sm:text-base lg:text-lg font-extrabold leading-snug" style={{ color: "#1D293D" }}>
                {prog.name}
              </h1>
            </div>
          </div>

          {/* ── stats — 4 separate cards in a grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">

            {/* completion */}
            <div className="bg-white rounded-2xl border border-[#E1E1E1] px-3 sm:px-4 py-3 sm:py-4 flex flex-col gap-2" dir="rtl">
              <p className="text-[10px] sm:text-xs" style={{ color: "#94a3b8" }}>نسبة الإتمام</p>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold shrink-0" style={{ color: BRAND }}>
                  {prog.completion}%
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#F0F0F0" }}>
                  <div className="h-full rounded-full"
                    style={{ width: `${prog.completion}%`, background: BRAND }} />
                </div>
              </div>
            </div>

            {/* seats left */}
            <div className="bg-white rounded-2xl border border-[#E1E1E1] px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2" dir="rtl">
              <div className="min-w-0 text-right">
                <p className="text-[10px] sm:text-xs leading-tight" style={{ color: "#94a3b8" }}>المقاعد المتبقية</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1" style={{ color: "#1D293D" }}>{prog.seatsLeft ?? "—"}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#0246770D" }}>
                <StatIconSeat />
              </div>
            </div>

            {/* enrolled */}
            <div className="bg-white rounded-2xl border border-[#E1E1E1] px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2" dir="rtl">
              <div className="min-w-0 text-right">
                <p className="text-[10px] sm:text-xs leading-tight" style={{ color: "#94a3b8" }}>الموظفون المسجلون</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1" style={{ color: "#1D293D" }}>{prog.enrolled ?? "—"}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#0246770D" }}>
                <StatIconUsers />
              </div>
            </div>

            {/* total seats */}
            <div className="bg-white rounded-2xl border border-[#E1E1E1] px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2" dir="rtl">
              <div className="min-w-0 text-right">
                <p className="text-[10px] sm:text-xs leading-tight" style={{ color: "#94a3b8" }}>المقاعد المتاحة</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold mt-1" style={{ color: "#1D293D" }}>{prog.seatsAvailable ?? "—"}</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#0246770D" }}>
                <StatIconGrad />
              </div>
            </div>
          </div>

          {/* ── tabs + content card ── */}
          <div className="bg-white rounded-2xl border border-[#E1E1E1] overflow-hidden">
            {/* tabs row */}
            <div className="flex items-center border-b border-[#F0F0F0] px-4">
              <Tab label="عن البرنامج"       active={tab === "about"}    onClick={() => setTab("about")} />
              {enrolledId && (
                <Tab label="الموظفون المسجلون" active={tab === "enrolled"} onClick={() => setTab("enrolled")} />
              )}
            </div>
            {/* content */}
            {tab === "about"    && <AboutTab program={prog} onCustomRequest={onCustomRequest} />}
            {tab === "enrolled" && enrolledId && <EnrolledTab employees={enrolledEmployees} />}
          </div>

        </div>
      </div>
    </main>
  );
}
