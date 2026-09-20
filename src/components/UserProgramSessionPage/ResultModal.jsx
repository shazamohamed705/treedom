import { useEffect } from "react";

export default function ResultModal({ ok, message, title, onClose }) {
  useEffect(() => {
    const t = window.setTimeout(onClose, 4000);
    return () => window.clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(2,17,38,0.55)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="w-full max-w-[340px] bg-white rounded-3xl flex flex-col items-center px-6 py-8 text-center"
        style={{ animation: "fadeUp 0.25s ease-out" }}>
        {/* icon circle */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
          style={{
            background: ok
              ? "linear-gradient(135deg,#4ade80,#22c55e)"
              : "linear-gradient(135deg,#f87171,#ef4444)",
          }}>
          {ok ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff"
              strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          )}
        </div>

        <h2 className="text-[18px] font-extrabold text-slate-900 mb-1.5">
          {title ?? (ok ? "تم بنجاح" : "فشلت العملية")}
        </h2>
        <p className="text-[13px] text-slate-500 leading-relaxed">{message}</p>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3 rounded-xl text-[14px] font-extrabold text-white hover:opacity-90 transition"
          style={{ background: "#024677" }}>
          حسناً
        </button>
      </div>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
