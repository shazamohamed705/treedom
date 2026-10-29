import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";
import { fetchFinancials } from "../../services/api";
import { DONUT_COLORS, BRAND, TEAL, TEAL_LIGHT, AMBER, PINK, ORANGE } from "../../constants/colors";

// ── period tab → API param ────────────────────────────────────────────────────
const PERIOD_TABS = [
  { label: "هذا العام",    key: "this_year"  },
  { label: "هذا الشهر",   key: "this_month" },
  { label: "آخر 3 أشهر",  key: "last_month" },
  { label: "مخصص",         key: "custom"     },
];

// ── finance donut uses a slightly different order — override locally ───────────
const FINANCE_DONUT_COLORS = [TEAL, BRAND, TEAL_LIGHT, AMBER, PINK, ORANGE];

// ── stats colours ─────────────────────────────────────────────────────────────
const STAT_COLORS = [TEAL, BRAND, TEAL_LIGHT, AMBER];

// ── number formatter ──────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("ar-SA");
}
function fmtSAR(n) {
  if (n == null) return "—";
  return `${Number(n).toLocaleString("ar-SA")} ر.س`;
}
function fmtGrowth(pct) {
  if (pct == null) return null;
  const n = Number(pct);
  return `${n >= 0 ? "+" : ""}${n}٪`;
}

function xmlEscape(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function excelCell(value) {
  if (value == null || value === "") {
    return `<Cell><Data ss:Type="String"></Data></Cell>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(value)}</Data></Cell>`;
}

function excelSheet(name, rows) {
  const body = rows.map(row =>
    `<Row>${row.map(excelCell).join("")}</Row>`
  ).join("");
  return `<Worksheet ss:Name="${xmlEscape(name)}"><Table>${body}</Table></Worksheet>`;
}

/** Build a real Excel-compatible .xls (SpreadsheetML) from finance data. */
function downloadFinanceExcel({ periodLabel, dateRange, summary, revenueTrend, donutData, programs, companies }) {
  const periodFrom = dateRange?.from || "";
  const periodTo   = dateRange?.to || "";

  const summaryRows = [
    ["التقرير المالي", periodLabel],
    ...(periodFrom || periodTo ? [["من", periodFrom], ["إلى", periodTo]] : []),
    [],
    ["البند", "القيمة"],
    ["إجمالي الإيرادات", summary.total_revenue ?? 0],
    ["إيراد الشركات", summary.companies_revenue ?? 0],
    ["إيراد الأفراد", summary.individuals_revenue ?? 0],
    ["نمو الإجمالي %", summary.growth_percent ?? 0],
    ["نمو الشركات %", summary.companies_growth_percent ?? 0],
    ["نمو الأفراد %", summary.individuals_growth_percent ?? 0],
    ["عدد متدربي الأفراد", summary.individual_trainees_count ?? 0],
    ["مقاعد الشركات", summary.company_seats_count ?? 0],
    ["عدد الشركات", summary.companies_count ?? 0],
    ["العملة", summary.currency ?? "SAR"],
  ];

  const trendRows = [
    ["الشهر", "الإيراد الكلي", "إيراد الأفراد", "إيراد الشركات"],
    ...revenueTrend.map(r => [
      r.month ?? "",
      r.total ?? 0,
      r.individuals ?? 0,
      r.companies ?? 0,
    ]),
  ];

  const fieldRows = [
    ["التخصص", "النسبة %"],
    ...donutData.map(d => [d.name ?? "", d.value ?? 0]),
  ];

  const programRows = [
    ["اسم البرنامج", "المشتركين", "قيمة الاشتراك", "الإيرادات الفعلية", "النسبة %"],
    ...programs.map(p => [
      p.name ?? "",
      p.count ?? 0,
      p.revenue ?? 0,
      p.actual ?? 0,
      p.percent ?? 0,
    ]),
  ];

  const companyRows = [
    ["اسم الشركة", "المتدربون", "الإيرادات"],
    ...companies.map(c => [
      c.company_name ?? "",
      c.trainees_count ?? 0,
      c.total_revenue ?? 0,
    ]),
  ];

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${excelSheet("الملخص", summaryRows)}
${excelSheet("اتجاه الإيرادات", trendRows)}
${excelSheet("حسب التخصص", fieldRows)}
${excelSheet("البرامج", programRows)}
${excelSheet("أعلى الشركات", companyRows)}
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `تقرير-مالييات-${stamp}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-right" dir="rtl">
      <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.stroke }}>
          {p.name}: <span className="font-bold">{Number(p.value).toLocaleString("ar-SA")} ر.س</span>
        </p>
      ))}
    </div>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, growth, color }) {
  const positive = growth == null || !String(growth).startsWith("-");
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
      {growth != null && (
        <span className={`text-xs font-semibold self-start px-2 py-0.5 rounded-full
          ${positive ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"}`}>
          {growth}
        </span>
      )}
    </div>
  );
}

// ── progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  const w = typeof pct === "number" ? `${pct}%` : pct;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: w, background: "#5AEACF" }} />
      </div>
      <span className="text-[10px] text-slate-400 shrink-0">{w}</span>
    </div>
  );
}

// ── loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ h = "h-6", w = "w-full" }) {
  return <div className={`${h} ${w} bg-slate-100 rounded animate-pulse`} />;
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function FinancePage() {
  const [periodKey,  setPeriodKey]  = useState("this_year");
  const [dateRange,  setDateRange]  = useState({ from: "", to: "" });
  const [search,     setSearch]     = useState("");
  const [filter,     setFilter]     = useState("all");
  const [data,       setData]       = useState(null);   // API response .data
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  // ── fetch on period change ────────────────────────────────────────────────
  useEffect(() => {
    if (periodKey === "custom" && (!dateRange.from || !dateRange.to)) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFinancials(periodKey, dateRange)
      .then(res => {
        if (!cancelled) setData(res?.data ?? null);
      })
      .catch(err => {
        if (!cancelled) setError(err.message ?? "حدث خطأ أثناء جلب البيانات");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [periodKey, dateRange.from, dateRange.to]);

  // ── derived data from API response ───────────────────────────────────────
  const summary       = data?.summary        ?? {};
  const revenueTrend  = (data?.revenue_trend ?? []).map(r => ({
    month:       r.label,
    total:       r.total_revenue,
    individuals: r.individuals_revenue,
    companies:   r.companies_revenue,
  }));
  const donutData     = (data?.revenue_by_field ?? []).map((f, i) => ({
    name:  f.field_name,
    value: f.percent,
    color: FINANCE_DONUT_COLORS[i % FINANCE_DONUT_COLORS.length],
  }));
  const programsData  = (data?.programs_revenue ?? []).map(p => ({
    name:    p.program_name,
    count:   p.trainers_count,
    revenue: p.total_revenue,
    actual:  p.individuals_revenue + p.companies_revenue,
    percent: p.completion_percent,
  }));
  const topCompanies  = data?.top_companies ?? [];

  // ── stats cards ───────────────────────────────────────────────────────────
  const stats = [
    {
      label: "إجمالي الإيرادات",
      value: loading ? null : fmtSAR(summary.total_revenue),
      growth: fmtGrowth(summary.growth_percent),
      color: STAT_COLORS[0],
    },
    {
      label: "إيراد الشركات",
      value: loading ? null : fmtSAR(summary.companies_revenue),
      growth: fmtGrowth(summary.companies_growth_percent),
      color: STAT_COLORS[1],
    },
    {
      label: "إيراد الأفراد",
      value: loading ? null : fmtSAR(summary.individuals_revenue),
      growth: fmtGrowth(summary.individuals_growth_percent),
      color: STAT_COLORS[2],
    },
    {
      label: "العملة",
      value: loading ? null : summary.currency ?? "—",
      growth: null,
      color: STAT_COLORS[3],
    },
  ];

  // ── client-side filter for programs table ────────────────────────────────
  const filtered = programsData.filter(p => {
    const q = search.trim();
    if (q && !p.name.includes(q)) return false;
    if (filter === "high-trainees" && p.count < 5)     return false;
    if (filter === "high-revenue"  && p.revenue < 100) return false;
    return true;
  });

  const activePeriodLabel = PERIOD_TABS.find(t => t.key === periodKey)?.label ?? "";

  const handleExportExcel = () => {
    if (loading || !data) return;
    downloadFinanceExcel({
      periodLabel: activePeriodLabel,
      dateRange: periodKey === "custom" ? dateRange : {},
      summary,
      revenueTrend,
      donutData,
      programs: filtered.length ? filtered : programsData,
      companies: topCompanies,
    });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 p-5" dir="rtl">

      {/* ── header ── */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex flex-col items-start gap-2.5">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="#14b8a6" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <h1 className="text-xl font-bold text-slate-800">الماليات</h1>
          </div>

          {/* period tabs */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200 divide-x divide-x-reverse divide-slate-200">
            {PERIOD_TABS.map(t => (
              <button key={t.key} onClick={() => setPeriodKey(t.key)}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={periodKey === t.key
                  ? { background: "#024677", color: "#fff" }
                  : { background: "#fff", color: "#64748b" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* custom date range */}
          {periodKey === "custom" && (
            <div className="flex items-center gap-2 mt-1">
              <input type="date" value={dateRange.from}
                onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-400" />
              <span className="text-xs text-slate-400">—</span>
              <input type="date" value={dateRange.to}
                onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))}
                className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-teal-400" />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={loading || !data}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#5AEACF", color: "#024677" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          تصدير تقرير مالي (Excel)
        </button>
      </div>

      {/* ── error banner ── */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          loading
            ? <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-2">
                <Skeleton h="h-3" w="w-24" />
                <Skeleton h="h-7" w="w-32" />
                <Skeleton h="h-4" w="w-16" />
              </div>
            : <StatCard key={i} {...s} />
        ))}
      </div>

      {/* ── revenue line chart ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-700">اتجاه الإيرادات عبر الزمن</h2>
        </div>
        {loading ? (
          <Skeleton h="h-56" />
        ) : (
          <div className="w-full sm:w-[75%] ms-auto">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenueTrend}
                margin={{ top: 10, right: 40, left: 44, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                  width={36} />
                <Tooltip content={<RevenueTooltip />} />
                <Line type="monotone" dataKey="total" name="الكل"
                  stroke="#0ABFBF" strokeWidth={3.2}
                  dot={{ r: 4, fill: "#0ABFBF", strokeWidth: 0 }}
                  activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="individuals" name="إيراد الأفراد"
                  stroke="#024677" strokeWidth={2.5}
                  dot={{ r: 4, fill: "#024677", strokeWidth: 0 }}
                  activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            {revenueTrend.every(r => r.total === 0 && r.individuals === 0) && (
              <p className="text-center text-xs text-slate-400 mt-2">لا توجد إيرادات في هذه الفترة</p>
            )}
            <div className="flex items-center justify-start gap-5 mt-1 flex-row-reverse" dir="rtl">
              {[{ label: "الكل", color: "#0ABFBF" }, { label: "إيراد الأفراد", color: "#024677" }].map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── donut + programs table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

        {/* donut */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-700 mb-4 text-right">
            توزيع الإيراد حسب التخصص
          </h2>
          {loading ? (
            <div className="space-y-3"><Skeleton h="h-44" /><Skeleton h="h-3" /><Skeleton h="h-3" /></div>
          ) : donutData.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">لا توجد بيانات</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    dataKey="value" paddingAngle={3}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2" dir="rtl">
                {donutData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-slate-700">{d.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* programs table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-700">جدول الإيرادات حسب البرامج</h2>
          </div>

          {/* search + filter */}
          <div className="relative mb-4">
            <select value={filter} onChange={e => setFilter(e.target.value)}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-600
                bg-slate-100 border border-slate-200 rounded-lg px-1.5 py-1
                focus:outline-none cursor-pointer"
              aria-label="فلترة البرامج">
              <option value="all">الكل</option>
              <option value="high-trainees">مدربين 5+</option>
              <option value="high-revenue">إيراد 100+</option>
            </select>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن برنامج..."
              className="w-full sm:w-72 pl-28 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl
                focus:outline-none focus:border-teal-400 transition
                placeholder:text-slate-400 text-slate-700" />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} h="h-8" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" dir="rtl">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["اسم البرنامج", "المشتركين", "قيمة الاشتراك", "الإيرادات الفعلية", "النسبة", "التقدم"].map(h => (
                      <th key={h} className="text-right py-2 px-2 text-slate-400 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="py-2.5 px-2 font-medium text-slate-700 whitespace-nowrap">{p.name}</td>
                      <td className="py-2.5 px-2 text-slate-500">{p.count}</td>
                      <td className="py-2.5 px-2 text-slate-500">{fmt(p.revenue)}</td>
                      <td className="py-2.5 px-2 font-semibold" style={{ color: "#024677" }}>
                        {fmt(p.actual)}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500">{p.percent}%</td>
                      <td className="py-2.5 px-2 w-24">
                        <ProgressBar pct={p.percent} />
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        {programsData.length === 0 ? "لا توجد بيانات برامج" : "لا توجد برامج مطابقة"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── top companies ── */}
      {(loading || topCompanies.length > 0) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 w-fit max-w-full ms-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-700">أعلى الشركات إنفاقاً</h2>
          </div>

          {loading ? (
            <div className="space-y-2 w-96">{[...Array(3)].map((_, i) => <Skeleton key={i} h="h-8" />)}</div>
          ) : (
            <div dir="rtl" className="grid w-fit max-w-full overflow-x-auto text-xs"
              style={{ gridTemplateColumns: "minmax(260px,max-content) 130px 170px 280px", columnGap: "1.75rem" }}>
              {["اسم الشركة", "المتدربون", "الإيرادات", "المحتوى"].map((h, i) => (
                <span key={h} className={`text-slate-400 font-semibold pb-2 border-b border-slate-100
                  ${i === 0 ? "" : i === 3 ? "text-right" : "text-center"}`}>{h}</span>
              ))}
              {topCompanies.map((c, i) => {
                const max = topCompanies[0]?.total_revenue ?? 1;
                const pct = Math.round((c.total_revenue / max) * 100);
                return (
                  <>
                    <span key={`n${i}`} className="py-2 border-b border-slate-50 font-medium text-slate-700 truncate">{c.company_name}</span>
                    <span key={`c${i}`} className="py-2 border-b border-slate-50 text-center text-slate-500">{c.trainees_count} مقعد</span>
                    <span key={`a${i}`} className="py-2 border-b border-slate-50 text-center font-semibold" style={{ color: "#024677" }}>
                      {fmt(c.total_revenue)} ر.س
                    </span>
                    <div key={`b${i}`} className="py-2 border-b border-slate-50 flex items-center gap-2">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: "#0ABFBF" }} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 shrink-0 w-10 text-left">{pct}%</span>
                    </div>
                  </>
                );
              })}
            </div>
          )}
        </div>
      )}

    </main>
  );
}
