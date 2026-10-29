import { IcoDlDark, IcoClock } from "./icons";
import { sessionHasPassed, sessionHasFiles, visibleSessionVideo } from "./sessionHelpers";
import SessionActionButton, { resolveSessionAction } from "./SessionActionButton";

export {
  isOnlineSession,
  sessionEndedFromApi,
  visibleSessionVideo,
  sessionHasPassed,
} from "./sessionHelpers";

function LockedThumb({ onClick }) {
  return (
    <div
      className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer self-stretch"
      onClick={onClick}
      style={{ width: 100, minHeight: 72, background: "#0d1b2e" }}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 35% 40%, rgba(49,175,234,0.45), transparent 55%), radial-gradient(circle at 70% 65%, rgba(90,234,207,0.3), transparent 50%), #0d1b2e",
          filter: "blur(14px)",
          transform: "scale(1.2)",
        }}
      />
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-1"
        style={{ background: "rgba(8,15,32,0.45)", backdropFilter: "blur(8px)" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span className="text-[8px] font-bold text-white/90 text-center leading-tight px-1">مقفول</span>
      </div>
    </div>
  );
}

export default function SessionRow({
  s,
  isEnrolled = true,
  onSelect,
  onAction,
  onRewatch,
  onAskEnroll,
  isSelected,
  joinBusy,
}) {
  const isCompleted = s.status === "completed";
  const isCurrent   = s.status === "current";
  const isPast      = !isCompleted && !isCurrent && sessionHasPassed(s);
  const isUpcoming  = !isCompleted && !isCurrent && !isPast;
  const showCompleted = isCompleted || isPast;
  const isBusy = joinBusy === (s.sessionId ?? s.id);
  const unlockedVideo = isEnrolled ? visibleSessionVideo(s) : null;
  const lockedVideo = !isEnrolled && (s.videoLocked || !!(s.video_url || s.videoUrl || s.previewVideoUrl));
  const action = resolveSessionAction(s, { isEnrolled, lockedVideo });

  const badge = showCompleted
    ? { label:"مكتمل",        color:"#22c55e", bg:"#f0fdf4", border:"#22c55e30" }
    : isCurrent
    ? { label:"قيد المشاهدة", color:"#f59e0b", bg:"#fef9ee", border:"#f59e0b30" }
    : null;

  return (
    <div
      className="flex items-stretch gap-3 p-3 rounded-2xl transition mb-2"
      style={{ background:"#F7F9FA", border: isSelected ? "1.5px solid #31AFEA" : "1.5px solid transparent" }}
      dir="rtl">

      {action?.key === "join" ? (
        <div
          className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer self-stretch flex flex-col items-center justify-center gap-1"
          onClick={() => !isBusy && onAction?.(s)}
          style={{ width:100, minHeight:72, background: isBusy ? "#64748b" : "#024677", opacity: isBusy ? 0.7 : 1 }}>
          {isBusy
            ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          }
          <span className="text-[9px] font-bold text-white text-center leading-tight px-1">
            {isBusy ? "جارِ..." : "دخول الجلسة"}
          </span>
        </div>
      ) : unlockedVideo ? (
        <div className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer self-stretch"
          onClick={() => onSelect?.(s)}
          style={{ width:100, minHeight:72, background:"#000" }}>
          <video
            src={unlockedVideo}
            preload="metadata"
            muted
            playsInline
            className="absolute inset-0 w-full h-full"
            style={{ objectFit:"cover", pointerEvents:"none" }}
          />
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background:"rgba(0,0,0,0.28)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background:"rgba(255,255,255,0.85)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#024677" stroke="none">
                <polygon points="6 3 20 12 6 21 6 3"/>
              </svg>
            </div>
          </div>
          <span className="absolute bottom-1 right-1 text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded font-mono">
            {String(s.duration ?? "").replace(" دقيقة","m")}
          </span>
        </div>
      ) : lockedVideo ? (
        <LockedThumb onClick={() => onAskEnroll?.(s)} />
      ) : isUpcoming ? (
        <div
          className="relative shrink-0 rounded-xl overflow-hidden cursor-pointer self-stretch flex flex-col items-center justify-center gap-1"
          onClick={() => !isBusy && onAction?.(s)}
          style={{ width:100, minHeight:72, background: isBusy ? "#64748b" : "#024677", opacity: isBusy ? 0.7 : 1 }}>
          {isBusy
            ? <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>
          }
          <span className="text-[9px] font-bold text-white text-center leading-tight px-1">{isBusy ? "جارِ..." : "بدأ الجلسة"}</span>
        </div>
      ) : null}

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
              style={{ color:badge.color, background:badge.bg, borderColor:badge.border }}>
              ● {badge.label}
            </span>
          )}
          <p className="text-[13px] font-bold text-slate-800 leading-snug">{s.title}</p>
        </div>
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-1">{s.desc}</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <IcoClock/>
            <span className="text-[11px] text-slate-400">{s.duration}</span>
          </div>
          {s.coach && s.coach !== "—" && (
            <div className="flex items-center gap-1">
              {s.coachImg ? (
                <img
                  src={s.coachImg}
                  alt={s.coach}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                  onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                />
              ) : null}
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0"
                style={{ background: "#31AFEA", display: s.coachImg ? "none" : "flex" }}>
                {s.coach[0]}
              </span>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[100px]">{s.coach}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center gap-1.5 shrink-0">
        <SessionActionButton
          s={s}
          busy={isBusy}
          isEnrolled={isEnrolled}
          lockedVideo={lockedVideo}
          onJoin={onAction}
          onWatch={onSelect}
          onRewatch={onRewatch ?? onSelect}
          onAskEnroll={onAskEnroll}
        />
        {sessionHasFiles(s) && isEnrolled && (
          <button className="w-[138px] inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-bold bg-white text-slate-600 hover:bg-slate-50 transition"
            style={{ border: "1px solid #cbd5e1" }}>
            <IcoDlDark/> تحميل الملفات
          </button>
        )}
      </div>
    </div>
  );
}
