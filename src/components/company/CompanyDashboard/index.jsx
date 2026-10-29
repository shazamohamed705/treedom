import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, CartesianGrid, Tooltip,
} from "recharts";
import { fetchCompanyDashboard, fetchCompanyPrograms } from "../../../services/api";
import { mapCompanyFollowUp } from "../companyFollowUp";
import { BRAND, TEAL, TEAL_LIGHT } from "../../../constants/colors";

// ─── Tiny SVG icon helper ─────────────────────────────────────────────────────
const Ico = ({ d, size = 18, stroke = "currentColor", sw = 1.8, fill = "none", viewBox = "0 0 24 24" }) => (
  <svg width={size} height={size} viewBox={viewBox} fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

// ─── Icons ────────────────────────────────────────────────────────────────────
const IcoHome    = () => <Ico d={<><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><polyline points="9 21 9 12 15 12 15 21"/></>} />;
const IcoUsers   = () => <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoGrad    = () => <Ico d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoVideo   = () => <Ico d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>} />;
const IcoChart   = () => <Ico d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>} />;
const IcoCal     = () => <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoHR      = () => <Ico d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const IcoArrow   = () => <Ico d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>} />;
const IcoShop    = () => <Ico d={<><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>} />;
const IcoFilter  = () => <Ico d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoSearch  = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;

// ─── Stat-specific icons (from the company mockup) ────────────────────────────
const IcoRefresh = () => (
  <Ico size={26} stroke="#024677" sw={1.93} viewBox="0 0 26 26"
    d={<><path d="M23.5851 11.8771V12.8634C23.5838 15.1751 22.8352 17.4245 21.451 19.276C20.0669 21.1276 18.1213 22.4821 15.9044 23.1376C13.6875 23.793 11.3181 23.7143 9.14966 22.9132C6.98117 22.112 5.12976 20.6314 3.87152 18.692C2.61329 16.7527 2.01566 14.4586 2.16777 12.1519C2.31987 9.84515 3.21356 7.64938 4.71555 5.89205C6.21754 4.13473 8.24735 2.91001 10.5023 2.40054C12.7572 1.89108 15.1163 2.12416 17.228 3.06504"/><path d="M23.5848 4.28833L12.8645 15.0193L9.64844 11.8032"/></>} />
);
const IcoPercent = () => (
  <Ico size={32} fill="#024677" stroke="none" viewBox="0 0 32 32"
    d={<path fillRule="evenodd" clipRule="evenodd" d="M22.9173 1.4367C24.627 1.09246 26.3713 0.951485 28.114 1.0167C28.5165 1.03235 28.8984 1.19927 29.1832 1.48413C29.4681 1.76899 29.635 2.15082 29.6507 2.55337C29.6907 3.49737 29.6953 5.48604 29.2307 7.75004C28.9573 9.08537 27.3513 9.44737 26.466 8.56137L25.188 7.28404C24.6903 7.73428 24.1985 8.19099 23.7127 8.65404C22.452 9.8547 20.8707 11.442 19.5367 13.0267C18.402 14.3747 16.2253 14.3654 15.16 12.8734C14.4863 11.9274 13.7865 11.0004 13.0613 10.0934C11.572 11.1127 8.48 13.4587 5.004 17.4334C4.788 17.68 4.57111 17.9329 4.35333 18.192C4.12551 18.4626 3.79956 18.6315 3.44718 18.6617C3.0948 18.6919 2.74485 18.5809 2.47433 18.353C2.20381 18.1252 2.03487 17.7993 2.00468 17.4469C1.97449 17.0945 2.08551 16.7446 2.31333 16.474C2.54267 16.2029 2.77022 15.9378 2.996 15.6787C6.72267 11.4174 10.054 8.9107 11.658 7.8227C12.78 7.06204 14.252 7.32404 15.0753 8.3427C15.8552 9.31434 16.6069 10.3083 17.3293 11.3234C17.3342 11.3295 17.34 11.3346 17.3467 11.3387C17.3621 11.3453 17.3786 11.3489 17.3953 11.3494C17.4141 11.3507 17.433 11.3477 17.4505 11.3408C17.468 11.3339 17.4838 11.3232 17.4967 11.3094C18.9207 9.61804 20.5807 7.9547 21.8727 6.72337C22.428 6.1947 22.9193 5.74137 23.3 5.3967L22.1067 4.2007C21.2207 3.31537 21.5827 1.71004 22.918 1.43604M22.51 28.4827C22.422 27.276 22.334 25.1234 22.334 21.3327C22.334 17.542 22.422 15.39 22.51 14.182C22.6073 12.842 23.586 11.7967 24.978 11.7114C25.4207 11.6847 25.976 11.666 26.6673 11.666C27.3587 11.666 27.914 11.6847 28.3567 11.7114C29.7487 11.7967 30.7273 12.842 30.8247 14.182C30.9127 15.39 31.0007 17.542 31.0007 21.3327C31.0007 25.1234 30.9127 27.2754 30.8247 28.4834C30.7273 29.8234 29.7487 30.8687 28.3567 30.954C27.914 30.9807 27.3587 30.9994 26.6673 30.9994C25.976 30.9994 25.4207 30.9807 24.978 30.954C23.586 30.8687 22.6073 29.8227 22.51 28.4827ZM1.11333 28.8467C1.04867 28.2174 1 27.3107 1 26C1 24.6894 1.04867 23.7827 1.11267 23.1534C1.24667 21.8267 2.31133 21.066 3.47733 21.0267C4.09581 21.0076 4.71456 20.9987 5.33333 21C6.12467 21 6.73133 21.0114 7.18933 21.0267C8.35533 21.066 9.42 21.8267 9.554 23.1534C9.618 23.7827 9.66667 24.6894 9.66667 26C9.66667 27.3107 9.618 28.2174 9.55467 28.8467C9.42 30.1734 8.35467 30.934 7.18933 30.9734C6.73133 30.9887 6.12467 31 5.33333 31C4.542 31 3.93533 30.9887 3.47733 30.9734C2.31133 30.934 1.24733 30.1734 1.11333 28.8467ZM11.6667 24C11.6667 26.274 11.7327 27.7094 11.8087 28.6114C11.9233 29.9767 12.9687 30.9094 14.2887 30.9674C14.7313 30.9867 15.2927 31 16 31C16.7073 31 17.2687 30.9867 17.7113 30.9667C19.0313 30.9094 20.0767 29.9767 20.1913 28.6114C20.2673 27.7094 20.3333 26.274 20.3333 24C20.3333 21.726 20.2673 20.2907 20.192 19.3887C20.0767 18.0234 19.032 17.0907 17.7113 17.0327C17.2687 17.0134 16.7073 17 16 17C15.2927 17 14.7313 17.0134 14.2893 17.0334C12.9687 17.0907 11.9227 18.0234 11.808 19.3887C11.7333 20.2907 11.6667 21.726 11.6667 24Z"/>} />
);
const IcoSpend   = () => (
  <Ico size={37} stroke="#024677" sw={2.81} viewBox="0 0 37 30"
    d={<path d="M35.1751 14.5393V5.15908C35.1751 4.16396 34.7798 3.2096 34.0761 2.50595C33.3725 1.80229 32.4181 1.40698 31.423 1.40698H5.15834C4.16323 1.40698 3.20887 1.80229 2.50521 2.50595C1.80156 3.2096 1.40625 4.16396 1.40625 5.15908V23.9195C1.40625 24.9147 1.80156 25.869 2.50521 26.5727C3.20887 27.2763 4.16323 27.6716 5.15834 27.6716H31.423C32.4181 27.6716 33.3725 27.2763 34.0761 26.5727C34.7798 25.869 35.1751 24.9147 35.1751 23.9195V20.1675"/>} />
);

// ─── Circular Progress (for team-coverage / rate card) ───────────────────────
const EMPTY_COVERAGE_STAT = {
  label: "تغطية الفريق",
  value: "—",
  icon: "chart",
  circle: true,
  circlePct: 0,
  sub: "",
  colorA: "#5AEACF",
  colorB: "#024677",
};

function CircleProgress({ pct = 80, size = 56, stroke = 6, from = TEAL, to = BRAND }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const id = React.useId();
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={`url(#${id})`} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ transform: "rotate(90deg) translate(0,-1px)", transformOrigin: "center",
          fontSize: size * 0.22, fontWeight: 800, fill: "#1D293D" }}>
        {pct}%
      </text>
    </svg>
  );
}

// ─── Wavy Sparkline ───────────────────────────────────────────────────────────
const WAVES = [
  "M300 42 C270 34 250 50 220 40 S165 30 140 42 S85 52 50 38 S15 28 0 34",
  "M300 36 C270 44 245 30 215 40 S160 50 135 36 S80 26 50 40 S18 50 0 42",
  "M300 44 C268 36 248 52 218 40 S162 28 138 44 S82 56 48 38 S14 26 0 36",
];
function Sparkline({ color = TEAL, idx = 0 }) {
  const id = React.useId();
  const line = WAVES[idx % WAVES.length];
  return (
    <div className="px-4 pb-3 pt-1">
      <svg width="100%" height="40" viewBox="0 0 300 80" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L0 80 L300 80 Z`} fill={`url(#${id})`} />
        <path d={line} stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const ICON_MAP = { users: IcoUsers, graduation: IcoGrad, video: IcoVideo, chart: IcoChart,
  refresh: IcoRefresh, percent: IcoPercent, spend: IcoSpend };

function StatCard({ stat, index }) {
  const IconComp = ICON_MAP[stat.icon] ?? IcoChart;
  const isCircle = !!stat.circle; // team-coverage card shows circular progress

  return (
    <article className="rounded-2xl bg-white border border-slate-100 flex flex-col
      transition-shadow hover:shadow-md overflow-hidden" dir="rtl">
      <div className="flex flex-col p-4 gap-3 flex-1">
        {/* icon + growth */}
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#0246770D", color: BRAND }}>
            <IconComp />
          </div>
          {stat.growth && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold
              text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M1 9L4 5L7 7L11 2" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {stat.growth}
            </span>
          )}
        </div>

        {/* label + value or circle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-start gap-0.5 flex-1">
            <span className="text-sm text-slate-500 leading-tight">{stat.label}</span>
            {!isCircle && (
              <span className="text-2xl font-extrabold leading-none mt-0.5"
                style={{ color: "#1D293D" }}>
                {stat.value}
              </span>
            )}
            {stat.sub && (
              <span className="text-xs text-slate-400 mt-0.5">{stat.sub}</span>
            )}
            {stat.liveToday && (
              <span className="inline-flex items-center gap-1.5 text-xs text-red-500 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Live Today
              </span>
            )}
          </div>
          {isCircle && (
            <CircleProgress pct={stat.circlePct ?? parseInt(stat.value)} size={58} stroke={6}
              from={stat.colorA ?? TEAL} to={stat.colorB ?? BRAND} />
          )}
        </div>
      </div>
      {!isCircle && <Sparkline color={stat.chartColor ?? TEAL} idx={index} />}
      {isCircle && <div className="h-4" />}
    </article>
  );
}

// ─── Alert / Action Card (transparent, animated, green button, bottom-left) ──
function AlertCard({ item, delay = 0 }) {
  const navigate = useNavigate();
  return (
    <article dir="rtl"
      className="animate-card-renew flex flex-col justify-between gap-4 min-h-[170px] p-5
        rounded-2xl border border-[#E1E1E1]"
      style={{ animationDelay: `${delay}s` }}>
      <div>
        <p className="text-sm font-extrabold text-slate-800 leading-snug">{item.title}</p>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{item.desc}</p>
      </div>
      <button
        onClick={() => item.path && navigate(item.path)}
        className="self-end inline-flex items-center justify-center px-3.5 py-2 rounded-[10px]
          bg-[#00BBA7] text-xs font-bold text-white transition hover:brightness-95">
        {item.action}
      </button>
    </article>
  );
}

// ─── Quick Link (box hugs right, title left, description below) ───────────────
function QuickLink({ icon: Icon, label, desc, onClick }) {
  return (
    <button onClick={onClick} dir="rtl"
      className="group flex flex-col items-start gap-2.5 p-4 rounded-2xl border border-[#E1E1E1]
        hover:border-[#024677]/40 hover:shadow-sm transition-all w-full">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 self-end"
        style={{ background: "#0246770D", color: BRAND }}>
        <Icon />
      </div>
      <span className="text-sm font-bold text-slate-800 text-right leading-snug group-hover:text-[#024677]">
        {label}
      </span>
      {desc && (
        <span className="text-xs text-slate-400 text-right leading-relaxed">{desc}</span>
      )}
    </button>
  );
}

// ─── Program Row ──────────────────────────────────────────────────────────────
function ProgramRow({ prog, date = "", delay = 0 }) {
  const CAPACITY = 100;
  const seatsLeft = Math.max(0, CAPACITY - (prog.trainees ?? 0));

  return (
    <div dir="rtl" style={{ animationDelay: `${delay}s` }}
      className="animate-card-renew flex items-center justify-between gap-4 py-3 border-b border-slate-200 last:border-0">
      {/* info: date / name / org */}
      <div className="flex flex-col items-start gap-1 min-w-0">
        <span className="text-[11px] text-slate-400 font-medium">{date}</span>
        <p className="text-sm font-bold text-slate-800 truncate">{prog.name}</p>
        <span className="text-xs text-slate-400">{prog.orgName ?? "كود كلين للتدريب"}</span>
      </div>
      {/* remaining seats (top-left, teal) + status bar (bottom) */}
      <div className="flex flex-col justify-between items-end shrink-0 self-stretch pt-2 pb-0.5">
        <span className="text-xs font-bold whitespace-nowrap" style={{ color: "#23D9C4" }}>
          مقعد متبقي <b>{seatsLeft}</b>
        </span>
        <div className="w-24 sm:w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden" dir="ltr">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${prog.progress}%`, background: TEAL }} />
        </div>
      </div>
    </div>
  );
}

// ─── Attendance Bar Chart ─────────────────────────────────────────────────────
function AttendanceChart({ data }) {
  const months = data ?? [];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5" dir="rtl">
      <div>
        <h2 className="text-sm font-bold text-slate-800">اتجاه تسجيل الموظفين الشهري</h2>
        <p className="text-xs text-slate-400 mt-0.5">آخر 10 أشهر</p>
      </div>
      <div className="mt-4">
        {months.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-slate-200"><IcoChart size={34} /></span>
            <p className="text-sm text-slate-400 mt-2">لا توجد بيانات تسجيل بعد</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={months} barSize={22} barCategoryGap="22%"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="enrolled" name="المسجلون" fill={TEAL} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Compliance / Attendance Rate ─────────────────────────────────────────────
function AttendanceRate({ items }) {
  const rows = items ?? [];
  const totalPct = rows.length > 0
    ? Math.round(rows.reduce((a, b) => a + (b.pct ?? 0), 0) / rows.length)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4" dir="rtl">
      <div>
        <h2 className="text-sm font-bold text-slate-800">نسبة الالتزام بالحضور</h2>
        <p className="text-xs text-slate-400 mt-0.5">آخر 30 يوم</p>
      </div>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">لا توجد بيانات حضور بعد</p>
        ) : rows.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm font-bold text-slate-700">{item.label}</span>
              <span className="flex items-center gap-2.5">
                {item.sessions != null && (
                  <span className="text-xs text-slate-400">
                    عدد الجلسات: {item.sessions}
                  </span>
                )}
                <span className="text-xl font-extrabold" style={{ color: "#1D293D" }}>
                  {item.pct}%
                </span>
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${item.pct}%`, background: item.color ?? BRAND }} />
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>
      {/* total */}
      <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center">
        <span className="text-xs text-slate-500">المتوسط العام</span>
        <span className="text-sm font-extrabold text-slate-700">
          {totalPct}%
        </span>
      </div>
    </div>
  );
}

// ─── data builders ────────────────────────────────────────────────────────────

/** 1,499,548 → "1.499.548" (arabic number grouping with dots) */
function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US").replace(/,/g, ".");
}

function normProgram(p = {}) {
  return {
    name:      p.name?.ar ?? p.name ?? "—",
    trainees:  p.trainees_count ?? p.trainees ?? p.enrolled ?? 0,
    progress:  p.progress_percent ?? p.progress ?? p.completion_percent ?? 0,
    orgName:   p.provider?.name ?? p.org_name ?? p.orgName ?? "كود كلين للتدريب",
    date:      p.start_date ?? p.date ?? "",
  };
}

/** Map GET /company/dashboard payload → page model */
function buildApiModel(d = {}) {
  const s = d.stats ?? {};
  const coveragePct = Math.round(Number(s.team_coverage_percent ?? 0));
  const trained  = s.employees_trained ?? 0;
  const total    = s.employees_total   ?? 0;
  const completion = Math.round(Number(s.average_completion ?? 0));
  const attendance = Math.round(Number(s.average_attendance ?? 0));

  const stats = [
    {
      ...EMPTY_COVERAGE_STAT,
      value:     `${trained}/${total}`,
      circlePct: coveragePct,
      sub:       total > 0 ? `يتم تدريب ${trained}/${total} من موظفين الشركة`
                           : "لم يبدأ التدريب بعد",
    },
    { label: "متوسط نسبة اتمام البرامج", value: `${completion}%`, icon: "refresh", chartColor: "#5AEACF" },
    { label: "متوسط نسبة الحضور العام",  value: `${attendance}%`, icon: "percent", chartColor: "#60a5fa" },
    { label: "إجمالي الإنفاق",           value: `${fmtMoney(s.total_spent ?? 0)}`, icon: "spend", chartColor: "#a78bfa" },
  ];

  const followAlerts = mapCompanyFollowUp(d).map(a => ({
    title: a.title,
    desc:  a.body,
    action: a.action,
    path:  a.path,
  }));
  const alerts = followAlerts.length > 0 ? followAlerts : [{
    title:  "لا توجد متابعات الآن",
    desc:   "كل شيء تحت السيطرة — لا توجد فواتير متأخرة أو طلبات تمويل بانتظار المراجعة.",
    action: "حسناً",
    path:   null,
  }];

  const programs = (d.latest_programs ?? []).slice(0, 2).map(normProgram);

  // Build monthly enrollment chart from latest_programs purchase_date
  const MONTH_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const monthMap = {};
  (d.latest_programs ?? []).forEach(p => {
    if (!p.purchase_date) return;
    const d2 = new Date(p.purchase_date);
    const key = `${d2.getFullYear()}-${d2.getMonth()}`;
    if (!monthMap[key]) monthMap[key] = { month: MONTH_AR[d2.getMonth()], enrolled: 0, completed: 0, _sort: d2.getFullYear() * 12 + d2.getMonth() };
    monthMap[key].enrolled  += Number(p.registered_employees ?? 0);
    monthMap[key].completed += 0; // API doesn't expose completed count
  });
  const enrollData = Object.values(monthMap).sort((a, b) => a._sort - b._sort).map(({ _sort, ...rest }) => rest);

  const attendanceItems = [{
    label: "الحضور العام",
    pct:   attendance,
    color: BRAND,
    sub:   total > 0 ? `${trained} موظف من ${total}` : "",
  }];

  return { stats, alerts, programs, attendanceItems, enrollData };
}

/** Fallback: return empty model when the API is unreachable — no mock data */
function buildFallbackModel(_data) {
  return {
    stats: [
      EMPTY_COVERAGE_STAT,
      { label: "متوسط نسبة اتمام البرامج", value: "—", icon: "refresh",  chartColor: "#5AEACF" },
      { label: "متوسط نسبة الحضور العام",  value: "—", icon: "percent",  chartColor: "#60a5fa" },
      { label: "إجمالي الإنفاق",           value: "—", icon: "spend",    chartColor: "#a78bfa" },
    ],
    alerts:         [],
    programs:       [],
    attendanceItems: [],
    enrollData:      [],
  };
}

// ─── Main Company Dashboard ───────────────────────────────────────────────────
export default function CompanyDashboard({ data, onViewProgram }) {
  const navigate = useNavigate();
  const [search,       setSearch]       = useState("");
  const [searchRes,    setSearchRes]    = useState([]);
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [searchLoading,setSearchLoading]= useState(false);
  const [loading,      setLoading]      = useState(true);
  const [model,        setModel]        = useState(null);

  const searchRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!search.trim()) { setSearchRes([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    setSearchOpen(true);
    const timer = setTimeout(() => {
      fetchCompanyPrograms({ search: search.trim(), per_page: 8 })
        .then(res => {
          const list = res?.data?.programs ?? res?.data?.data ?? [];
          setSearchRes(list.map(p => ({
            id:       p.id,
            name:     typeof p.name === "object" ? (p.name?.ar ?? p.name?.en ?? "—") : (p.name ?? "—"),
            provider: p.provider?.name ?? p.provider ?? "—",
            price:    p.price_amount ? `${p.price_amount} ر.س` : null,
            // keep full object for navigation
            _raw: p,
          })));
        })
        .catch(() => setSearchRes([]))
        .finally(() => setSearchLoading(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let on = true;
    fetchCompanyDashboard()
      .then(res => { if (on) setModel(buildApiModel(res?.data ?? {})); })
      .catch(() => { if (on) setModel(buildFallbackModel(data)); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || model === null) {
    return (
      <main className="flex-1 overflow-y-auto bg-white p-6 flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-[#024677] animate-spin" />
          <p className="text-sm text-slate-400">جارٍ تحميل لوحة التحكم...</p>
        </div>
      </main>
    );
  }

  const { stats, alerts, programs, attendanceItems, enrollData } = model;

  // Quick links
  const quickLinks = [
    { icon: IcoCal,   label: "إضافة موظف جديد",      desc: "سجّل موظفاً جديداً في المنصة",     path: "/dashboard/employees" },
    { icon: IcoShop,  label: "عرض برامج لموظفيك",    desc: "تصفح البرامج المتاحة لموظفيك",    path: "/dashboard/programs" },
    { icon: IcoChart, label: "تصدير تقرير الحضور",   desc: "نزّل تقرير الحضور والالتزام",     path: "/dashboard/attendance" },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-white p-3 sm:p-6 space-y-5" dir="rtl">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">الرئيسية</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            مرحباً، ابقَ على علم بتقدم التدريب في شركتك
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* search with dropdown */}
          <div className="relative w-full sm:w-auto" ref={searchRef}>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => { if (search.trim() && searchRes.length > 0) setSearchOpen(true); }}
              placeholder="تصفح البرامج التدريبية"
              className="pr-10 pl-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white
                w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                transition placeholder:text-slate-400"
            />

            {/* dropdown */}
            {searchOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-full sm:w-72 bg-white rounded-2xl border border-slate-200
                shadow-[0_8px_32px_rgba(2,70,119,0.12)] z-50 overflow-hidden" dir="rtl">

                {searchLoading ? (
                  <div className="flex items-center justify-center gap-2 py-5 text-sm text-slate-400">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-[#024677] animate-spin" />
                    جاري البحث...
                  </div>
                ) : searchRes.length === 0 ? (
                  <div className="py-5 text-center text-sm text-slate-400">لا توجد نتائج</div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto py-1.5">
                    {searchRes.map(p => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setSearchOpen(false);
                            setSearchRes([]);
                            if (onViewProgram) {
                              onViewProgram(p._raw);
                            } else {
                              navigate("/dashboard/programs");
                            }
                          }}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#f0f6fb] transition text-right">
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center mt-0.5"
                            style={{ background: "rgba(2,70,119,0.08)", color: BRAND }}>
                            <IcoGrad />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-slate-800 leading-snug truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">{p.provider}</p>
                          </div>
                          {p.price && (
                            <span className="mr-auto shrink-0 text-[11px] font-bold" style={{ color: TEAL }}>{p.price}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} stat={stat} index={i} />
        ))}
      </div>

      {/* ── يحتاج متابعتك الآن ──────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full" style={{ background: BRAND }} />
            <h2 className="text-sm font-bold text-slate-700">يحتاج متابعتك الآن</h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/notifications")}
            className="text-xs font-semibold transition hover:opacity-70"
            style={{ color: TEAL }}
          >
            عرض الكل
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((a, i) => <AlertCard key={i} item={a} delay={i * 0.9} />)}
        </div>
      </section>

      {/* ── Middle row: Quick Links (right) + Programs (left) ───────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* روابط سريعة (الأول — يمين) */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(2,70,119,0.08)", color: BRAND }}>
              <IcoHome />
            </div>
            <h2 className="text-sm font-bold text-slate-800">روابط سريعة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((ql, i) => (
              <QuickLink key={i} icon={ql.icon} label={ql.label} desc={ql.desc}
                onClick={() => navigate(ql.path)} />
            ))}
          </div>
        </div>

        {/* أحدث البرامج المسجلة (الثاني — شمال) */}
        <div className="bg-white rounded-2xl border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "rgba(2,70,119,0.08)", color: BRAND }}>
                <IcoCal />
              </div>
              <h2 className="text-sm font-bold text-slate-800">أحدث البرامج المسجلة</h2>
            </div>
            <button
              onClick={() => navigate("/dashboard/programs")}
              className="flex items-center gap-1 text-xs font-semibold text-[#024677] hover:underline">
              عرض الكل <IcoArrow />
            </button>
          </div>

          {/* date labels */}
          <div className="px-4 pb-2 flex flex-col gap-0">
            {programs.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">لا توجد برامج مسجلة بعد</p>
            ) : programs.map((prog, i) => (
              <ProgramRow key={i} prog={prog} delay={i * 0.9} date={prog.date} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom row: Attendance Rate + Bar Chart (reversed) ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <AttendanceRate items={attendanceItems} />
        <div className="lg:col-span-2">
          <AttendanceChart data={enrollData} />
        </div>
      </div>

    </main>
  );
}