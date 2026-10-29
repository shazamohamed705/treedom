export default function JoinSessionModal({ joinMsg, onClose, onViewRecording }) {
  if (!joinMsg) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center text-center gap-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: joinMsg.ok ? "#f0fdf4" : "#fff1f2" }}>
          {joinMsg.ok
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </div>

        <div>
          <h3 className="text-[17px] font-extrabold text-slate-800">
            {joinMsg.ok ? "تم تسجيل حضورك" : "تنبيه"}
          </h3>
          <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">{joinMsg.text}</p>
        </div>

        {joinMsg.ok && joinMsg.sessionEnded && joinMsg.session && onViewRecording && (
          <button
            type="button"
            onClick={() => { onClose?.(); onViewRecording(joinMsg.session); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-bold text-white hover:opacity-90 transition"
            style={{ background: "#14b8a6" }}
          >
            عرض تسجيل الجلسة
          </button>
        )}

        {joinMsg.meetUrl && !joinMsg.sessionEnded && (
          <a
            href={joinMsg.meetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            فتح رابط الجلسة المباشرة
          </a>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-slate-400 hover:text-slate-600 transition"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}
