import { useEffect } from "react";
import { IcoBell, IcoChevL, IcoChevR } from "./icons.jsx";
import UpcomingCard from "./UpcomingCard.jsx";

export default function Sidebar({ isEmployee, upcomingIdx, setUpcomingIdx, user, upcomingSessions = [], avgProgress = 0 }) {

  const firstName = (user?.name ?? user?.first_name ?? "").split(" ")[0] || "";
  const greeting  = firstName ? `مرحباً، ${firstName}` : "مرحباً";
  const initial   = (user?.name ?? user?.first_name ?? "أ")[0] ?? "أ";

  const pct    = Math.round(Math.min(100, Math.max(0, avgProgress)));
  const r      = 42;
  const circum = 2 * Math.PI * r;
  const dash   = (pct / 100) * circum;

  // عدد الجلسات — نعرض 2 في كل مرة
  const total  = upcomingSessions.length;
  const maxIdx = Math.max(0, total - 2);

  // auto-scroll every 5 seconds
  useEffect(() => {
    if (total <= 2) return;
    const timer = setInterval(() => {
      setUpcomingIdx(i => (i >= maxIdx ? 0 : i + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [total, maxIdx, setUpcomingIdx]);

  return (
    <div
      className="hidden lg:flex w-[300px] shrink-0 flex-col overflow-hidden lg:pl-6"
      style={{ background: "#fff", borderRight: "1px solid #f1f5f9" }}
    >
      {/* user info */}
      <div className="px-4 pt-5 pb-4 text-center border-b border-slate-100">
        <div className="relative w-24 h-24 mx-auto mb-2">
          <div
            className="absolute inset-[14px] rounded-full flex items-center justify-center text-2xl font-extrabold text-white z-10"
            style={{ background: "linear-gradient(135deg,#14b8a6,#024677)" }}
          >
            {initial}
          </div>
          <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 pointer-events-none">
            <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6"/>
            <circle
              cx="48" cy="48" r={r}
              fill="none" stroke="#31AFEA" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circum}`}
              transform="rotate(-90 48 48)"
            />
          </svg>
        </div>

        <p className="text-[13px] font-bold text-slate-800 mt-4">{greeting}</p>
        <p className="text-[11px] text-slate-400 mt-1 leading-tight">
          {isEmployee
            ? (user?.job_title ?? user?.department ?? "موظف — إدارة التدريب")
            : "واصل رحلتك وحقق هدفك"}
        </p>
        {pct > 0 && (
          <p className="text-[10px] font-bold mt-1" style={{ color: "#31AFEA" }}>
            {pct}% متوسط التقدم
          </p>
        )}

        <button className="mt-2 w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center mx-auto text-slate-400 hover:text-teal-500 hover:border-teal-300 transition">
          <IcoBell/>
        </button>
      </div>

      {/* upcoming sessions */}
      <div
        className="px-3 py-3 flex-1 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <style>{`.dash-scroll::-webkit-scrollbar{display:none}`}</style>
        <div className="dash-scroll" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-700">الجلسات القادمة</span>
            {total > 2 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setUpcomingIdx(i => Math.max(0, i - 1))}
                  className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition"
                >
                  <IcoChevL/>
                </button>
                <button
                  onClick={() => setUpcomingIdx(i => Math.min(maxIdx, i + 1))}
                  className="w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition"
                >
                  <IcoChevR/>
                </button>
              </div>
            )}
          </div>

          {total === 0 ? (
            <p className="text-center text-[11px] text-slate-400 py-6">لا توجد جلسات قادمة</p>
          ) : (
            <>
              <div className="space-y-2">
                {upcomingSessions.slice(upcomingIdx, upcomingIdx + 2).map(s => (
                  <UpcomingCard key={s.id} s={s}/>
                ))}
              </div>

              {total > 2 && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  {Array.from({ length: maxIdx + 1 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setUpcomingIdx(i)}
                      className="rounded-full transition-all"
                      style={{
                        width:      i === upcomingIdx ? 20 : 10,
                        height:     10,
                        background: i === upcomingIdx ? "#5AEACF" : "#cbd5e1",
                        boxShadow:  i === upcomingIdx ? "0 0 8px rgba(90,234,207,.7)" : "none",
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
