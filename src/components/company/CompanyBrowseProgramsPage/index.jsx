import { useState, useMemo, useEffect, useRef } from "react";
import CustomRequestModal from "../../trainer/modals/CustomRequestModal";
import { fetchCompanyPrograms, createCompanyProgramBooking } from "../../../services/api";

// ── brand colour ──────────────────────────────────────────────────────────────
const BRAND = "#024677";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 14, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoSearch  = ({ size=16 }) => <Ico size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoGrid    = () => <Ico d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}/>;
const IcoList    = () => <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;
const IcoClock   = () => <Ico size={11} d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
const IcoCal     = () => <Ico size={11} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoVid     = () => <Ico size={11} d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>;
const IcoStar    = () => <Ico size={11} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const IcoPlay    = () => <Ico size={13} fill="white" stroke="white" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const IcoChev    = ({ dir="down" }) => <Ico size={12} d={dir==="down" ? <polyline points="6 9 12 15 18 9"/> : <polyline points="18 15 12 9 6 15"/>}/>;

// ── thumbnail bg ──────────────────────────────────────────────────────────────
const THUMB_BG = "linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0d3a5c 100%)";

// ── ribbon badge (bookmark shape) ─────────────────────────────────────────────
function RibbonBadge({ type }) {
  const cfg = {
    online:   { label:"أونلاين", fill:"#0B5CFF",
      icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
    offline:  { label:"حضوري",  fill:"#A7ABAB",
      icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    recorded: { label:"مسجل",   fill:"#E2BF34",
      icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="12" cy="12" r="9"/></svg> },
  };
  const c = cfg[type] ?? cfg.online;
  const W=36, H=46, bodyH=34;
  return (
    <div className="absolute z-20 pointer-events-none" style={{ top:0, left:10 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none"
        style={{ filter:"drop-shadow(1px 2px 3px rgba(0,0,0,0.28))" }}>
        <path d={`M0 0 H${W} V${bodyH} L${W/2} ${H} L0 ${bodyH} Z`} fill={c.fill}/>
      </svg>
      <div className="absolute top-0 left-0 flex flex-col items-center justify-start gap-0.5"
        style={{ width:W, paddingTop:5 }}>
        {c.icon}
        <span className="text-[6.5px] font-extrabold text-white leading-tight text-center">{c.label}</span>
      </div>
    </div>
  );
}

// ── gold best-seller badge ────────────────────────────────────────────────────
function BestBadge() {
  const W=42, H=56, bodyH=42;
  return (
    <div className="absolute z-20 pointer-events-none" style={{ top:0, left:50 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none"
        style={{ filter:"drop-shadow(1px 2px 3px rgba(0,0,0,0.22))" }}>
        <path d={`M0 0 H${W} V${bodyH} L${W/2} ${H} L0 ${bodyH} Z`} fill="#E2BF34"/>
      </svg>
      <div className="absolute top-0 left-0 flex flex-col items-center justify-start gap-0.5"
        style={{ width:W, paddingTop:6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M12 2l2.4 5.4 5.7.6-4.2 4 1.1 5.6-5-2.9-5 2.9 1.1-5.6-4.2-4 5.7-.6z"/>
        </svg>
        <span className="text-[7px] font-extrabold text-white leading-tight text-center whitespace-pre-line">{"الأكثر\nمبيعاً"}</span>
      </div>
    </div>
  );
}

// ── tag pill ──────────────────────────────────────────────────────────────────
function Tag({ label }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold"
      style={{ background:"rgba(49,175,234,0.13)", color:"#31AFEA" }}>
      {label}
    </span>
  );
}

// ── Saudi Riyal icon ──────────────────────────────────────────────────────────
function Riyal({ size = 12 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width={size} height={size+1}
      aria-label="Saudi Riyal" title="Saudi Riyal"
      style={{ display:"inline-block", verticalAlign:"middle", marginLeft:"2px", flexShrink:0 }}>
      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

// ── program card — same as "تصفح البرامج" in ProgramsBrowsePage ──────────────
function ProgramCard({ p, onView, onBuySeats, onCustomRequest }) {
  const waiting  = p.state === "waiting";
  const waiting2 = p.state === "waiting2";
  const recorded = p.state === "recorded";

  return (
    <div onClick={() => onView?.(p)}
      className="rounded-[16px] bg-white border border-slate-100 flex flex-col relative overflow-hidden w-full cursor-pointer hover:shadow-md transition"
      style={{ maxWidth: 390, boxShadow:"0 6px 24px rgba(8,15,52,0.08)" }} dir="rtl">
      {p.best && <BestBadge/>}
      <RibbonBadge type={p.type}/>
      {/* thumb */}
      <div className="relative overflow-hidden mx-2.5 mt-2.5 rounded-xl shrink-0"
        style={{ height:116, background:THUMB_BG }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize:"14px 14px" }}/>
        {p.img && <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition">
            <IcoPlay size={14}/>
          </div>
        </div>
      </div>
      {/* body */}
      <div className="px-2.5 pt-2 pb-2 flex flex-col gap-1.5 flex-1">
        {/* tags */}
        <div className="flex flex-wrap gap-1.5">{(p.tags||[]).map((t,i)=><Tag key={i} label={t}/>)}</div>

        {/* title — wraps to 2 lines, reserved height */}
        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2 min-h-[36px]" title={p.title}>{p.title}</p>

        {/* duration line — fixed gray for all states */}
        <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
          المدة: {p.sessions ?? 12} جلسة - {p.duration ?? 6} أسابيع
        </p>

        {/* status — by state, fixed height to keep cards aligned */}
        <div className="flex flex-col gap-0.5" style={{ minHeight: 46 }}>
          {(waiting || waiting2) && (
            <>
              <p className="text-[11px] font-medium text-slate-800">يبدأ فور اكتمال العدد</p>
              <p className="text-[10px] font-medium" style={{ color:"#024677" }}>
                (أو بحد أقصى: {p.maxDate ?? "30 نوفمبر 2026"})
              </p>
              <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
                {p.enrolledNum ?? 20}/{p.totalSeats ?? 40} متدرب مسجّل
              </p>
            </>
          )}
          {recorded && (
            <>
              <p className="text-[11px] font-medium" style={{ color:"#14b8a6" }}>متاح فوراً (محتوى مسجل)</p>
              <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
                {p.enrolledNum ?? 20}/{p.totalSeats ?? 40} متدرب مسجّل
              </p>
            </>
          )}
          {!waiting && !waiting2 && !recorded && p.totalSeats > 0 && (
            <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
              {p.enrolledNum ?? 0}/{p.totalSeats} متدرب مسجّل
            </p>
          )}
        </div>

        {/* price (strike + current together) + rating */}
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="flex items-center gap-1.5">
            <span className="text-slate-400 line-through" style={{ display:"inline-flex", alignItems:"center" }}>
              {p.oldPrice ?? 129.99}<Riyal size={9}/>
            </span>
            <span className="font-extrabold" style={{ color:"#31AFEA", display:"inline-flex", alignItems:"center", fontSize:"14px" }}>
              {p.price ?? 79.99}<Riyal size={10}/>
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <IcoStar/>{p.rating ?? 4.8}
          </span>
        </div>

        {/* trainer row */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background:"#31AFEA" }}>{p.trainerAvatar ?? "م"}</div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">{p.trainer}</p>
            <p className="text-[11px] font-medium text-slate-500 truncate">{p.org ?? p.trainerSub ?? "كود كلين للتدريب"}</p>
          </div>
        </div>

        {/* buy seats / special offer buttons — last element */}
        <div className="flex gap-2 mt-2">
          {p.isEnrolled ? (
            <button className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white hover:opacity-90 transition"
              style={{ background:"#16a34a" }}>
              أنت مسجّل
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onBuySeats?.(p); }}
              className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-white hover:opacity-90 transition"
              style={{ background:"#31AFEA" }}>
              شراء مقاعد للموظفين
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); onCustomRequest?.(p); }}
            className="flex-1 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 border hover:bg-slate-50 transition"
            style={{ background:"#fff", borderColor:"#E1E1E1" }}>
            طلب عرض خاص
          </button>
        </div>
      </div>
    </div>
  );
}

// ── dropdown ──────────────────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // measure the widest option label so the button never shrinks
  const minW = useMemo(() => {
    const longest = options.reduce((a, o) => o.label.length > a.length ? o.label : a, label);
    return `${longest.length * 7 + 48}px`; // approx px per char + padding
  }, [options, label]);

  return (
    <div className="relative" dir="rtl" ref={ref} style={{ minWidth: minW }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ minWidth: minW }}
        className={`flex items-center justify-between gap-2 w-full px-3 py-1.5 rounded-lg border bg-white text-[11px] font-medium hover:border-[#31AFEA] transition whitespace-nowrap
          ${selected && selected.value !== "all" ? "border-[#31AFEA] text-[#31AFEA]" : "border-slate-200 text-slate-600"}`}
      >
        <span>{selected?.label ?? label}</span>
        <IcoChev dir={open ? "up" : "down"}/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden" style={{ minWidth: minW }}>
          {options.map(o => (
            <button key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-right px-3 py-2 text-[11px] hover:bg-slate-50 transition
                ${String(value) === String(o.value) ? "text-[#31AFEA] font-bold bg-blue-50" : "text-slate-600"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── label strip (border 1px rgba(2,70,119,0.30), r8, h52) ─────────────────────
function LabelStrip({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-between px-3.5 w-full shrink-0 ${className}`}
      style={{ borderRadius: 8, border: "1px solid rgba(2,70,119,0.30)", height: 52 }}>
      {children}
    </div>
  );
}

// ── inline stepper (used inside the strip) ────────────────────────────────────
function MiniStep({ value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-6 h-6 flex items-center justify-center rounded-md text-sm leading-none hover:bg-slate-100 transition"
        style={{ color: BRAND, border: "1px solid rgba(2,70,119,0.30)", opacity: value <= min ? 0.4 : 1 }}
        disabled={value <= min}>−</button>
      <span className="w-6 text-center text-sm font-bold" style={{ color: BRAND }}>{value}</span>
      <button type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 flex items-center justify-center rounded-md text-sm leading-none hover:bg-slate-100 transition"
        style={{ color: BRAND, border: "1px solid rgba(2,70,119,0.30)", opacity: value >= max ? 0.4 : 1 }}
        disabled={value >= max}>+</button>
    </div>
  );
}

// ── payment methods (text only) ───────────────────────────────────────────────
const PAY_METHODS = [
  { id: "mada",       label: "مدى" },
  { id: "visa",       label: "فيزا" },
  { id: "mastercard", label: "ماستركارد" },
  { id: "apple",      label: "أبل باي" },
];

// ── buy seats popup (step 1: request / step 2: payment) ──────────────────────
function BuySeatsPopup({ program, onClose }) {
  const price = program?.price ?? 79.99;
  const maxSeats = program?.totalSeats ?? 40;
  const [step,   setStep]   = useState(1);
  const [count,  setCount]  = useState(1);
  const [notes,  setNotes]  = useState("");
  const [date,   setDate]   = useState("");
  const [method, setMethod] = useState("mada");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const total = price * count;
  const typeLabel = ({ online: "أونلاين (مباشر)", offline: "حضوري", recorded: "مسجل (متاح فوراً)" })[program?.type] ?? program?.type ?? "أونلاين (مباشر)";

  const handleBooking = async () => {
    if (!date) { setError("الرجاء تحديد تاريخ البدء المطلوب"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await createCompanyProgramBooking({
        program_id:     program.id,
        trainee_count:  count,
        requested_date: date,
        notes:          notes || undefined,
      });
      setBookingResult(res?.data ?? null);
      setStep(3);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col" style={{ maxWidth: 620, background: "#FFF" }} dir="rtl">
        {/* ── header ── */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#F0F0F0]">
          <button onClick={() => { if (step === 2) setStep(1); else onClose(); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 border border-slate-200 hover:bg-slate-50 transition shrink-0"
            style={{ visibility: step === 2 ? "visible" : "hidden" }}>
            {step === 2 ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            )}
          </button>
          <div className="flex-1 min-w-0 leading-tight">
            <p className="text-xs font-extrabold" style={{ color: BRAND }}>
              {step === 1 ? "نموذج طلب البرنامج" : step === 2 ? "نموذج طلب البرنامج / الدفع" : "تأكيد الدفع"}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {step === 1 ? "شراء مقاعد للموظفين" : step === 2 ? "اختر طريقة الدفع وأكمل الحجز" : "تم استلام طلبك بنجاح"}
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {step === 1 ? (
          <>
            {/* ── step 1 body ── */}
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>اسم البرنامج</p>
                <LabelStrip>
                  <span className="min-w-0 truncate text-[13px] font-semibold text-slate-800">{program?.title}</span>
                </LabelStrip>
              </div>

              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>عدد المتدربين</p>
                <LabelStrip>
                  <MiniStep value={count} min={1} max={maxSeats} onChange={setCount}/>
                </LabelStrip>
              </div>

              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>
                  تاريخ البدء المطلوب <span className="text-red-400">*</span>
                </p>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border outline-none transition focus:border-[#024677]"
                  style={{ borderColor: "rgba(2,70,119,0.30)" }} dir="ltr" />
              </div>

              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>ملاحظات إضافية</p>
                <div className="w-full overflow-hidden"
                  style={{ borderRadius: 8, border: "1px solid rgba(2,70,119,0.30)" }}>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                    placeholder="اكتب أي متطلبات إضافية أو ملاحظات هنا..."
                    className="w-full p-3 text-[12px] leading-relaxed outline-none resize-none placeholder:text-slate-400"
                    style={{ background: "transparent", color: "#64748b" }} />
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 text-right">{error}</p>
              )}

              {/* cost summary */}
              <div className="rounded-lg border border-[#E1E1E1] px-3.5 py-2" style={{ background: "#F8FAFC" }}>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-slate-500">السعر للفرد:</span>
                  <span className="flex items-center text-[11px] font-bold" style={{ color: "#1D293D" }}>{price.toFixed(2)}<Riyal size={9}/></span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-slate-500">عدد المتدربين:</span>
                  <span className="text-[11px] font-bold text-slate-800">{count} <span className="text-[9px] font-medium text-slate-400">متدرب</span></span>
                </div>
                <div className="my-1.5 border-t border-dashed border-slate-200"/>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold" style={{ color: "#1D293D" }}>الإجمالي:</span>
                  <span className="flex items-center text-sm font-extrabold" style={{ color: "#31AFEA" }}>{total.toFixed(2)}<Riyal size={11}/></span>
                </div>
              </div>
            </div>

            {/* ── step 1 footer ── */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F0F0F0]">
              <button onClick={onClose}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-slate-50"
                style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
                إلغاء
              </button>
              <button
                onClick={handleBooking}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: BRAND }}>
                {saving && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                )}
                إرسال طلب الحجز
              </button>
            </div>
          </>
        ) : step === 2 ? (
          <>
            {/* ── step 2 body: الدفع ── */}
            <div className="p-5 space-y-4">
              {/* booking details strips */}
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>اسم البرنامج</p>
                <LabelStrip>
                  <span className="min-w-0 truncate text-[13px] font-semibold text-slate-800">{program?.title}</span>
                </LabelStrip>
              </div>
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>نوع التدريب</p>
                <LabelStrip>
                  <span className="text-[13px] font-semibold text-slate-800">{typeLabel}</span>
                </LabelStrip>
              </div>
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>مدة التدريب</p>
                <LabelStrip>
                  <span className="text-[13px] font-semibold text-slate-800">{program?.duration ?? 6} أسابيع</span>
                </LabelStrip>
              </div>

              {/* total cost */}
              <div>
                <p className="text-xs font-bold mb-1.5" style={{ color: BRAND }}>التكلفة الإجمالية</p>
                <div className="rounded-lg border border-[#E1E1E1] px-3.5 py-2" style={{ background: "#F8FAFC" }}>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-slate-500">السعر للفرد:</span>
                    <span className="flex items-center text-[11px] font-bold" style={{ color: "#1D293D" }}>{price.toFixed(2)}<Riyal size={9}/></span>
                  </div>
                  <div className="my-1.5 border-t border-dashed border-slate-200"/>
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-extrabold" style={{ color: "#1D293D" }}>الإجمالي:</span>
                    <span className="flex items-center text-sm font-extrabold" style={{ color: "#31AFEA" }}>{total.toFixed(2)}<Riyal size={11}/></span>
                  </div>
                </div>
              </div>

              {/* payment methods */}
              <div className="w-full bg-white px-4 py-3.5"
                style={{ borderRadius: 8, border: "1px solid rgba(2,70,119,0.30)", background: "#FFF" }}>
                <p className="text-xs font-bold mb-3" style={{ color: BRAND }}>اختر طريقة الدفع</p>
                <div className="flex flex-wrap items-center gap-x-7 gap-y-2">
                  {PAY_METHODS.map(mm => {
                    const active = method === mm.id;
                    return (
                      <button key={mm.id} type="button"
                        onClick={() => setMethod(mm.id)}
                        className="flex items-center gap-2 text-sm transition shrink-0"
                        style={{ color: active ? BRAND : "#334155", fontWeight: active ? 800 : 600 }}>
                        <span className="flex items-center justify-center w-4 h-4 rounded-full shrink-0"
                          style={{
                            border: `1.5px solid ${active ? BRAND : "#CBD5E1"}`,
                            background: active ? BRAND : "transparent",
                          }}>
                          {active && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          )}
                        </span>
                        <span>{mm.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── step 2 footer ── */}
            <div className="flex items-center gap-3 px-5 py-4 border-t border-[#F0F0F0]">
              <button onClick={() => setStep(1)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border transition hover:bg-slate-50"
                style={{ color: "#64748b", borderColor: "#E1E1E1" }}>
                رجوع
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: BRAND }}>
                إتمام الدفع
              </button>
            </div>
          </>
        ) : (
          <>
            {/* ── step 3 success ── */}
            <div className="flex flex-col items-center px-5 pt-9 pb-5 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background:"#E7F7EE", border:"1.5px solid rgba(38,170,87,0.35)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#26AA57" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-lg font-extrabold" style={{ color:"#1D293D" }}>تم إرسال طلب الحجز بنجاح</p>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                تم إصدار الفاتورة وسيتم التواصل معك لإتمام الدفع وتأكيد التفاصيل
              </p>

              {/* summary from API response */}
              <div className="w-full rounded-lg border border-[#E1E1E1] px-4 py-2 mt-6 text-right" style={{ background:"#F8FAFC" }}>
                {(() => {
                  const inv = bookingResult?.booking?.invoice;
                  const invNum = typeof inv === "object" && inv !== null
                    ? (typeof inv.invoice_num === "object" ? (inv.invoice_num?.invoice_num ?? inv.invoice_num?.id) : inv.invoice_num)
                    : inv;
                  return invNum ? (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[11px] text-slate-500">رقم الفاتورة:</span>
                      <span className="text-[11px] font-bold text-slate-800">{invNum}</span>
                    </div>
                  ) : null;
                })()}
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-slate-500">البرنامج:</span>
                  <span className="text-[11px] font-bold text-slate-800 max-w-[60%] truncate">
                    {bookingResult?.booking?.program?.name ?? program?.title}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-slate-500">عدد المقاعد:</span>
                  <span className="text-[11px] font-bold text-slate-800">
                    {bookingResult?.booking?.trainee_count ?? count} مقعد
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-slate-500">تاريخ البدء المطلوب:</span>
                  <span className="text-[11px] font-bold text-slate-800">
                    {bookingResult?.booking?.requested_date ?? date}
                  </span>
                </div>
                {bookingResult?.booking?.price_per_seat && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-[11px] text-slate-500">السعر للمقعد:</span>
                    <span className="flex items-center text-[11px] font-bold text-slate-800">
                      {typeof bookingResult.booking.price_per_seat === "object"
                        ? (bookingResult.booking.price_per_seat?.value ?? bookingResult.booking.price_per_seat?.amount ?? "—")
                        : bookingResult.booking.price_per_seat}<Riyal size={9}/>
                    </span>
                  </div>
                )}
                <div className="my-1.5 border-t border-dashed border-slate-200"/>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-extrabold" style={{ color:"#1D293D" }}>الإجمالي:</span>
                  <span className="flex items-center text-sm font-extrabold" style={{ color:"#31AFEA" }}>
                    {(() => {
                      const inv = bookingResult?.booking?.invoice;
                      const rawTotal = bookingResult?.booking?.total_amount;
                      // total_amount might be the invoice object itself
                      const amt = typeof rawTotal === "object" && rawTotal !== null
                        ? (rawTotal.total_amount ?? rawTotal.id ?? total)
                        : (rawTotal ?? (typeof inv === "object" && inv !== null ? inv.total_amount : null) ?? total);
                      return (parseFloat(amt) || total).toLocaleString("ar-SA");
                    })()}<Riyal size={11}/>
                  </span>
                </div>
              </div>
            </div>

            {/* ── step 3 footer ── */}
            <div className="px-5 py-4 border-t border-[#F0F0F0]">
              <button onClick={onClose}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                style={{ background: BRAND }}>
                تم، شكراً
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── mock data ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: "all",      label: "الأقسام" },
  { value: "design",   label: "التصميم" },
  { value: "dev",      label: "البرمجة" },
  { value: "business", label: "الأعمال" },
  { value: "hr",       label: "الموارد البشرية" },
];

const FIELDS = [
  { value: "all",    label: "مجالة البرنامج" },
  { value: "ux",     label: "تجربة المستخدم" },
  { value: "ai",     label: "الذكاء الاصطناعي" },
  { value: "pm",     label: "إدارة المشاريع" },
  { value: "data",   label: "تحليل البيانات" },
];

const SORT_OPTIONS = [
  { value: "newest",  label: "ترتيب حسب الأحدث" },
  { value: "popular", label: "الأكثر شعبية" },
  { value: "price",   label: "السعر" },
  { value: "rating",  label: "التقييم" },
];

const COMPANY_CATALOG = [
  { id:"c1",  title:"دليل المبتدئين إلى كتابة الكود النظيف وممارسات Clean Code الاحترافية", sessions:20, hours:40, duration:8, date:"12 يناير 2025", price:79.99, oldPrice:129.99, rating:4.8, type:"online",   tags:["CLEAN CODE"], trainer:"م. خالد سعيد", trainerSub:"كود كلين للتدريب", trainerAvatar:"خ", best:true,  cat:"dev",      field:"data",  state:"waiting",  enrolledNum:24, totalSeats:40, maxDate:"30 نوفمبر 2026", img:"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80&auto=format&fit=crop" },
  { id:"c2",  title:"تطوير تطبيقات الويب الحديثة باستخدام React و TypeScript من الصفر", sessions:15, hours:30, duration:6, date:"15 أكتوبر 2026", price:99.99, oldPrice:149.99, rating:4.9, type:"online",   tags:["تطوير الويب"], trainer:"م. نورة محمد", trainerSub:"كود كلين للتدريب", trainerAvatar:"ن", best:true,  cat:"dev",      field:"data",  state:"waiting2", enrolledNum:30, totalSeats:40, maxDate:"30 نوفمبر 2026", img:"https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&q=80&auto=format&fit=crop" },
  { id:"c3",  title:"أمن المعلومات الأساسي وحماية الأنظمة والشبكات للمبتدئين المعتمد", sessions:10, hours:25, duration:5, date:"15 أكتوبر 2026", price:89.99, oldPrice:139.99, rating:4.7, type:"recorded", tags:["مسجل","أمن"],  trainer:"م. عمر علي", trainerSub:"كود كلين للتدريب", trainerAvatar:"ع", best:false, cat:"dev",      field:"data",  state:"recorded", enrolledNum:18, totalSeats:30,            img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop" },
  { id:"c4",  title:"الذكاء الاصطناعي التطبيقي وأدوات التعلّم الآلي للمهنيين", sessions:16, hours:32, duration:7, date:"12 يناير 2025", price:119.99, oldPrice:179.99, rating:4.9, type:"offline",  tags:["الذكاء الاصطناعي"], trainer:"م. سارة أحمد", trainerSub:"كود كلين للتدريب", trainerAvatar:"س", best:true,  cat:"business", field:"ai",   state:"waiting",  enrolledNum:15, totalSeats:25, maxDate:"30 نوفمبر 2026", img:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&auto=format&fit=crop" },
  { id:"c5",  title:"إدارة المشاريع الاحترافية PMP بمنهجية حديثة وشاملة المشروع", sessions:18, hours:36, duration:6, date:"15 أكتوبر 2026", price:109.99, oldPrice:159.99, rating:4.6, type:"online",   tags:["إدارة المشاريع"], trainer:"م. خالد سعيد", trainerSub:"كود كلين للتدريب", trainerAvatar:"خ", best:false, cat:"business", field:"pm",   state:"waiting2", enrolledNum:22, totalSeats:40, maxDate:"20 ديسمبر 2026", img:"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80&auto=format&fit=crop" },
  { id:"c6",  title:"قواعد البيانات المتقدمة وتحليل البيانات باستخدام SQL و Python", sessions:12, hours:24, duration:4, date:"15 أكتوبر 2026", price:69.99, oldPrice:119.99, rating:4.8, type:"recorded", tags:["مسجل","بيانات"], trainer:"م. نورة محمد", trainerSub:"كود كلين للتدريب", trainerAvatar:"ن", best:false, cat:"dev",      field:"data",  state:"recorded", enrolledNum:28, totalSeats:40,            img:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80&auto=format&fit=crop" },
];

// ── main page ─────────────────────────────────────────────────────────────────
export default function CompanyBrowseProgramsPage({ onViewProgram }) {
  const [search,        setSearch]        = useState("");
  const [category,      setCategory]      = useState("all");
  const [sort,          setSort]          = useState("newest");
  const [viewMode,      setViewMode]      = useState("grid"); // grid | list
  const [buyP,          setBuyP]          = useState(null);   // program being bought
  const [customReqOpen, setCustomReqOpen] = useState(false);  // custom-request modal
  const [catalog,       setCatalog]       = useState([...COMPANY_CATALOG]);
  const [loading,       setLoading]       = useState(true);
  const [dynamicCategories, setDynamicCategories] = useState(null); // built from API data

  // load from API
  useEffect(() => {
    fetchCompanyPrograms({ per_page: 100 })
      .then(res => {
        const list = res?.data?.programs ?? [];
        if (list.length > 0) {
          const mapped = list.map(p => {
            // extract category info — prefer id as the stable key
            const catObj  = typeof p.category === "object" ? p.category : null;
            const catKey  = catObj ? String(catObj.id ?? catObj.name ?? "other") : (p.category ? String(p.category) : "other");
            const catLabel = catObj ? (catObj.name ?? catKey) : catKey;

            return {
              id:          p.id,
              title:       p.name ?? "—",
              sessions:    p.sessions_count ?? 0,
              hours:       parseFloat(p.hours_count) || 0,
              duration:    p.duration_weeks ?? 0,
              date:        p.start_date ?? "",
              price:       parseFloat(p.price_amount) || 0,
              oldPrice:    null,
              rating:      p.rating ?? 0,
              type:        typeof p.session_type === "object" ? (p.session_type?.text ?? "أونلاين") : (p.session_type ?? "أونلاين"),
              tags:        (p.keywords ?? []).filter(t => typeof t === "string"),
              trainer:     typeof p.trainer === "object" ? (p.trainer?.name ?? "—") : (p.trainer ?? "—"),
              trainerSub:  typeof p.provider === "object" ? (p.provider?.name ?? "—") : (p.provider ?? "—"),
              trainerAvatar: (typeof p.trainer === "object" ? p.trainer?.name : p.trainer ?? "م")?.[0] ?? "م",
              best:        false,
              cat:         catKey,
              catLabel:    catLabel,
              state:       (() => {
                const raw = typeof p.activity_status === "object"
                  ? (p.activity_status?.value ?? "")
                  : (p.activity_status ?? "");
                const sessionType = typeof p.session_type === "object"
                  ? (p.session_type?.value ?? p.session_type?.text ?? "")
                  : (p.session_type ?? "");
                if (sessionType === "recorded" || sessionType === "مسجل") return "recorded";
                if (raw === "waiting" || raw === "pending") return "waiting";
                if (raw === "upcoming" || raw === "waiting2") return "waiting2";
                return raw || "active";
              })(),
              enrolledNum: p.trainees_count ?? 0,
              totalSeats:  p.max_capacity ?? 0,
              maxDate:     p.registration_deadline ?? p.end_date ?? "",
              isEnrolled:  p.is_enrolled ?? p.is_subscribed ?? false,
              img:         p.image ?? null,
              statusText:  p.status_text ?? "",
            };
          });

          setCatalog(mapped);

          // build unique category list from actual API data
          const seen = new Map();
          mapped.forEach(p => {
            if (p.cat && p.cat !== "other" && !seen.has(p.cat)) {
              seen.set(p.cat, p.catLabel);
            }
          });
          const cats = [
            { value: "all", label: "الأقسام" },
            ...Array.from(seen.entries()).map(([value, label]) => ({ value, label })),
          ];
          setDynamicCategories(cats);
        }
      })
      .catch(() => {}) // keep mock on error
      .finally(() => setLoading(false));
  }, []);

  // use dynamic categories from API if available, otherwise fall back to static
  const categoryOptions = dynamicCategories ?? CATEGORIES;

  const filtered = useMemo(() => {
    let list = [...catalog];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (typeof p.trainer === "string" && p.trainer.toLowerCase().includes(q))
      );
    }
    if (category !== "all") list = list.filter(p => p.cat === category);
    if (sort === "popular") list.sort((a,b) => (b.best ? 1 : 0) - (a.best ? 1 : 0));
    if (sort === "price")   list.sort((a,b) => a.price - b.price);
    if (sort === "rating")  list.sort((a,b) => b.rating - a.rating);
    return list;
  }, [catalog, search, category, sort]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-4">

        {/* ── page header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IcoSearch size={18}/>
            <h1 className="text-lg font-extrabold text-slate-800">تصفح البرامج</h1>
          </div>

          <div className="flex items-center gap-3">

            {/* view toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white border border-slate-200">
              <button onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition ${viewMode==="grid" ? "bg-[#31AFEA] text-white" : "text-slate-400 hover:text-slate-600"}`}>
                <IcoGrid/>
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition ${viewMode==="list" ? "bg-[#31AFEA] text-white" : "text-slate-400 hover:text-slate-600"}`}>
                <IcoList/>
              </button>
            </div>
          </div>
        </div>

        {/* ── filters bar ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* dropdowns */}
          <Dropdown label="الأقسام" options={categoryOptions} value={category} onChange={setCategory}/>

          {/* search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IcoSearch size={13}/>
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن برنامج تدريبي..."
              className="w-full pr-8 pl-3 py-2 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-700 placeholder-slate-400 outline-none focus:border-[#31AFEA] transition"
            />
          </div>

          {/* sort */}
          <div className="mr-auto">
            <Dropdown label="ترتيب حسب الأحدث" options={SORT_OPTIONS} value={sort} onChange={setSort}/>
          </div>
        </div>

        {/* ── results count ── */}
        <p className="text-[11px] text-slate-400 mb-3">
          {loading ? "جارٍ التحميل..." : `${filtered.length} برنامج متاح`}
        </p>

        {/* ── grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3" style={{ rowGap: "16px", columnGap: "10px" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
                <div className="h-40 bg-slate-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            style={{ rowGap: "16px", columnGap: "10px" }}>
            {filtered.length === 0
              ? <p className="col-span-3 text-center text-sm text-slate-400 py-16">لا توجد برامج متاحة</p>
              : filtered.map(p => (
              <ProgramCard key={p.id} p={p} onView={onViewProgram} onBuySeats={(x) => setBuyP(x)} onCustomRequest={() => setCustomReqOpen(true)} />
            ))}
          </div>
        ) : (
          /* ── list view ── */
          <div className="flex flex-col gap-3">
            {filtered.length === 0
              ? <p className="text-center text-sm text-slate-400 py-16">لا توجد برامج متاحة</p>
              : filtered.map(p => (
              <div key={p.id}
                className="bg-white rounded-[14px] border border-slate-100 flex gap-3 p-3 relative overflow-hidden cursor-pointer hover:shadow-md transition"
                style={{ boxShadow: "0 4px 16px rgba(8,15,52,0.06)" }}
                onClick={() => onViewProgram?.(p)}
                dir="rtl">
                {/* thumb */}
                <div className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={{ width: 120, height: 80, background: THUMB_BG }}>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer transition">
                    <IcoPlay/>
                  </div>
                  <RibbonBadge type={p.type}/>
                </div>
                {/* content */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                  <p className="text-[12px] font-bold text-slate-800 line-clamp-1">{p.title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                    <span className="flex items-center gap-0.5"><IcoVid/>{p.sessions} جلسة</span>
                    <span className="flex items-center gap-0.5"><IcoClock/>{p.hours} ساعة</span>
                    {p.date && <span className="flex items-center gap-0.5"><IcoCal/>{p.date}</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                      style={{ background:"#31AFEA" }}>{p.trainerAvatar}</div>
                    <span className="text-[10px] text-slate-500 truncate">{p.trainer}</span>
                  </div>
                </div>
                {/* price + btn */}
                <div className="flex flex-col items-end justify-between shrink-0">
                  <div className="text-right">
                    {p.oldPrice && <p className="flex items-center justify-end text-[9px] text-slate-400 line-through">{p.oldPrice}<Riyal size={7}/></p>}
                    <p className="flex items-center justify-end text-[13px] font-extrabold" style={{ color:"#31AFEA" }}>{p.price}<Riyal size={10}/></p>
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      <IcoStar/><span className="text-[10px] font-bold text-amber-500">{p.rating}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onViewProgram?.(p); }}
                    className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white hover:opacity-90 transition"
                    style={{ background:"#31AFEA" }}>
                    عرض البرنامج
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── buy seats popup ── */}
      {buyP && <BuySeatsPopup program={buyP} onClose={() => setBuyP(null)}/>}

      {/* ── custom request modal ── */}
      <CustomRequestModal
        open={customReqOpen}
        onClose={() => setCustomReqOpen(false)}
      />
    </div>
  );
}