// ── shared visual constants ───────────────────────────────────────────────────
export const THUMB_BG = "linear-gradient(135deg,#024677 0%,#0a5fa0 55%,#10b0c8 100%)";

// ── SAR currency icon (component so JSX works) ────────────────────────────────
export function SarIcon({ size = 11 }) {
  const h = Math.round(size * (12 / 11));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39"
      width={size} height={h}
      style={{ display: "inline-block", verticalAlign: "middle" }}>
      <path fill="#024677" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill="#024677" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

// ── Arabic date formatter ─────────────────────────────────────────────────────
const AR_DATE = new Intl.DateTimeFormat("ar", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
export const fmtDate = (iso) => {
  if (!iso) return "";
  try { return AR_DATE.format(new Date(`${iso}T00:00:00`)); } catch { return iso; }
};
