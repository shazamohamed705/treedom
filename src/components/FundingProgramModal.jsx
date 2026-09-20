import { useState, useEffect } from "react";
import { C, Icon, FileCard } from "./FundingShared";
import { fetchCompanyProgramDetail } from "../services/api";

// ═══════════════════════ Design tokens (حسب المواصفات) ════════════════════════
const TEAL  = "#159C93";
const TEXT  = "#1D293D";
const GREY  = "#64748b";
const SLATE = "#94a3b8";
const LINE  = "#E6ECF0";
const BG    = "#F7F9FA";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1600&q=80&auto=format&fit=crop";

// ═══════════════════════ Icons ═══════════════════════════════════════════════
function I({ d, size = 13, stroke = "currentColor", sw = 1.8, fill = "none" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}>{d}</svg>
  );
}
const IcoStar   = ({ size = 14 }) => <I size={size} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>} />;
const IcoUsers  = ({ size = 13 }) => <I size={size} stroke={GREY} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoClock  = ({ size = 13 }) => <I size={size} stroke={GREY} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />;
const IcoBox    = ({ size = 13 }) => <I size={size} stroke={SLATE} d={<><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>} />;
const IcoCheck  = ({ size = 13 }) => <I size={size} stroke={TEAL} sw={2.5} d={<polyline points="20 6 9 17 4 12"/>} />;

// ═══════════════════════ Reusable sub-components (على الصفحة بدون بوكسات) ═════
function SectionTitle({ icon, children, right }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
      <h4 className="flex items-center gap-2 text-[13px] font-bold" style={{ color: TEXT }}>
        {icon}
        {children}
      </h4>
      {right}
    </div>
  );
}

function ProgramHeader({ request }) {
  const p = request.program;
  const initials = (p.provider ?? "أ").split(" ").map(w => w[0]).slice(0, 2).join("");
  const modules = p.modules?.length ?? 5;
  return (
    <section>
      {/* title + not-subscribed badge */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <h1 className="text-[15px] font-extrabold leading-snug" style={{ color: TEXT }}>
          {request.title}
        </h1>
        {request.subscribed === false && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold"
            style={{ background: C.warningBg, color: C.warning }}>
            <Icon name="lock" size={10} color={C.warning} sw={2.4} />
            غير مشترك
          </span>
        )}
      </div>

      {/* instructor (right) + rating/meta (left) */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white shrink-0"
            style={{ background: TEAL }}>{initials}</div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold" style={{ color: TEXT }}>{p.provider}</p>
            <p className="text-[10.5px] mt-0.5" style={{ color: SLATE }}>المدرب المسؤول عن البرنامج</p>
          </div>
        </div>

        {/* rating + meta — بدون خلفيات */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <IcoStar size={12} />
            <span className="text-[12.5px] font-extrabold" style={{ color: TEXT }}>{p.courseRating ?? 4.5}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end text-[11px] font-semibold" style={{ color: GREY }}>
            <span className="flex items-center gap-1"><IcoBox size={11.5} /> {modules} Modules</span>
            <span className="flex items-center gap-1"><IcoUsers size={11.5} /> {p.students ?? 500} Student</span>
            <span className="flex items-center gap-1"><IcoClock size={11.5} /> {p.timeShort ?? "30m"}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PriceCard({ request }) {
  const p = request.program;
  const fallbackPrice = (p.cost ?? "").replace(/[^0-9.,]/g, "").trim();
  const price = p.priceShort ?? fallbackPrice ?? "3,500.00";
  const currency = p.currency ?? "ر.س";
  return (
    <section className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-[10.5px]" style={{ color: SLATE }}>تكلفة البرنامج</p>
        <p className="text-[17px] font-extrabold mt-0.5" style={{ color: TEAL }}>
          <span dir="ltr">{price}</span> {currency}
        </p>
      </div>
    </section>
  );
}

function ProgramDescription({ request }) {
  const programDesc = request.program.description;
  const employeeNote = request.body;
  return (
    <>
      {/* نص طلب الموظف (سبب التمويل) */}
      {employeeNote && (
        <section>
          <SectionTitle icon={<Icon name="file" size="13" color={TEAL} />}>سبب طلب التمويل</SectionTitle>
          <p className="text-[12.5px] leading-[1.9] text-right" style={{ color: GREY }}>{employeeNote}</p>
        </section>
      )}
      {/* وصف البرنامج من الجهة المدربة (إن وُجد وليس هو نفسه نص الطلب) */}
      {programDesc && programDesc !== employeeNote && (
        <section>
          <SectionTitle icon={<Icon name="file" size="13" color={TEAL} />}>وصف البرنامج</SectionTitle>
          <p className="text-[12.5px] leading-[1.9] text-right" style={{ color: GREY }}>{programDesc}</p>
        </section>
      )}
    </>
  );
}

const KEY_POINTS_DEFAULT = [
  "دورة أساسيات التصميم الرقمية (Prototyping)",
  "نظام Microinteractions وإشارات التفاعل",
  "إتقان أدوات تصميم تجربة المنتجات",
  "تمام التصميم البصري والأجهزة التلقائية",
];

function KeyPoints({ request }) {
  const items = request.program.keyPoints;
  if (!items?.length) return null;
  return (
    <section>
      <SectionTitle icon={<IcoCheck size={13} />}>النقاط الرئيسية</SectionTitle>
      <ul className="space-y-2">
        {items.map((kp, i) => (
          <li key={i} className="flex items-center gap-2 text-[12.5px] text-right" style={{ color: TEXT }}>
            <IcoCheck />
            {kp}
          </li>
        ))}
      </ul>
    </section>
  );
}

const MODULES_DEFAULT = [
  { num: 1, title: "مقدمة",                        duration: "10:00" },
  { num: 2, title: "ما هو UX design",               duration: "10:00" },
  { num: 3, title: "اختيار قابلية الاستخدام",        duration: "10:00" },
  { num: 4, title: "عمل اختبار قابلية الاستخدام",    duration: "30:00" },
  { num: 5, title: "كيفية التنفيذ",                  duration: "30:00" },
];

function ModuleList({ request }) {
  const modules = request.program.modules;
  if (!modules?.length) return null;
  const done = request.program.modulesDone ?? 0;
  return (
    <section>
      <SectionTitle icon={<IcoBox size={14} />}
        right={<span className="text-[11px] font-semibold" style={{ color: SLATE }}>{done}/{modules.length} مكتمل</span>}>
        محتوى البرنامج
      </SectionTitle>
      {modules.map((m, i) => (
        <div key={m.num} className="flex items-center gap-3 py-3"
          style={{ borderBottom: i < modules.length - 1 ? `1px solid ${LINE}` : "none" }}>
          <span className="w-6 h-6 rounded-[7px] flex items-center justify-center text-[11px] font-extrabold shrink-0"
            style={{ background: "#159C9314", color: TEAL }}>{m.num}</span>
          <span className="text-[12.5px] font-semibold flex-1 text-right truncate" style={{ color: TEXT }}>
            {m.title}
          </span>
          <span dir="ltr" className="text-[11.5px] font-semibold shrink-0" style={{ color: SLATE }}>
            {m.duration}
          </span>
        </div>
      ))}
    </section>
  );
}

function FilesSection({ request }) {
  const files = request.files ?? [];
  if (files.length === 0) return null;
  return (
    <section>
      <SectionTitle icon={<Icon name="file" size="13" color={TEAL} />}>الملفات</SectionTitle>
      <div className="space-y-2">
        {files.map(f => (
          <FileCard key={f.name} name={f.name} type={f.type} size={f.size} />
        ))}
      </div>
    </section>
  );
}

function BottomActions({ onApprove, onReject }) {
  return (
    <div className="shrink-0 px-5 py-3.5 border-t bg-white flex items-center gap-3"
      style={{ borderColor: LINE, boxShadow: "0 -2px 12px rgba(8,15,52,0.06)" }}>
      <button type="button" onClick={onReject}
        className="flex-1 h-[40px] rounded-xl text-[13px] font-bold transition hover:bg-slate-50"
        style={{ border: `1.5px solid ${LINE}`, background: "#fff", color: GREY }}>
        رفض الطلب
      </button>
      <button type="button" onClick={onApprove}
        className="flex-[1.25] h-[40px] rounded-xl text-[13px] font-extrabold text-white transition hover:opacity-90"
        style={{ background: TEAL }}>
        موافق
      </button>
    </div>
  );
}

// ═══════════════════════ Main modal ═══════════════════════════════════════════
export default function FundingProgramModal({ request, onClose, onApprove, onReject }) {
  const [programData, setProgramData] = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(false);

  useEffect(() => {
    if (!request) { setProgramData(null); return; }
    const programId = request._programId;
    if (!programId) return;
    setLoadingProgram(true);
    setProgramData(null);
    fetchCompanyProgramDetail(programId)
      .then(res => {
        const d = res?.data ?? {};
        // Map API response to modal's program shape
        setProgramData({
          name:         d.name ?? request.program?.name,
          provider:     d.provider?.name ?? request.program?.provider,
          description:  d.description ?? request.program?.description ?? "",
          cost:         d.price_amount ? `${d.price_amount} ${d.currency ?? "ر.س"}` : request.program?.cost,
          priceShort:   d.price_amount ?? request.program?.priceShort,
          currency:     d.currency ?? "ر.س",
          image:        d.image ?? request.program?.image,
          courseRating: d.rating ?? request.program?.courseRating,
          students:     d.trainees_count ?? request.program?.students,
          start:        d.start_date ?? request.program?.start,
          end:          d.end_date ?? request.program?.end,
          duration:     d.duration_weeks ? `${d.duration_weeks} أسابيع` : request.program?.duration,
          type:         d.content_type ?? d.session_type ?? request.program?.type,
          category:     d.category?.name ?? null,
          hours:        d.hours_count ? `${d.hours_count} ساعة` : null,
          keyPoints:    d.keywords?.length
                          ? d.keywords.map(k => k.name)
                          : null,
          modules:      d.sessions?.length
                          ? d.sessions.map((s, i) => ({
                              num:      i + 1,
                              title:    s.name ?? s.title ?? `جلسة ${i + 1}`,
                              duration: s.duration ?? "—",
                            }))
                          : null,
        });
      })
      .catch(() => { /* keep fallback data from mapRequest */ })
      .finally(() => setLoadingProgram(false));
  }, [request?.id]);

  if (!request) return null;

  // Merge: API data takes priority over the minimal data from mapRequest
  const mergedRequest = {
    ...request,
    program: { ...request.program, ...(programData ?? {}) },
  };

  const p   = mergedRequest.program;
  const img = p.image || DEFAULT_IMG;

  return (
    <div className="fixed inset-0 z-[60]" dir="rtl">
      <div className="absolute inset-0 bg-[#0B1B2B]/45 backdrop-blur-[2px]" onClick={onClose} />

      {/* ── side sheet anchored to the LEFT (الشمال) — wide ── */}
      <div className="absolute top-0 bottom-0 left-0 w-full max-w-[900px] bg-white shadow-2xl flex flex-col overflow-hidden">

        {/* ── top header (before the image) ── */}
        <div className="shrink-0 px-5 py-2.5 bg-white flex items-center justify-between gap-3"
          style={{ borderBottom: `1px solid ${LINE}` }}>
          <button type="button" onClick={onClose} aria-label="إغلاق"
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition hover:bg-slate-100 order-last"
            style={{ border: `1px solid ${LINE}`, color: GREY }}>
            <Icon name="x" size={15} sw={2.2} />
          </button>
          <div className="min-w-0" style={{ order: 1 }}>
            <h3 className="text-[13.5px] font-extrabold leading-tight" style={{ color: TEXT }}>تفاصيل البرنامج</h3>
            <p className="text-[10.5px] mt-0.5" style={{ color: SLATE }}>رقم الطلب: {request.id}</p>
          </div>
        </div>

        {/* ── short hero image ── */}
        <div className="relative w-full shrink-0" style={{ height: 150 }}>
          <img src={img} alt={p.name} loading="eager"
            className="absolute inset-0 w-full h-full object-cover object-center" />
          {loadingProgram && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="w-7 h-7 rounded-full border-[3px] border-slate-200 border-t-[#159C93] animate-spin" />
            </div>
          )}
        </div>

        {/* ── scrollable body ── */}
        <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4"
          style={{ background: BG }}>

          <ProgramHeader request={mergedRequest} />

          {/* extra meta: category / duration / hours */}
          {(p.category || p.duration || p.hours || p.start || p.end) && (
            <section className="grid grid-cols-2 gap-x-4 gap-y-2">
              {p.category && (
                <div>
                  <p className="text-[10.5px]" style={{ color: SLATE }}>التصنيف</p>
                  <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: TEXT }}>{p.category}</p>
                </div>
              )}
              {p.duration && (
                <div>
                  <p className="text-[10.5px]" style={{ color: SLATE }}>المدة</p>
                  <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: TEXT }}>{p.duration}</p>
                </div>
              )}
              {p.hours && (
                <div>
                  <p className="text-[10.5px]" style={{ color: SLATE }}>الساعات التدريبية</p>
                  <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: TEXT }}>{p.hours}</p>
                </div>
              )}
              {p.start && (
                <div>
                  <p className="text-[10.5px]" style={{ color: SLATE }}>تاريخ البدء</p>
                  <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: TEXT }}>{p.start}</p>
                </div>
              )}
              {p.end && (
                <div>
                  <p className="text-[10.5px]" style={{ color: SLATE }}>تاريخ الانتهاء</p>
                  <p className="text-[12.5px] font-semibold mt-0.5" style={{ color: TEXT }}>{p.end}</p>
                </div>
              )}
            </section>
          )}

          <PriceCard request={mergedRequest} />
          <ProgramDescription request={mergedRequest} />
          <KeyPoints request={mergedRequest} />
          <ModuleList request={mergedRequest} />
          <FilesSection request={mergedRequest} />

        </div>

        {/* ── sticky bottom actions ── */}
        <BottomActions
          onApprove={() => onApprove?.(request)}
          onReject={() => onReject?.(request)}
        />

      </div>
    </div>
  );
}