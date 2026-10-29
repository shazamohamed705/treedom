import { useState, useEffect } from "react";
import { fetchAccountTypes } from "../../../services/api";

// -----------------------------------------------------------------------------
// Icons
// -----------------------------------------------------------------------------

const IcoUser = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IcoBuilding = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18"/>
    <path d="M5 21V7l7-4 7 4v14"/>
    <path d="M9 21v-4h6v4"/>
    <rect x="9" y="10" width="2" height="2"/>
    <rect x="13" y="10" width="2" height="2"/>
  </svg>
);

const IcoInstitute = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7h20L12 2z"/>
    <path d="M5 10v7"/>
    <path d="M9 10v7"/>
    <path d="M15 10v7"/>
    <path d="M19 10v7"/>
    <path d="M2 19h20"/>
  </svg>
);

const IcoTrainer = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="7" r="4"/>
    <path d="M5.5 21a7.5 7.5 0 0 1 13 0"/>
    <path d="M16 11l2 2 4-4"/>
  </svg>
);

// map API keys to icons
const ICONS = {
  individual:          <IcoUser />,
  individual_trainer:  <IcoTrainer />,
  company:             <IcoBuilding />,
  training_authority:  <IcoInstitute />,
};

// -----------------------------------------------------------------------------
// Account type card
// -----------------------------------------------------------------------------
function TypeCard({ item, selected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-2xl border-2 transition-all text-center w-full"
      style={{
        borderColor: selected ? "#024677" : "#E2E8F0",
        background:  selected ? "#EEF3F8" : "#FAFAFA",
      }}
    >
      <span style={{ color: selected ? "#024677" : "#94A3B8" }}>
        {ICONS[item.key] ?? <IcoUser />}
      </span>
      <div>
        <p className="text-sm font-bold leading-tight"
          style={{ color: selected ? "#024677" : "#1E293B" }}>
          {item.name}
        </p>
        <p className="text-[11px] mt-1 leading-snug"
          style={{ color: selected ? "#024677CC" : "#94A3B8" }}>
          {item.description}
        </p>
      </div>
    </button>
  );
}

// -----------------------------------------------------------------------------
// Phone mockup decoration — 3 stacked cards (no rotation, offset top/left)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Layered Image Composition — same image × 3 layers with opacity + offset
// -----------------------------------------------------------------------------

export const PhoneMockup = () => {
  const layers = [
    { src: "/Rectangle 2.png",       tx: 28, ty: 28, opacity: 0.55, zIndex: 1 },
    { src: "/Rectangle 3.png",       tx: 14, ty: 14, opacity: 0.78, zIndex: 2 },
    { src: "/Frame 427321433.png",   tx: 0,  ty: 0,  opacity: 1.00, zIndex: 3 },
  ];

  return (
    <div
      className="relative w-full flex-1 flex items-center justify-center"
      style={{ minHeight: 320, transform: "scaleY(0.93)", transformOrigin: "center top" }}
    >
      <div className="relative" style={{ width: "85%", aspectRatio: "3 / 4" }}>
        {layers.map((layer, i) => (
          <div
            key={i}
            className="absolute inset-0 overflow-hidden"
            style={{
              transform:    `translate(${layer.tx}px, ${layer.ty}px)`,
              opacity:      layer.opacity,
              zIndex:       layer.zIndex,
              borderRadius: 72,
              boxShadow:    layer.opacity < 1
                ? "0 16px 40px rgba(0,0,0,0.25)"
                : "0 24px 56px rgba(0,0,0,0.35)",
            }}
          >
            <img
              src={layer.src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
            {layer.opacity < 1 && (
              <div
                className="absolute inset-0"
                style={{ background: "rgba(0,45,75,0.25)", borderRadius: 72 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main page
// -----------------------------------------------------------------------------

export default function RegisterPage({ onContinue, onLoginRedirect }) {
  const [selected,     setSelected]     = useState(null); // full account type object
  const [accountTypes, setAccountTypes] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    fetchAccountTypes()
      .then(types => setAccountTypes(types.filter(t => t.enabled)))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false));
  }, []);

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden flex items-center justify-center p-4 sm:p-6"
      dir="rtl"
      style={{
        background: "linear-gradient(160deg, #024677 8.49%, #013359 58.3%, #01243F 91.51%)",
      }}
    >
      {/* dot grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}/>

      {/* logo background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "url('/logo.png')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "280%",
        opacity: 0.08,
      }}/>

      <div className="relative w-full max-w-6xl flex flex-col items-center gap-4">
        <div className="w-full flex flex-col lg:flex-row items-stretch gap-4 lg:gap-6">

          {/* LEFT - text + phone mockup (after form on mobile) */}
          <div className="w-full lg:w-[42%] lg:min-w-0 flex flex-col gap-4 sm:gap-6 order-2 lg:order-1">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">
                مرحباً بك في{" "}
                <span style={{ color: "#ffffff" }}>Treedom</span>
              </h2>
            </div>
            <p className="text-base font-medium leading-relaxed text-right"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              حدد نوع حسابك للبدء في إعداد ملفك بسهولة
            </p>
            <div className="flex-1 flex items-center justify-center">
              <PhoneMockup />
            </div>
          </div>

          {/* RIGHT - white form card (before text on mobile) */}
          <div className="w-full lg:flex-1 lg:min-w-0 flex flex-col gap-3 order-1 lg:order-2 lg:mt-20">
            <div className="bg-white rounded-3xl shadow-2xl flex flex-col gap-6 p-5 sm:p-8 lg:p-10">
              <div className="flex justify-start">
                <img src="/Frame427321291.png" alt="Treedom"
                  style={{ width: "auto", height: 48, objectFit: "contain" }} />
              </div>
              <div className="text-right">
                <h1 className="text-xl font-extrabold" style={{ color: "#024677" }}>
                  حدد نوع حسابك
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  اختر الخيار المناسب لطبيعة استخدامك للمنصة
                </p>
              </div>

              {/* loading state */}
              {loading && (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2a10 10 0 0 1 10 10"/>
                  </svg>
                </div>
              )}

              {/* error state */}
              {error && (
                <p className="text-center text-sm text-red-500 py-4">{error}</p>
              )}

              {/* account type cards */}
              {!loading && !error && (
                <div
                  className="grid gap-4 flex-1"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))" }}
                >
                  {accountTypes.map(item => (
                    <TypeCard
                      key={item.key}
                      item={item}
                      selected={selected?.key === item.key}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={() => selected && onContinue?.(selected)}
                disabled={!selected}
                className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all"
                style={{
                  background: selected ? "#024677" : "#E2E8F0",
                  color:      selected ? "#ffffff"  : "#94A3B8",
                  cursor:     selected ? "pointer"  : "not-allowed",
                }}
              >
                متابعة
              </button>

              {/* login link */}
              <p className="text-center text-sm text-slate-500">
                هل لديك حساب بالفعل؟{" "}
                <button onClick={onLoginRedirect} className="font-bold" style={{ color: "#024677" }}>
                  تسجل الدخول
                </button>
              </p>
            </div>

            {/* step dots */}
            <div className="flex items-center justify-start gap-2 pt-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: 6, height: 6, background: i === 0 ? "#5AEACF" : "rgba(255,255,255,0.3)" }} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
