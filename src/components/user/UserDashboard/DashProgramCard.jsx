import { useState } from "react";
import { IcoPlay, IcoStar, Riyal } from "./icons.jsx";
import { BestBadge, MiniRibbon, TagPill } from "./BadgesRibbons.jsx";
import { THUMB_BG } from "./mockData.js";
import { useFavStore, setFav } from "../../../services/favourites.js";
import { addMyFavourite, removeMyFavourite } from "../../../services/api.js";

// userType: "user" | "employee" | "trainer" | "company" | "org" | null
export default function DashProgramCard({ p, onView, showButton = false, userType = null }) {
  // is_enrolled من API يكون موجود في p.isEnrolled — نستخدمه مباشرة
  const enrolled = p.isEnrolled ?? false;
  const [favBusy,    setFavBusy]    = useState(false);

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
      setFav(pid, isFav); // rollback
    } finally {
      setFavBusy(false);
    }
  };

  const showOwnership = !showButton && userType === "employee";

  const capacityText =
    p.totalSeats > 0
      ? `${p.enrolledNum ?? 0}/${p.totalSeats} متدرب مسجّل`
      : `${p.sessions ?? 0} جلسات تدريبية`;

  return (
    <>
      <div
        onClick={() => onView?.(p)}
        className="rounded-[16px] bg-white border border-slate-100 flex flex-col relative overflow-hidden shrink-0 cursor-pointer hover:shadow-md transition"
        style={{ width: "min(300px, 80vw)", boxShadow: "0 6px 24px rgba(8,15,52,0.08)" }}
        dir="rtl"
      >
        {p.best && <BestBadge/>}
        <MiniRibbon type={p.type}/>

        {/* thumbnail */}
        <div className="relative overflow-hidden mx-2.5 mt-2.5 rounded-xl shrink-0"
          style={{ height: 100, background: THUMB_BG }}>
          <div className="absolute inset-0 opacity-60 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize: "14px 14px" }}/>
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
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition">
              <IcoPlay size={14}/>
            </div>
          </div>
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
        <div className="px-2.5 pt-2 pb-3 flex flex-col gap-1 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {(p.tags || p.badges || []).map((t, i) => <TagPill key={i} label={t}/>)}
          </div>

          <p className="text-[13px] font-semibold text-slate-800 leading-snug line-clamp-2" title={p.title}>
            {p.title}
          </p>

          <p className="text-[10px] font-medium" style={{ color: "#808080" }}>
            المدة: {p.sessions ?? 0} جلسة - {p.duration ?? 0} أسابيع
          </p>

          {/* status area */}
          <div className="flex flex-col gap-0.5">
            {enrolled ? (
              <p className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "#14b8a6" }}>
                ✓ أنت مسجّل في هذا البرنامج
              </p>
            ) : (
              <p className="text-[11px] font-medium text-slate-800">
                يبدأ {p.date ? p.date : "قريباً"}
              </p>
            )}
            <p className="text-[10px] font-medium" style={{ color: "#808080" }}>
              {capacityText}
            </p>
            {p.sessions > 0 && p.completedSessions != null && (
              <p className="text-[10px] font-medium" style={{ color: "#024677" }}>
                {p.completedSessions}/{p.sessions} جلسة مكتملة
              </p>
            )}
          </div>

          {/* price + rating */}
          <div className="flex items-baseline justify-between gap-2 mt-0.5">
            <span className="flex items-center gap-1.5">
              {p.oldPrice ? (
                <span className="text-slate-400 line-through" style={{ display: "inline-flex", alignItems: "center" }}>
                  {p.oldPrice}<Riyal size={9}/>
                </span>
              ) : null}
              <span className="font-extrabold" style={{ color: "#31AFEA", display: "inline-flex", alignItems: "center", fontSize: "14px" }}>
                {p.price ?? 0}<Riyal size={10}/>
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
                alt={typeof p.trainer === "object" ? p.trainer?.name : p.trainer}
                className="w-7 h-7 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ background: "#31AFEA" }}>
                {p.trainerAvatar ?? "م"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-slate-900 truncate">
                {typeof p.trainer === "object"
                  ? (p.trainer?.name ?? p.trainerSub ?? "—")
                  : (p.trainer || p.trainerSub || "—")}
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate">
                {p.org ?? p.trainerSub ?? "أكاديمية الريادة الخليجية"}
              </p>
            </div>
          </div>

          {/* ownership label — employee only */}
          {showOwnership && (
            <p className="w-full flex items-center justify-end gap-1.5 text-[11px] font-bold"
              style={{ color: "#024677" }}>
              {p.ownership === "company" ? (
                <>
                  معين من الشركة
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21V7l5 3V7l5 3V7l5 3v11z"/><path d="M3 21h18"/>
                  </svg>
                </>
              ) : (
                <>
                  خاص بيه
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                  </svg>
                </>
              )}
            </p>
          )}

          {/* enroll button — only for "برامج مقترحة" (showButton=true) */}
          {showButton && (
            enrolled ? (
              <button
                onClick={(e) => { e.stopPropagation(); onView?.(p); }}
                className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-2"
                style={{ background: "#16a34a" }}
              >
                أنت مسجّل
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onView?.(p); }}
                className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white hover:opacity-90 transition mt-2"
                style={{ background: "#31AFEA" }}
              >
                سجل الآن
              </button>
            )
          )}
        </div>
      </div>
    </>
  );
}
