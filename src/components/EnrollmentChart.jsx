import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

// ── custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-right"
      dir="rtl">
      <p className="text-xs font-bold text-slate-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.fill }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function EnrollmentChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + (d.enrolled ?? 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5" dir="rtl">

      {/* header */}
      <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-slate-800">منحنى الالتحاق والإتمام</h2>
          <p className="text-xs text-slate-400 mt-0.5">إجمالي {total} متدرب</p>
        </div>
        <div className="flex items-center gap-4 pt-1 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#14b8a6" }} />
            المسجلون
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "#3b82f6" }} />
            أتموا البرنامج
          </span>
        </div>
      </div>

      {/* chart */}
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          barSize={12}
          barCategoryGap="30%"
          barGap={3}
          margin={{ top: 0, right: 0, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="enrolled"  name="المسجلون"        fill="#14b8a6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" name="أتموا البرنامج"  fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
