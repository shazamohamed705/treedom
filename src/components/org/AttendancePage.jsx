import { useState, useEffect, useCallback } from "react";
import { fetchSessions, fetchSession } from "../../services/api";

// ── helpers ───────────────────────────────────────────────────────────────────
function getTypeInt(raw) {
  if (raw == null) return null;
  return typeof raw === "object" ? raw.value : raw;
}

function isOnline(raw) {
  const v = getTypeInt(raw);
  return Number(v) === 0;           // 0 = zoom/online
}

function localStr(val) {
  if (typeof val === "object" && val) return val.ar ?? val.en ?? "";
  return val ?? "";
}

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoPeople() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function IcoSpinner() {
  return (
    <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24"
      fill="none" stroke="#024677" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ value, label, color, bg }) {
  return (
    <div
      className="flex flex-col items-start justify-center flex-1 min-w-[130px]"
      style={{
        background: bg, borderRadius: "21.94px",
        border: "1.25px solid #e2e8f0",
        padding: "25px 28px", minHeight: "144px",
      }}
    >
      <span className="text-3xl font-extrabold leading-none" style={{ color }}>{value}</span>
      <span className="text-xs text-slate-500 mt-2 text-right">{label}</span>
    </div>
  );
}

// ── audience badge ────────────────────────────────────────────────────────────
function AudienceBadge({ label }) {
  const MAP = {
    طالب:   { bg: "#e0f2fe", color: "#0284c7" },
    موظف:   { bg: "#fef3c7", color: "#d97706" },
    "متدرّب": { bg: "#ede9fe", color: "#7c3aed" },
  };
  const style = MAP[label] ?? { bg: "#f1f5f9", color: "#64748b" };
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}

// ── attendance badge ──────────────────────────────────────────────────────────
function AttendanceBadge({ present }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap
      ${present ? "text-emerald-600" : "text-red-500"}`}>
      <span className={`w-2 h-2 rounded-full shrink-0
        ${present ? "bg-emerald-500" : "bg-red-500"}`} />
      {present ? "تم الحضور" : "غائب"}
    </span>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [search,   setSearch]   = useState("");
  const [modeFilter, setModeFilter] = useState("all");   // all | online | offline
  const [presFilter, setPresFilter] = useState("all");   // all | present | absent
  const [rows,     setRows]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = [];

    try {
      const sessions = (await fetchSessions({ per_page: 30, page: 1 }))
        ?.data?.all_sessions?.data ?? [];

      const details = await Promise.allSettled(sessions.map(s => fetchSession(s.id)));

      details.forEach((res, idx) => {
        const meta   = sessions[idx];
        const detail = res.status === "fulfilled" ? res.value?.data : null;
        if (!detail) return;

        const online  = isOnline(meta.type);
        const program = localStr(meta.program_name);
        const title   = localStr(meta.title);
        const date    = localStr(meta.date);
        const time    = localStr(meta.starts_at);

        const coach = detail.coach;
        if (coach) {
          const sessionStarted = !!(detail.actual_started_at ?? detail.timing?.actual_started_at);
          result.push({
            key:      `${detail.session_id}-coach`,
            name:     localStr(coach.name),
            audience: "مدرب",
            program, title, online, date, time,
            present:  sessionStarted ? true : !!coach.attended,
          });
        }

        const trainees = Array.isArray(detail.trainees) ? detail.trainees : [];
        trainees.forEach(tr => {
          const audience =
            tr.audience_label ?? (tr.audience === "student" ? "طالب" : "موظف");
          result.push({
            key:      `${detail.session_id}-${tr.id}`,
            name:     localStr(tr.name),
            audience,
            program, title, online, date, time,
            present:  !!tr.attended,
          });
        });
      });

      setRows(result);
    } catch (err) {
      setError(err.message || "حدث خطأ أثناء تحميل بيانات الحضور");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── derived stats ─────────────────────────────────────────────────────────
  const presentCount = rows.filter(r => r.present).length;
  const absentCount  = rows.filter(r => !r.present).length;
  const pct = rows.length ? Math.round((presentCount / rows.length) * 100) : 0;

  // ── filtered rows ─────────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filtered = rows.filter(r => {
    const matchSearch = !q
      || r.name.toLowerCase().includes(q)
      || r.program.toLowerCase().includes(q)
      || r.title.toLowerCase().includes(q);
    const matchMode =
      modeFilter === "all"
        ? true
        : modeFilter === "online" ? r.online : !r.online;
    const matchPres =
      presFilter === "all"
        ? true
        : presFilter === "present" ? r.present : !r.present;
    return matchSearch && matchMode && matchPres;
  });

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 px-2 py-4" dir="rtl">
      <div className="w-full max-w-[1024px] mx-auto space-y-3">

        {/* header */}
        <div className="text-right">
          <div className="flex items-center gap-2 justify-start">
            <IcoPeople />
            <h1 className="text-xl font-bold" style={{ color: "#024677" }}>
              سجل الحضور والغياب العام
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            متابعة حضور المدربين والطلاب والموظفين عبر جميع الجلسات والبرامج
          </p>
        </div>

        {/* stat cards */}
        <div className="flex flex-wrap gap-3" dir="rtl">
          <StatCard value={`${pct}%`}       label="نسبة الحضور"   color="#7c3aed" bg="#f5f3ff" />
          <StatCard value={absentCount}     label="غياب"           color="#ef4444" bg="#fff1f2" />
          <StatCard value={presentCount}    label="تم الحضور"      color="#16a34a" bg="#f0fdf4" />
          <StatCard value={rows.length}     label="إجمالي الحضور"  color="#1D293D" bg="#F1F5F9" />
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2" dir="rtl">

          {/* search */}
          <div className="relative flex-1 min-w-[180px]" dir="ltr">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <IcoSearch />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البرنامج أو الجلسة..."
              className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-slate-300"
              dir="rtl"
            />
          </div>

          {/* presence filter buttons */}
          {[
            { key: "all",     label: "الكل",   active: "#024677" },
            { key: "present", label: "الحضور", active: "#16a34a" },
            { key: "absent",  label: "الغياب", active: "#ef4444" },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={() => setPresFilter(btn.key)}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition"
              style={presFilter === btn.key
                ? { background: btn.active, color: "#fff" }
                : { color: "#64748b" }}
            >
              {btn.label}
            </button>
          ))}

          {/* mode filter */}
          <div className="relative">
            <select
              value={modeFilter}
              onChange={e => setModeFilter(e.target.value)}
              className="appearance-none text-sm font-medium border border-slate-200 bg-white rounded-xl px-4 py-2.5 pl-8 text-slate-600 cursor-pointer focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="online">أونلاين</option>
              <option value="offline">أوفلاين</option>
            </select>
          </div>
        </div>

        {/* loading */}
        {loading && (
          <div className="flex justify-center py-24">
            <IcoSpinner />
          </div>
        )}

        {/* error */}
        {!loading && error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* table */}
        {!loading && !error && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
            <table
              className="w-full text-sm"
              dir="rtl"
              style={{ borderCollapse: "collapse", tableLayout: "fixed", minWidth: "820px" }}
            >
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead>
                <tr style={{ background: "#024677" }}>
                  {["الاسم", "الفئة", "البرنامج", "الجلسة", "النوع", "التاريخ والوقت", "الحالة"].map(h => (
                    <th key={h} className="text-right font-bold text-white px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-slate-400">
                      لا توجد نتائج
                    </td>
                  </tr>
                ) : filtered.map((row, i) => (
                  <tr
                    key={row.key}
                    className="hover:bg-slate-50 transition"
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none" }}
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-700 truncate block">{row.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <AudienceBadge label={row.audience} />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <span className="block truncate">{row.program}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      <span className="block truncate">{row.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
                        ${row.online ? "text-[#0ea5e9] bg-[#e0f2fe]" : "text-[#f59e0b] bg-[#fef3c7]"}`}>
                        {row.online ? "أونلاين" : "أوفلاين"}
                      </span>
                    </td>
                    <td className="px-4 py-3" dir="ltr">
                      <div className="font-medium text-slate-700">{row.date}</div>
                      <div className="text-slate-400 text-xs">{row.time}</div>
                    </td>
                    <td className="px-4 py-3">
                      <AttendanceBadge present={row.present} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
