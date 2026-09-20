import { useEffect, useState } from "react";
import VideoPlayer from "./VideoPlayer";
import { getWatchProgress } from "../../services/watchProgress";
import { quizzesForSession } from "../../services/quizzes";
import SessionQuizPage from "./SessionQuizPage";
import { useQuizMode } from "../../context/QuizModeContext";

const TEAL = "#36D5C4";
const NAVY = "#075A82";
const BG = "#F5F8FA";


function filesOf(s) {
  const raw = s?.files ?? s?.attachments ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((f, i) => ({
    id: f.id ?? i,
    name: f.name ?? f.title ?? f.file_name ?? "ملف",
    kind: f.extension ?? f.type ?? f.mime ?? "ملف",
    url: f.url ?? f.file_url ?? f.path ?? null,
  }));
}

function sessionMinutes(s) {
  const n = Number(s?.duration_minutes);
  if (Number.isFinite(n) && n > 0) return `${n} دقيقة`;
  const raw = String(s?.duration ?? "").trim();
  const m = raw.match(/(\d+)/);
  if (m && Number(m[1]) > 0) return `${m[1]} دقيقة`;
  return "";
}

function sessionTrainer(s, program) {
  const coach = typeof s?.coach === "object" ? s.coach?.name : s?.coach;
  if (coach && coach !== "—") return coach;
  const trainer = typeof program?.trainer === "object" ? program.trainer?.name : program?.trainer;
  if (trainer && trainer !== "—") return trainer;
  return "";
}

function learningsOf(s, program) {
  const raw = s?.learnings ?? s?.objectives ?? program?.learnings ?? program?.keypoints ?? [];
  if (Array.isArray(raw) && raw.length) return raw.map(x => (typeof x === "string" ? x : x?.title ?? x?.text ?? "")).filter(Boolean);
  const desc = String(s?.desc ?? s?.description ?? "").trim();
  if (!desc) return [];
  return desc.split(/\n|•|-/).map(x => x.trim()).filter(x => x.length > 8).slice(0, 6);
}

function watchPercent(s) {
  const ids = [s?.sessionId, s?.session_id, s?.id].filter(v => v != null);
  let best = Number(s?.progress ?? s?.progress_percent ?? 0) || 0;
  for (const id of ids) {
    const local = getWatchProgress(id);
    if (local && Number(local.percent) > best) best = Number(local.percent);
  }
  return best;
}

export function lessonWatched(s) {
  if (s?.is_completed || s?.status === "completed" || s?.status === 2) return true;
  return watchPercent(s) >= 90;
}

function isQuizLesson(s) {
  return /كويز|اختبار|امتحان|quiz/i.test(String(s?.title ?? ""));
}

function arcPath(cx, cy, r, start, end) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(start));
  const y1 = cy + r * Math.sin(rad(start));
  const x2 = cx + r * Math.cos(rad(end));
  const y2 = cy + r * Math.sin(rad(end));
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function SegmentRing({ pct }) {
  const segs = 8;
  const gap = 18;
  const sweep = 360 / segs - gap;
  const filled = Math.round((Math.min(100, Math.max(0, pct)) / 100) * segs);
  const r = 40;
  const cx = 48;
  const cy = 48;
  const sharp = {
    fontFamily: '"Segoe UI", "Cairo", "IBM Plex Sans Arabic", sans-serif',
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    textRendering: "optimizeLegibility",
  };
  return (
    <div className="relative mx-auto" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" style={{ display: "block" }}>
        {Array.from({ length: segs }, (_, i) => {
          const start = -90 + i * (360 / segs) + gap / 2;
          return (
            <path
              key={i}
              d={arcPath(cx, cy, r, start, start + sweep)}
              fill="none"
              stroke={i < filled ? "#45D7C6" : "#E6EEF0"}
              strokeWidth="5"
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span style={{ ...sharp, fontSize: 20, fontWeight: 700, color: "#07577F", lineHeight: "22px" }}>{Math.round(pct)}%</span>
        <span style={{ ...sharp, fontSize: 12, fontWeight: 500, color: "#9AA6AD", lineHeight: "14px", marginTop: 1 }}>مكتمل</span>
      </div>
    </div>
  );
}

function StatusIcon({ state }) {
  if (state === "done") {
    return (
      <span className="rounded-full flex items-center justify-center shrink-0" style={{ width: 14, height: 14, background: "#16A34A" }}>
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
    );
  }
  if (state === "current") {
    return (
      <svg width="14" height="14" viewBox="0 0 12 12" className="shrink-0" aria-hidden="true">
        <circle cx="6" cy="6" r="5" fill="none" stroke="#49D8C8" strokeWidth="1.4" />
        <circle cx="6" cy="6" r="2.4" fill="#B7F3EA" />
      </svg>
    );
  }
  if (state === "warn") {
    return (
      <span className="rounded-full flex items-center justify-center shrink-0 text-white" style={{ width: 14, height: 14, background: "#F4A62A", fontSize: 10, fontWeight: 700, lineHeight: 1 }}>!</span>
    );
  }
  if (state === "file") {
    return (
      <span className="relative shrink-0" style={{ width: 14, height: 14 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8AA0AE" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        </svg>
        <span className="absolute rounded-full" style={{ width: 4, height: 4, background: "#E11D48", top: -1, left: -1 }} />
      </span>
    );
  }
  return <span className="rounded-full shrink-0" style={{ width: 14, height: 14, border: "1px solid #DCE4E8", background: "transparent" }} />;
}

function lessonVisualState(s, active) {
  const quiz = isQuizLesson(s);
  if (lessonWatched(s)) return "done";
  if (quiz && watchPercent(s) > 0) return "warn";
  if (quiz) return "file";
  if (active || watchPercent(s) > 0 || s?.status === "current") return "current";
  return "idle";
}

export function CourseSideNav({ title, category, lessons, activeId, onSelect, meta }) {
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump(n => n + 1);
    window.addEventListener("treedom:watch", fn);
    return () => window.removeEventListener("treedom:watch", fn);
  }, []);

  const total = lessons.length;
  const completed = lessons.filter(lessonWatched).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;
  const sub = meta || `${completed} من ${total} جلسة`;
  return (
    <aside className="h-full flex flex-col min-h-0" dir="rtl" style={{ width: "100%", background: "#FBFCFC", fontFamily: '"Cairo", "IBM Plex Sans Arabic", "Segoe UI", sans-serif', WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale", textRendering: "optimizeLegibility" }}>
      <div className="text-center shrink-0" style={{ padding: "12px 16px 10px" }}>
        <p style={{ color: "#43D6C5", fontSize: 11, fontWeight: 500, lineHeight: 1.35 }}>{category || "محتوى البرنامج"}</p>
        <p style={{ color: "#173247", fontSize: 13, fontWeight: 700, lineHeight: 1.45, marginTop: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</p>
        <div style={{ marginTop: 8 }}>
          <SegmentRing pct={pct} />
        </div>
        <p style={{ color: "#9BA6AC", fontSize: 11, fontWeight: 400, lineHeight: 1.35, marginTop: 4 }}>{sub}</p>
      </div>
      <div style={{ height: 1, background: "#EEF1F2", flexShrink: 0 }} />
      <div className="course-nav-scroll flex-1 overflow-y-auto min-h-0">
        {lessons.map((s, i) => {
          const on = activeId != null && (String(activeId) === String(s.id) || String(activeId) === String(s.sessionId));
          const state = lessonVisualState(s, on);
          const showRule = i > 0 && i % 4 === 0;
          return (
            <div key={s.id ?? i}>
              {showRule && <div style={{ height: 1, background: "#EEF1F2", margin: "1px 0" }} />}
              <button
                type="button"
                onClick={() => onSelect?.(s)}
                className="w-full"
                style={{
                  display: "grid",
                  gridTemplateColumns: "14px minmax(0, 1fr)",
                  direction: "ltr",
                  alignItems: "center",
                  columnGap: 8,
                  padding: "7px 16px 7px 10px",
                  minHeight: s.duration ? 48 : 40,
                  background: on ? "#F0FBF9" : "transparent",
                  borderRadius: on ? 3 : 0,
                  textAlign: "right",
                }}>
                <StatusIcon state={state} />
                <span className="min-w-0" style={{ direction: "rtl" }}>
                  <span className="block" style={{
                    color: on ? "#07577F" : (state === "done" ? "#34424C" : "#4B5560"),
                    fontSize: 12,
                    fontWeight: on ? 700 : 500,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    <span style={{ fontWeight: 700 }}>{s.num}.</span> {s.title}
                  </span>
                  {s.duration ? (
                    <span className="block" style={{ color: "#A7B0B5", fontSize: 10, fontWeight: 400, lineHeight: 1.3, marginTop: 2 }}>{s.duration}</span>
                  ) : null}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default function EnrolledClassroom({
  program, sessions, selected, onSelect, onRewatch, onBack, videoKey, playerRef,
}) {
  const [openNav,   setOpenNav]   = useState(false);
  const [note,      setNote]      = useState("");
  const [openQuiz,  setOpenQuiz]  = useState(false);
  const [quizLocked, setQuizLocked] = useState(false);  // true فقط بعد "ابدأ الآن"
  const { enterQuiz, exitQuiz } = useQuizMode();
  const active = selected ?? sessions[0] ?? null;

  // تأكد من إعادة تعيين quizActive عند unmount (حماية من الحالات الشاذة)
  useEffect(() => {
    return () => { exitQuiz(); };
  }, [exitQuiz]);
  const files = filesOf(active);
  const learnings = learningsOf(active, program);
  const videoUrl = active ? (active.videoUrl || null) : null;
  const sessionPct = active && lessonWatched(active) ? 100 : watchPercent(active);

  // Load quizzes for current session
  const sessionQuizzes = quizzesForSession(active?.sessionId ?? active?.id);
  const currentQuiz    = sessionQuizzes[0] ?? null;

  useEffect(() => {
    const key = `treedom.note.${active?.sessionId ?? active?.id ?? "x"}`;
    try { setNote(localStorage.getItem(key) || ""); } catch { setNote(""); }
  }, [active?.id, active?.sessionId]);

  const saveNote = (v) => {
    setNote(v);
    const key = `treedom.note.${active?.sessionId ?? active?.id ?? "x"}`;
    try { localStorage.setItem(key, v); } catch { /* ignore */ }
  };

  const nav = (
    <CourseSideNav
      title={program?.title}
      category={program?.field || program?.trainerOrg || "محتوى البرنامج"}
      lessons={sessions}
      activeId={active?.id}
      onSelect={(s) => { onSelect?.(s); setOpenNav(false); }}
    />
  );

  return (
    <div className="flex-1 min-h-0 flex overflow-hidden" style={{ background: BG, fontFamily: "'Cairo', 'IBM Plex Sans Arabic', system-ui, sans-serif" }} dir="ltr">
      {!quizLocked && (
        <div className="hidden md:block w-[300px] lg:w-[320px] shrink-0 h-full overflow-hidden border-r ms-3 lg:ms-4" style={{ borderColor: "#EEF1F2", background: "#FBFCFC" }}>
          {nav}
        </div>
      )}

      {!quizLocked && openNav && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="h-full overflow-hidden" style={{ width: 320, background: "#FBFCFC", borderLeft: "1px solid #EEF1F2" }}>{nav}</div>
          <button type="button" className="flex-1 bg-black/30" onClick={() => setOpenNav(false)} aria-label="إغلاق" />
        </div>
      )}

      {/* ── Quiz view (inline, sidebar stays) ── */}
      {openQuiz ? (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <SessionQuizPage
            quiz={currentQuiz}
            session={active}
            onEnterLock={() => { setQuizLocked(true); enterQuiz(); }}
            onClose={() => { setOpenQuiz(false); setQuizLocked(false); exitQuiz(); }}
          />
        </div>
      ) : (
      <main className="flex-1 overflow-y-auto min-w-0 px-3 sm:px-4 lg:px-5 py-3 sm:py-4" dir="ltr">
        <div className="w-full max-w-[1080px] mx-auto space-y-3" dir="rtl">
        <div className="flex items-center justify-between gap-2">
          {onBack ? (
            <button type="button" onClick={onBack} className="text-[12px] font-semibold hover:underline" style={{ color: NAVY }}>
              تفاصيل البرنامج
            </button>
          ) : <span />}
          <button type="button" onClick={() => setOpenNav(true)} className="md:hidden text-[11px] font-semibold px-2.5 py-1.5 rounded-md border bg-white" style={{ borderColor: "#EEF1F2", color: NAVY }}>
            جلسات البرنامج
          </button>
        </div>

        <section className="rounded-[12px] px-5 py-4 text-white" style={{ background: "linear-gradient(135deg, rgba(2, 70, 119, 0.99) 0%, rgba(10, 90, 138, 0.92) 100%)", minHeight: 104 }}>
          <div className="flex items-center justify-between gap-3">
            <div className="text-right min-w-0 flex-1">
              <p className="text-[12px] text-white/75">الجلسة {active?.num ?? 1} من {sessions.length}</p>
              <h1 className="text-[17px] sm:text-[19px] font-extrabold leading-snug mt-2.5">{active?.title || program?.title}</h1>
              <p className="text-[12px] text-white/80 mt-2.5">
                {[sessionMinutes(active), sessionTrainer(active, program)].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span
              className="shrink-0"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                alignSelf: "flex-start",
                marginTop: -6,
                borderRadius: "clamp(10px, 1.2vw, 13.74px)",
                background: "rgba(90, 234, 207, 0.15)",
                padding: "clamp(5px, 0.6vw, 6.87px) clamp(12px, 1.5vw, 17.18px)",
              }}
            >
              <span
                style={{
                  color: "#5AEACF",
                  fontFamily: "Cairo, sans-serif",
                  fontSize: "clamp(16px, 1.6vw, 20.61px)",
                  fontStyle: "normal",
                  fontWeight: 400,
                  lineHeight: "133.333%",
                }}
              >✓</span>
            </span>
          </div>
        </section>

        <div ref={playerRef} className="rounded-[12px] overflow-hidden w-full" style={{ background: "#102431" }}>
          {videoUrl ? (
            <VideoPlayer
              key={videoKey}
              variant="classroom"
              title={active?.title}
              videoUrl={videoUrl}
              sessionId={active?.sessionId ?? active?.id}
              programId={program?.id ?? program?.programId}
            />
          ) : (
            <div className="relative w-full flex items-center justify-center" style={{ aspectRatio: "16/9" }}>
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: "rgba(54,213,196,0.25)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: TEAL }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="8 5 19 12 8 19"/></svg>
                </div>
              </div>
            </div>
          )}
        </div>

        <section className="bg-white rounded-[12px] border px-5 py-5" style={{ borderColor: "#E7EEF3" }}>
          <div className="flex items-center justify-between gap-4">
            {/* left: title + stats */}
            <div className="text-right flex flex-col gap-3">
              <p className="text-[15px] font-extrabold" style={{ color: "#16324F" }}>
                تقدم الجلسة {active?.num}
              </p>
              <div className="flex flex-col gap-0.5" style={{ marginTop: 6 }}>
                <p className="text-[26px] font-extrabold leading-none" style={{ color: "#16A34A" }}>{sessionPct}%</p>
                <p className="text-[12px] mt-1" style={{ color: "#94A3B8" }}>أكملت هذا المحور</p>
              </div>
            </div>
            {/* right: start quiz button */}
            <button
              type="button"
              onClick={() => setOpenQuiz(true)}
              className="shrink-0 text-[13px] font-extrabold px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
              style={{ background: NAVY }}>
              ابدأ الاختبار
            </button>
          </div>
        </section>




        {learnings.length > 0 && (
          <section className="bg-white rounded-[12px] border px-4 py-3.5" style={{ borderColor: "#E7EEF3" }}>
            <h2 className="text-[14px] font-extrabold text-right" style={{ color: "#16324F" }}>أبرز ما ستتعلمه</h2>
            <p className="text-[12px] mt-1 mb-3 text-right" style={{ color: "#94A3B8" }}>نقاط الجلسة</p>
            <div className="space-y-2.5">
              {learnings.map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-[13px] flex-1 text-right" style={{ color: "#334155" }}>{item}</span>
                  <span className="w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0" style={{ background: "#E7F8F6", color: NAVY }}>{i + 1}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-[12px] border px-4 py-3.5" style={{ borderColor: "#E7EEF3" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[14px] font-extrabold" style={{ color: "#16324F" }}>ملفات الجلسة</h2>
            <span className="text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </span>
          </div>
          {files.length === 0 ? (
            <p className="text-[12px] text-center py-3" style={{ color: "#94A3B8" }}>لا توجد ملفات</p>
          ) : (
            <div className="space-y-2">
              {files.map(f => (
                <div key={f.id} className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: "#F7FAFC" }}>
                  <span className="w-8 h-8 rounded-lg bg-white border flex items-center justify-center shrink-0 text-[9px] font-bold" style={{ borderColor: "#E6EEF3", color: NAVY }}>
                    {String(f.kind).slice(0, 3).toUpperCase()}
                  </span>
                  <span className="flex-1 min-w-0 text-right">
                    <span className="block text-[13px] font-semibold truncate" style={{ color: "#1E3348" }}>{f.name}</span>
                    <span className="block text-[10px]" style={{ color: "#94A3B8" }}>{f.kind}</span>
                  </span>
                  {f.url ? (
                    <a href={f.url} download className="text-[11px] font-bold shrink-0" style={{ color: NAVY }}>تحميل</a>
                  ) : (
                    <span className="text-[11px] shrink-0" style={{ color: "#94A3B8" }}>تحميل</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-[12px] border px-4 py-3.5" style={{ borderColor: "#E7EEF3" }}>
          <h2 className="text-[14px] font-extrabold text-right mb-2" style={{ color: "#16324F" }}>ملاحظاتي الشخصية</h2>
          <textarea
            value={note}
            onChange={e => saveNote(e.target.value)}
            rows={4}
            placeholder="اكتب ملاحظاتك..."
            className="mt-3 w-full rounded-[10px] border px-3 py-2.5 text-[13px] outline-none resize-y"
            style={{ borderColor: "#E6EEF3", color: "#1E3348" }}
          />
        </section>
        </div>
      </main>
      )}
    </div>
  );
}
