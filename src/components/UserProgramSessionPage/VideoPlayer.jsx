import { useRef, useState, useEffect, useCallback } from "react";
import { IcoPlay, IcoPause, IcoSkipB, IcoSkipF, IcoVol, IcoFullscr } from "./icons";
import { saveWatchProgress, getResumeTime } from "../../services/watchProgress";

function fmtTime(sec) {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${m}:${String(s).padStart(2,"0")}`;
}

export default function VideoPlayer({ title, videoUrl, sessionId, programId, variant }) {
  const videoRef  = useRef(null);
  const wrapRef   = useRef(null);
  const hideTimer = useRef(null);
  const lastSave  = useRef(0);
  // هل الفيديو وصل للنهاية؟ — منعاً من الحفظ بعد الـ ended
  const endedRef  = useRef(false);

  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted,    setMuted]    = useState(false);
  const [volume,   setVolume]   = useState(1);
  const [showCtrl, setShowCtrl] = useState(true);
  const [fullscr,  setFullscr]  = useState(false);
  const [resumed,  setResumed]  = useState(false);

  const classroom = variant === "classroom";

  // ── persist: بيحفظ بس لو الفيديو لسه ما خلصش ────────────────────────────
  const persist = useCallback((v) => {
    if (!sessionId || !v?.duration || endedRef.current) return;
    if (v.currentTime <= 5) return;                        // أقل من 5 ثواني — مش مهم
    if (v.currentTime >= v.duration - 2) return;           // قريب من النهاية — مش نحفظ
    saveWatchProgress(sessionId, {
      programId,
      currentTime: v.currentTime,
      duration:    v.duration,
    });
  }, [sessionId, programId]);

  // ref دايماً بيشير لـ persist الأحدث — للـ cleanup
  const persistRef = useRef(persist);
  useEffect(() => { persistRef.current = persist; }, [persist]);

  // ── reset عند تغيير الجلسة أو الـ URL ───────────────────────────────────
  useEffect(() => {
    endedRef.current = false;
    setPlaying(false); setProgress(0); setCurrent(0);
    setDuration(0); setResumed(false);
    lastSave.current = 0;
  }, [videoUrl, sessionId]);

  // ── حفظ عند: إغلاق/إخفاء المتصفح أو unmount ────────────────────────────
  useEffect(() => {
    const saveNow = () => {
      const v = videoRef.current;
      if (!v || endedRef.current) return;
      persistRef.current(v);
    };
    document.addEventListener("visibilitychange", saveNow);
    window.addEventListener("pagehide", saveNow);
    return () => {
      saveNow();
      document.removeEventListener("visibilitychange", saveNow);
      window.removeEventListener("pagehide", saveNow);
    };
  }, []); // eslint-disable-line

  // ── fullscreen listener ──────────────────────────────────────────────────
  useEffect(() => {
    const h = () => setFullscr(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── إخفاء controls بعد 2.5s ─────────────────────────────────────────────
  const showControls = useCallback(() => {
    setShowCtrl(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCtrl(false), 2500);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);
  useEffect(() => {
    if (!playing) { setShowCtrl(true); clearTimeout(hideTimer.current); }
  }, [playing]);

  if (!videoUrl) return null;

  // ── handlers ─────────────────────────────────────────────────────────────
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play(); else v.pause();
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration || endedRef.current) return;
    setCurrent(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
    const now = Date.now();
    if (now - lastSave.current > 1500) {
      lastSave.current = now;
      persist(v);
    }
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v || !Number.isFinite(v.duration) || v.duration <= 0) return;
    const actualDuration = v.duration;
    setDuration(actualDuration);
    endedRef.current = false;

    const saved = getResumeTime(sessionId);
    if (!Number.isFinite(saved) || saved <= 5) return;

    // لو المدة المحفوظة مختلفة → نستخدم النسبة المئوية
    let resumeTime = saved;
    try {
      const store = JSON.parse(localStorage.getItem("resume_positions") || "{}");
      const entry = store[String(sessionId)];
      if (entry && Number(entry.duration) > 0 &&
          Math.abs(Number(entry.duration) - actualDuration) > 2) {
        resumeTime = (Number(entry.percent ?? 0) / 100) * actualDuration;
      }
    } catch { /* use saved as-is */ }

    // لا نستكمل لو الوقت قريب من النهاية (يعني الفيديو كان خالص)
    if (resumeTime >= actualDuration - 5) return;

    resumeTime = Math.max(0, Math.min(resumeTime, actualDuration - 5));
    if (resumeTime > 5) {
      v.currentTime = resumeTime;
      setCurrent(resumeTime);
      setProgress((resumeTime / actualDuration) * 100);
      setResumed(true);
      setTimeout(() => setResumed(false), 2500);
    }
  };

  const handleEnded = () => {
    endedRef.current = true;
    setPlaying(false);
    // عند انتهاء الفيديو: احفظ كـ 100% في watch_progress بس
    // ولا تحفظ في resume_positions عشان مايفتحش على النهاية
    const v = videoRef.current;
    if (sessionId && v?.duration) {
      saveWatchProgress(sessionId, {
        programId,
        currentTime: v.duration,
        duration:    v.duration,
      });
    }
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
    if (pct < 0.95) endedRef.current = false;
  };

  const handleSeekMouseDown = (e) => {
    e.preventDefault();
    const bar = e.currentTarget;

    const move = (ev) => {
      const v = videoRef.current;
      if (!v || !v.duration) return;
      const rect = bar.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
      v.currentTime = pct * v.duration;
      setProgress(pct * 100);
      setCurrent(v.currentTime);
      if (pct < 0.95) endedRef.current = false;
    };

    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
    };

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);

    // seek فوري على click كمان
    move(e);
  };

  const skip = (sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
    if (v.currentTime < (v.duration || 0) * 0.95) endedRef.current = false;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next && volume === 0) { setVolume(0.5); v.volume = 0.5; }
  };

  const changeVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    setMuted(val === 0);
  };

  const toggleFullscreen = () => {
    const el = classroom ? wrapRef.current : (videoRef.current ?? wrapRef.current);
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  };

  const VolIcon = () => {
    if (muted || volume === 0) return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    );
    return <IcoVol />;
  };

  const bg = classroom ? "#102431" : "#0d1b2e";

  return (
    <div
      ref={wrapRef}
      dir="ltr"
      className="relative select-none"
      style={{ background: bg, borderRadius: classroom ? 12 : 16, overflow: "hidden" }}
      onMouseMove={showControls}
      onMouseEnter={showControls}
      onMouseLeave={() => { if (playing) setShowCtrl(false); }}
    >
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain", background: bg, cursor: showCtrl ? "default" : "none" }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setPlaying(true)}
          onPause={() => { persist(videoRef.current); setPlaying(false); }}
          onEnded={handleEnded}
          onClick={togglePlay}
          onDoubleClick={toggleFullscreen}
          playsInline
        />

        {/* toast استكمال */}
        {resumed && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg z-20"
            style={{ background: "rgba(54,213,196,0.92)", color: "#0d1b2e" }}>
            ▶ استكمال من {fmtTime(current)}
          </div>
        )}

        {/* زر play وسط */}
        {!playing && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-30"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={togglePlay}
          >
            {classroom ? (
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                style={{ background: "rgba(54,213,196,0.25)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: "#36D5C4" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                    <polygon points="8 5 19 12 8 19"/>
                  </svg>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: "#5AEACF" }}>
                  <IcoPlay />
                </div>
                {title && (
                  <p className="mt-3 text-white text-[13px] font-bold drop-shadow text-center px-4">{title}</p>
                )}
              </>
            )}
          </div>
        )}

        {/* controls overlay */}
        <div
          className="absolute inset-0 flex flex-col justify-end transition-opacity duration-300"
          style={{
            zIndex: playing ? 20 : 10,
            opacity: showCtrl ? 1 : 0,
            // دايماً قابل للـ interaction لما الـ controls ظاهرة
            pointerEvents: showCtrl ? "auto" : "none",
            background: "linear-gradient(to top,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.18) 40%,transparent 70%)",
          }}
        >
          {/* title bar */}
          <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-8"
            style={{ background: "linear-gradient(to bottom,rgba(0,0,0,0.65),transparent)" }}>
            <p className="text-white text-[13px] font-bold truncate">{title}</p>
          </div>

          <div className="px-3 pb-3 space-y-1.5">
            {/* seek bar */}
            <div
              className="relative w-full cursor-pointer group/seek"
              style={{ height: 20, display: "flex", alignItems: "center" }}
              onMouseDown={handleSeekMouseDown}
            >
              <div className="w-full rounded-full"
                style={{ height: 4, background: "rgba(255,255,255,0.25)", position: "relative" }}>
                <div className="h-full rounded-full absolute top-0 left-0"
                  style={{ width: `${Math.min(progress + 12, 100)}%`, background: "rgba(255,255,255,0.18)" }}/>
                <div className="h-full rounded-full absolute top-0 left-0 transition-all"
                  style={{ width: `${progress}%`, background: classroom ? "#36D5C4" : "#5AEACF" }}/>
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md scale-0 group-hover/seek:scale-100 transition-transform"
                style={{ left: `calc(${progress}% - 7px)` }}
              />
            </div>

            {/* buttons row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button onClick={toggleFullscreen}
                  className="text-white/75 hover:text-white transition p-1 rounded"
                  title={fullscr ? "خروج" : "ملء الشاشة"}>
                  {fullscr ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                      <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                    </svg>
                  ) : <IcoFullscr />}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => skip(-10)} className="text-white/75 hover:text-white transition">
                  <IcoSkipB />
                </button>
                <button onClick={togglePlay}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110"
                  style={{ background: classroom ? "#36D5C4" : "#5AEACF" }}>
                  {playing ? <IcoPause /> : <IcoPlay />}
                </button>
                <button onClick={() => skip(10)} className="text-white/75 hover:text-white transition">
                  <IcoSkipF />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/60 text-[11px] font-mono tabular-nums hidden sm:inline">
                  {fmtTime(current)} / {fmtTime(duration)}
                </span>
                <div className="flex items-center gap-1.5 group/vol">
                  <button onClick={toggleMute} className="text-white/75 hover:text-white transition p-1">
                    <VolIcon />
                  </button>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={muted ? 0 : volume}
                    onChange={changeVolume}
                    className="w-0 group-hover/vol:w-16 transition-all duration-200 cursor-pointer"
                    style={{ accentColor: classroom ? "#36D5C4" : "#5AEACF", height: 3 }}
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <button onClick={toggleFullscreen}
                  className="text-white/75 hover:text-white transition p-1 rounded"
                  title={fullscr ? "خروج" : "ملء الشاشة"}>
                  {fullscr ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                      <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                    </svg>
                  ) : <IcoFullscr />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
