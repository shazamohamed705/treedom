import { useState, useMemo, useEffect } from "react";
import { fetchMyBrowsePrograms, fetchMyProgramDetail, addMyFavourite, removeMyFavourite } from "../../services/api";
import { sessionTypeUiKey } from "../../services/sessionType";
import { useFavStore, setFav, seedFavs } from "../../services/favourites";
import { mediaUrl, programCover, programVideoUrl, attachCategoryProgramVideos } from "../../services/programMedia";

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

// ── thumbnail bg (fallback) ──────────────────────────────────────────────────
// ── helpers ───────────────────────────────────────────────────────────────────
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" });
};
const IcoCheck = () => <Ico size={11} sw={3} d={<polyline points="20 6 9 17 4 12"/>}/>;

// colorful thumbnails per category — cards differ nicely
const THUMBS = [
  "linear-gradient(135deg,#024677 0%,#0a5fa0 55%,#10b0c8 100%)",
  "linear-gradient(135deg,#1e3c72 0%,#2a5298 60%,#8e2de2 130%)",
  "linear-gradient(135deg,#134e5e 0%,#2d8f74 100%)",
  "linear-gradient(135deg,#42275a 0%,#734b6d 55%,#e96443 140%)",
  "linear-gradient(135deg,#0f2027 0%,#203a43 60%,#ff6b6b 160%)",
  "linear-gradient(135deg,#5f2c82 0%,#49a09d 100%)",
];
const thumbFor = (p) => THUMBS[(parseInt(p.cat, 10) || 0) % THUMBS.length];

// ── award ribbon badges (الأوائل + الأكثر طلباً) ─────────────────────────────
function AwardRibbons() {
  // ribbon SVG path: rect body + V-notch bottom
  // W=44 H=68, notch at y=54 → center point at y=68
  const W = 44, H = 68, notchY = 54;
  const path = `M0,0 H${W} V${notchY} L${W/2},${H} L0,${notchY} Z`;
  const shadow = "drop-shadow(2px 4px 6px rgba(0,0,0,0.55))";

  return (
    <div className="absolute inset-0 flex items-start justify-center pointer-events-none"
      style={{ zIndex: 10 }}>
      {/* center the two badges together */}
      <div className="flex items-start" style={{ marginTop: 0, gap: 4 }}>

        {/* LEFT — gray "الأوائل" */}
        <div className="relative flex flex-col items-center" style={{ filter: shadow }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
            {/* thin blue top stripe */}
            <rect x="0" y="0" width={W} height="3" fill="#31AFEA"/>
            <path d={path} fill="#AEB1B2"/>
          </svg>
          {/* content overlay */}
          <div className="absolute inset-0 flex flex-col items-center"
            style={{ paddingTop: 8 }}>
            {/* location icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span className="mt-1 text-white font-extrabold leading-tight text-center"
              style={{ fontSize: 11, fontFamily: "Cairo, Tahoma, sans-serif", letterSpacing: "0.01em" }}>
              الأوائل
            </span>
          </div>
        </div>

        {/* RIGHT — gold "الأكثر طلباً" */}
        <div className="relative flex flex-col items-center" style={{ filter: shadow, marginTop: 8 }}>
          <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none">
            <rect x="0" y="0" width={W} height="3" fill="#31AFEA"/>
            <path d={path} fill="#E9C42F"/>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ paddingBottom: 12 }}>
            <span className="text-white font-extrabold leading-tight text-center"
              style={{ fontSize: 11, fontFamily: "Cairo, Tahoma, sans-serif", lineHeight: 1.25 }}>
              الأكثر
              <br />
              طلباً
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── ribbon badge (bookmark shape) ─────────────────────────────────────────────
function RibbonBadge({ type }) {
  const cfg = {
    online:   { label:"أونلاين", fill:"#0B5CFF",
      icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> },
    offline:  { label:"حضوري",  fill:"#A7ABAB",
      icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
    mixed:    { label:"مختلط",  fill:"#7C3AED",
      icon:<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M4.9 4.9l14.2 14.2"/><path d="M20.6 14c-2.3 2.5-5.3 4-8.6 4s-6.3-1.5-8.6-4"/></svg> },
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

// ── program card ─────────────────────────────────────────────────────────────
function ProgramCard({ p, onView }) {
  const enrolled = p.isEnrolled ?? false;
  const [favBusy,  setFavBusy]  = useState(false);

  const favStore = useFavStore();
  const fpid     = String(p.programId ?? p.id ?? "");
  const isFav    = favStore.has(fpid);

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (favBusy || !fpid) return;
    const numId = Number(fpid);
    setFav(fpid, !isFav);
    setFavBusy(true);
    try {
      if (!isFav) await addMyFavourite(numId);
      else        await removeMyFavourite(numId);
    } catch {
      setFav(fpid, isFav);
    } finally {
      setFavBusy(false);
    }
  };

  const waiting  = p.state === "waiting";
  const recorded = p.state === "recorded" || p.type === "recorded";

  const handleEnroll = (e) => {
    e.stopPropagation();
    onView?.(p);
  };

  return (
    <div onClick={() => onView?.(p)}
      className="rounded-[16px] bg-white border border-slate-100 flex flex-col relative overflow-hidden w-full cursor-pointer hover:shadow-md transition"
      style={{ maxWidth: 390, boxShadow:"0 6px 24px rgba(8,15,52,0.08)" }} dir="rtl">
      {p.best && <BestBadge/>}
      <RibbonBadge type={p.type}/>
      {/* thumb */}
      <div className="relative overflow-hidden mx-2.5 mt-2.5 rounded-xl shrink-0"
        style={{ height:116, background:thumbFor(p) }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage:"radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize:"14px 14px" }}/>
        {p.videoUrl ? (
          <video
            src={p.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
        ) : p.img ? (
          <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        ) : null}
        {p.videoUrl && (
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            فيديو
          </div>
        )}
        {p.best && <AwardRibbons />}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition">
            <IcoPlay size={14}/>
          </div>
        </div>
        {p.categoryName && (
          <span className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-white"
            style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(2px)", border:"1px solid rgba(255,255,255,0.25)" }}>
            {p.categoryName}
          </span>
        )}
        {/* favourite button */}
        <button
          onClick={toggleFav}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 transition"
          style={{ background: isFav ? "rgba(239,68,68,0.9)" : "rgba(0,0,0,0.25)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24"
            fill={isFav ? "#fff" : "none"} stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
      {/* body */}
      <div className="px-2.5 pt-2 pb-3 flex flex-col gap-1">
        {/* tags */}
        <div className="flex flex-wrap gap-1">{(p.tags||[]).map((t,i)=><Tag key={i} label={t}/>)}</div>

        {/* title — wraps to 2 lines, reserved height */}
        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2" title={p.title}>{p.title}</p>

        {/* duration line — fixed gray for all states */}
        <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
          المدة: {p.sessions ?? 12} جلسة - {p.duration ?? 6} أسابيع
        </p>

        {/* status — by state */}
        <div className="flex flex-col gap-0.5">
          {enrolled ? (
            <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color:"#14b8a6" }}>
              <IcoCheck/> أنت مسجّل في هذا البرنامج
            </p>
          ) : recorded ? (
            <p className="text-[11px] font-medium" style={{ color:"#14b8a6" }}>متاح فوراً (محتوى مسجل)</p>
          ) : waiting ? (
            <p className="text-[11px] font-medium text-slate-800">يبدأ فور اكتمال العدد</p>
          ) : (
            <p className="text-[11px] font-medium text-slate-800">
              يبدأ {p.date ? fmtDate(p.date) : "قريباً"}
            </p>
          )}
          {(p.totalSeats > 0) && (
            <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
              {p.enrolledNum ?? 0}/{p.totalSeats} متدرب مسجّل
            </p>
          )}
          {p.maxDate && !enrolled && waiting && (
            <p className="text-[10px] font-medium" style={{ color:"#024677" }}>
              (أو بحد أقصى: {fmtDate(p.maxDate)})
            </p>
          )}
        </div>

        {/* price (strike + current together) + rating */}
        <div className="flex items-baseline justify-between gap-2 mt-0.5">
          <span className="flex items-center gap-1.5">
            {p.oldPrice ? (
              <span className="text-slate-400 line-through" style={{ display:"inline-flex", alignItems:"center" }}>
                {p.oldPrice}<Riyal size={9}/>
              </span>
            ) : null}
            <span className="font-extrabold" style={{ color:"#31AFEA", display:"inline-flex", alignItems:"center", fontSize:"14px" }}>
              {p.price != null ? p.price : 0}<Riyal size={10}/>
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <IcoStar/>{p.rating ?? 0}
          </span>
        </div>

        {/* trainer row */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-2">
          {p.trainerImg ? (
            <img
              src={p.trainerImg}
              alt={p.trainer}
              className="w-7 h-7 rounded-full object-cover shrink-0"
              onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
            style={{ background:"#31AFEA", display: p.trainerImg ? "none" : "flex" }}>
            {p.trainerAvatar ?? "م"}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">{p.trainer}</p>
            <p className="text-[11px] font-medium text-slate-500 truncate">{p.org ?? p.trainerSub ?? "أكاديمية الريادة الخليجية"}</p>
          </div>
        </div>

        {/* big enroll / subscribed button */}
        {enrolled ? (
          <button className="w-full py-1.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-1.5"
            style={{ background:"#16a34a" }}>
            أنت مسجّل
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            className="w-full py-1.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-1.5"
            style={{ background: "#31AFEA" }}>
            سجل الآن
          </button>
        )}
      </div>
    </div>
  );
}

// ── dropdown ──────────────────────────────────────────────────────────────────
function Dropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative" dir="rtl">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 font-medium hover:border-[#31AFEA] transition whitespace-nowrap"
      >
        {selected?.label ?? label}
        <IcoChev dir={open ? "up" : "down"}/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden">
          {options.map(o => (
            <button key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-right px-3 py-2 text-[11px] hover:bg-slate-50 transition
                ${value === o.value ? "text-[#31AFEA] font-bold" : "text-slate-600"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── normalize API program → card shape ───────────────────────────────────────
function normalize(raw) {
  const type = sessionTypeUiKey(raw.session_type);

  // map activity_status → state (waiting / recorded / active)
  const actVal = raw.activity_status?.value ?? raw.status ?? "";
  let state = "active";
  if (type === "recorded") state = "recorded";
  else if (actVal === "waiting" || actVal === "soon" || actVal === 0) state = "waiting";

  const trainerName = raw.trainer?.name ?? "";
  return {
    id:               raw.id,
    title:            raw.name ?? "—",
    sessions:         raw.sessions_count ?? 0,
    completedSessions: raw.completed_sessions_count ?? 0,
    hours:            parseFloat(raw.hours_count) || 0,
    duration:         raw.duration_weeks ?? 0,
    price:            parseFloat(raw.price_amount) || 0,
    oldPrice:         null,
    rating:           raw.rating ?? 0,
    type,
    state,
    tags:             [raw.category?.name, raw.session_type?.text].filter(Boolean),
    trainer:          trainerName || "—",
    trainerSub:       raw.provider?.name ?? "",
    trainerAvatar:    (trainerName.trim()[0] || "م"),
    trainerImg:       mediaUrl(raw.trainer?.image ?? raw.trainer?.profile_image ?? raw.trainer?.avatar),
    cat:              String(raw.category?.id ?? ""),
    categoryName:     raw.category?.name ?? "",
    fieldName:        raw.field?.name ?? "",
    enrolledNum:      raw.trainees_count ?? 0,
    totalSeats:       raw.max_capacity ?? null,
    maxDate:          raw.registration_deadline ?? null,
    date:             raw.start_date ?? "",
    isEnrolled:       raw.is_enrolled ?? false,
    isFavourite:      raw.is_favourite ?? false,
    img:              programCover(raw),
    videoUrl:         programVideoUrl(raw),
    raw,
  };
}

const SORT_OPTIONS = [
  { value: "newest",  label: "ترتيب حسب الأحدث" },
  { value: "popular", label: "الأكثر شعبية" },
  { value: "price",   label: "السعر" },
  { value: "rating",  label: "التقييم" },
];

// ── main page ─────────────────────────────────────────────────────────────────
export default function ProgramsBrowsePage({ onViewProgram }) {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [field,    setField]    = useState("all");
  const [sort,     setSort]     = useState("newest");
  const [viewMode, setViewMode] = useState("grid"); // grid | list
  const [page,     setPage]     = useState(1);
  const PAGE_SIZE = 12;

  const [data,     setData]     = useState({ categories: [], statistics: {} });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [reload,   setReload]   = useState(0);

  // ── fetch from the API (debounced) ────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const cat = category === "all" ? undefined : category;
      fetchMyBrowsePrograms({ search: search.trim() || undefined, category: cat })
        .then(res => {
          if (!active) return;
          const d = res?.data ?? {};
          const normalized = (d.categories ?? []).map(c => ({
            id: c.id,
            name: c.name,
            programs: (c.programs ?? []).map(normalize),
          }));
          // seed the fav store so state survives refresh
          const favIds = normalized
            .flatMap(c => c.programs)
            .filter(p => p.isFavourite)
            .map(p => String(p.id));
          if (favIds.length) seedFavs(favIds);
          setData({ categories: normalized, statistics: d.statistics ?? {} });
          setError("");
          attachCategoryProgramVideos(normalized, fetchMyProgramDetail).then(next => {
            if (active) setData(prev => ({ ...prev, categories: next }));
          });
        })
        .catch(() => {
          if (!active) return;
          setError("تعذر تحميل البرامج، حاول مرة أخرى.");
          setData({ categories: [], statistics: {} });
        })
        .finally(() => { if (active) setLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, category, reload]);

  const beginLoad = () => setLoading(true);

  const categories = useMemo(() =>
    [{ value: "all", label: "الأقسام" }, ...data.categories.map(c => ({ value: String(c.id), label: c.name }))],
    [data.categories]);

  const all = useMemo(() => data.categories.flatMap(c => c.programs), [data.categories]);

  const fields = useMemo(() => {
    const names = [...new Set(all.map(p => p.fieldName).filter(Boolean))];
    return [{ value: "all", label: "مجال البرنامج" }, ...names.map(n => ({ value: n, label: n }))];
  }, [all]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.trainer.toLowerCase().includes(q));
    }
    if (field !== "all") list = list.filter(p => p.fieldName === field);
    if (sort === "popular") list.sort((a,b) => b.enrolledNum - a.enrolledNum);
    if (sort === "price")   list.sort((a,b) => a.price - b.price);
    if (sort === "rating")  list.sort((a,b) => b.rating - a.rating);
    return list;
  }, [all, search, field, sort]);

  // reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, category, field, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="max-w-[1500px] mx-auto px-3 sm:px-6 py-4">

        {/* ── page header ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IcoSearch size={18}/>
            <h1 className="text-lg font-extrabold text-slate-800">تصفح البرامج</h1>
          </div>
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

        {/* ── filters bar ── */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* dropdowns */}
          <Dropdown label="مجال البرنامج" options={fields}     value={field}    onChange={setField}/>
          <Dropdown label="الأقسام"       options={categories} value={category} onChange={(v) => { beginLoad(); setCategory(v); }}/>

          {/* search */}
          <div className="relative flex-1 min-w-[200px]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IcoSearch size={13}/>
            </span>
            <input
              value={search}
              onChange={e => { beginLoad(); setSearch(e.target.value); }}
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
          {data.statistics.programs_count ?? filtered.length} برنامج متاح
        </p>

        {/* ── loading ── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            style={{ rowGap: "16px", columnGap: "10px" }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} className="rounded-[16px] bg-white border border-slate-100 overflow-hidden"
                style={{ maxWidth: 390, boxShadow:"0 6px 24px rgba(8,15,52,0.08)" }}>
                <div className="mx-2.5 mt-2.5 rounded-xl" style={{ height:116, background:"#EEF2F6" }}/>
                <div className="px-2.5 pt-2 pb-2 space-y-2">
                  <div className="h-3 rounded w-3/5" style={{ background:"#EEF2F6" }}/>
                  <div className="h-2.5 rounded w-full" style={{ background:"#EEF2F6" }}/>
                  <div className="h-8 rounded-xl w-full" style={{ background:"#EEF2F6" }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── error ── */}
        {!loading && error && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">{error}</p>
            <button onClick={() => { beginLoad(); setReload(r => r + 1); }}
              className="mt-3 px-4 py-2 rounded-lg text-[12px] font-bold text-white"
              style={{ background:"#31AFEA" }}>إعادة المحاولة</button>
          </div>
        )}

        {/* ── grid ── */}
        {!loading && !error && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            style={{ rowGap: "20px", columnGap: "10px", paddingBottom: "8px" }}>
            {paged.map(p => (
              <ProgramCard key={p.id} p={p} onView={onViewProgram}/>
            ))}
          </div>
        )}

        {/* ── list view ── */}
        {!loading && !error && viewMode === "list" && (
          <div className="flex flex-col gap-3">
            {paged.map(p => (
              <div key={p.id}
                className="bg-white rounded-[14px] border border-slate-100 flex gap-3 p-3 relative overflow-hidden cursor-pointer hover:shadow-md transition"
                style={{ boxShadow: "0 4px 16px rgba(8,15,52,0.06)" }}
                onClick={() => onViewProgram?.(p)}
                dir="rtl">
                {/* thumb */}
                <div className="rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative"
                  style={{ width: 120, height: 80, background: thumbFor(p) }}>
                  {p.videoUrl ? (
                    <video
                      src={p.videoUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      preload="metadata"
                      muted
                      playsInline
                    />
                  ) : p.img ? (
                    <img src={p.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
                  ) : null}
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 cursor-pointer transition relative z-10">
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
                    {p.oldPrice && <p className="text-[9px] text-slate-400 line-through">ر.س {p.oldPrice}</p>}
                    <p className="text-[13px] font-extrabold" style={{ color:"#31AFEA" }}>ر.س {p.price}</p>
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      <IcoStar/><span className="text-[10px] font-bold text-amber-500">{p.rating}</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white hover:opacity-90 transition"
                    style={{ background:"#31AFEA" }}>
                    سجل الآن
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <p className="text-sm">لا توجد برامج تطابق البحث</p>
          </div>
        )}

        {/* ── pagination ── */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-6 pb-2" dir="ltr">
            {/* prev */}
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center border text-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#31AFEA] hover:text-[#31AFEA]"
              style={{ borderColor: "#e2e8f0" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            {/* page numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce((acc, n, idx, arr) => {
                if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                acc.push(n);
                return acc;
              }, [])
              .map((n, i) =>
                n === "..." ? (
                  <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-slate-400 text-[12px]">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => { setPage(n); window.scrollTo(0, 0); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-bold transition border"
                    style={{
                      background: page === n ? "#31AFEA" : "white",
                      color:      page === n ? "#fff"    : "#64748b",
                      borderColor: page === n ? "#31AFEA" : "#e2e8f0",
                    }}
                  >
                    {n}
                  </button>
                )
              )
            }

            {/* next */}
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center border text-slate-500 transition disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#31AFEA] hover:text-[#31AFEA]"
              style={{ borderColor: "#e2e8f0" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
