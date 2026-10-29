import { isRecordedSession } from "../../../services/sessionType";

// ── program preview sidebar ───────────────────────────────────────────────────
function CheckIcon({ done, warn }) {
  if (warn) return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]"
      style={{ background: "#FEF3C7", color: "#D97706" }}>!</span>
  );
  if (done) return (
    <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
      style={{ background: "#14b8a6" }}>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
    </span>
  );
  return (
    <span className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0"/>
  );
}

export default function ProgramPreview({ form, sessions, doneCount, indeCoach = false }) {
  const totalSessions  = Number(form.totalSessions) || 0;
  const recordedSessions = sessions.filter(s => s.type === "recorded").length;
  const liveSessions     = sessions.filter(s => s.type === "zoom").length;
  const uploadedVideos   = sessions.filter(s => s.type === "recorded" && s.videos?.[0]).length;

  // جاهزية الجلسات — كل جلسة ليها حالة
  const sessionReadiness = sessions.map(s => {
    const hasTitle = !!s.title;
    const recorded = isRecordedSession(s.type);
    const hasDate  = !!s.date;
    if (!hasTitle) return { label: s.title || "جلسة بدون عنوان", sub: "جلسة تفاعلية غير مسجله", status: "warn" };
    if (!hasDate)  return { label: s.title, sub: "جلسة تفاعلية غير مسجله", status: "warn" };
    return { label: s.title, sub: recorded ? "مسجل" : "جلسة تفاعلية غير مسجله", status: "done" };
  });

  const readinessPct = sessions.length === 0 ? 0
    : Math.round((sessionReadiness.filter(s => s.status === "done").length / sessions.length) * 100);

  // قائمة الإرسال للمراجعة
  const submitChecks = [
    { label: "عنوان البرنامج",       done: !!form.name },
    { label: "وصف البرنامج",         done: !!form.desc },
    { label: "المدرب المسؤول",        done: indeCoach || !!form.coachId },
    { label: "تاريخ البدء والانتهاء", done: !!(form.startDate && form.endDate) },
    { label: "السعر المحدد",          done: !!form.price },
    { label: "جميع الجلسات مكتملة",  done: sessions.length > 0 && sessionReadiness.every(s => s.status === "done") },
  ];

  return (
    <div className="w-full xl:w-72 xl:shrink-0 space-y-3 xl:sticky xl:top-6" dir="rtl">

      {/* ── نظرة عامة على البرنامج ── */}
      <div className="bg-white rounded-2xl p-4 space-y-3 border border-brand-border">
        <h3 className="text-sm font-bold text-slate-800 text-center border-b border-brand-border pb-2">
          نظرة عامة على البرنامج
        </h3>
        {[
          { label: "السعر",              val: form.price ? `${form.price} /متدرب` : "—" },
          { label: "إجمالي الجلسات",    val: form.totalSessions ? `${form.totalSessions} جلسة` : "—" },
          { label: "إجمالي الساعات",    val: form.hours ? `${form.hours} ساعة` : "—" },
          { label: "جلسات مسجلة",       val: `${recordedSessions} جلسة` },
          { label: "جلسات مباشرة",      val: `${liveSessions} جلسة` },
          { label: "فيديوهات مرفوعة",   val: `${uploadedVideos} / ${recordedSessions}` },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">{row.val}</span>
            <span className="text-slate-700 font-semibold">{row.label}</span>
          </div>
        ))}
      </div>

      {/* ── جاهزية الجلسات ── */}
      <div className="bg-white rounded-2xl p-4 space-y-2 border border-brand-border">
        <h3 className="text-sm font-bold text-slate-800 text-center border-b border-brand-border pb-2">
          جاهزية الجلسات
        </h3>
        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">لا توجد جلسات مضافة بعد</p>
        ) : (
          <>
            {sessionReadiness.map((s, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <CheckIcon done={s.status === "done"} warn={s.status === "warn"} />
                <div className="flex-1 min-w-0 text-right">
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {i + 1}. {s.label}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: s.status === "warn" ? "#D97706" : "#94a3b8" }}>
                    {s.sub}
                  </p>
                </div>
              </div>
            ))}
            {/* progress bar */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>{readinessPct}%</span>
                <span>جاهزية المنهج</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${readinessPct}%`, background: "#14b8a6" }}/>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── قائمة الإرسال للمراجعة ── */}
      <div className="bg-white rounded-2xl p-4 space-y-2 border border-brand-border">
        <h3 className="text-sm font-bold text-slate-800 text-center border-b border-brand-border pb-2 flex items-center justify-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          قائمة الإرسال للمراجعة
        </h3>
        {submitChecks.map(item => (
          <div key={item.label} className="flex items-center justify-between gap-2">
            <CheckIcon done={item.done} />
            <span className={`text-xs flex-1 text-right ${item.done ? "text-slate-700" : "text-slate-400"}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}
