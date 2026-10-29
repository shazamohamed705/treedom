import { useMemo } from "react";

// Build the visible page list: first, last, current ± siblings, ellipsis in gaps.
function getPages(current, total, siblings) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const left  = Math.max(2, current - siblings);
  const right = Math.min(total - 1, current + siblings);
  const pages = [1];

  if (left > 2) pages.push("ellipsis-l");
  else if (left === 2) pages.push(2);

  for (let i = left; i <= right; i++) pages.push(i);

  if (right < total - 1) pages.push("ellipsis-r");
  else if (right === total - 1) pages.push(total - 1);

  pages.push(total);
  return pages;
}

function Chevron({ dir }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      {dir === "right"
        ? <polyline points="9 18 15 12 9 6"/>
        : <polyline points="15 18 9 12 15 6"/>}
    </svg>
  );
}

export default function Pagination({ page, totalPages, onChange, accent = "#024677", siblings = 1, className = "" }) {
  const pages = useMemo(() => getPages(page, totalPages, siblings), [page, totalPages, siblings]);

  if (totalPages <= 1) return null;

  const navCls = disabled => [
    "w-9 h-9 rounded-xl border flex items-center justify-center transition",
    disabled
      ? "opacity-30 cursor-not-allowed border-slate-200 text-slate-400"
      : "bg-white border-slate-200 text-slate-500 hover:border-teal-400 hover:text-teal-600",
  ].join(" ");

  return (
    <nav dir="rtl" aria-label="التنقل بين الصفحات"
      className={`flex items-center justify-center gap-3 flex-wrap ${className}`}>
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={navCls(page <= 1)}
        aria-label="الصفحة السابقة">
        <Chevron dir="right" />
      </button>

      {pages.map((p, i) => {
        if (p === "ellipsis-l" || p === "ellipsis-r") {
          return (
            <span key={`${p}-${i}`}
              className="w-9 h-9 flex items-center justify-center text-slate-400 select-none">
              …
            </span>
          );
        }
        const active = p === page;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className="w-9 h-9 rounded-xl text-xs font-bold border transition flex items-center justify-center"
            style={active
              ? { background: accent, color: "#fff", borderColor: accent }
              : { background: "#fff", color: "#64748b", borderColor: "#e2e8f0" }}
            aria-current={active ? "page" : undefined}>
            {p}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className={navCls(page >= totalPages)}
        aria-label="الصفحة التالية">
        <Chevron dir="left" />
      </button>
    </nav>
  );
}