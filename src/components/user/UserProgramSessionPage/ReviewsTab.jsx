function Star({ size = 22, filled = true }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

export default function ReviewsTab({ rating = 0, total = 0, reviews = [] }) {
  const ratingCounts = [5, 4, 3, 2, 1].map(s => ({
    stars: s,
    count: reviews.filter(r => r.rating === s).length,
  }));
  const maxCount = Math.max(...ratingCounts.map(r => r.count), 1);

  return (
    <div dir="rtl" className="space-y-5">
      <div className="flex flex-col items-center py-4">
        <div className="flex items-center gap-1 mb-1">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} size={22} filled={i <= Math.round(Number(rating))} />
          ))}
        </div>
        <span className="text-[32px] font-extrabold" style={{ color: "#024677" }}>{rating || "—"}</span>
        <span className="text-[12px] text-slate-400 mt-0.5">بناءً على {total} تقييم</span>
      </div>

      {reviews.length > 0 && (
        <div className="space-y-2 px-2">
          {ratingCounts.map(r => (
            <div key={r.stars} className="flex items-center gap-2" dir="ltr">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(r.count / maxCount) * 100}%`,
                    background: r.stars >= 4 ? "#31AFEA" : r.stars === 3 ? "#94a3b8" : "#e2e8f0",
                  }}
                />
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {[...Array(r.stars)].map((_, i) => (
                  <Star key={i} size={10} filled />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {reviews.length > 0 ? (
        <div className="space-y-4 pt-2 divide-y divide-slate-100">
          {reviews.map((r, idx) => (
            <div key={r.id ?? idx} className="flex gap-3 pt-4 first:pt-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: "#31AFEA" }}>
                {(r.name ?? r.reviewer_name ?? "؟")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5 flex-wrap gap-1">
                  <span className="text-[12px] font-bold text-slate-800">{r.name ?? r.reviewer_name ?? "—"}</span>
                  <span className="text-[11px] text-slate-400">{r.time ?? r.created_at ?? ""}</span>
                </div>
                <div className="flex items-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} size={11} filled={i <= r.rating} />
                  ))}
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">{r.text ?? r.comment ?? ""}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-[12px] text-slate-400 py-6">لا توجد تقييمات بعد</p>
      )}
    </div>
  );
}
