import { THUMB_BG } from "./mockData.js";
import { IcoPlay, IcoChevL, IcoChevR } from "./icons.jsx";

// ── small notch ribbon badge (top-left of a card image) ───────────────────────
export function MiniRibbon({ type }) {
  const cfg = {
    online: {
      label: "أونلاين",
      fill: "#0B5CFF",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    },
    offline: {
      label: "حضوري",
      fill: "#A7ABAB",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    },
    recorded: {
      label: "مسجل",
      fill: "#E2BF34",
      icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="12" cy="12" r="9"/></svg>,
    },
  };
  const c = cfg[type] ?? cfg.online;
  const W = 36, H = 46, bodyH = 34;
  return (
    <div className="absolute z-20 pointer-events-none" style={{ top: 0, left: 10 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none"
        style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.28))" }}>
        <path d={`M0 0 H${W} V${bodyH} L${W / 2} ${H} L0 ${bodyH} Z`} fill={c.fill}/>
      </svg>
      <div className="absolute top-0 left-0 flex flex-col items-center justify-start gap-0.5"
        style={{ width: W, paddingTop: 5 }}>
        {c.icon}
        <span className="text-[6.5px] font-extrabold text-white leading-tight text-center">{c.label}</span>
      </div>
    </div>
  );
}

// ── gold best-seller badge ─────────────────────────────────────────────────────
export function BestBadge() {
  const W = 42, H = 56, bodyH = 42;
  return (
    <div className="absolute z-20 pointer-events-none" style={{ top: 0, left: 50 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none"
        style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.22))" }}>
        <path d={`M0 0 H${W} V${bodyH} L${W / 2} ${H} L0 ${bodyH} Z`} fill="#E2BF34"/>
      </svg>
      <div className="absolute top-0 left-0 flex flex-col items-center justify-start gap-0.5"
        style={{ width: W, paddingTop: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round">
          <path d="M12 2l2.4 5.4 5.7.6-4.2 4 1.1 5.6-5-2.9-5 2.9 1.1-5.6-4.2-4 5.7-.6z"/>
        </svg>
        <span className="text-[7px] font-extrabold text-white leading-tight text-center whitespace-pre-line">{"الأكثر\nمبيعاً"}</span>
      </div>
    </div>
  );
}

// ── bookmark badge SVG ─────────────────────────────────────────────────────────
export function BookmarkBadge({ size = 68 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size * 81 / 68} viewBox="0 0 68 81" fill="none">
      <g filter="url(#bbf)">
        <path d="M0 0H59.8381V72.7614L29.9191 62.0902L0 72.7614V0Z" fill="#E2BF34"/>
      </g>
      <defs>
        <filter id="bbf" x="0" y="0" width="67.5947" height="80.5205"
          filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <feOffset dx="3.8794" dy="3.8794"/>
          <feGaussianBlur stdDeviation="1.9397"/>
          <feComposite in2="hardAlpha" operator="out"/>
          <feColorMatrix type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
      </defs>
    </svg>
  );
}

// ── single ribbon notch (used in RibbonPair) ──────────────────────────────────
export function RibbonBadge({ type, tone }) {
  const iconFor = {
    online:   (c = "#fff") => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
    offline:  (c = "#fff") => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
    recorded: (c = "#fff") => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="4" fill={c}/><circle cx="12" cy="12" r="9"/></svg>,
    best:     (c = "#fff") => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinejoin="round"><path d="M12 2l2.4 5.4 5.7.6-4.2 4 1.1 5.6-5-2.9-5 2.9 1.1-5.6-4.2-4 5.7-.6z"/></svg>,
  };
  const labelFor = {
    online:   "أونلاين",
    offline:  "أوفلاين",
    recorded: "مسجل",
    best:     "الأكثر\nمبيعاً",
  };

  const isBest = type === "best";
  const fill   = tone === "gold" ? "#E2BF34" : tone === "gray" ? "#A7ABAB" : "#0B5CFF";
  const icon   = (iconFor[type] ?? iconFor.online)("#fff");

  const W     = isBest ? 46 : 36;
  const H     = isBest ? 72 : 48;
  const tip   = isBest ? 16 : 12;
  const bodyH = H - tip;
  const midX  = W / 2;

  return (
    <div className="flex flex-col items-center justify-start shrink-0"
      style={{ width: W, filter: "drop-shadow(2px 2px 3px rgba(0,0,0,0.22))" }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ display: "block" }}>
        <path d={`M0 0 H${W} V${bodyH} L${midX} ${H} L0 ${bodyH} Z`} fill={fill}/>
      </svg>
      <div className="flex flex-col items-center justify-start gap-0.5"
        style={{ width: W, height: bodyH, marginTop: -bodyH, paddingTop: isBest ? 7 : 5 }}>
        {icon}
        <span className={`font-extrabold text-white leading-tight text-center px-0.5 whitespace-pre-line ${isBest ? "text-[8px]" : "text-[7px]"}`}>
          {labelFor[type] ?? ""}
        </span>
      </div>
    </div>
  );
}

// ── ribbon pair — best-seller gold + type notch ───────────────────────────────
export function RibbonPair({ type }) {
  return (
    <div className="absolute z-30 flex items-start gap-0.5 pointer-events-none"
      style={{ top: -4, left: 10 }}>
      <RibbonBadge type="best" tone="gold"/>
      <RibbonBadge type={type} tone={type === "offline" ? "gray" : "blue"}/>
    </div>
  );
}

// ── tag pill ──────────────────────────────────────────────────────────────────
export function TagPill({ label }) {
  return (
    <span style={{
      borderRadius: 8,
      background: "rgba(49,175,234,0.15)",
      display: "inline-flex",
      padding: "0 12px",
      height: 15,
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      fontSize: 9,
      fontWeight: 700,
      color: "#31AFEA",
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── progress bar ──────────────────────────────────────────────────────────────
export function Bar({ value, color = "#14b8a6" }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }}/>
    </div>
  );
}

// ── section header ─────────────────────────────────────────────────────────────
export function SecHeader({ title, onNext, onPrev, onViewAll }) {
  return (
    <div className="flex items-center justify-between mb-2" dir="rtl">
      <h2 className="text-sm font-bold text-slate-800">{title}</h2>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button onClick={onPrev}
            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition">
            <IcoChevL/>
          </button>
          <button onClick={onNext}
            className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:border-teal-400 hover:text-teal-500 transition">
            <IcoChevR/>
          </button>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[11px] font-semibold transition hover:opacity-70"
            style={{ color: "#14b8a6" }}
          >
            عرض الكل
          </button>
        )}
      </div>
    </div>
  );
}

// ── video thumbnail ───────────────────────────────────────────────────────────
export function Thumb({ height = 110, tags = [], children, dots = true }) {
  return (
    <div className="relative rounded-t-xl overflow-hidden flex items-center justify-center"
      style={{ height, background: THUMB_BG }}>
      {dots && (
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: "radial-gradient(circle,rgba(255,255,255,0.25) 1px,transparent 1px)", backgroundSize: "14px 14px" }}/>
      )}
      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center z-10 hover:bg-white/30 transition cursor-pointer">
        <IcoPlay size={13}/>
      </div>
      <span className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center z-10 cursor-pointer hover:bg-white/30 transition">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </span>
      {tags.length > 0 && (
        <div className="absolute bottom-2 right-2 flex gap-1 flex-wrap z-10">
          {tags.map((t, i) => (
            <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 rounded-sm"
              style={{ background: "rgba(0,0,0,0.55)", color: "#5AEACF" }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {children}
    </div>
  );
}
