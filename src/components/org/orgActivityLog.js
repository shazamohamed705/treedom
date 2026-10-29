export function fmtRelative(isoStr) {
  if (!isoStr) return "";
  try {
    const diff = Date.now() - new Date(isoStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (days  > 0)  return `منذ ${days} يوم`;
    if (hours > 0)  return `منذ ${hours} ساعة`;
    if (mins  > 0)  return `منذ ${mins} دقيقة`;
    return "الآن";
  } catch {
    return "";
  }
}

function activityType(type) {
  if (type === "program") return "success";
  if (type === "session") return "info";
  if (type === "coach")   return "reminder";
  return type || "info";
}

export function mapActivityLog(raw = []) {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((a, i) => ({
    id:    a.id ?? `act-${i}`,
    title: a.title ?? a.text ?? a.message ?? "",
    text:  a.title ?? a.description ?? a.text ?? a.message ?? "",
    body:  a.body || (a.description && a.description !== a.title ? a.description : ""),
    time:  fmtRelative(a.created_at ?? a.date ?? a.time),
    type:  activityType(a.type ?? a.action_type),
  }));
}

export function activityLogFromDashboard(data) {
  const d = data?.data ?? data ?? {};
  const raw = d.activity_log ?? d.activities ?? d.recent_activities ?? d.logs ?? [];
  return mapActivityLog(raw);
}
