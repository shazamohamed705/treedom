import { IcoPlay } from "./icons.jsx";
import { TagPill, Bar, MiniRibbon } from "./BadgesRibbons.jsx";
import { THUMB_BG } from "./mockData.js";

export default function ContinueCard({ p, onView, onContinue, fav, onFav, isLoading }) {
  // الضغط على الكارد → تفاصيل البرنامج
  // زر استكمل المشاهدة → session view على أول جلسة ما اتكملتش
  const handleContinue = (e) => {
    e.stopPropagation();
    if (isLoading) return;
    onContinue?.(p);
  };
  return (
    <div
      onClick={() => onView?.(p)}
      className="rounded-[14px] bg-white border border-slate-100 flex flex-col shrink-0 relative overflow-hidden cursor-pointer hover:shadow-md transition"
      style={{ width: "min(300px, 80vw)", boxShadow: "0 4px 16px rgba(8,15,52,0.07)" }}
      dir="rtl"
    >
      <MiniRibbon type={typeof p.type === "string" ? p.type : "online"} />

      {/* thumbnail — نفس غلاف برامجي */}
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
        ) : typeof p.img === "string" && p.img ? (
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
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleContinue}
        >
          <div className="w-9 h-9 rounded-full bg-white/25 flex items-center justify-center hover:bg-white/40 cursor-pointer transition">
            <IcoPlay size={13}/>
          </div>
        </div>
        {/* favourite heart */}
        <button
          onClick={(e) => { e.stopPropagation(); onFav?.(p); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center z-10 cursor-pointer transition"
          style={{ background: fav ? "rgba(239,68,68,0.9)" : "rgba(255,255,255,0.25)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24"
            fill={fav ? "#fff" : "none"} stroke="#fff" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      {/* body */}
      <div className="px-2.5 pt-1.5 pb-2.5 flex flex-col gap-1">
        {(p.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {p.tags.slice(0, 1).map((t, i) => <TagPill key={i} label={t}/>)}
          </div>
        )}

        <p className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-2">{p.title}</p>

        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[9px] text-slate-400">التقدم</span>
            <span className="text-[9px] font-bold" style={{ color: "#14b8a6" }}>{p.progress}%</span>
          </div>
          <Bar value={p.progress} color="#14b8a6"/>
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {p.trainerImg ? (
              <img
                src={p.trainerImg}
                alt={typeof p.trainer === "object" ? p.trainer?.name : p.trainer}
                className="w-6 h-6 rounded-full object-cover shrink-0"
              />
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
              <p className="text-[9.5px] text-slate-500">{p.org ?? "مطوّر برمجيات"}</p>
            </div>
          </div>
          <button
            onClick={handleContinue}
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
