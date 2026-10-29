// ── submit success modal ─────────────────────────────────────────────────────
export default function SubmitSuccessModal({ message, onClose, onDone }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}>
      <div dir="rtl" onClick={e => e.stopPropagation()}
        className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "#F0F7FF", color: "#024677" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.5 7h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4m-8-13a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h4" />
            <line x1="2" y1="2" x2="2" y2="16" />
            <line x1="2" y1="6" x2="2" y2="10" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">تم إرسال البرنامج للمراجعة</h3>
        <p className="text-sm text-slate-500 leading-relaxed mb-5">{message}</p>
        <button
          onClick={onDone}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
          style={{ background: "#024677" }}>
          حسناً، فهمت
        </button>
      </div>
    </div>
  );
}
