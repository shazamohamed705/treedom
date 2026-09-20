import { useState, useEffect } from "react";
import useReloadOnFocus from "../../hooks/useReloadOnFocus";
import StatsGrid        from "../StatsGrid";
import ProgramsTable    from "../ProgramsTable";
import UpcomingSessions from "../UpcomingSessions";
import EnrollmentChart  from "../EnrollmentChart";
import ProgramDonut     from "../ProgramDonut";
import ActiveTeam       from "../ActiveTeam";
import NotifFeed        from "../NotifFeed";
import { fetchDashboard, fetchTrainerDashboard, fetchSessions } from "../../services/api";
import { isIndeCoach } from "../../services/auth";
import { computeStatus } from "../SessionsPage";
import { activityLogFromDashboard } from "../orgActivityLog";

function asList(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw.coming_sessions)) return raw.coming_sessions;
  if (Array.isArray(raw.upcoming_sessions)) return raw.upcoming_sessions;
  if (Array.isArray(raw.sessions)) return raw.sessions;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function sessionListFromResponse(res) {
  const d = res?.data ?? res ?? {};
  const coming = asList(d.coming_sessions);
  const paged  = asList(d.all_sessions?.data ?? d.all_sessions);
  const lastPage = Number(
    d.all_sessions?.meta?.last_page ?? d.all_sessions?.last_page ?? 1
  ) || 1;
  return { coming, paged, lastPage };
}

function parseHm(raw) {
  const m = String(raw || "").trim().match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!m) return [0, 0];
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = (m[3] || "").toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return [h || 0, min || 0];
}

function sessionStartMs(s) {
  try {
    const base = new Date(s.date || Date.now());
    const [h, m] = parseHm(s.starts_at || s.timing?.scheduled?.starts_at_time || "00:00");
    base.setHours(h, m, 0, 0);
    return base.getTime();
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

// ── donut colour palette ───────────────────────────────────────────────────────
const DONUT_COLORS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f59e0b", "#e879f9", "#fb923c"];

// ── normalise session for UpcomingSessions ────────────────────────────────────
function normaliseSession(s) {
  const apiLive = s.is_live === true || s.status === "running" || s.timing?.status === "running";
  const st = apiLive ? "live" : (computeStatus?.(s) ?? "upcoming");
  const title = typeof s.title === "object"
    ? (s.title?.ar ?? s.title?.en ?? "جلسة")
    : (s.title ?? "جلسة");
  return {
    id:      s.id,
    title,
    program: s.program_name ?? (typeof s.program === "object" ? s.program?.name : s.program) ?? "—",
    trainer: s.coach_name ?? s.trainer?.name ?? s.coach?.name ?? "—",
    date:    s.date ?? "",
    time:    s.starts_at ?? s.timing?.scheduled?.starts_at_time ?? "",
    starts_at: s.starts_at,
    ends_at:   s.ends_at ?? s.timing?.scheduled?.ends_at_time ?? "",
    timeTo:    s.ends_at ?? s.timing?.scheduled?.ends_at_time ?? "",
    can_start: s.can_start,
    canStart:  s.can_start,
    can_end:   s.can_end,
    is_live:   s.is_live ?? apiLive,
    actual_started_at: s.actual_started_at ?? s.timing?.actual_started_at ?? s.timing?.started_at ?? null,
    timing:    s.timing,
    status:    apiLive || st === "live" ? "جارية" : "مجدولة",
    when:      apiLive || st === "live" ? "تبدأ الآن" : (s.status_label || s.date || "قادمة"),
  };
}

// ── normalise active program for ProgramsTable ───────────────────────────────
function normaliseProgram(p) {
  return {
    id:        p.id,
    name:      p.name?.ar ?? p.name ?? "—",
    trainees:  p.trainees_count                                               ?? 0,
    sessions:  p.sessions_count                                               ?? 0,
    remaining: (p.sessions_count ?? 0) - (p.completed_sessions_count ?? 0),
    progress:  p.progress_percent                                             ?? 0,
  };
}

// ── stat card shapes (built entirely from API) ────────────────────────────────
const STAT_SHAPES = [
  { label: "إجمالي المتدربين", icon: "users",      color: "teal",   chartColor: "#5AEACF" },
  { label: "البرامج النشطة",   icon: "graduation", color: "blue",   chartColor: "#60a5fa" },
  { label: "جلسات تفاعلية",    icon: "video",      color: "purple", chartColor: "#a78bfa" },
  { label: "معدل الإنجاز",     icon: "chart",      color: "green",  chartColor: "#34d399" },
];

// ── main ──────────────────────────────────────────────────────────────────────
export default function Dashboard({ onAddTrainer, onAddProgram, onGoNotifications, onViewSession }) {
  const [programs,       setPrograms]       = useState(null);
  const [sessions,       setSessions]       = useState([]);
  const [stats,          setStats]          = useState(null);
  const [enrollChart,    setEnrollChart]    = useState([]);
  const [donutData,      setDonutData]      = useState([]);
  const [notifications,  setNotifications]  = useState([]);
  const [focusTick, setFocusTick] = useState(0);
  useReloadOnFocus(() => setFocusTick(t => t + 1));
  const indeCoach = isIndeCoach();

  useEffect(() => {
    let on = true;
    const load = () => {
      const dashFn = indeCoach ? fetchTrainerDashboard : fetchDashboard;
      Promise.all([
        dashFn({ upcoming_sessions_limit: 3, active_programs_per_page: 50 }),
        indeCoach ? Promise.resolve(null) : fetchSessions({ page: 1 }).catch(() => null),
        indeCoach
          ? fetchDashboard({ upcoming_sessions_limit: 3, active_programs_per_page: 50 }).catch(() => null)
          : Promise.resolve(null),
      ])
        .then(async ([res, sessRes, activityRes]) => {
          if (!on) return;
          const d = res?.data ?? {};

          const sum       = d.summary ?? {};
          const todayTabs = d.today_sessions?.tabs ?? {};
          const liveCount = todayTabs.running?.count ?? 0;

          setStats([
            { ...STAT_SHAPES[0], value: String(sum.total_trainees_count ?? 0),   growth: "" },
            { ...STAT_SHAPES[1], value: String(sum.active_programs_count ?? 0),  growth: "" },
            {
              ...STAT_SHAPES[2],
              value:     String(sum.interactive_sessions_count ?? sum.upcoming_sessions_count ?? 0),
              liveToday: liveCount > 0,
              sub:       liveCount > 0 ? `${liveCount} جلسة الآن` : undefined,
              growth:    "",
            },
            { ...STAT_SHAPES[3], value: `${sum.completion_rate ?? 0}%`, growth: "" },
          ]);

          const first = sessionListFromResponse(sessRes);
          const extraPages = [];
          const more = indeCoach ? 1 : Math.min(first.lastPage, 5);
          for (let p = 2; p <= more; p++) extraPages.push(p);
          const rest = extraPages.length
            ? await Promise.all(extraPages.map(p => fetchSessions({ page: p }).catch(() => null)))
            : [];
          if (!on) return;

          const pool = [
            ...asList(d.upcoming_sessions),
            ...first.coming,
            ...first.paged,
            ...rest.flatMap(r => {
              const next = sessionListFromResponse(r);
              return [...next.coming, ...next.paged];
            }),
          ];
          const merged = [];
          const seen = new Set();
          pool.forEach(s => {
            const id = s?.id;
            if (id == null || seen.has(id)) return;
            const st = computeStatus(s);
            const apiLive = s?.is_live === true || s?.status === "running" || s?.timing?.status === "running";
            if (!apiLive && st !== "live" && st !== "upcoming") return;
            seen.add(id);
            merged.push(s);
          });
          merged.sort((a, b) => sessionStartMs(a) - sessionStartMs(b));
          setSessions(merged.map(normaliseSession));
          setPrograms(asList(d.active_programs).map(normaliseProgram));

          const curve = (d.enrollment_completion_curve ?? []).map(r => ({
            month:     r.month,
            enrolled:  r.enrollments,
            completed: r.completions,
          }));
          setEnrollChart(curve);

          const total = (d.program_distribution ?? []).reduce((s, c) => s + (c.count ?? 0), 0);
          const dist  = (d.program_distribution ?? []).map((c, i) => ({
            name:  c.category,
            value: total > 0 ? Math.round((c.count / total) * 100) : 0,
            color: DONUT_COLORS[i % DONUT_COLORS.length],
          }));
          setDonutData(dist);

          setNotifications(activityLogFromDashboard(indeCoach ? (activityRes ?? res) : res));
        })
        .catch(() => {
          if (!on) return;
          setStats(prev => prev ?? STAT_SHAPES.map(s => ({ ...s, value: "—", growth: "" })));
          setPrograms(prev => prev ?? []);
        });
    };

    load();
    const timer = setInterval(load, 30000);
    return () => { on = false; clearInterval(timer); };
  }, [focusTick]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="flex-1 overflow-y-auto bg-white p-4 sm:p-5 space-y-4 sm:space-y-5" dir="rtl">

      {/* stats row */}
      {stats === null ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 h-36 flex flex-col p-4 gap-3">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-slate-100" />
                <div className="w-10 h-5 rounded-full bg-slate-100" />
              </div>
              <div className="space-y-2 mt-auto">
                <div className="h-3 bg-slate-100 rounded w-2/3" />
                <div className="h-8 bg-slate-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <StatsGrid stats={stats} />
      )}

      {/* programs table + upcoming sessions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          {programs === null ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3 animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-1/3" />
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : (
            <ProgramsTable programs={programs} onAddProgram={onAddProgram} />
          )}
        </div>
        <div>
          <UpcomingSessions
            sessions={sessions}
            onView={onViewSession}
            onRefresh={() => setFocusTick(t => t + 1)}
          />
        </div>
      </div>

      {/* active team + notifications */}
      <div className={`grid grid-cols-1 gap-5 ${indeCoach ? "" : "lg:grid-cols-2"}`}>
        {!indeCoach && <ActiveTeam onAddTrainer={onAddTrainer} />}
        <NotifFeed notifications={notifications} onViewAll={onGoNotifications} />
      </div>

      {/* enrollment chart + program donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <EnrollmentChart data={enrollChart} />
        </div>
        <div>
          <ProgramDonut data={donutData} />
        </div>
      </div>

    </main>
  );
}
