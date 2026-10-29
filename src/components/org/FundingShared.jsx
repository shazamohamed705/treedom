import { useState } from "react";

// ═══════════════════════ Design tokens — طلبات تمويل الموظفين ═══════════════
export const C = {
  primary:   "#075985",
  pageBg:    "#FAFBFC",
  border:    "#E8EDF2",
  text:      "#263746",
  muted:     "#8A9AAA",
  success:   "#16A36A",
  successBg: "#ECFDF3",
  warning:   "#F59E0B",
  warningBg: "#FFF7E8",
  danger:    "#EF6A67",
  dangerBg:  "#FFF1F1",
  white:     "#FFFFFF",
};

// ═══════════════════════ Status config ═══════════════════════════════════════
export const REQUEST_STATUS = {
  pending:   { label: "قيد المراجعة", color: C.warning, bg: C.warningBg, icon: "clock"   },
  approved:  { label: "موافق عليه",   color: C.success, bg: C.successBg, icon: "check"   },
  rejected:  { label: "مرفوض",        color: C.danger,  bg: C.dangerBg,  icon: "x"       },
};

// ═══════════════════════ Icons ═══════════════════════════════════════════════
export const Ico = ({ d, size = 16, stroke = "currentColor", sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block" }}>{d}</svg>
);

const ICONS = {
  clock: <> <circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/> </>,
  check: <> <polyline points="20 6 9 17 4 12"/> </>,
  x:     <> <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/> </>,
  search:<><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  "...": null,
};
ICONS["chev-left"] = <> <polyline points="15 18 9 12 15 6"/> </>;
ICONS["arrow-left"] = <> <polyline points="15 18 9 12 15 6"/> </>;
ICONS["back"] = <> <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/> </>;
ICONS["briefcase"] = <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>;
ICONS["calendar"] = <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>;
ICONS["user"] = <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>;
ICONS["mail"] = <><rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="22 6 12 13 2 6"/></>;
ICONS["file"] = <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>;
ICONS["download"] = <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>;
ICONS["eye"] = <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>;
ICONS["alert"] = <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>;
ICONS["inbox"] = <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>;
ICONS["edit"] = <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>;
ICONS["money"] = <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>;
ICONS["lock"] = <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>;

export function Icon({ name, size = 16, color = "currentColor", sw = 1.8 }) {
  const d = ICONS[name];
  if (!d) return null;
  return <Ico size={size} stroke={color} sw={sw} d={d} />;
}

// ═══════════════════════ Status badge ════════════════════════════════════════
export function StatusIcon({ status, size = 14 }) {
  const cfg = REQUEST_STATUS[status];
  const name = cfg?.icon ?? "clock";
  const color = cfg?.color ?? C.muted;
  return (
    <span className="w-6 h-6 rounded-[8px] flex items-center justify-center shrink-0"
      style={{ background: cfg?.bg ?? C.pageBg, color }}>
      <Icon name={name} size={size} color={color} />
    </span>
  );
}

export function StatusBadge({ status }) {
  const cfg = REQUEST_STATUS[status];
  if (!cfg) return null;
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      <Icon name={cfg.icon} size={11} color={cfg.color} sw={2.4} />
      {cfg.label}
    </span>
  );
}

// ═══════════════════════ Buttons ══════════════════════════════════════════════
export function Button({ children, variant = "primary", icon, loading, disabled, onClick, className = "" }) {
  const styles = {
    primary:   { background: C.primary, color: "#fff", border: "1px solid transparent" },
    secondary: { background: C.white,   color: C.primary, border: `1px solid ${C.border}` },
    danger:    { background: C.danger,  color: "#fff", border: "1px solid transparent" },
    success:   { background: C.success, color: "#fff", border: "1px solid transparent" },
  };
  const s = styles[variant] ?? styles.primary;
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading}
      className={`h-[40px] px-5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2
        transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={s}>
      {loading && (
        <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      )}
      {!loading && icon}
      {children}
    </button>
  );
}

// ═══════════════════════ Search input ═════════════════════════════════════════
export function SearchInput({ value, onChange, placeholder = "بحث..." }) {
  return (
    <div className="relative w-full max-w-[300px]" dir="rtl">
      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A9AAA]">
        <Icon name="search" size={15} />
      </span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-[38px] pr-9 pl-3 rounded-xl border bg-white text-[12px]
          text-[#263746] placeholder:text-[#A8B4BE] focus:outline-none focus:border-[#075985] transition"
        style={{ borderColor: C.border }} />
    </div>
  );
}

// ═══════════════════════ Status tabs ══════════════════════════════════════════
export const TABS = [
  { key: "all",      label: "الكل",             count: null },
  { key: "pending",  label: "قيد المراجعة",     count: null },
  { key: "approved", label: "تمت الموافقة",     count: null },
  { key: "rejected", label: "مرفوض",            count: null },
];

export function StatusTabs({ value, onChange, counts }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" dir="rtl">
      {TABS.map(t => {
        const active = value === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)}
            className={`h-[36px] px-4 rounded-xl text-[12px] font-bold transition border
              ${active ? "text-white" : "bg-white text-[#263746] hover:border-[#075985]/40"}`}
            style={{
              background: active ? C.primary : C.white,
              borderColor: active ? C.primary : C.border,
            }}>
            {t.label}
            {counts?.[t.key] !== undefined && (
              <span className={`mr-1.5 text-[10px] ${active ? "text-white/80" : "text-[#8A9AAA]"}`}>
                ({counts[t.key]})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════ Section card ═════════════════════════════════════════
export function Card({ title, icon, children, className = "", style }) {
  return (
    <section className={`bg-white rounded-2xl border p-5 sm:p-6 ${className}`}
      style={{ ...{ borderColor: C.border }, ...style }}>
      {title && (
        <h2 className="flex items-center gap-2.5 text-[15px] font-bold mb-5" style={{ color: C.primary }}>
          {icon}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function InfoRow({ label, value, icon }) {
  return (
    <div className="py-2.5 border-b last:border-b-0" style={{ borderColor: C.border }}>
      <p className="text-[11px] mb-1 flex items-center gap-1.5" style={{ color: C.muted }}>{icon}{label}</p>
      <p className="text-[13px] font-semibold" style={{ color: C.text }}>{value}</p>
    </div>
  );
}

// ═══════════════════════ Timeline ═════════════════════════════════════════════
export const TIMELINE_STEPS = ["تم تقديم الطلب", "قيد المراجعة", "قرار الإدارة", "مكتمل"];

export function Timeline({ current = 1 }) {
  return (
    <div className="p-5 sm:p-6" dir="rtl">
      <div className="flex items-center">
        {TIMELINE_STEPS.map((label, i) => {
          const done = i < current;
          const isNow = i === current;
          return (
            <div key={label} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold
                  ${done ? "text-white" : isNow ? "text-white" : "text-[#8A9AAA]"}`}
                  style={{
                    background: done ? C.success : isNow ? C.primary : C.border,
                  }}>
                  {done ? <Icon name="check" size={13} color="#fff" sw={2.6} /> : i + 1}
                </span>
                <span className={`text-[10px] text-center max-w-[70px] leading-tight
                  ${done ? "text-[#075985] font-bold" : isNow ? "font-bold" : "text-[#8A9AAA]"}`}>
                  {label}
                </span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className="flex-1 h-[2px] mx-2 mb-6"
                  style={{ background: i < current ? C.success : C.border }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════ File attachment card ═════════════════════════════════
export function FileCard({ name, type, size }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3.5 bg-white"
      style={{ borderColor: C.border }}>
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: C.pageBg, color: C.primary }}>
          <Icon name="file" size={16} />
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-bold truncate" style={{ color: C.text }}>{name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{type} • {size}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button"
          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white transition hover:bg-[#F7FAFC]"
          style={{ borderColor: C.border, color: C.primary }} title="عرض الملف">
          <Icon name="eye" size={14} />
        </button>
        <button type="button"
          className="w-8 h-8 rounded-lg flex items-center justify-center border bg-white transition hover:bg-[#F7FAFC]"
          style={{ borderColor: C.border, color: C.primary }} title="تحميل">
          <Icon name="download" size={14} />
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════ Modal ════════════════════════════════════════════════
export function Modal({ open, onClose, title, children, maxWidth = 440 }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-[#0B1B2B]/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full bg-white rounded-2xl p-6 max-w-full"
        style={{ maxWidth, border: `1px solid ${C.border}` }}>
        {title && (
          <h3 className="text-[15px] font-bold mb-4" style={{ color: C.text }}>{title}</h3>
        )}
        {children}
      </div>
    </div>
  );
}

// ═══════════════════════ Empty / Error / Skeleton ═════════════════════════════
export function EmptyState({ title = "لا توجد طلبات", desc = "لا توجد طلبات تمويل متاحة في الوقت الحالي." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: C.successBg, color: C.success }}>
        <Icon name="inbox" size={26} />
      </span>
      <h3 className="text-[15px] font-bold" style={{ color: C.text }}>{title}</h3>
      <p className="text-[12px] mt-1.5 max-w-[340px]" style={{ color: C.muted }}>{desc}</p>
    </div>
  );
}

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: C.pageBg, color: C.primary }}>
        <Icon name="search" size={24} />
      </span>
      <h3 className="text-[15px] font-bold" style={{ color: C.text }}>لم يتم العثور على نتائج</h3>
      <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>جرّب تغيير كلمات البحث أو الفلاتر.</p>
    </div>
  );
}

export function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: C.dangerBg, color: C.danger }}>
        <Icon name="alert" size={26} />
      </span>
      <h3 className="text-[15px] font-bold" style={{ color: C.text }}>حدث خطأ</h3>
      <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>تعذر تحميل الطلبات، يرجى المحاولة مرة أخرى.</p>
      <button type="button" onClick={onRetry}
        className="mt-5 h-[38px] px-5 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
        style={{ background: C.primary }}>
        إعادة المحاولة
      </button>
    </div>
  );
}

// ── skeletons ─────────────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border p-5" style={{ borderColor: C.border }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2F5] animate-pulse shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 bg-[#EEF2F5] rounded-lg animate-pulse" />
            <div className="h-3 w-2/3 bg-[#EEF2F5] rounded-lg animate-pulse" />
            <div className="h-3 w-1/3 bg-[#EEF2F5] rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-24 bg-[#EEF2F5] rounded-full animate-pulse shrink-0" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

// ═══════════════════════ Toast (success message) ══════════════════════════════
export function SuccessToast({ show, message }) {
  if (!show) return null;
  return (
    <div className="fixed top-5 left-5 z-[70] flex items-center gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-lg"
      style={{ borderColor: C.successBg }}>
      <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.success }}>
        <Icon name="check" size={13} color="#fff" sw={2.6} />
      </span>
      <span className="text-[12px] font-bold" style={{ color: C.text }}>{message}</span>
    </div>
  );
}

// ═══════════════════════ Mock data ════════════════════════════════════════════
export const REQUESTS = [
  {
    id: "FIN-1042",
    status: "pending",
    subscribed: false,
    title: "القيادة الإدارية المتقدمة",
    employee: "أحمد محمود علي",
    role: "مهندس برمجيات",
    dept: "تقنية المعلومات",
    org: "أكاديمية الريادة",
    date: "28 أغسطس 2026",
    employeeInfo: { email: "ahmed@company.sa", empNo: "EMP-1052", title: "مهندس برمجيات", dept: "تقنية المعلومات" },
    program: {
      name: "القيادة الإدارية المتقدمة",
      provider: "أكاديمية الريادة",
      start: "10 سبتمبر 2026",
      end: "25 أكتوبر 2026",
      duration: "6 أسابيع",
      type: "حضوري",
      location: "الرياض — مركز الأمير سلطان",
      cost: "8,400 ر.س",
      priceShort: "3,500.00",
      currency: "ر.س",
      courseRating: 4.5,
      students: 500,
      timeShort: "30m",
      description: "برنامج تدريبي متخصص يهدف إلى تطوير مهارات القيادة والإدارة لدى المدراء التنفيذيين والمشرفين، من خلال محاور التفكير الاستراتيجي، وصناعة القرار، والقيادة الفعّالة للفرق.",
      content: [
        "مقدمة في القيادة الإدارية المتقدمة",
        "التفكير الاستراتيجي وتحليل الأعمال",
        "اتخاذ القرارات تحت الضغط",
        "مهارات التواصل والتحفيز للفرق",
        "قيادة التغيير ودراسات حالة عملية",
      ],
    },
    files: [
      { name: "عرض سعر البرنامج.pdf",  type: "PDF",  size: "1.2 MB" },
      { name: "خطاب الترشيح.docx",     type: "DOCX", size: "240 KB" },
    ],
  },
  {
    id: "FIN-1041",
    status: "approved",
    title: "إدارة المشاريع الاحترافية PMP",
    employee: "سارة إبراهيم خليل",
    role: "أخصائي تسويق",
    dept: "التسويق",
    org: "مركز التنمية الإدارية",
    date: "25 أغسطس 2026",
    inv: "INV-1032",
    employeeInfo: { email: "sara@company.sa", empNo: "EMP-1088", title: "أخصائي تسويق", dept: "التسويق" },
    program: {
      name: "إدارة المشاريع الاحترافية PMP",
      provider: "مركز التنمية الإدارية",
      start: "15 سبتمبر 2026",
      end: "20 أكتوبر 2026",
      duration: "5 أسابيع",
      type: "أونلاين (Zoom)",
      location: "عن بُعد",
      cost: "12,000 ر.س",
      description: "برنامج معتمد لتعزيز المعرفة والمهارات في إدارة المشاريع وفق منهجية PMBOK، يغطي نطاق المشروع والجدولة والموارد وإدارة المخاطر استعدادًا لشهادة PMP.",
      content: [
        "أساسيات إدارة المشاريع ومصطلحاتها",
        "إدارة نطاق المشروع والجدولة",
        "إدارة الموارد والمشتريات",
        "إدارة المخاطر والجودة",
        "محاكاة امتحان PMP",
      ],
    },
    files: [
      { name: "عرض سعر البرنامج.pdf",  type: "PDF",  size: "980 KB" },
      { name: "إثبات الدفع.pdf",        type: "PDF",  size: "310 KB" },
    ],
  },
  {
    id: "FIN-1040",
    status: "rejected",
    title: "الذكاء الاصطناعي للمديرين",
    employee: "ليلى أحمد محمد",
    role: "محلل بيانات",
    dept: "التخطيط",
    org: "معهد تكنولوجيا المعلومات",
    date: "20 أغسطس 2026",
    rejectReason: "ميزانية التدريب للعام الحالي مكتملة، يرجى إعادة الطلب في الربع القادم.",
    employeeInfo: { email: "laila@company.sa", empNo: "EMP-1095", title: "محلل بيانات", dept: "التخطيط" },
    program: {
      name: "الذكاء الاصطناعي للمديرين",
      provider: "معهد تكنولوجيا المعلومات",
      start: "1 أكتوبر 2026",
      end: "15 نوفمبر 2026",
      duration: "7 أسابيع",
      type: "حضوري",
      location: "جدة — فرع المعهد",
      cost: "15,500 ر.س",
      description: "برنامج يزوّد المديرين بالمعرفة العملية حول الذكاء الاصطناعي وأدواته، وكيفية توظيفه في تحسين القرارات ورفع الكفاءة التشغيلية داخل المؤسسات.",
      content: [
        "مقدمة في الذكاء الاصطناعي وتطبيقاته",
        "أدوات الذكاء الاصطناعي للمديرين",
        "توظيف البيانات في القرارات",
        "الذكاء الاصطناعي وتحسين العمليات",
        "دراسات حالة تطبيقية",
      ],
    },
    files: [
      { name: "عرض سعر البرنامج.pdf", type: "PDF", size: "1.1 MB" },
    ],
  },
  {
    id: "FIN-1039",
    status: "pending",
    title: "تحليل البيانات باستخدام Python",
    employee: "عمر خالد حسن",
    role: "محلل أعمال",
    dept: "العمليات",
    org: "أكاديمية البرمجة المتقدمة",
    date: "18 أغسطس 2026",
    employeeInfo: { email: "omar@company.sa", empNo: "EMP-1101", title: "محلل أعمال", dept: "العمليات" },
    program: {
      name: "تحليل البيانات باستخدام Python",
      provider: "أكاديمية البرمجة المتقدمة",
      start: "5 سبتمبر 2026",
      end: "30 سبتمبر 2026",
      duration: "4 أسابيع",
      type: "أونلاين (Zoom)",
      location: "عن بُعد",
      cost: "6,800 ر.س",
      description: "برنامج عملي يؤسس المتدربين في تحليل البيانات باستخدام لغة Python، من التعامل مع البيانات وحتى بناء التقارير التحليلية والتصورات البيانية.",
      content: [
        "أساسيات Python للبيانات",
        "معالجة البيانات بـ Pandas",
        "تصور البيانات بـ Matplotlib وSeaborn",
        "تحليل البيانات الإحصائي",
        "مشروع تحليلي ختامي",
      ],
    },
    files: [
      { name: "عرض سعر البرنامج.pdf", type: "PDF", size: "860 KB" },
      { name: "خطاب الترشيح.docx",    type: "DOCX", size: "210 KB" },
    ],
  },
  {
    id: "FIN-1038",
    status: "approved",
    title: "مهارات التفاوض المتقدمة",
    employee: "نورة عبدالله سعد",
    role: "أخصائي مشتريات",
    dept: "المشتريات",
    org: "مركز تنمية المهارات",
    date: "15 أغسطس 2026",
    inv: "INV-1029",
    employeeInfo: { email: "noura@company.sa", empNo: "EMP-1107", title: "أخصائي مشتريات", dept: "المشتريات" },
    program: {
      name: "مهارات التفاوض المتقدمة",
      provider: "مركز تنمية المهارات",
      start: "20 سبتمبر 2026",
      end: "24 سبتمبر 2026",
      duration: "5 أيام",
      type: "حضوري",
      location: "الرياض — فندق روز",
      cost: "5,200 ر.س",
      description: "برنامج مكثف لتنمية مهارات التفاوض المهني، يشمل استراتيجيات التفاوض الفعّال، والتعامل مع المواقف الصعبة، والوصول إلى اتفاقيات تحقق مصالح جميع الأطراف.",
      content: [
        "أساسيات التفاوض واستراتيجياته",
        "مراحل التفاوض الاحترافي",
        "التعامل مع الاعتراضات والمواقف الصعبة",
        "التفاوض الجماعي والشراكات",
        "تمارين تطبيقية وتقييم",
      ],
    },
    files: [
      { name: "عرض سعر البرنامج.pdf", type: "PDF", size: "720 KB" },
      { name: "إثبات الدفع.pdf",       type: "PDF", size: "280 KB" },
    ],
  },
  {
    id: "FIN-1037",
    status: "rejected",
    title: "القيادة التحولية",
    employee: "محمود سامي فتحي",
    role: "مشرف أول",
    dept: "الموارد البشرية",
    org: "أكاديمية القيادة",
    date: "12 أغسطس 2026",
    rejectReason: "البرنامج لا يتوافق مع خطة التطوير الوظيفي للعام الحالي.",
    employeeInfo: { email: "mahmoud@company.sa", empNo: "EMP-1112", title: "مشرف أول", dept: "الموارد البشرية" },
    program: {
      name: "القيادة التحولية",
      provider: "أكاديمية القيادة",
      start: "1 نوفمبر 2026",
      end: "5 نوفمبر 2026",
      duration: "5 أيام",
      type: "حضوري",
      location: "الرياض — مقر الأكاديمية",
      cost: "7,900 ر.س",
      description: "برنامج يركز على تطوير أسلوب القيادة التحولية لدى القادة، ويشمل بناء الرؤية، وتمكين الفرق، وتعزيز ثقافة الابتكار والتحسين المستمر.",
      content: [
        "مفهوم القيادة التحولية",
        "بناء الرؤية ورسالة الفريق",
        "تمكين الفرق والتفويض الفعّال",
        "قيادة ثقافة الابتكار",
        "خطة تطوير قيادي شخصية",
      ],
    },
    files: [
      { name: "عرض سعر البرنامج.pdf", type: "PDF", size: "640 KB" },
    ],
  },
];