import { useState, useEffect } from "react";

/**
 * QuizNavbar — شريط رفيع يظهر أسفل الـ Topbar مباشرة أثناء الاختبار فقط
 * meta = { title, questionsCount, durationMinutes, currentQuestion? }
 */
export default function QuizNavbar({ meta }) {
  const totalSecs = (meta?.durationMinutes ?? 0) * 60;
  const [secs, setSecs] = useState(totalSecs);

  // reset when quiz changes
  useEffect(() => {
    setSecs((meta?.durationMinutes ?? 0) * 60);
  }, [meta?.durationMinutes, meta?.title]);

  // countdown tick
  useEffect(() => {
    if (totalSecs <= 0) return;
    const id = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [totalSecs]);

  const mm     = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss     = String(secs % 60).padStart(2, "0");
  const urgent = totalSecs > 0 && secs > 0 && secs <= 120;

  const questionsCount  = meta?.questionsCount ?? 0;
  const currentQuestion = meta?.currentQuestion ?? null;

  return (
    <div
      className="shrink-0 flex items-center justify-between px-5"
      style={{
        height: 40,
        background: "#024677",
        borderBottom: "1px solid rgba(255,255,255,0.1)",
        direction: "rtl",
      }}
      dir="rtl"
    >
      {/* يمين: اسم الاختبار */}
      <span
        className="text-[13px] font-bold truncate max-w-[40%]"
        style={{ color: "#fff" }}
      >
        {meta?.title ?? "الاختبار"}
      </span>

      {/* وسط: السؤال الحالي / الكل */}
      {questionsCount > 0 && (
        <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
          {currentQuestion != null
            ? `السؤال ${currentQuestion} من ${questionsCount}`
            : `${questionsCount} سؤال`}
        </span>
      )}

      {/* شمال: تايمر */}
      {totalSecs > 0 && (
        <span
          className="flex items-center gap-1.5 text-[12px] font-extrabold px-2.5 py-0.5 rounded-lg transition-colors"
          style={{
            background: urgent ? "#EF4444" : "rgba(255,255,255,0.15)",
            color: "#fff",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {mm}:{ss}
        </span>
      )}
    </div>
  );
}
