import { useRef, useState, useEffect } from "react";
import { IcoPlay, IcoPause, IcoSkipB, IcoSkipF, IcoVol, IcoDownload, IcoFullscr } from "./icons";
import { saveWatchProgress, getResumeTime } from "../../services/watchProgress";

function fmtTime(sec) {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VideoPlayer({ title, videoUrl, sessionId, programId, variant }) {
  const videoRef = useRef(null);
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [current,  setCurrent]  = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted,    setMuted]    = useState(false);
  const lastSave = useRef(0);

  const persist = (v) => {
    if (!sessionId || !v?.duration) return;
    saveWatchProgress(sessionId, {
      programId,
      currentTime: v.currentTime,
      duration: v.duration,
    });
  };

  // reset when url changes
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrent(0);
    setDuration(0);
    lastSave.current = 0;
  }, [videoUrl]);

  useEffect(() => () => persist(videoRef.current), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!videoUrl) return null;

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setCurrent(v.currentTime);
    setProgress((v.currentTime / v.duration) * 100);
    const now = Date.now();
    if (now - lastSave.current > 3000) {
      lastSave.current = now;
      persist(v);
    }
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    const saved = getResumeTime(sessionId);
    if (saved > 5 && saved < v.duration - 5) {
      v.currentTime = saved;
      setCurrent(saved);
      setProgress((saved / v.duration) * 100);
    }
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setProgress(pct * 100);
  };

  const skip = (sec) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else v.requestFullscreen?.();
  };

  const classroom = variant === "classroom";

  return (
    <div dir="ltr" style={{ background: classroom ? "#102431" : "#0d1b2e", borderRadius: classroom ? 12 : 16, overflow: "hidden" }}>
      <div className="relative w-full" style={{ aspectRatio: "16/9", background: classroom ? "#102431" : "#000" }}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "contain" }}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPause={() => persist(videoRef.current)}
          onEnded={() => {
            setPlaying(false);
            const v = videoRef.current;
            if (sessionId && v?.duration) {
              saveWatchProgress(sessionId, {
                programId,
                currentTime: v.duration,
                duration: v.duration,
              });
            }
          }}
          onClick={togglePlay}
          playsInline
        />

        {classroom && (
          <>
            <div className="absolute top-3 left-3 text-white/85 text-[11px] px-2 py-0.5 rounded pointer-events-none" style={{ background: "rgba(0,0,0,0.45)" }}>
              {duration ? `${fmtTime(current)} / ${fmtTime(duration)}` : "0:00 / 0:00"}
            </div>
            <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center pointer-events-none" style={{ background: "#36D5C4" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
          </>
        )}

        {!playing && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
            style={{ background: classroom ? "transparent" : "rgba(0,0,0,0.35)" }}
            onClick={togglePlay}
          >
            {classroom ? (
              <div className="w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: "rgba(54,213,196,0.25)" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#36D5C4" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="8 5 19 12 8 19"/></svg>
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition hover:scale-110" style={{ background: "#5AEACF" }}>
                  <IcoPlay />
                </div>
                {title && (
                  <p className="mt-3 text-white text-[13px] font-bold drop-shadow text-center px-4 select-none">{title}</p>
                )}
              </>
            )}
          </div>
        )}

        {classroom ? (
          <div className="absolute bottom-0 left-3 right-3 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.16)" }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "#36D5C4" }} />
          </div>
        ) : (playing || current > 0) && (
          <div className="absolute bottom-2 left-3 text-white/60 text-[11px] font-mono select-none pointer-events-none" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {fmtTime(current)} / {fmtTime(duration)}
          </div>
        )}
      </div>

      {!classroom && (
      <div className="px-4 pb-3 pt-2" style={{ background: "#0d1b2e" }}>
        <div className="relative w-full h-1.5 rounded-full mb-3 cursor-pointer" style={{ background: "rgba(255,255,255,0.15)" }} onClick={handleSeek}>
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "#5AEACF" }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#5AEACF] bg-white" style={{ left: `calc(${progress}% - 6px)`, pointerEvents: "none" }} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <a href={videoUrl} download className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white/80 hover:bg-white/10 transition shrink-0" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
            <IcoDownload /> تحميل
          </a>
          <div className="flex items-center gap-4">
            <button onClick={() => skip(-10)} className="text-white/60 hover:text-white transition"><IcoSkipB /></button>
            <button onClick={togglePlay} className="w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-110" style={{ background: "#5AEACF" }}>
              {playing ? <IcoPause /> : <IcoPlay />}
            </button>
            <button onClick={() => skip(10)} className="text-white/60 hover:text-white transition"><IcoSkipF /></button>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-white/50 text-[11px] font-mono hidden sm:inline">{fmtTime(current)} / {fmtTime(duration)}</span>
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition">
              {muted
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                    <line x1="23" y1="9" x2="17" y2="15"/>
                    <line x1="17" y1="9" x2="23" y2="15"/>
                  </svg>
                : <IcoVol />}
            </button>
            <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition"><IcoFullscr /></button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
