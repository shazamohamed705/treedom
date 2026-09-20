export default function ZoomSessionLink({
  autoZoom,
  value = "",
  onChange,
  inputClassName = "",
  compact = false,
}) {
  if (autoZoom) {
    return (
      <div
        className={`rounded-xl border border-slate-100 px-4 ${compact ? "py-2.5" : "py-3"}`}
        style={{ background: "#02467708" }}
        dir="rtl"
      >
        <p className="text-xs font-semibold text-slate-800">رابط Zoom</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
          سيتم إنشاء رابط الاجتماع تلقائياً عبر تكامل Zoom عند الحفظ.
        </p>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <p className="text-xs font-semibold text-slate-700 mb-1.5">رابط Zoom</p>
      <input
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder="https://zoom.us/j/..."
        className={inputClassName}
        dir="ltr"
      />
    </div>
  );
}
