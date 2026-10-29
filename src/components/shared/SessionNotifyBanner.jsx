import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../context/NotificationContext";
import { getUserRole } from "../../services/auth";

function playAlertBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (freq, start, dur, vol = 0.2) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.02);
    };
    beep(740, 0, 0.16, 0.18);
    beep(980, 0.18, 0.16, 0.2);
    beep(740, 0.38, 0.16, 0.18);
    beep(1180, 0.58, 0.28, 0.22);
    setTimeout(() => ctx.close(), 1400);
  } catch { /* ignore autoplay blocks */ }
}

export default function SessionNotifyBanner() {
  const navigate = useNavigate();
  const ctx = useNotifications();
  const role = getUserRole();
  const urgent = ctx?.urgent;
  const played = useRef(null);

  const isTrainee = role === "trainee" || role === "employee";

  useEffect(() => {
    if (!isTrainee || !urgent?.id) return;
    if (played.current === urgent.id) return;
    played.current = urgent.id;
    playAlertBeep();
  }, [isTrainee, urgent?.id]);

  if (!isTrainee || !urgent) return null;

  const title = urgent.title || urgent.text || "تنبيه من المدرب";
  const body  = urgent.body || "المدرب يناديك — سجّل حضورك في الجلسة الأونلاين الآن.";

  const goSessions = () => {
    ctx?.dismissUrgent?.();
    navigate("/dashboard/sessions");
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{ background: "rgba(8, 15, 32, 0.72)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-lg rounded-[28px] overflow-hidden text-white session-alert-pulse"
        style={{
          background: "linear-gradient(165deg, #ef4444 0%, #b91c1c 42%, #024677 100%)",
        }}
      >
        <div className="px-6 pt-8 pb-4 sm:px-8 sm:pt-10 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-extrabold px-3 py-1 rounded-full bg-white/20 mb-5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            بث مباشر الآن
          </span>

          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 flex items-center justify-center mb-5 session-alert-icon"
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>

          <p className="text-[13px] sm:text-sm font-bold text-red-100 mb-2">
            تنبيه عاجل من المدرب
          </p>
          <h2 className="text-[22px] sm:text-[28px] font-black leading-tight mb-3">
            {title}
          </h2>
          <p className="text-[14px] sm:text-[16px] text-white/90 leading-relaxed max-w-sm">
            {body}
          </p>
        </div>

        <div className="px-6 pb-7 sm:px-8 space-y-2.5">
          <button
            type="button"
            onClick={goSessions}
            className="w-full py-4 rounded-2xl text-[16px] sm:text-[17px] font-black bg-white text-[#b91c1c] hover:bg-red-50 transition shadow-lg"
          >
            سجّل حضورك الآن
          </button>
          <button
            type="button"
            onClick={() => ctx?.dismissUrgent?.()}
            className="w-full py-2.5 text-[13px] font-semibold text-white/70 hover:text-white transition"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
}
