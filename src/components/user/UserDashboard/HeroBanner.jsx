export default function HeroBanner() {
  return (
    <div
      className="rounded-[20px] overflow-hidden relative flex items-center w-full"
      style={{ minHeight: 180, maxWidth: "100%" }}
    >
      {/* ── background image ── */}
      <img
        src="/17cb2c3d8051b7ba8f4e61470f34be0101c5eeaf.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
        loading="lazy"
      />

      {/* ── white overlay on the right (RTL = text side) fading to transparent ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.60) 100%)",
        }}
      />

      {/* ── text content ── */}
      <div
        className="relative z-10 flex-1 py-7 px-5 sm:px-10 text-right"
        dir="rtl"
      >
        {/* tag badge */}
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3"
          style={{
            background: "rgba(2,70,119,0.10)",
            color: "#024677",
            border: "1px solid rgba(2,70,119,0.18)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          تعلّم بالسرعة التي تناسبك
        </span>

        {/* headline */}
        <h2
          className="text-xl sm:text-2xl font-extrabold leading-snug"
          style={{ color: "#ffffff" }}
        >
          طوّر مهاراتك من خلال<br />
          دورات أونلاين احترافية
        </h2>
      </div>
    </div>
  );
}
