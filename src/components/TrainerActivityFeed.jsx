export function mapCoachHomeUpdates(raw = []) {
  return (Array.isArray(raw) ? raw : []).map((u, i) => ({
    id:    u.id ?? `upd-${i}`,
    title: u.title ?? u.text ?? "",
    body:  u.body ?? "",
    time:  u.created_at ?? u.time ?? "",
    type:  u.type ?? "info",
    url:   u.url ?? null,
  }));
}

function IcoBell() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

function IcoCheckCircle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function IcoXCircle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6"  y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function IcoWarning() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

const TYPE_CONFIG = {
  reminder: { icon: <IcoBell />,        dot: "#14b8a6" },
  success:  { icon: <IcoCheckCircle />, dot: "#16a34a" },
  error:    { icon: <IcoXCircle />,     dot: "#dc2626" },
  warning:  { icon: <IcoWarning />,     dot: "#d97706" },
  info:     { icon: <IcoBell />,        dot: "#14b8a6" },
};

export function feedType(type) {
  const t = String(type ?? "").toLowerCase();
  if (t.includes("approved") || t.includes("enrolled") || t.includes("paid") || t === "success") return "success";
  if (t.includes("rejected") || t.includes("overdue") || t === "error") return "error";
  if (t.includes("warning") || t.includes("reminder") || t.includes("notify") || t.includes("live") || t.includes("started") || t === "session_reminder") return "warning";
  return "info";
}

export function ActivityRow({ item }) {
  const kind = feedType(item.type);
  const cfg = TYPE_CONFIG[kind] ?? TYPE_CONFIG.info;
  const title = item.title ?? item.text ?? "";
  const body = item.body ?? "";
  const time = item.time ?? "";

  const handleClick = () => {
    if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 text-right transition hover:bg-slate-50"
      dir="rtl"
    >
      <div className="shrink-0 mt-0.5">{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 leading-snug">{title}</p>
        {body && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{body}</p>
        )}
        {time && <p className="text-[11px] text-slate-400 mt-1">{time}</p>}
      </div>
      <span className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: cfg.dot }} />
    </button>
  );
}

export default function TrainerActivityFeed({ items = [], onViewAll, limit = 6 }) {
  const list = mapCoachHomeUpdates(items).slice(0, limit);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5" dir="rtl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-slate-800">آخر التحديثات</h2>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold transition hover:opacity-70"
            style={{ color: "#14b8a6" }}
          >
            عرض الكل
          </button>
        )}
      </div>

      <div>
        {list.map(n => (
          <ActivityRow key={n.id} item={n} />
        ))}
        {list.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6">لا توجد تحديثات حديثة</p>
        )}
      </div>
    </div>
  );
}
