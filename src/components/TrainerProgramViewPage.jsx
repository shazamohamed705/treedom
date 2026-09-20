import { useState, useEffect } from "react";
import { fetchCoachProgram } from "../services/api";
import { hasPermission } from "../services/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const IcoGrad    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
const IcoSlash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round"><line x1="16" y1="4" x2="8" y2="20"/></svg>;
const IcoClock   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IcoUsers   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="1.8" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcoCal     = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcoChart   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#024677" strokeWidth="1.8" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>;
const IcoChevron = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoEdit    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IcoCheck   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IcoX       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcoPin     = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;

// ─────────────────────────────────────────────────────────────────────────────
// Status config — API returns status.value (2=approved, 1=review, 0=rejected)
// ─────────────────────────────────────────────────────────────────────────────
const STATUS_CFG = {
  2: { key: "approved", label: "معتمد",         bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  1: { key: "review",   label: "قيد المراجعة", bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  0: { key: "rejected", label: "مرفوض",         bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
function Sk({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}
function SkeletonView() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2"><Sk className="w-40 h-5" /><Sk className="w-16 h-6 rounded-full" /></div>
      <div className="grid grid-cols-3 gap-4">{[0,1,2].map(i=><Sk key={i} className="h-20 rounded-2xl"/>)}</div>
      <Sk className="h-64 rounded-2xl"/>
      <Sk className="h-24 rounded-2xl"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Donut ring
// ─────────────────────────────────────────────────────────────────────────────
function DonutRing({ pct = 0, size = 64 }) {
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="8"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#024677" strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x="50%" y="54%" textAnchor="middle" fontSize="11" fontWeight="700" fill="#024677">{pct}%</text>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, Icon }) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3">
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

// ─────────────────────────────────────────────────────────────────────────────
// Readiness checklist
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Sessions accordion
// ─────────────────────────────────────────────────────────────────────────────
function SessionsAccordion({ sessions = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" dir="ltr">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
        <span className={`transition-transform duration-200 text-slate-400 ${open ? "rotate-180" : ""}`}>
          <IcoChevron />
        </span>
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
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "#14b8a6" }}>{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                        <span className="text-[11px] text-slate-400">{s.type?.text ?? s.type ?? ""}</span>
                        {s.location && (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400">
                            <IcoPin />{s.location}
                          </span>
                        )}
                        {/* coach attendance */}
                        {s.coach_attendance && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            s.coach_attendance.status_key === "present"
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}>
                            {typeof s.coach_attendance.status_label === "object" ? (s.coach_attendance.status_label.text ?? s.coach_attendance.status_label.value ?? "—") : (s.coach_attendance.status_label ?? "—")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] text-slate-500">{s.date}</p>
                    <p className="text-[11px] text-slate-400">{s.starts_at} — {s.ends_at}</p>
                    {s.attendance_summary && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        حضور: {s.attendance_summary.trainees_present} / غياب: {s.attendance_summary.trainees_absent}
                      </p>
                    )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainerProgramViewPage({ programId, onBack, onEdit }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!programId) return;
    setLoading(true);
    setError(null);
    fetchCoachProgram(programId)
      .then(res => setData(res.data ?? res))
      .catch(e  => setError(e.message))
      .finally(() => setLoading(false));
  }, [programId]);

  // derive status config
  const statusVal = typeof data?.status === "object" ? data?.status?.value : data?.status;
  const st = STATUS_CFG[statusVal] ?? STATUS_CFG[1];

  const keywords = (data?.keywords ?? []).map(k => typeof k === "string" ? k : k.name ?? k);

  return (
    <main className="flex-1 overflow-y-auto bg-white" dir="ltr">
      <div className="pr-3 sm:pr-14 py-6 space-y-5" dir="rtl">

        {/* breadcrumb */}
        <div className="max-w-5xl ml-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <IcoGrad />
            <button onClick={onBack}
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition">
              برامجي التدريبية
            </button>
            <IcoSlash />
            <span className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
              {loading ? "…" : (data?.name ?? "—")}
            </span>
          </div>
          {!loading && data && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
              <IcoClock />{st.label}
            </span>
          )}
        </div>

        {/* loading */}
        {loading && <div className="max-w-5xl ml-auto"><SkeletonView /></div>}

        {/* error */}
        {!loading && error && (
          <div className="max-w-5xl ml-auto flex flex-col items-center py-16 gap-3 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => { setLoading(true); fetchCoachProgram(programId).then(r=>setData(r.data??r)).catch(e=>setError(e.message)).finally(()=>setLoading(false)); }}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: "#024677" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* stat cards */}
            <div className="max-w-5xl ml-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="عدد المتدربين"    value={`${data.trainees_count} / ${data.max_capacity}`} Icon={IcoUsers} />
              <StatCard label="الجلسات المتبقية" value={data.remaining_sessions_count}                   Icon={IcoCal}   />
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#0246770D" }}>
                  <IcoChart />
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">التقدم</p>
                  <p className="text-2xl font-bold" style={{ color: "#024677" }}>{data.progress_percent}%</p>
                </div>
                <div className="mr-auto">
                  <DonutRing pct={data.progress_percent} />
                </div>
              </div>
            </div>

            {/* rejection reason banner */}
            {st.key === "rejected" && data.reject_reason && (
              <div className="max-w-5xl ml-auto bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                <p className="text-sm font-bold text-red-600 mb-1">سبب الرفض</p>
                <p className="text-sm text-red-700">{data.reject_reason}</p>
              </div>
            )}

            {/* about card */}
            <div className="max-w-5xl ml-auto">
              <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 sm:p-8 space-y-5" dir="rtl">
                <h2 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#024677" }}>عن البرنامج</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-right">
                  {[
                    { label: "اسم البرنامج",         value: data.name },
                    { label: "المدرب",                value: data.trainer?.name },
                    { label: "تاريخ البدء",           value: data.start_date },
                    { label: "تاريخ الانتهاء",        value: data.end_date },
                    { label: "عدد الجلسات المخططة",   value: data.sessions_count_planned },
                    { label: "عدد الساعات",           value: data.hours_count ? `${data.hours_count} ساعة` : null },
                    { label: "السعر",                 value: data.price_amount ? `${parseFloat(data.price_amount).toFixed(0)} ${data.currency}` : null },
                    { label: "نوع المحتوى",           value: data.content_type?.text },
                    { label: "نوع الجلسة",            value: data.session_type?.text },
                    { label: "التصنيف",               value: data.category?.name },
                    { label: "المجال",                value: data.field?.name },
                    { label: "الطاقة الاستيعابية",    value: data.capacity_label },
                    { label: "حالة النشاط",           value: data.activity_status?.text },
                    { label: "مدة البرنامج",          value: data.duration_weeks ? `${data.duration_weeks} أسبوع` : null },
                  ].filter(it => it.value != null).map(item => (
                    <div key={item.label}>
                      <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                  <div>
                    <p className="text-xs text-slate-400 mb-1">حالة البرنامج</p>
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg"
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* description */}
                {data.description && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">وصف البرنامج</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{data.description}</p>
                  </div>
                )}

                {/* keywords */}
                {keywords.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">الكلمات المفتاحية</p>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((k, i) => (
                        <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-lg"
                          style={{ background: "#E6F0F8", color: "#024677" }}>
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* readiness checklist */}
            {data.checklist?.length > 0 && (
              <div className="max-w-5xl ml-auto">
                <Checklist items={data.checklist} readiness={data.readiness} />
              </div>
            )}

            {/* sessions accordion */}
            <div className="max-w-5xl ml-auto">
              <SessionsAccordion sessions={data.sessions ?? []} />
            </div>

            {/* edit button — only if user has programs.update permission */}
            {st.key !== "rejected" && hasPermission("programs.update") && (
              <button
                onClick={() => onEdit?.(data)}
                className="flex items-center justify-center gap-2 w-full max-w-5xl ml-auto py-3.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: "#024677" }}>
                <IcoEdit />
                تعديل البرنامج
              </button>
            )}
          </>
        )}

      </div>
    </main>
  );
}
