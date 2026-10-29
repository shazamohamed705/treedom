import { IcoCal, IcoClock, IcoUsers } from "./icons.jsx";
import { THUMB_BG } from "./mockData.js";

// حساب حالة الجلسة والنص المناسب للزر
function sessionStatus(dateStr, startTimeStr, endTimeStr) {
  if (!dateStr) return { label: "عرض الجلسة", isLiveNow: false };
  try {
    const parseHM = (t) => {
      const [h, m] = (t || "00:00").split(":").map(Number);
      return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
    };

    const now  = Date.now();
    const base = new Date(`${dateStr}T00:00:00`);

    const { h: sh, m: sm } = parseHM(startTimeStr);
    const { h: eh, m: em } = parseHM(endTimeStr || "23:59");

    const startDt = new Date(base); startDt.setHours(sh, sm, 0, 0);
    const endDt   = new Date(base); endDt.setHours(eh, em, 0, 0);

    // جارية الآن
    if (now >= startDt && now <= endDt) {
      return { label: "انضم الآن", isLiveNow: true };
    }

    const diffMs  = startDt - now;
    if (diffMs <= 0) return { label: "عرض الجلسة", isLiveNow: false }; // فاتت

    const totalMin = Math.round(diffMs / 60000);

    // أقل من 24 ساعة → "بعد X"
    if (totalMin < 60)  return { label: `بعد ${totalMin} دقيقة`,  isLiveNow: false };
    if (totalMin < 1440) {
      const hrs = Math.floor(totalMin / 60);
      const min = totalMin % 60;
      return { label: min === 0 ? `بعد ${hrs} ساعة` : `بعد ${hrs} س ${min} د`, isLiveNow: false };
    }

    // أكتر من 24 ساعة → اليوم بالعربي
    const dayFmt = new Intl.DateTimeFormat("ar-SA", { weekday: "long" });
    return { label: dayFmt.format(startDt), isLiveNow: false };

  } catch { return { label: "عرض الجلسة", isLiveNow: false }; }
}

// عرض الوقت بشكل قابل للقراءة (08:30 → 8:30 ص)
function fmtTime(t) {
  if (!t) return "";
  try {
    const [hStr, mStr] = t.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr ?? "00";
    const ampm = h < 12 ? "ص" : "م";
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  } catch { return t; }
}

export default function UpcomingCard({ s }) {
  const startTime = s.timeFrom ?? s.time?.split("—")[0]?.trim() ?? "";
  const endTime   = s.timeTo   ?? s.time?.split("—")[1]?.trim() ?? "";
  const { label, isLiveNow } = sessionStatus(s.date, startTime, endTime);
  const liveNow   = s.isLive || isLiveNow;
  const timeDisplay = s.timeFrom
    ? `${fmtTime(s.timeFrom)} — ${fmtTime(s.timeTo)}`
    : (s.time ?? "");

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white" dir="rtl">
      {/* thumbnail header */}
      <div className="h-[100px] flex items-end px-3 pb-2.5 relative overflow-hidden"
        style={{ background: THUMB_BG }}>
        {s.videoUrl ? (
          <video
            src={s.videoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            preload="metadata"
            muted
            playsInline
          />
        ) : s.img ? (
          <img src={s.img} alt="" className="absolute inset-0 w-full h-full object-cover"/>
        ) : (
          <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.3) 1px,transparent 1px)", backgroundSize: "12px 12px" }}/>
        )}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%)" }}/>
        <p className="text-[12px] text-white leading-tight line-clamp-2 z-10">{s.program}</p>
      </div>

      {/* body */}
      <div className="p-3 space-y-2">
        <p className="text-[13px] font-bold text-slate-800 leading-snug line-clamp-2">{s.title}</p>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          {s.date && (
            <span className="flex items-center gap-0.5"><IcoCal/>{s.date}</span>
          )}
          {timeDisplay && (
            <span className="flex items-center gap-0.5"><IcoClock/>{timeDisplay}</span>
          )}
          {s.duration > 0 && (
            <span className="flex items-center gap-0.5"><IcoUsers/>{s.duration} دقيقة</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: "#14b8a6" }}>
            {(s.trainer ?? "م")[0]}
          </div>
          <p className="text-[11px] text-slate-400 truncate">{s.trainer}</p>
        </div>

        <button
          className="w-full py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition text-white"
          style={{ background: liveNow ? "#14b8a6" : "#31AFEA" }}
        >
          {liveNow && <span className="w-2 h-2 rounded-full bg-white animate-pulse"/>}
          {label}
        </button>
      </div>
    </div>
  );
}
