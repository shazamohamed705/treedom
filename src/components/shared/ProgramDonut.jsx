import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

// ── custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-right" dir="rtl">
      <p className="text-xs font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].name}: {payload[0].value}%
      </p>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function ProgramDonut({ data = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col h-full" dir="rtl">

      {/* header */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">توزيع البرامج</h2>
        <p className="text-[11px] text-slate-400 mt-0.5">حسب التخصص</p>
      </div>

      {/* donut chart */}
      <div className="flex justify-center">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={62}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* legend + bars */}
      <div className="mt-4 space-y-2">
        {data.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
              <span className="text-[11px] text-slate-600 truncate">{entry.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${entry.value}%`, background: entry.color }} />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 w-7 text-left">
                {entry.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
