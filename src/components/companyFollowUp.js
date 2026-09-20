function fmtMoney(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("en-US").replace(/,/g, ".");
}

function asList(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function rowFromUpdate(u, i, prefix = "upd") {
  if (!u || typeof u !== "object") return null;
  const title = u.title ?? u.text ?? u.name ?? u.subject ?? "";
  const body  = u.body ?? u.description ?? u.desc ?? u.message ?? "";
  if (!title && !body) return null;
  return {
    id:         u.id ?? `${prefix}-${i}`,
    type:       u.type ?? u.kind ?? "info",
    title,
    body,
    time:       u.created_at ?? u.time ?? u.date ?? "",
    url:        u.url ?? null,
    path:       u.path ?? null,
    is_read:    u.is_read ?? true,
    action:     u.action ?? null,
  };
}

/**
 * Maps GET /company/dashboard follow_up object → notification-like rows.
 */
export function mapCompanyFollowUp(d = {}, { all = false } = {}) {
  const fu = d.follow_up ?? {};
  const items = [];

  const inv = fu.overdue_invoices ?? fu.invoices ?? {};
  if ((inv.count ?? 0) > 0 || (inv.amount ?? 0) > 0) {
    items.push({
      id:    "overdue-invoices",
      type:  "warning",
      title: "فواتير متأخرة السداد",
      body:  `${inv.count ?? 0} فاتورة بقيمة ${fmtMoney(inv.amount ?? 0)} ج.م متأخرة عن موعد الاستحقاق.`,
      path:  "/dashboard/company-payments",
      action: "ادفع الآن",
      is_read: false,
    });
  }

  const funds = asList(fu.funding_requests);
  (all ? funds : funds.slice(0, 1)).forEach((r, i) => {
    items.push({
      id:    r.id ?? `fund-${i}`,
      type:  "reminder",
      title: "طلب تمويل من موظف",
      body:  `قدّم ${r.employee_name ?? r.trainee_name ?? r.trainee?.name ?? "أحد الموظفين"} طلب تمويل للبرنامج "${r.program_name ?? "—"}". يحتاج الطلب للمراجعة.`,
      path:  "/dashboard/funding-requests",
      action: "مراجعة الطلب",
      is_read: false,
    });
  });

  const wasted = asList(fu.wasted_seats);
  (all ? wasted : wasted.slice(0, 1)).forEach((w, i) => {
    items.push({
      id:    w.id ?? `seats-${i}`,
      type:  "info",
      title: "مقاعد غير مستغلة في برنامج",
      body:  `برنامج "${w.program_name ?? "…"}" به ${w.empty_seats ?? w.wasted_seats ?? w.seats ?? w.count ?? 0} مقعد غير مستغل من أصل ${w.seats_count ?? ""}.`,
      path:  "/dashboard/programs",
      action: "عرض البرامج",
      is_read: false,
    });
  });

  return items;
}

/** Every update-like list that /company/dashboard may return. */
export function dashboardToNotifs(d = {}) {
  const seen = new Set();
  const out = [];
  const push = (row) => {
    if (!row) return;
    const key = String(row.id);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(row);
  };

  mapCompanyFollowUp(d, { all: true }).forEach(push);

  const lists = [
    asList(d.latest_updates),
    asList(d.notifications),
    asList(d.alerts),
    asList(d.needs_attention),
    asList(d.follow_up),
    asList(d.follow_up?.items),
    asList(d.follow_up?.updates),
    asList(d.follow_up?.notifications),
  ];
  lists.forEach(list => {
    list.forEach((u, i) => push(rowFromUpdate(u, i)));
  });

  return out;
}
