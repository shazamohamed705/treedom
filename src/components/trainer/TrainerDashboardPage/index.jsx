import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCoachHome } from "../../../services/api";
import useReloadOnFocus from "../../../hooks/useReloadOnFocus";
import StatsGrid           from "../../shared/StatsGrid";
import ProgramsTable       from "../../shared/ProgramsTable";
import UpcomingSessions    from "../../shared/UpcomingSessions";
import EnrollmentChart     from "../../shared/EnrollmentChart";
import ProgramDonut        from "../../shared/ProgramDonut";
import TrainerActivityFeed from "../TrainerActivityFeed";
import { DONUT_COLORS, BRAND } from "../../../constants/colors";

// ── month label helper ────────────────────────────────────────────────────────
const MONTH_AR = {
  "01": "يناير", "02": "فبراير", "03": "مارس",   "04": "أبريل",
  "05": "مايو",  "06": "يونيو",  "07": "يوليو",  "08": "أغسطس",
  "09": "سبتمبر","10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};
function monthLabel(str) {
  // str = "2026-09"
  const [, m] = (str ?? "").split("-");
  return MONTH_AR[m] ?? str;
}

// ── delivery icon ─────────────────────────────────────────────────────────────
function deliveryLabel(session) {
  const mode = session.type?.delivery_mode ?? session.delivery_mode ?? "";
  if (mode === "offline") return "حضوري";
  if (mode === "online")  return "أونلاين";
  return session.type?.text ?? "—";
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainerDashboardPage({ onViewSession, onAddProgram }) {
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    fetchCoachHome()
      .then(res => {
        setData(res?.data ?? res);
        setError(null);
      })
      .catch(err => {
        if (!silent) setError(err?.message ?? "حدث خطأ");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useReloadOnFocus(() => load(true));

  // ── destructure API sections ──────────────────────────────────────────────
  const welcome         = data?.welcome          ?? {};
  const summary         = data?.summary          ?? {};
  const upcomingSess    = data?.upcoming_sessions ?? [];
  const activePrograms  = data?.active_programs  ?? [];
  const latestUpdates   = data?.latest_updates   ?? [];
  const charts          = data?.charts           ?? {};

  const trainerName = welcome.name ?? "المدرب";
  const trainerImg  = welcome.image ?? null;

  // ── stats cards ───────────────────────────────────────────────────────────
  const stats = [
    {
      label:      "تقييم المدرب",
      value:      `${summary.average_rating?.value ?? 0} / ${summary.average_rating?.max ?? 5}`,
      icon:       "chart",
      growth:     summary.average_rating?.trend >= 0
                    ? `+${summary.average_rating?.trend ?? 0}`
                    : `${summary.average_rating?.trend ?? 0}`,
      chartColor: "#f59e0b",
    },
    {
      label:      "معدل الالتزام",
      value:      `${summary.commitment_rate?.value ?? 0}%`,
      icon:       "graduation",
      growth:     summary.commitment_rate?.trend >= 0
                    ? `+${summary.commitment_rate?.trend ?? 0}%`
                    : `${summary.commitment_rate?.trend ?? 0}%`,
      chartColor: "#14b8a6",
    },
    {
      label:      "جلسات هذا الشهر",
      value:      summary.sessions_this_month?.value ?? 0,
      icon:       "video",
      growth:     summary.sessions_this_month?.trend >= 0
                    ? `+${summary.sessions_this_month?.trend ?? 0}%`
                    : `${summary.sessions_this_month?.trend ?? 0}%`,
      chartColor: "#60a5fa",
    },
    {
      label:      "البرامج النشطة",
      value:      summary.active_programs?.value ?? 0,
      icon:       "users",
      growth:     summary.active_programs?.trend >= 0
                    ? `+${summary.active_programs?.trend ?? 0}%`
                    : `${summary.active_programs?.trend ?? 0}%`,
      chartColor: "#34d399",
    },
  ];

  // ── upcoming sessions → shape UpcomingSessions expects ───────────────────
  const upcomingMapped = upcomingSess.map(s => ({
    id:        s.id,
    title:     s.title,
    program:   s.program_name ?? s.program?.name ?? "—",
    trainer:   trainerName,
    date:      s.date ?? "",
    time:      s.starts_at ?? "",
    starts_at: s.starts_at,
    ends_at:   s.ends_at,
    timeTo:    s.ends_at,
    can_start: s.can_start,
    canStart:  s.can_start,
    is_live:   s.is_live,
    actual_started_at: s.actual_started_at ?? s.timing?.actual_started_at ?? null,
    timing:    s.timing,
    status:    s.status === "running" || s.is_live || s.status === "live" ? "جارية" : "مجدولة",
    when:      s.status_label ?? "قادمة",
    type:      deliveryLabel(s),
  }));

  // ── active programs → shape ProgramsTable expects ────────────────────────
  const programsMapped = activePrograms.map(p => ({
    id:        p.id,
    name:      p.name,
    progress:  p.progress_percent ?? 0,
    trainees:  p.trainees_count   ?? 0,
    sessions:  `${p.sessions_total ?? 0} جلسة`,
    remaining: p.sessions_remaining ?? 0,
  }));

  // ── enrollment chart data ─────────────────────────────────────────────────
  const enrollmentData = (charts.enrollment_completion_trend ?? []).map(row => ({
    month:     monthLabel(row.month),
    enrolled:  row.enrollments  ?? 0,
    completed: row.completions  ?? 0,
  }));

  // ── donut chart data ──────────────────────────────────────────────────────
  // DONUT_COLORS imported from src/constants/colors.js
  const donutData = (charts.program_distribution ?? []).map((item, i) => ({
    name:  item.category ?? `تصنيف ${i + 1}`,
    value: item.percent  ?? item.count ?? 0,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 bg-white p-4 sm:p-5 space-y-5" dir="rtl">
        <div className="h-8 w-56 bg-slate-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 animate-pulse">
          <div className="xl:col-span-2 h-64 bg-slate-100 rounded-2xl" />
          <div className="h-64 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-pulse">
          <div className="lg:col-span-2 h-56 bg-slate-100 rounded-2xl" />
          <div className="h-56 bg-slate-100 rounded-2xl" />
        </div>
      </main>
    );
  }

  // ── error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <main className="flex-1 overflow-y-auto min-h-0 bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-3">
          <p className="text-slate-500 text-sm">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchCoachHome().then(r => setData(r?.data ?? r)).catch(e => setError(e?.message ?? "خطأ")).finally(() => setLoading(false)); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#024677" }}>
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto min-h-0 bg-white p-4 sm:p-5 space-y-4 sm:space-y-5" dir="rtl">

      {/* ── greeting ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {trainerImg && (
          <img src={trainerImg} alt={trainerName}
            className="w-10 h-10 rounded-full object-cover border-2 border-teal-200 shrink-0" />
        )}
        <div>
          <h1 className="text-lg font-bold" style={{ color: "#024677" }}>
            مرحباً، {trainerName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">إليك ملخص جلساتك وبرامجك التدريبية</p>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <StatsGrid stats={stats} />

      {/* ── Programs Table + Upcoming Sessions ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <ProgramsTable programs={programsMapped.length ? programsMapped : []} onAddProgram={onAddProgram} />
        </div>
        <div>
          <UpcomingSessions sessions={upcomingMapped} onView={onViewSession} onRefresh={() => load(true)} />
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <TrainerActivityFeed items={latestUpdates} onViewAll={() => navigate("/dashboard/notifications")} />

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <EnrollmentChart data={enrollmentData.length ? enrollmentData : []} />
        </div>
        <div>
          <ProgramDonut data={donutData.length ? donutData : []} />
        </div>
      </div>

    </main>
  );
}
