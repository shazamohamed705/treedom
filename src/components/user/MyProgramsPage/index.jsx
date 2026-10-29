import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { fetchMyEnrollments, fetchMyBrowsePrograms, fetchMyEnrollmentDetail, fetchMySessions, fetchMyProgramDetail, addMyFavourite, removeMyFavourite } from "../../../services/api";
import { getUser } from "../../../services/auth";
import { useFavStore, setFav, seedFavs } from "../../../services/favourites";
import {
  resolveContinueSession,
  resolveProgramId,
  getProgramLocalPercent,
  getLastWatchForProgram,
  markAutoplaySession,
} from "../../../services/watchProgress";
import {
  mediaUrl,
  programCover,
  programVideoUrl,
  groupSessionsByProgram,
  sessionsForProgram,
  attachProgramVideos,
  attachCategoryProgramVideos,
} from "../../../services/programMedia";

// ── Carousel wrapper — simple horizontal scroll ───────────────────────────────
function Carousel({ children, gap = 12, autoScroll = true }) {
  const trackRef = React.useRef(null);
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    if (!autoScroll) return;
    const el = trackRef.current;
    if (!el) return;

    const step = () => {
      if (!el) return;
      // rtl: scrollLeft is negative in some browsers, use scrollLeft directly
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) return; // nothing to scroll

      // in RTL, scroll goes right-to-left (negative direction in some browsers)
      // we increase scrollLeft magnitude each tick
      const current = Math.abs(el.scrollLeft);
      const cardWidth = 290 + gap;

      if (current + el.clientWidth >= el.scrollWidth - 10) {
        // reached end — reset to start
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -(cardWidth), behavior: "smooth" });
      }
    };

    timerRef.current = setInterval(step, 3000);
    return () => clearInterval(timerRef.current);
  }, [autoScroll, gap]);

  return (
    <div
      ref={trackRef}
      dir="rtl"
      className="w-full overflow-x-auto"
      style={{ scrollbarWidth:"none", msOverflowStyle:"none" }}
      onMouseEnter={() => clearInterval(timerRef.current)}
      onMouseLeave={() => {
        if (!autoScroll) return;
        const el = trackRef.current;
        if (!el) return;
        timerRef.current = setInterval(() => {
          const maxScroll = el.scrollWidth - el.clientWidth;
          if (maxScroll <= 0) return;
          const current = Math.abs(el.scrollLeft);
          const cardWidth = 290 + gap;
          if (current + el.clientWidth >= el.scrollWidth - 10) {
            el.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            el.scrollBy({ left: -(cardWidth), behavior: "smooth" });
          }
        }, 3000);
      }}
    >
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
      <div className="flex items-start no-scrollbar" style={{ gap, paddingBottom: 12 }}>
        {children}
      </div>
    </div>
  );
}

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 13, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoPlay  = ({ size=14 }) => <Ico size={size} fill="white" stroke="white" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
const IcoStar  = () => <Ico size={11} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const IcoChevD = () => <Ico size={12} d={<polyline points="6 9 12 15 18 9"/>}/>;
const IcoGrid  = () => <Ico d={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>}/>;
const IcoSearch= ({ size=14 }) => <Ico size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;

// ── thumbnail bg ──────────────────────────────────────────────────────────────
const THUMB_BG = "linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0d3a5c 100%)";

// ── ribbon badge ──────────────────────────────────────────────────────────────
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

// ── progress bar ──────────────────────────────────────────────────────────────
function Bar({ value, color="#31AFEA" }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width:`${value}%`, background:color }}/>
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

// ── RESUME card — نفس ContinueCard في الداش بورد بالضبط ──────────────────────
function ResumeCard({ p, onContinue, isLoading }) {
  const favStore = useFavStore();
  const pid      = String(p.programId ?? p.id ?? "");
  const isFav    = favStore.has(pid);
  const [favBusy, setFavBusy] = useState(false);

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (favBusy || !pid) return;
    const numId = Number(pid);
    setFav(pid, !isFav);
    setFavBusy(true);
    try {
      if (!isFav) await addMyFavourite(numId);
      else        await removeMyFavourite(numId);
    } catch { setFav(pid, isFav); }
    finally { setFavBusy(false); }
  };

  return (
    <div
      className="rounded-[14px] bg-white border border-slate-100 flex flex-col shrink-0 relative overflow-hidden cursor-pointer hover:shadow-md transition"
      style={{ width: "min(300px, 80vw)", boxShadow: "0 4px 16px rgba(8,15,52,0.07)" }}
      dir="rtl"
    >
      {/* thumbnail */}
      <div className="relative overflow-hidden shrink-0 rounded-xl mx-2.5 mt-2.5"
        style={{ height: 95, background: THUMB_BG }}>
        <div className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize: "12px 12px" }}/>
        {/* video thumbnail — show video element when videoUrl available */}
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition"
            style={{ backdropFilter: "blur(2px)" }}>
            <IcoPlay size={13}/>
          </div>
        </div>
        {/* video badge */}
        {p.videoUrl && (
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            فيديو
          </div>
        )}
        {/* favourite heart */}
        <button
          onClick={toggleFav}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 cursor-pointer transition"
          style={{ background: isFav ? "rgba(239,68,68,0.9)" : "rgba(255,255,255,0.25)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24"
            fill={isFav ? "#fff" : "none"} stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div className="px-2.5 pt-1.5 pb-2.5 flex flex-col gap-1">
        {(p.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.tags.slice(0, 1).map((t, i) => <Tag key={i} label={t}/>)}
          </div>
        )}

        <p className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-2">{p.title}</p>

        {/* progress bar */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-slate-400">التقدم</span>
            <span className="text-[9px] font-bold" style={{ color: "#14b8a6" }}>{p.progress ?? 0}%</span>
          </div>
          <Bar value={p.progress ?? 0} color="#14b8a6"/>
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {p.trainerImg ? (
              <img src={p.trainerImg} alt="" className="w-6 h-6 rounded-full object-cover shrink-0"/>
            ) : (
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: "#31AFEA" }}>
                {p.trainerAvatar ?? "م"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 truncate">
                {typeof p.trainer === "object" ? p.trainer?.name : p.trainer}
              </p>
              <p className="text-[9.5px] text-slate-500">{p.trainerSub ?? ""}</p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); if (!isLoading) onContinue?.(p); }}
            disabled={isLoading}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white hover:opacity-90 transition disabled:opacity-60"
            style={{ background: "#14b8a6", minWidth: 90 }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                جارٍ التحميل
              </>
            ) : (
              <>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                استكمل المشاهدة
              </>
            )}
          </button>
        </div>
      </div>
    </div>
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

// ── ALL PROGRAMS card ─────────────────────────────────────────────────────────
function ProgramCard({ p, onClick, userType = null, hideCta = false }) {
  const waiting  = p.state === "waiting";
  const waiting2 = p.state === "waiting2";
  const recorded = p.state === "recorded";
  const hasCta   = p.cta;

  // show ownership only for employee users; hide for plain "user" and staff/org
  const showOwnership = !hasCta && userType === "employee";

  const [favBusy, setFavBusy] = useState(false);
  const favStore = useFavStore();
  const pid      = String(p.programId ?? p.id ?? "");
  const isFav    = favStore.has(pid);

  const toggleFav = async (e) => {
    e.stopPropagation();
    if (favBusy || !pid) return;
    const numId = Number(pid);
    setFav(pid, !isFav);
    setFavBusy(true);
    try {
      if (!isFav) await addMyFavourite(numId);
      else        await removeMyFavourite(numId);
    } catch {
      setFav(pid, isFav);
    } finally {
      setFavBusy(false);
    }
  };

  return (
    <div onClick={onClick}
      className="rounded-[16px] bg-white border border-slate-100 flex flex-col relative overflow-hidden w-full cursor-pointer hover:shadow-md transition"
      style={{ boxShadow:"0 6px 24px rgba(8,15,52,0.08)" }} dir="rtl">
      {p.best && <BestBadge/>}
      <RibbonBadge type={p.type}/>
      {/* thumb */}
      <div className="relative overflow-hidden mx-3 mt-3 rounded-xl shrink-0"
        style={{ height:98, background:THUMB_BG }}>
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition"
            style={{ backdropFilter: "blur(2px)" }}>
            <IcoPlay size={14}/>
          </div>
        </div>
        {/* video badge */}
        {p.videoUrl && (
          <div className="absolute bottom-1.5 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white"
            style={{ background: "rgba(0,0,0,0.55)" }}>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="white" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            فيديو
          </div>
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
      <div className="px-3 pt-2 pb-3 flex flex-col gap-2">
        {/* tags */}
        <div className="flex flex-wrap gap-1.5">{(p.tags||[]).map((t,i)=><Tag key={i} label={t}/>)}</div>

        {/* title — wraps to 2 lines, reserved height */}
        <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2" title={p.title}>{p.title}</p>

        {/* duration line — fixed gray for all states */}
        <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
          المدة: {p.sessions ?? 12} جلسة - {p.duration ?? 6} أسابيع
        </p>

        {/* status — by state */}
        <div className="flex flex-col gap-0.5">
          {p.state === "enrolled" ? (
            <>
              <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color:"#14b8a6" }}>
                ✓ أنت مسجّل في هذا البرنامج
              </p>
              {p.progress > 0 && (
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-slate-400">التقدم</span>
                    <span className="text-[9px] font-bold" style={{ color:"#14b8a6" }}>{p.progress}%</span>
                  </div>
                  <Bar value={p.progress} color="#14b8a6"/>
                </div>
              )}
            </>
          ) : recorded ? (
            <p className="text-[11px] font-medium" style={{ color:"#14b8a6" }}>متاح فوراً (محتوى مسجل)</p>
          ) : (waiting || waiting2) ? (
            <>
              <p className="text-[11px] font-medium text-slate-800">يبدأ فور اكتمال العدد</p>
              {p.maxDate && (
                <p className="text-[10px] font-medium" style={{ color:"#024677" }}>(أو بحد أقصى: {p.maxDate})</p>
              )}
            </>
          ) : (
            <p className="text-[11px] font-medium text-slate-800">يبدأ {p.date || "قريباً"}</p>
          )}
          {p.totalSeats > 0 && p.state !== "enrolled" && (
            <p className="text-[10px] font-medium" style={{ color:"#808080" }}>
              {p.enrolledNum ?? 0}/{p.totalSeats} متدرب مسجّل
            </p>
          )}
        </div>

        {/* price + rating — لكل البرامج */}
        <div className="flex items-baseline justify-between gap-2 mt-1">
          <span className="flex items-center gap-1.5">
            {p.oldPrice ? (
              <span className="text-slate-400 line-through" style={{ display:"inline-flex", alignItems:"center" }}>
                {p.oldPrice}<Riyal size={9}/>
              </span>
            ) : null}
            <span className="font-extrabold" style={{ color:"#31AFEA", display:"inline-flex", alignItems:"center", fontSize:"14px" }}>
              {p.price ?? 0}<Riyal size={10}/>
            </span>
          </span>
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
            <IcoStar/>{p.rating ?? 0}
          </span>
        </div>

        {/* trainer row */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          {p.trainerImg ? (
            <img src={p.trainerImg} alt="" className="w-7 h-7 rounded-full object-cover shrink-0"/>
          ) : (
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ background:"#31AFEA" }}>{p.trainerAvatar}</div>
          )}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-slate-900 truncate">{typeof p.trainer === 'object' ? p.trainer?.name : p.trainer}</p>
            <p className="text-[11px] font-medium text-slate-500 truncate">{p.org ?? p.trainerSub ?? "أكاديمية الريادة الخليجية"}</p>
          </div>
        </div>

        {/* ownership — employee only, hidden for plain user and staff */}
        {showOwnership && (
          <p className="w-full flex items-center justify-end gap-1.5 text-[11px] font-bold"
            style={{ color:"#024677" }}>
            {p.ownership === "company" ? (
              <>
                معين من الشركة
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21V7l5 3V7l5 3V7l5 3v11z"/><path d="M3 21h18"/>
                </svg>
              </>
            ) : (
              <>
                خاص بيه
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                </svg>
              </>
            )}
          </p>
        )}

        {/* big action button — last element */}
        {!hideCta && p.state === "enrolled" ? (
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-2"
            style={{ background:"#16a34a" }}
          >
            ✓ أنت مسجّل
          </button>
        ) : (!hideCta && hasCta) ? (
          <button
            onClick={(e) => { e.stopPropagation(); onClick?.(); }}
            className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-2"
            style={{ background:"#31AFEA" }}
          >
            سجل الآن
          </button>
        ) : null}
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
        <IcoChevD/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-full overflow-hidden">
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

const SORT_OPTIONS = [
  { value:"newest",   label:"ترتيب حسب الأحدث" },
  { value:"popular",  label:"الأكثر شعبية"     },
  { value:"price",    label:"السعر"             },
  { value:"rating",   label:"التقييم"           },
];

const ALL = [
  { id:"a1", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", sessions:12, hours:6, duration:6, date:"12 يناير 2025", price:79.99, oldPrice:129.99, rating:4.8, type:"online",   tags:["FRONTEND"],    trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", best:true,  state:"waiting",  enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", ownership:"company", img:"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80&auto=format&fit=crop" },
  { id:"a2", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", sessions:12, hours:6, duration:6, date:"15 أكتوبر 2026", price:79.99, oldPrice:129.99, rating:4.8, type:"online",   tags:["تطوير الويب"], trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", best:true,  state:"waiting2", enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", ownership:"company", img:"https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&q=80&auto=format&fit=crop" },
  { id:"a3", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", sessions:12, hours:6, duration:6, date:"22 سبتمبر 2026", price:79.99, oldPrice:129.99, rating:4.8, type:"recorded", tags:["مسجل"],        trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", best:false, state:"recorded", enrolledNum:20, totalSeats:40, ownership:"own",      img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop" },
  { id:"a4", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", sessions:12, hours:6, duration:6, date:"12 يناير 2025", price:79.99, oldPrice:129.99, rating:4.8, type:"online",   tags:["FRONTEND"],    trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", best:true,  state:"waiting",  enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", ownership:"company", img:"https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80&auto=format&fit=crop" },
  { id:"a5", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", sessions:12, hours:6, duration:6, date:"15 أكتوبر 2026", price:79.99, oldPrice:129.99, rating:4.9, type:"online",   tags:["تطوير الويب"], trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", best:true,  state:"waiting2", enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", ownership:"own",      img:"https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&q=80&auto=format&fit=crop" },
  { id:"a6", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", sessions:12, hours:6, duration:6, date:"22 سبتمبر 2026", price:79.99, oldPrice:129.99, rating:4.8, type:"recorded", tags:["مسجل"],        trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", best:false, state:"recorded", enrolledNum:20, totalSeats:40, ownership:"company", img:"https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80&auto=format&fit=crop" },
];

const SUGGESTED = [ALL[3], ALL[4], ALL[5]];

// ── section header ─────────────────────────────────────────────────────────────
function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-2 mb-3" dir="rtl">
      <h2 className="text-[15px] font-extrabold text-slate-800">{title}</h2>
      {count != null && (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{count}</span>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function MyProgramsPage({ onViewProgram, onViewProgress, onViewSession }) {
  const location = useLocation();
  const targetSection = location.state?.section ?? null; // "continue" | "enrolled" | null

  // section refs for scroll-into-view
  const continueRef = useRef(null);
  const enrolledRef = useRef(null);
  // ── my programs state ──
  const [enrolled,  setEnrolled]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [continueLoading, setContinueLoading] = useState(null);

  // auto-scroll to target section once data loads
  useEffect(() => {
    if (loading) return;
    if (!targetSection) return;
    const refMap = { continue: continueRef, enrolled: enrolledRef };
    const ref = refMap[targetSection];
    if (!ref?.current) return;
    // small delay so the DOM has rendered
    const timer = setTimeout(() => {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => clearTimeout(timer);
  }, [loading, targetSection]);

  // ── browse state ──
  const [bSearch,   setBSearch]   = useState("");
  const [bCategory, setBCategory] = useState("all");
  const [bField,    setBField]    = useState("all");
  const [bSort,     setBSort]     = useState("newest");
  const [bData,     setBData]     = useState({ categories: [], statistics: {} });
  const [bLoading,  setBLoading]  = useState(true);
  const [bError,    setBError]    = useState("");
  const [bReload,   setBReload]   = useState(0);

  const userType = (() => {
    const u = getUser();
    const t = u?.type ?? u?.role ?? null;
    if (t === "employee") return "employee";
    if (t === "user" || t === "trainee") return "user";
    if (t === "staff") return "staff";
    return "user";
  })();

  // ── continue watching ─────────────────────────────────────────────────────
  const handleContinue = useCallback(async (prog) => {
    const pid = resolveProgramId(prog);
    if (!pid) return;
    setContinueLoading(pid);
    try {
      const next = await resolveContinueSession(pid, {
        fetchEnrollmentDetail: fetchMyEnrollmentDetail,
        fetchSessions: fetchMySessions,
      });
      if (next?.id) {
        markAutoplaySession(next.id);
        // افتح صفحة البرنامج مع auto-open على الجلسة الصح
        onViewProgram?.({ ...prog, programId: pid, id: pid, autoOpenSessionId: next.id });
      } else {
        onViewProgram?.(prog);
      }
    } catch { onViewProgram?.(prog); }
    finally { setContinueLoading(null); }
  }, [onViewProgram]);

  // ── fetch enrolled ────────────────────────────────────────────────────────
  useEffect(() => {
    let on = true;
    Promise.all([
      fetchMyEnrollments({ per_page: 100 }),
      fetchMySessions({ filter: "all", per_page: 100 }).catch(() => null),
    ])
      .then(([res, sessRes]) => {
        const list = res?.data?.programs ?? [];
        // seed favourites from enrolled programs
        const enrolledFavIds = list
          .filter(e => e.program?.is_favourite)
          .map(e => String(e.program?.id ?? ""))
          .filter(Boolean);
        if (enrolledFavIds.length) seedFavs(enrolledFavIds);
        const byProgram = groupSessionsByProgram(sessRes?.data?.sessions ?? sessRes?.data ?? []);
        const mapped = list.map(e => {
          const p = e.program ?? {};
          const trainerName = p.trainer?.name ?? null;
          const sessionList = sessionsForProgram(e, p, byProgram);
          return {
            id:           `e${e.enrollment_id ?? p.id}`,
            programId:    p.id,
            title:        p.name ?? "—",
            sessions:     e.progress?.total ?? p.sessions_count ?? 0,
            hours:        parseFloat(p.hours_count) || 0,
            duration:     p.duration_weeks ?? 0,
            date:         p.start_date ?? "",
            endDate:      p.end_date ?? "",
            price:        parseFloat(p.price_amount) || 0,
            oldPrice:     null,
            rating:       p.rating ?? 0,
            type:         typeof p.session_type === "object"
                            ? (p.session_type?.text ?? "أونلاين")
                            : (p.session_type ?? "أونلاين"),
            tags:         (p.keywords ?? []).map(k => typeof k === "object" ? k.name : k),
            trainer:      trainerName ?? "—",
            trainerAvatar: trainerName ? trainerName[0] : (p.provider?.name ? p.provider.name[0] : "م"),
            trainerImg:   mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
            trainerSub:   p.provider?.name ?? "—",
            best:         false,
            state:        "enrolled",
            enrolledNum:  p.trainees_count ?? 0,
            totalSeats:   p.max_capacity ?? 0,
            ownership:    "own",
            progress:     Math.max(
              Number(e.progress?.progress_percent ?? p.progress_percent ?? 0) || 0,
              getProgramLocalPercent(p.id)
            ),
            img:          programCover(p),
            category:     p.category?.name ?? "all",
            videoUrl:     programVideoUrl(p, sessionList),
          };
        });
        if (on) setEnrolled(mapped);
        attachProgramVideos(mapped, fetchMyProgramDetail).then(next => {
          if (on) setEnrolled(next);
        });
      })
      .catch(() => {})
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  // ── fetch browse programs ─────────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    setBLoading(true);
    const timer = window.setTimeout(() => {
      const cat = bCategory === "all" ? undefined : bCategory;
      fetchMyBrowsePrograms({ search: bSearch.trim() || undefined, category: cat })
        .then(res => {
          if (!active) return;
          const d = res?.data ?? {};
          const categories = (d.categories ?? []).map(c => ({
            id: c.id,
            name: c.name,
            programs: (c.programs ?? []).map(p => ({
              id:           p.id,
              programId:    p.id,
              title:        p.name ?? "—",
              sessions:     p.sessions_count ?? 0,
              hours:        parseFloat(p.hours_count) || 0,
              duration:     p.duration_weeks ?? 0,
              date:         p.start_date ?? "",
              price:        parseFloat(p.price_amount) || 0,
              oldPrice:     null,
              rating:       p.rating ?? 0,
              type:         typeof p.session_type === "object"
                              ? (p.session_type?.text ?? "online")
                              : (p.session_type ?? "online"),
              tags:         p.keywords ?? [],
              trainer:      p.trainer?.name ?? "—",
              trainerAvatar:(p.trainer?.name ?? "م")[0],
              trainerImg:   mediaUrl(p.trainer?.image ?? p.trainer?.profile_image ?? p.trainer?.avatar),
              trainerSub:   p.provider?.name ?? "—",
              fieldName:    p.category?.name ?? "",
              best:         false,
              state:        "waiting",
              cta:          true,
              img:          programCover(p),
              videoUrl:     programVideoUrl(p),
              cat:          String(p.category?.id ?? 0),
              enrolledNum:  p.trainees_count ?? 0,
              isFavourite:  p.is_favourite ?? false,
            })),
          }));
          // seed favourites from browse programs
          const browseFavIds = categories
            .flatMap(c => c.programs)
            .filter(p => p.isFavourite)
            .map(p => String(p.id));
          if (browseFavIds.length) seedFavs(browseFavIds);
          setBData({ categories, statistics: d.statistics ?? {} });
          setBError("");
          attachCategoryProgramVideos(categories, fetchMyProgramDetail).then(next => {
            if (active) setBData(prev => ({ ...prev, categories: next }));
          });
        })
        .catch(() => { if (active) setBError("تعذر تحميل البرامج، حاول مرة أخرى."); })
        .finally(() => { if (active) setBLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [bSearch, bCategory, bReload]);

  const bAll = useMemo(() => bData.categories.flatMap(c => c.programs), [bData.categories]);

  const bCategories = useMemo(() =>
    [{ value: "all", label: "الأقسام" }, ...bData.categories.map(c => ({ value: String(c.id), label: c.name }))],
    [bData.categories]);

  const bFields = useMemo(() => {
    const names = [...new Set(bAll.map(p => p.fieldName).filter(Boolean))];
    return [{ value: "all", label: "مجال البرنامج" }, ...names.map(n => ({ value: n, label: n }))];
  }, [bAll]);

  const bFiltered = useMemo(() => {
    let list = [...bAll];
    if (bSearch.trim()) {
      const q = bSearch.trim().toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || (typeof p.trainer === "string" && p.trainer.toLowerCase().includes(q)));
    }
    if (bField !== "all") list = list.filter(p => p.fieldName === bField);
    if (bSort === "popular") list.sort((a,b) => (b.enrolledNum??0) - (a.enrolledNum??0));
    if (bSort === "price")   list.sort((a,b) => (a.price??0) - (b.price??0));
    if (bSort === "rating")  list.sort((a,b) => (b.rating??0) - (a.rating??0));
    return list;
  }, [bAll, bSearch, bField, bSort]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 min-h-0" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-8 py-4 space-y-8">

        {/* ── page header ── */}
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#31AFEA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <h1 className="text-lg font-extrabold text-slate-800">برامجي</h1>
        </div>

        {/* ══ section 1: استكمال المشاهدة — أول جزء في الصفحة ══ */}
        {!loading && enrolled.filter(p => (p.progress ?? 0) > 0 || getLastWatchForProgram(p.programId)).length > 0 && (
          <div ref={continueRef} style={{ scrollMarginTop: 16 }}>
            <SectionHeader title="استكمال المشاهدة"/>
            <Carousel gap={14}>
              {enrolled.filter(p => (p.progress ?? 0) > 0 || getLastWatchForProgram(p.programId)).map(p => (
                <ResumeCard
                  key={p.id}
                  p={p}
                  onContinue={handleContinue}
                  isLoading={continueLoading === resolveProgramId(p)}
                />
              ))}
            </Carousel>
          </div>
        )}

        {/* ══ section 2: برامجي المسجلة ══ */}
        <div ref={enrolledRef} style={{ scrollMarginTop: 16 }}>
          <SectionHeader title="برامجي المسجلة" count={!loading ? enrolled.length : undefined}/>
          {loading ? (
            <Carousel gap={16}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[16px] bg-white border border-slate-100 overflow-hidden animate-pulse shrink-0" style={{ width: 290 }}>
                  <div className="h-24 bg-slate-200 mx-2.5 mt-2.5 rounded-xl"/>
                  <div className="p-3 space-y-2">
                    <div className="h-3.5 bg-slate-200 rounded w-3/4"/>
                    <div className="h-3 bg-slate-100 rounded w-1/2"/>
                    <div className="h-8 bg-slate-200 rounded-xl mt-3"/>
                  </div>
                </div>
              ))}
            </Carousel>
          ) : enrolled.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-100 px-6 py-8 text-center">
              <p className="text-sm text-slate-400">لم تسجّل في أي برنامج بعد</p>
            </div>
          ) : (
            <Carousel gap={16}>
              {enrolled.map(p => (
                <div key={p.id} className="shrink-0" style={{ width: 290 }}>
                  <ProgramCard p={p} onClick={() => onViewProgram?.(p)} userType={userType} hideCta/>
                </div>
              ))}
            </Carousel>
          )}
        </div>

        {/* ══ section 3: تصفح كل البرامج ══ */}
        <div className="border-t border-slate-200 pt-6">
          <SectionHeader title="تصفح كل البرامج" count={!bLoading ? bFiltered.length : undefined}/>

        

          {/* ── cards carousel ── */}
          {bLoading ? (
            <Carousel gap={16}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-[16px] bg-white border border-slate-100 overflow-hidden animate-pulse shrink-0" style={{ width: 290 }}>
                  <div className="mx-2.5 mt-2.5 rounded-xl" style={{ height: 116, background:"#EEF2F6" }}/>
                  <div className="px-2.5 pt-2 pb-2 space-y-2">
                    <div className="h-3 rounded w-3/5" style={{ background:"#EEF2F6" }}/>
                    <div className="h-2.5 rounded w-full" style={{ background:"#EEF2F6" }}/>
                    <div className="h-8 rounded-xl w-full" style={{ background:"#EEF2F6" }}/>
                  </div>
                </div>
              ))}
            </Carousel>
          ) : bError ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">{bError}</p>
              <button onClick={() => { setBLoading(true); setBReload(r => r + 1); }}
                className="mt-3 px-4 py-2 rounded-lg text-[12px] font-bold text-white"
                style={{ background:"#31AFEA" }}>إعادة المحاولة</button>
            </div>
          ) : bFiltered.length === 0 ? (
            <p className="text-center py-12 text-sm text-slate-400">لا توجد برامج تطابق البحث</p>
          ) : (
            <Carousel gap={16}>
              {bFiltered.map(p => {
                const isEnrolled = enrolled.some(e => (e.programId ?? e.id) === p.id);
                const pWithState = isEnrolled ? { ...p, state: "enrolled", cta: true } : p;
                return (
                  <div key={p.id} className="shrink-0" style={{ width: 290 }}>
                    <ProgramCard p={pWithState} onClick={() => onViewProgram?.(p)} userType={userType}/>
                  </div>
                );
              })}
            </Carousel>
          )}
        </div>

      </div>
    </div>
  );
}
