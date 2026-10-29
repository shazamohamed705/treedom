import { THUMB_BG } from "./constants.jsx";
import { IcoPlay, IcoStar } from "./icons";
import TrainerAvatar from "./TrainerAvatar";

export default function RelatedCard({ p, onView }) {
  const trainerName = typeof p.trainer === "object" ? p.trainer?.name : (p.trainer ?? "—");
  const trainerLetter = p.trainerAvatar ?? (trainerName.trim()[0] || "م");

  return (
    <div
      onClick={() => onView?.(p)}
      className="rounded-2xl border border-slate-200 bg-white overflow-hidden cursor-pointer hover:shadow-md transition shrink-0"
      style={{ width: 200 }}>
      {/* thumbnail */}
      <div className="w-full relative" style={{ height: 100, background: THUMB_BG }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <IcoPlay />
          </div>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[11px] font-bold text-slate-800 line-clamp-2 mb-1.5">{p.title}</p>
        {/* trainer row: avatar + name */}
        <div className="flex items-center gap-1.5 mb-1">
          <TrainerAvatar img={p.trainerImg ?? null} letter={trainerLetter} size={20} />
          <span className="text-[10px] text-slate-400 truncate">{trainerName}</span>
        </div>
        <div className="flex items-center gap-1">
          <IcoStar />
          <span className="text-[10px] font-bold text-amber-500">{p.rating}</span>
        </div>
      </div>
    </div>
  );
}
