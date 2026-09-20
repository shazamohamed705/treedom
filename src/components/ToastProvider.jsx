import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastCtx = createContext(() => {});

// ── usage ─────────────────────────────────────────────────────────────────────
//  const showToast = useToast();
//  showToast("تم حفظ التغييرات بنجاح", "success");
export function useToast() {
  return useContext(ToastCtx);
}

// ── icon per type ─────────────────────────────────────────────────────────────
const ICONS = {
  success: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const showToast = useCallback((message, type = "success", duration = 2600) => {
    const id = ++idRef.current;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  return (
    <ToastCtx.Provider value={showToast}>
      {children}

      {/* toasts rendered above everything (modals use z-50, sidebar z-40) */}
      <div
        dir="rtl"
        className="fixed top-5 right-1/2 translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 pointer-events-none"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 pl-4 pr-2.5 py-2.5 rounded-xl shadow-lg text-white text-sm font-bold animate-toast-in pointer-events-auto"
            style={{
              background: t.type === "error" ? "#dc2626" : t.type === "info" ? "#31AFEA" : "#0ABFBF",
              boxShadow: "0 10px 30px -8px rgba(0,0,0,0.35)",
            }}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0
                              ${t.type === "error" ? "bg-white/25" : "bg-white/25"}`}>
              {ICONS[t.type] ?? ICONS.info}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}