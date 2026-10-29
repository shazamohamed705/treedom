// ── Base icon wrapper ─────────────────────────────────────────────────────────
export const Ico = ({ d, size = 12, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

export const IcoPlay  = ({ size = 14 }) => <Ico size={size} fill="white" stroke="white" d={<polygon points="5 3 19 12 5 21 5 3"/>}/>;
export const IcoClock = () => <Ico d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
export const IcoCal   = () => <Ico d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
export const IcoUsers = () => <Ico d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
export const IcoStar  = () => <Ico size={11} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
export const IcoVid   = () => <Ico d={<><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>}/>;
export const IcoBell  = () => <Ico size={15} d={<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>}/>;
export const IcoDoc   = () => <Ico size={11} d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}/>;
export const IcoChevL = () => <Ico size={14} d={<polyline points="15 18 9 12 15 6"/>}/>;
export const IcoChevR = () => <Ico size={14} d={<polyline points="9 18 15 12 9 6"/>}/>;
export const IcoPin   = () => <Ico size={11} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>}/>;

// ── Saudi Riyal icon ──────────────────────────────────────────────────────────
export function Riyal({ size = 12 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width={size} height={size + 1}
      aria-label="Saudi Riyal" title="Saudi Riyal"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "2px", flexShrink: 0 }}>
      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

// ── 4-pointed sparkle ─────────────────────────────────────────────────────────
export function Sparkle({ size = 40, top = "50%", left = "10%", color = "#31AFEA", opacity = 0.78, rotate = 0 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size} height={size}
      viewBox="0 0 80 80"
      fill="none"
      style={{
        position: "absolute", top, left,
        transform: `translateY(-50%) rotate(${rotate}deg)`,
        opacity,
        pointerEvents: "none",
      }}
    >
      <path
        d="M40 0C40 0 37.793 20.5997 29.1964 29.1964C20.5997 37.793 0 40 0 40C0 40 20.5997 42.207 29.1964 50.8036C37.793 59.4003 40 80 40 80C40 80 42.207 59.4003 50.8036 50.8036C59.4003 42.207 80 40 80 40C80 40 59.4003 37.793 50.8036 29.1964C42.207 20.5997 40 0 40 0Z"
        fill={color}
      />
    </svg>
  );
}
