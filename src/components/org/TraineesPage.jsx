import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchPurchaserIndividuals,
  fetchPurchaserCompanies,
  createOwnedTrainee,
} from "../../services/api";
import { normalizePhone, isPhoneValid, PHONE_ERROR_AR } from "../../services/registerDraft";
import { useToast } from "../shared/ToastProvider";

// ─────────────────────────────────────────────
// Palette
// ─────────────────────────────────────────────
const C = {
  primary:    "#075985",
  accent:     "#20C9B0",
  text:       "#1E293B",
  muted:      "#64748B",
  border:     "#E5E7EB",
  bg:         "#FFFFFF",
  card:       "#FFFFFF",
  lightBlue:  "#EFF6FF",
  lightGreen: "#ECFDF5",
};

function initialsOf(name) {
  return String(name || "—").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "—";
}

function typeLabel(type) {
  if (type === "company") return "شركة";
  if (type === "individual") return "فرد";
  return "موظف";
}

function typeStyle(type) {
  if (type === "company") return { background: "#FEF3C7", color: "#b45309" };
  if (type === "individual") return { background: C.lightGreen, color: "#059669" };
  return { background: C.lightBlue, color: C.primary };
}

// ─────────────────────────────────────────────
// Normalise individuals / companies APIs
// ─────────────────────────────────────────────
function normaliseIndividual(t) {
  const summary = t.attendance_summary ?? {};
  const programs = (t.programs ?? []).map(p => ({
    enrollmentId: p.enrollment_id,
    enrollmentNum: p.enrollment_num,
    programId: p.program?.id,
    programName: p.program?.name ?? "—",
    category: p.program?.category ?? "",
    field: p.program?.field ?? "",
    startDate: p.program?.start_date ?? "",
    endDate: p.program?.end_date ?? "",
    amount: p.payment?.total_amount ?? null,
    paidAt: p.payment?.paid_at ?? "",
    invoiceNum: p.payment?.invoice_num ?? "",
    attendance: typeof p.attendance?.attendance_percent === "number"
      ? Math.round(p.attendance.attendance_percent) : null,
    sessionsTotal: p.attendance?.sessions_total ?? 0,
    sessionsCompleted: p.attendance?.sessions_completed ?? 0,
    enrolledAt: p.enrolled_at ?? "",
  }));
  const name = t.name ?? "—";
  const programNames = programs.map(p => p.programName).filter(Boolean);
  return {
    key: `individual-${t.id}`,
    id: t.id,
    type: "individual",
    name,
    initials: initialsOf(name),
    email: t.email ?? "",
    phone: t.phone ?? "",
    attendance: typeof summary.overall_attendance_percent === "number"
      ? Math.round(summary.overall_attendance_percent) : null,
    programsCount: summary.programs_enrolled ?? programs.length,
    employeesCount: 0,
    programs,
    employees: [],
    programSubtitle: programNames.join(" · "),
    active: !!(t.is_active ?? t.active),
    city: t.city?.name ?? "",
    nationality: t.nationality?.name ?? "",
  };
}

function normaliseCompany(c) {
  const summary = c.attendance_summary ?? {};
  const purchases = c.purchases ?? [];
  const employees = purchases.flatMap(p =>
    (p.employees ?? []).map(e => {
      const name = e.name ?? "—";
      return {
        id: e.employee_id ?? e.member_id,
        memberId: e.member_id,
        name,
        initials: initialsOf(name),
        email: e.email ?? "",
        phone: e.phone ?? "",
        jobTitle: e.job_title ?? "",
        department: e.department ?? "",
        nationalId: e.national_id ?? "",
        hasAccess: !!e.has_access,
        attendance: typeof e.attendance?.attendance_percent === "number"
          ? Math.round(e.attendance.attendance_percent) : null,
        sessionsTotal: e.attendance?.sessions_total ?? 0,
        sessionsCompleted: e.attendance?.sessions_completed ?? 0,
        programName: p.program?.name ?? "",
        programId: p.program?.id,
      };
    })
  );
  const programNames = purchases.map(p => p.program?.name).filter(Boolean);
  const name = c.name ?? "—";
  return {
    key: `company-${c.id}`,
    id: c.id,
    type: "company",
    name,
    initials: initialsOf(name),
    email: c.email ?? "",
    phone: c.phone ?? "",
    commercialNumber: c.commercial_number ?? "",
    attendance: typeof summary.overall_attendance_percent === "number"
      ? Math.round(summary.overall_attendance_percent) : null,
    programsCount: summary.programs_purchased ?? purchases.length,
    employeesCount: summary.employees_total ?? employees.length,
    seatsPurchased: summary.seats_purchased ?? 0,
    programs: purchases.map(p => ({
      purchaseId: p.purchase_id,
      programId: p.program?.id,
      programName: p.program?.name ?? "—",
      category: p.program?.category ?? "",
      seatsCount: p.seats_count ?? 0,
      employeesCount: p.employees_count ?? (p.employees ?? []).length,
      amount: p.payment?.total_amount ?? p.price ?? null,
      paidAt: p.payment?.paid_at ?? p.purchase_date ?? "",
      invoiceNum: p.payment?.invoice_num ?? "",
      attendance: typeof p.attendance_summary?.average_attendance_percent === "number"
        ? Math.round(p.attendance_summary.average_attendance_percent) : null,
    })),
    employees,
    programSubtitle: programNames.join(" · "),
    active: !!(c.is_active ?? c.active),
  };
}

// ─────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────
function IcoUsers({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IcoUserCheck({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  );
}
function IcoBriefcase({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2"/>
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
    </svg>
  );
}
function IcoActivity({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IcoSearch({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IcoChevronDown({ size = 14, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={className}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function IcoX({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IcoFolder({ size = 20, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function IcoRefresh({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.9"/>
    </svg>
  );
}
function IcoEmpty({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Sparkline / StatCard
// ─────────────────────────────────────────────
const WAVES = [
  "M0 35 C40 28 70 42 110 34 S175 26 210 36 S260 44 300 38",
  "M0 38 C45 30 80 44 120 36 S180 28 215 38 S268 48 300 40",
  "M0 32 C38 40 72 26 115 34 S172 42 208 32 S262 22 300 36",
  "M0 40 C42 32 76 46 118 38 S177 30 212 40 S265 50 300 42",
];
function Sparkline({ color = C.accent, idx = 0, ratio = 0.5 }) {
  const uid = `sp-${color.replace("#", "")}-${idx}`;
  const line = WAVES[idx % WAVES.length];
  const r = Math.max(0.18, Math.min(1, Number(ratio) || 0));
  return (
    <div className="mt-1 rounded-xl overflow-hidden px-2" style={{ background: `${color}10` }}>
      <svg width="100%" height={26 + Math.round(r * 10)} viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${line} L300 72 L0 72 Z`} fill={`url(#${uid})`}/>
        <path d={line} stroke={color} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

function StatCard({ icon, title, value, sub, color = C.accent, idx = 0, ratio = 0.5 }) {
  return (
    <article
      className="bg-white rounded-2xl border px-5 pt-5 pb-4 flex flex-col gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
      style={{ borderColor: C.border }}
      dir="rtl">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}>
        {icon}
      </div>
      <p className="text-xs font-medium" style={{ color: C.muted }}>{title}</p>
      <p className="text-3xl font-extrabold leading-none" style={{ color: C.text }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: C.muted }}>{sub}</p>}
      <Sparkline color={color} idx={idx} ratio={ratio} />
    </article>
  );
}

function ProgressBar({ pct }) {
  if (pct === null || pct === undefined)
    return <span className="text-xs" style={{ color: C.muted }}>—</span>;
  const color = pct >= 80 ? C.accent : pct >= 50 ? "#f59e0b" : "#f87171";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: `${color}22` }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
      <span className="text-xs font-bold shrink-0" style={{ color }}>{pct}%</span>
    </div>
  );
}

function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}
function SkeletonStatCard() {
  return (
    <div className="bg-white rounded-2xl border p-5 flex flex-col gap-3" style={{ borderColor: C.border }}>
      <Sk className="w-10 h-10" />
      <Sk className="w-24 h-3 mt-1" />
      <Sk className="w-16 h-8" />
    </div>
  );
}
function SkeletonRow() {
  return (
    <tr>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Sk className="w-9 h-9 rounded-full" />
          <div className="flex flex-col gap-1.5"><Sk className="w-28 h-3" /><Sk className="w-20 h-2.5" /></div>
        </div>
      </td>
      <td className="px-5 py-3.5"><Sk className="w-20 h-3" /></td>
      <td className="px-5 py-3.5"><Sk className="w-16 h-3" /></td>
      <td className="px-5 py-3.5"><Sk className="w-12 h-3" /></td>
      <td className="px-5 py-3.5"><Sk className="w-full h-3 max-w-[120px]" /></td>
      <td className="px-4 py-3.5"><Sk className="w-16 h-8 rounded-lg" /></td>
    </tr>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center" dir="rtl">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: C.lightBlue }}>
        <IcoEmpty size={36} />
      </div>
      <div>
        <p className="text-base font-bold" style={{ color: C.text }}>لا يوجد مشتركون</p>
        <p className="text-sm mt-1.5 max-w-xs" style={{ color: C.muted }}>
          لم يتم العثور على أفراد أو شركات مطابقين للبحث الحالي.
        </p>
      </div>
      <button onClick={onReset}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90"
        style={{ background: C.primary, color: "#fff" }}>
        <IcoRefresh size={14} /> إعادة تعيين
      </button>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center" dir="rtl">
      <p className="text-base font-bold" style={{ color: C.text }}>حدث خطأ أثناء تحميل البيانات</p>
      <button onClick={onRetry}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
        style={{ background: C.primary }}>
        <IcoRefresh size={14} /> إعادة المحاولة
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Subscriber card (carousel — name + type)
// ─────────────────────────────────────────────
function SubscriberCard({ item, active, onSelect }) {
  const isCompany = item.type === "company";
  return (
    <article
      className="bg-white rounded-2xl border p-5 flex flex-col gap-3 transition-all duration-300 hover:shadow-md shrink-0"
      style={{
        borderColor: active ? C.primary : C.border,
        width: "260px",
        boxShadow: active ? `0 0 0 1px ${C.primary}33` : undefined,
      }}
      dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ background: isCompany ? "#f59e0b" : C.primary }}>
          {isCompany ? <IcoBriefcase size={17} /> : item.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate" style={{ color: C.text }}>{item.name}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: C.muted }}>
            {item.programSubtitle || item.email || "—"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={typeStyle(item.type)}>
          {typeLabel(item.type)}
        </span>
        {isCompany ? (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: "#FEF3C7", color: "#b45309" }}>
            {item.employeesCount} موظف
          </span>
        ) : (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: C.lightBlue, color: C.primary }}>
            {item.programsCount} برنامج
          </span>
        )}
      </div>

      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: `${C.accent}22` }}>
        <div className="h-full rounded-full"
          style={{ width: `${Math.min(100, item.attendance ?? 0)}%`, background: C.accent }} />
      </div>

      <button
        type="button"
        className="text-xs font-bold px-4 py-2 rounded-xl text-white transition hover:opacity-90 self-start"
        style={{ background: C.primary }}
        onClick={() => onSelect?.(item)}>
        {active ? "إخفاء الملف" : "عرض الملف"}
      </button>
    </article>
  );
}

// ─────────────────────────────────────────────
// Detail tables inside expand
// ─────────────────────────────────────────────
function IndividualDetails({ item }) {
  const programs = item.programs ?? [];
  if (!programs.length) {
    return <p className="text-xs text-center py-3" style={{ color: C.muted }}>لا توجد برامج مسجّلة</p>;
  }
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr style={{ background: "#EEF2F7" }}>
            {["البرنامج", "الفاتورة", "المبلغ", "الحضور", "تاريخ الاشتراك"].map(h => (
              <th key={h} className="text-right text-[11px] font-semibold px-4 py-2" style={{ color: C.muted }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {programs.map((p, i) => (
            <tr key={p.enrollmentId ?? i} style={{ borderTop: `1px solid ${C.border}` }}>
              <td className="px-4 py-2.5">
                <p className="text-xs font-semibold" style={{ color: C.text }}>{p.programName}</p>
                <p className="text-[10px]" style={{ color: C.muted }}>{p.category || p.enrollmentNum}</p>
              </td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }}>{p.invoiceNum || "—"}</td>
              <td className="px-4 py-2.5 text-xs font-bold" style={{ color: C.text }}>
                {p.amount != null ? `${p.amount}` : "—"}
              </td>
              <td className="px-4 py-2.5 min-w-[110px]"><ProgressBar pct={p.attendance} /></td>
              <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }} dir="ltr">{p.enrolledAt || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompanyDetails({ item }) {
  const employees = item.employees ?? [];
  const programs = item.programs ?? [];

  return (
    <div className="space-y-4">
      {programs.length > 0 && (
        <div>
          <p className="text-[11px] font-bold mb-2" style={{ color: C.muted }}>البرامج المشتراة</p>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ background: "#EEF2F7" }}>
                  {["البرنامج", "المقاعد", "الموظفين", "المبلغ", "الحضور"].map(h => (
                    <th key={h} className="text-right text-[11px] font-semibold px-4 py-2" style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {programs.map((p, i) => (
                  <tr key={p.purchaseId ?? i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-4 py-2.5 text-xs font-semibold" style={{ color: C.text }}>{p.programName}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }}>{p.seatsCount}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }}>{p.employeesCount}</td>
                    <td className="px-4 py-2.5 text-xs font-bold" style={{ color: C.text }}>
                      {p.amount != null ? `${p.amount}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 min-w-[110px]"><ProgressBar pct={p.attendance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold mb-2" style={{ color: C.muted }}>تفاصيل الموظفين</p>
        {employees.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: C.muted }}>لا يوجد موظفون مسجلون</p>
        ) : (
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
            <table className="w-full text-sm" dir="rtl">
              <thead>
                <tr style={{ background: "#EEF2F7" }}>
                  {["الموظف", "القسم", "البريد", "البرنامج", "الحضور"].map(h => (
                    <th key={h} className="text-right text-[11px] font-semibold px-4 py-2" style={{ color: C.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((e, i) => (
                  <tr key={e.id ?? i} style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                          style={{ background: C.primary }}>{e.initials}</div>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: C.text }}>{e.name}</p>
                          <p className="text-[10px]" style={{ color: C.muted }}>{e.jobTitle || e.phone || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }}>{e.department || "—"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }}>{e.email || "—"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: C.muted }}>{e.programName || "—"}</td>
                    <td className="px-4 py-2.5 min-w-[110px]"><ProgressBar pct={e.attendance} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Table row — expandable details
// ─────────────────────────────────────────────
function PurchaserRow({ item, idx, open, onToggle }) {
  const isEven = idx % 2 === 1;
  const isCompany = item.type === "company";

  return (
    <>
      <tr
        className="transition-colors duration-150 cursor-pointer"
        style={{ background: isEven ? "#FAFCFE" : C.card, borderBottom: `1px solid ${C.border}` }}
        onClick={onToggle}>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button type="button"
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border transition"
              style={{ borderColor: C.border, color: C.primary, background: open ? C.lightBlue : "#fff" }}
              aria-label={open ? "طي" : "توسيع"}>
              <IcoChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
              style={{ background: isCompany ? "#f59e0b" : C.primary }}>
              {item.initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: C.text }}>{item.name}</p>
              <p className="text-[11px] truncate mt-0.5" style={{ color: C.muted }}>
                {item.email || item.programSubtitle || "—"}
              </p>
            </div>
          </div>
        </td>
        <td className="px-5 py-3.5">
          <span className="text-sm" style={{ color: C.muted }}>{item.phone || "—"}</span>
        </td>
        <td className="px-5 py-3.5">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: isCompany ? "#FEF3C7" : C.lightBlue, color: isCompany ? "#b45309" : C.primary }}>
            {isCompany
              ? `${item.employeesCount} موظف`
              : `${item.programsCount} برنامج`}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={typeStyle(item.type)}>
            {typeLabel(item.type)}
          </span>
        </td>
        <td className="px-5 py-3.5 min-w-[140px]">
          <ProgressBar pct={item.attendance} />
        </td>
        <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={onToggle}
            className="text-[11px] font-bold px-3 py-1.5 rounded-lg text-white whitespace-nowrap"
            style={{ background: C.primary }}>
            {open ? "إخفاء" : "عرض الملف"}
          </button>
        </td>
      </tr>
      {open && (
        <tr style={{ background: "#F8FAFC" }}>
          <td colSpan={6} className="px-5 py-4">
            {isCompany ? <CompanyDetails item={item} /> : <IndividualDetails item={item} />}
          </td>
        </tr>
      )}
    </>
  );
}

function PurchaserMobileCard({ item, open, onToggle }) {
  const isCompany = item.type === "company";
  return (
    <article className="bg-white rounded-2xl border p-4 flex flex-col gap-3" style={{ borderColor: C.border }} dir="rtl">
      <button type="button" onClick={onToggle} className="flex items-center gap-3 text-right w-full">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ background: isCompany ? "#f59e0b" : C.primary }}>{item.initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: C.text }}>{item.name}</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: C.muted }}>{item.email || item.phone || "—"}</p>
        </div>
        <IcoChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={typeStyle(item.type)}>
          {typeLabel(item.type)}
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background: C.lightBlue, color: C.primary }}>
          {isCompany ? `${item.employeesCount} موظف` : `${item.programsCount} برنامج`}
        </span>
        <button type="button" onClick={onToggle}
          className="mr-auto text-[11px] font-bold px-3 py-1.5 rounded-lg text-white"
          style={{ background: C.primary }}>
          {open ? "إخفاء" : "عرض الملف"}
        </button>
      </div>

      <ProgressBar pct={item.attendance} />

      {open && (
        <div className="pt-2 border-t" style={{ borderColor: C.border }}>
          {isCompany ? <CompanyDetails item={item} /> : <IndividualDetails item={item} />}
        </div>
      )}
    </article>
  );
}

const HEADER_ALIASES = {
  name:  ["name", "full name", "الاسم", "اسم", "اسم المتدرب", "الاسم بالكامل"],
  email: ["email", "e-mail", "mail", "البريد", "البريد الإلكتروني", "الايميل", "ايميل"],
  phone: ["phone", "mobile", "tel", "الجوال", "رقم الجوال", "الهاتف", "الموبايل", "رقم الهاتف"],
};

function normHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function pickHeader(headers, key) {
  const aliases = HEADER_ALIASES[key].map(normHeader);
  return headers.find(h => aliases.includes(normHeader(h)))
    || headers.find(h => aliases.some(a => normHeader(h).includes(a)));
}

async function loadXlsx() {
  const mod = await import("xlsx");
  return mod.default?.read ? mod.default : mod;
}

async function parseTraineeSheet(file) {
  const XLSX = await loadXlsx();
  const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
  if (!rows.length) return [];
  const headers = Object.keys(rows[0]);
  const nameKey = pickHeader(headers, "name");
  const emailKey = pickHeader(headers, "email");
  const phoneKey = pickHeader(headers, "phone");
  if (!nameKey || !emailKey || !phoneKey) {
    throw new Error("الملف لازم يحتوي أعمدة: الاسم، البريد الإلكتروني، رقم الجوال");
  }
  return rows
    .map((row, i) => ({
      row: i + 2,
      name: String(row[nameKey] ?? "").trim(),
      email: String(row[emailKey] ?? "").trim(),
      phone: normalizePhone(String(row[phoneKey] ?? "")),
    }))
    .filter(r => r.name || r.email || r.phone);
}

async function downloadTraineeTemplate() {
  const XLSX = await loadXlsx();
  const ws = XLSX.utils.aoa_to_sheet([
    ["الاسم", "البريد الإلكتروني", "رقم الجوال"],
    ["أحمد سعد الزهراني", "ahmed@treedom.sa", "512345678"],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "متدربين");
  XLSX.writeFile(wb, "نموذج-المتدربين.xlsx");
}

function AddTraineeForm({ onCancel, onDone }) {
  const showToast = useToast();
  const fileRef = useRef();
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const phoneOk = !form.phone || isPhoneValid(form.phone);
  const canSave = form.name.trim() && form.email.trim() && form.phone && phoneOk && !saving;

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !saving) onCancel?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, saving]);

  const save = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone) {
      setError("الاسم والبريد ورقم الجوال مطلوبون");
      return;
    }
    if (!isPhoneValid(form.phone)) {
      setError(PHONE_ERROR_AR);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await createOwnedTrainee({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: normalizePhone(form.phone),
        country_code: "966",
      });
      showToast(res?.message || "تم إضافة المتدرب", "success");
      onDone?.();
    } catch (err) {
      setError(err.message || "تعذر إضافة المتدرب");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border bg-white px-4 py-3 text-base outline-none focus:border-[#075985]";

  const importSheet = async (next) => {
    if (!next || saving) return;
    const ext = next.name.split(".").pop()?.toLowerCase();
    if (!["xls", "xlsx", "csv"].includes(ext)) {
      setError("صيغة الملف غير مدعومة. اختر ملف Excel");
      return;
    }
    setFile(next);
    setError("");
    setResult(null);
    setSaving(true);
    try {
      const parsed = await parseTraineeSheet(next);
      const ready = parsed.filter(r => r.name && r.email && isPhoneValid(r.phone));
      const skipped = parsed.filter(r => !r.name || !r.email || !isPhoneValid(r.phone));
      if (!ready.length) {
        setError("مفيش صفوف صالحة. الشيت لازم فيه الاسم والبريد ورقم الجوال");
        return;
      }
      let ok = 0;
      const failed = skipped.map(r => `صف ${r.row}: بيانات ناقصة`);
      for (const row of ready) {
        try {
          await createOwnedTrainee({
            name: row.name,
            email: row.email,
            phone: row.phone,
            country_code: "966",
          });
          ok += 1;
        } catch (err) {
          failed.push(`صف ${row.row}: ${err.message || "فشل الحفظ"}`);
        }
      }
      setResult({ ok, failed, fileName: next.name });
      if (ok) showToast(`تم إضافة ${ok} متدرب من الشيت`, "success");
    } catch (err) {
      setError(err.message || "تعذر قراءة الملف");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/40 backdrop-blur-sm"
      onClick={() => { if (!saving) onCancel?.(); }}
      role="dialog"
      aria-modal="true"
      aria-label="إضافة متدرب">
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-3xl border bg-white shadow-2xl flex flex-col overflow-hidden"
        style={{ borderColor: C.border }}
        dir="rtl"
        onClick={e => e.stopPropagation()}>
        <div className="px-6 sm:px-8 py-5 border-b flex items-center justify-between gap-4" style={{ borderColor: C.border, background: C.lightBlue }}>
          <div>
            <p className="text-xl font-extrabold" style={{ color: C.text }}>إضافة متدرب</p>
            <p className="text-sm mt-1" style={{ color: C.muted }}>
              طالب خاص بالهيئة — الاسم والبريد والجوال، أو استيراد شيت إكسل
            </p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} aria-label="إغلاق"
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border shrink-0"
            style={{ borderColor: C.border, color: C.muted }}>
            <IcoX size={14} />
          </button>
        </div>

        <div className="px-6 sm:px-8 py-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <label className="flex flex-col gap-2 sm:col-span-2">
              <span className="text-sm font-semibold" style={{ color: C.text }}>الاسم بالكامل <span className="text-red-400">*</span></span>
              <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="مثال: أحمد سعد الزهراني"
                className={inputCls} style={{ borderColor: C.border, color: C.text }} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold" style={{ color: C.text }}>البريد الإلكتروني <span className="text-red-400">*</span></span>
              <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="user@treedom.sa" dir="ltr"
                className={inputCls} style={{ borderColor: C.border, color: C.text }} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold" style={{ color: C.text }}>رقم الجوال <span className="text-red-400">*</span></span>
              <input value={form.phone} onChange={e => set("phone", normalizePhone(e.target.value))}
                inputMode="numeric" maxLength={14} placeholder="5XXXXXXXX" dir="ltr"
                className={inputCls} style={{ borderColor: form.phone && !phoneOk ? "#f87171" : C.border, color: C.text }} />
              {form.phone && !phoneOk && <span className="text-xs text-red-500">{PHONE_ERROR_AR}</span>}
            </label>
          </div>
          {result && (
            <div className="mt-5 rounded-2xl border px-4 py-3" style={{ borderColor: C.border, background: C.lightGreen }}>
              <p className="text-sm font-bold" style={{ color: C.text }}>
                اتقبل الشيت {result.fileName} وتمت إضافة {result.ok} متدرب
              </p>
              {result.failed.length > 0 && (
                <ul className="mt-2 text-xs text-red-500 space-y-1 max-h-32 overflow-y-auto">
                  {result.failed.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              )}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-500 text-right">{error}</p>}
        </div>

        <div className="px-6 sm:px-8 py-5 border-t flex flex-wrap items-center gap-3" style={{ borderColor: C.border }}>
          <button type="button" onClick={save} disabled={!canSave}
            className="text-sm font-bold text-white px-6 py-3 rounded-xl disabled:opacity-50"
            style={{ background: C.primary }}>
            {saving && !file ? "جارِ الحفظ..." : "حفظ وإضافة"}
          </button>
          <label
            className="text-sm font-bold px-6 py-3 rounded-xl border bg-white cursor-pointer"
            style={{ borderColor: C.primary, color: C.primary, opacity: saving ? 0.5 : 1 }}>
            <input
              ref={fileRef}
              type="file"
              accept=".xls,.xlsx,.csv"
              className="hidden"
              disabled={saving}
              onChange={e => { importSheet(e.target.files?.[0]); e.target.value = ""; }}
            />
            {saving && file ? "جارِ إضافة الشيت..." : "استيراد ملف إكسل"}
          </label>
          <button type="button" onClick={downloadTraineeTemplate}
            className="text-sm font-semibold" style={{ color: C.primary }}>
            تحميل نموذج
          </button>
          {result?.ok ? (
            <button type="button" onClick={onDone}
              className="text-sm font-bold text-white px-6 py-3 rounded-xl mr-auto"
              style={{ background: C.accent }}>
              تم
            </button>
          ) : (
            <button type="button" onClick={onCancel} disabled={saving}
              className="text-sm font-semibold px-6 py-3 rounded-xl border bg-white mr-auto"
              style={{ borderColor: C.border, color: C.text }}>
              إلغاء
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TraineesPage() {
  const [purchasers, setPurchasers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);
  const [addMode, setAddMode] = useState(null);
  const scrollRef = useRef();
  const tableRef = useRef();

  const load = useCallback((q = "") => {
    setLoading(true);
    setError(null);
    const params = { per_page: 50, search: q || "" };
    return Promise.all([
      fetchPurchaserIndividuals(params),
      fetchPurchaserCompanies(params),
    ])
      .then(([indRes, coRes]) => {
        const individuals = (indRes?.data?.individuals ?? []).map(normaliseIndividual);
        const companies = (coRes?.data?.companies ?? []).map(normaliseCompany);
        setPurchasers([...companies, ...individuals]);
      })
      .catch(err => setError(err.message ?? "خطأ"))
      .finally(() => setLoading(false));
  }, []);

  // initial + debounced search (single effect avoids double fetch on mount)
  useEffect(() => {
    const delay = search ? 400 : 0;
    const t = setTimeout(() => { load(search); }, delay);
    return () => clearTimeout(t);
  }, [search, load]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let frame;
    let paused = false;
    const SPEED = 0.55;

    // توحيد موضع السكرول عبر المتصفحات (Chrome RTL سالب / Firefox RTL معكوس / LTR عادي)
    const metrics = () => {
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const sl = el.scrollLeft;
      if (sl < 0) {
        return { max, progress: -sl, set: (p) => { el.scrollLeft = -Math.min(max, Math.max(0, p)); } };
      }
      if (getComputedStyle(el).direction === "rtl") {
        return { max, progress: max - sl, set: (p) => { el.scrollLeft = max - Math.min(max, Math.max(0, p)); } };
      }
      return { max, progress: sl, set: (p) => { el.scrollLeft = Math.min(max, Math.max(0, p)); } };
    };

    const step = () => {
      if (!paused) {
        const m = metrics();
        if (m.max > 1) {
          const next = m.progress + SPEED;
          m.set(next >= m.max - 1 ? 0 : next);
        }
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [purchasers.length]);

  const filtered = purchasers.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q) ||
      (t.phone || "").includes(q) ||
      (t.programSubtitle || "").toLowerCase().includes(q) ||
      typeLabel(t.type).includes(search)
    );
  });

  // لما يتختار مشترك — الجدول يعرضه لوحده عشان التفاصيل تبقى أوضح
  const tableItems = expandedKey
    ? filtered.filter(t => t.key === expandedKey)
    : filtered;

  const toggle = (item) => {
    const next = expandedKey === item.key ? null : item.key;
    setExpandedKey(next);
    if (next) {
      setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
    }
  };

  const handleReset = () => {
    setSearch("");
    setExpandedKey(null);
    load("");
  };

  const liveIndividuals = filtered.filter(t => t.type === "individual").length;
  const liveCompanies = filtered.filter(t => t.type === "company").length;
  const liveEmployees = filtered.reduce((n, t) => n + (Number(t.employeesCount) || 0), 0);
  const liveTotal = filtered.length;
  const statsMax = Math.max(liveTotal, liveIndividuals, liveCompanies, tableItems.length, 1);

  return (
    <main
      className="flex-1 overflow-y-auto min-h-0"
      style={{ background: C.bg, fontFamily: "'Cairo', 'IBM Plex Sans Arabic', system-ui, sans-serif" }}
      dir="rtl">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: C.text }}>
              إدارة المتدربين
            </h1>
            <p className="text-sm mt-1" style={{ color: C.muted }}>
              المشتركين في برامج الهيئة — أفراد وشركات
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:max-w-[760px] shrink-0">
            <div className="relative flex-1 min-w-0">
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.muted }}>
                <IcoSearch size={16} />
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border bg-white text-sm outline-none"
                style={{ borderColor: C.border, color: C.text }}
                dir="rtl"
              />
            </div>
            <button
              type="button"
              onClick={() => setAddMode("form")}
              className="shrink-0 flex items-center gap-1.5 text-sm font-bold text-white px-4 py-2.5 rounded-xl hover:opacity-90"
              style={{ background: C.primary }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إضافة متدرب
            </button>
          </div>
        </header>

        {addMode && (
          <AddTraineeForm
            onCancel={() => setAddMode(null)}
            onDone={() => { setAddMode(null); load(search); }}
          />
        )}

        <section aria-label="إحصائيات">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading && !purchasers.length ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
            ) : (
              <>
                <StatCard icon={<IcoUsers size={19} />} title="إجمالي المشتركين" value={liveTotal} color={C.accent} idx={0} ratio={liveTotal / statsMax} />
                <StatCard icon={<IcoUserCheck size={19} />} title="الأفراد" value={liveIndividuals} sub="اشتراك فردي" color="#60a5fa" idx={1} ratio={liveIndividuals / statsMax} />
                <StatCard icon={<IcoBriefcase size={19} />} title="الشركات" value={liveCompanies} sub={liveEmployees ? `${liveEmployees} موظف` : undefined} color="#f59e0b" idx={2} ratio={liveCompanies / statsMax} />
                <StatCard icon={<IcoActivity size={19} />} title="المعروض الآن" value={tableItems.length} color={C.primary} idx={3} ratio={tableItems.length / statsMax} />
              </>
            )}
          </div>
        </section>

        {/* البرامج المشتركة → كروت المشتركين (اسم + نوع) */}
        {(loading || purchasers.length > 0) && (
          <section aria-label="المشتركون">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${C.primary}14`, color: C.primary }}>
                <IcoFolder size={15} />
              </div>
              <h2 className="text-base font-bold" style={{ color: C.text }}>البرامج المشتركة</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: C.lightBlue, color: C.primary }}>
                اسم كل مشترك ونوعه
              </span>
              {expandedKey && (
                <button onClick={() => setExpandedKey(null)}
                  className="mr-auto flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
                  style={{ background: C.lightBlue, color: C.primary }}>
                  <IcoX size={10} /> عرض الكل
                </button>
              )}
            </div>
            <div
              ref={scrollRef}
              dir="rtl"
              className="flex gap-4 pb-2"
              style={{ overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
              {loading && !purchasers.length
                ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border p-5 shrink-0" style={{ borderColor: C.border, width: 260 }}>
                    <Sk className="w-full h-24" />
                  </div>
                ))
                : purchasers.map(item => (
                  <SubscriberCard
                    key={item.key}
                    item={item}
                    active={expandedKey === item.key}
                    onSelect={toggle} />
                ))}
            </div>
          </section>
        )}

        <section aria-label="جدول المشتركين" ref={tableRef} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${C.primary}14`, color: C.primary }}>
              <IcoUsers size={15} />
            </div>
            <h2 className="text-base font-bold" style={{ color: C.text }}>قائمة المشتركين</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: C.lightBlue, color: C.primary }}>
              {tableItems.length}
            </span>
            {search && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mr-auto"
                style={{ background: "#EFF6FF", color: C.primary, border: "1px solid #BFDBFE" }}>
                &quot;{search}&quot;
                <button onClick={() => setSearch("")} aria-label="إزالة البحث"><IcoX size={10} /></button>
              </span>
            )}
          </div>
          {error ? (
            <ErrorState onRetry={() => load(search)} />
          ) : (
            <>
              <div className="hidden md:block bg-white rounded-2xl border overflow-hidden"
                style={{ borderColor: C.border, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" dir="rtl" style={{ borderCollapse: "collapse", minWidth: 720 }}>
                    <thead>
                      <tr style={{ background: C.primary }}>
                        {["المشترك", "الهاتف", "البرامج / الموظفين", "النوع", "نسبة الحضور", ""].map((h, i) => (
                          <th key={i} className="text-right font-semibold text-white px-5 py-3.5 text-[13px] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                        : tableItems.length === 0
                          ? (
                            <tr>
                              <td colSpan={6}><EmptyState onReset={handleReset} /></td>
                            </tr>
                          )
                          : tableItems.map((item, i) => (
                            <PurchaserRow
                              key={item.key}
                              item={item}
                              idx={i}
                              open={expandedKey === item.key}
                              onToggle={() => toggle(item)} />
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {loading
                  ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border p-4"><Sk className="w-full h-20" /></div>
                  ))
                  : tableItems.length === 0
                    ? <EmptyState onReset={handleReset} />
                    : tableItems.map(item => (
                      <PurchaserMobileCard
                        key={item.key}
                        item={item}
                        open={expandedKey === item.key}
                        onToggle={() => toggle(item)} />
                    ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
