import { useState, useEffect, useRef } from "react";
import { fetchMySessionDetail, fetchMySessions, fetchMyProgramDetail, sessionLooksCheckedIn } from "../../services/api";
import { sessionIsOver, visibleSessionVideo } from "../UserProgramSessionPage/sessionHelpers";
import {
  saveWatchProgress,
  getResumeTime,
  consumeAutoplaySession,
} from "../../services/watchProgress";

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>{d}</svg>
);

const IcoCheck    = () => <Ico size={14} stroke="#22c55e" sw={2.5} d={<polyline points="20 6 9 17 4 12"/>}/>;
const IcoStar     = () => <Ico size={14} stroke="#f59e0b" fill="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
const IcoDownload = () => <Ico size={13} stroke="#64748b" d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
const IcoRec      = () => <Ico size={14} stroke="#31AFEA" d={<><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.876v6.248a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></>}/>;
const IcoFile     = () => <Ico size={14} stroke="#31AFEA" d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}/>;
const IcoCal      = () => <Ico size={14} stroke="#64748b" d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
const IcoChevL    = () => <Ico size={14} stroke="#64748b" d={<polyline points="15 18 9 12 15 6"/>}/>;
const IcoPlay     = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="#0d1b2e" stroke="none" style={{ flexShrink: 0 }}>
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>
);
const IcoVideoFile = () => <Ico size={14} stroke="#31AFEA" d={<><rect x="2" y="6" width="13" height="12" rx="2"/><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.876v6.248a1 1 0 0 1-1.447.894L15 14"/></>}/>;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const arDateFmt = new Intl.DateTimeFormat("ar-SA", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});
function formatDate(iso) {
  if (!iso) return "";
  try { return arDateFmt.format(new Date(iso + "T00:00:00")); } catch { return iso; }
}

function fmtDuration(mins) {
  if (!mins && mins !== 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} د`;
  if (m === 0) return `${h}:00:00`;
  return `${h}:${String(m).padStart(2, "0")}:00`;
}

function fileIcon(kind, mime) {
  const k = (kind ?? "").toLowerCase();
  const m = (mime ?? "").toLowerCase();
  if (k === "video" || m.startsWith("video/")) return "video";
  if (k === "image" || m.startsWith("image/")) return "image";
  if (m.includes("pdf")) return "pdf";
  return "file";
}

function sameFileUrl(a, b) {
  if (!a || !b) return false;
  const na = String(a).split("?")[0];
  const nb = String(b).split("?")[0];
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}

function normalizeSessionFile(item) {
  if (!item) return null;
  if (typeof item === "string") {
    const name = decodeURIComponent(item.split("/").pop() || "ملف");
    return { id: item, name, kind: "file", size: null, url: item };
  }
  const url = item.url ?? item.path ?? item.file_url ?? item.full_url ?? null;
  return {
    id:   item.id,
    name: item.original_name ?? item.file_name ?? item.name ?? "ملف",
    kind: fileIcon(item.kind, item.mime ?? item.mime_type),
    size: item.size ? `${Math.round(item.size / 1024)} KB` : null,
    url,
  };
}

function collectSessionFiles(s) {
  if (!s) return [];
  const videoUrl = s.video_url ?? s.videoUrl ?? "";
  const out = [];
  const seen = new Set();

  const push = (raw) => {
    const f = normalizeSessionFile(raw);
    if (!f) return;
    if (f.url && videoUrl && sameFileUrl(f.url, videoUrl)) return;
    const key = String(f.id ?? f.url ?? f.name);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(f);
  };

  [s.attachments, s.attachment, s.files].forEach((bucket) => {
    if (Array.isArray(bucket)) bucket.forEach(push);
    else if (bucket) push(bucket);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 bg-slate-200 rounded-xl w-1/3"/>
      <div className="h-48 bg-slate-200 rounded-2xl"/>
      <div className="h-32 bg-slate-200 rounded-2xl"/>
      <div className="h-24 bg-slate-200 rounded-2xl"/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Video Player  — يحفظ موضع التشغيل في localStorage ويرجعه عند الفتح
// ─────────────────────────────────────────────────────────────────────────────
function VideoPlayer({ url, title, duration, sessionId, programId }) {
  const videoRef    = useRef(null);
  const wrapRef     = useRef(null);
  const saveTimer   = useRef(null);
  const hideTimer   = useRef(null);

  const [playing,   setPlaying]   = useState(false);
  const [current,   setCurrent]   = useState(0);
  const [total,     setTotal]     = useState(0);
  const [volume,    setVolume]    = useState(1);
  const [muted,     setMuted]     = useState(false);
  const [showCtrl,  setShowCtrl]  = useState(true);
  const [fullscr,   setFullscr]   = useState(false);
  const [native,    setNative]    = useState(() => consumeAutoplaySession(sessionId));
  const [resumed,   setResumed]   = useState(false);

  const cacheKey = sessionId
    ? `vid_pos_s${sessionId}`
    : (url ? `vid_pos_${url.slice(-40).replace(/\W/g, "_")}` : null);

  const fmt = (s) => {
    if (!s && s !== 0) return "0:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${m}:${String(sec).padStart(2,"0")}`;
  };

  const getSavedPos = () => {
    const fromStore = getResumeTime(sessionId);
    if (fromStore > 0) return fromStore;
    if (!cacheKey) return 0;
    try { return parseFloat(localStorage.getItem(cacheKey) ?? "0") || 0; }
    catch { return 0; }
  };

  const persistPos = (v) => {
    if (!v || !v.duration) return;
    if (sessionId) saveWatchProgress(sessionId, { programId, currentTime: v.currentTime, duration: v.duration });
    if (cacheKey && v.currentTime > 2) {
      try { localStorage.setItem(cacheKey, String(v.currentTime)); } catch {}
    }
  };

  const startSaving = () => {
    if (saveTimer.current) return;
    saveTimer.current = setInterval(() => persistPos(videoRef.current), 3000);
  };

  const stopSaving = () => {
    if (saveTimer.current) { clearInterval(saveTimer.current); saveTimer.current = null; }
  };

  useEffect(() => () => { persistPos(videoRef.current); stopSaving(); }, []); // eslint-disable-line

  // autoplay من "استكمل المشاهدة"
  useEffect(() => {
    if (!native || !url) return;
    const v = videoRef.current;
    if (!v) return;
    const tryPlay = () => v.play?.().catch(() => {});
    if (v.readyState >= 1) tryPlay();
    else v.addEventListener("loadedmetadata", tryPlay, { once: true });
  }, [native, url]);

  // hide controls بعد ثانيتين من السكون
  const showControls = () => {
    setShowCtrl(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowCtrl(false); }, 2500);
  };

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  // fullscreen change listener
  useEffect(() => {
    const handler = () => setFullscr(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  };

  const toggle = () => {
    if (!url) return;
    if (!native) { setNative(true); return; }
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play();
  };

  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !total) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * total;
  };

  const changeVolume = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    setMuted(val === 0);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    const next = !muted;
    setMuted(next);
    v.muted = next;
    if (!next && volume === 0) { setVolume(0.5); v.volume = 0.5; }
  };

  const onLoadedMetadata = (e) => {
    const v = e.target;
    setTotal(v.duration);
    const saved = getSavedPos();
    if (saved > 5 && saved < v.duration - 5) {
      v.currentTime = saved;
      setResumed(true);
      setTimeout(() => setResumed(false), 3000);
    }
  };

  const onTimeUpdate = (e) => setCurrent(e.target.currentTime);

  const pct = total > 0 ? (current / total) * 100 : 0;
  const displayDuration = total > 0 ? fmt(total) : (duration ?? "0:00");

  const savedPosDisplay = (() => {
    if (native) return null;
    const p = getSavedPos();
    return p > 5 ? fmt(p) : null;
  })();

  const VolumeIcon = () => {
    if (muted || volume === 0) return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
    );
    if (volume < 0.5) return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
    );
  };

  return (
    <div
      ref={wrapRef}
      className="rounded-xl overflow-hidden select-none"
      dir="ltr"
      style={{ background: "#0d1b2e", position: "relative" }}
      onMouseMove={native ? showControls : undefined}
      onMouseEnter={native ? showControls : undefined}
      onMouseLeave={() => { if (playing) setShowCtrl(false); }}
    >
      {/* ── screen ── */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        {native && url ? (
          <video
            ref={videoRef}
            src={url}
            className="w-full h-full object-contain"
            style={{ background: "#0d1b2e", cursor: showCtrl ? "default" : "none" }}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onPlay={() => { setPlaying(true); startSaving(); showControls(); }}
            onPause={() => { persistPos(videoRef.current); setPlaying(false); setShowCtrl(true); stopSaving(); }}
            onClick={toggle}
            onDoubleClick={toggleFullscreen}
            onEnded={() => {
              setPlaying(false); stopSaving(); setShowCtrl(true);
              const v = videoRef.current;
              if (sessionId && v?.duration) saveWatchProgress(sessionId, { programId, currentTime: v.duration, duration: v.duration });
              if (cacheKey) { try { localStorage.removeItem(cacheKey); } catch {} }
            }}
          />
        ) : (
          <>
            {url && (
              <video src={url} preload="metadata" muted playsInline
                className="absolute inset-0 w-full h-full"
                style={{ objectFit: "cover", pointerEvents: "none" }} />
            )}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 40%, rgba(0,0,0,0.72))" }} />
            <p className="absolute bottom-10 right-3 text-white text-[13px] font-bold drop-shadow leading-tight max-w-[60%] text-right">{title}</p>
            <p className="absolute bottom-10 left-3 text-white/60 text-[11px] font-mono">
              {savedPosDisplay ? <span style={{ color: "#5AEACF" }}>⏱ {savedPosDisplay}</span> : displayDuration}
            </p>
          </>
        )}

        {/* resumed toast */}
        {resumed && (
          <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-lg"
            style={{ background: "rgba(90,234,207,0.9)", color: "#0d1b2e" }}>
            ▶ استكمال من {fmt(current)}
          </div>
        )}

        {/* play button overlay — when paused or thumbnail */}
        {(!playing || !native) && (
          <button onClick={toggle}
            className="absolute inset-0 flex items-center justify-center group"
            aria-label="تشغيل الفيديو">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition group-hover:scale-110 shadow-lg"
              style={{ background: "#5AEACF" }}>
              <IcoPlay/>
            </div>
          </button>
        )}

        {/* ── hover controls overlay (شاهد-style) ── */}
        {native && (
          <div
            className="absolute inset-0 flex flex-col justify-end transition-opacity duration-300"
            style={{ opacity: showCtrl ? 1 : 0, pointerEvents: showCtrl ? "auto" : "none",
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)" }}
          >
            {/* title top */}
            <div className="absolute top-0 left-0 right-0 px-4 pt-3 pb-6"
              style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}>
              <p className="text-white text-sm font-bold truncate">{title}</p>
            </div>

            {/* bottom controls */}
            <div className="px-3 pb-3 space-y-1.5">
              {/* seek bar */}
              <div
                className="relative w-full group/seek cursor-pointer"
                style={{ height: 18, display: "flex", alignItems: "center" }}
                onClick={seek}
              >
                <div className="w-full rounded-full transition-all"
                  style={{ height: showCtrl ? 4 : 2, background: "rgba(255,255,255,0.25)" }}>
                  {/* buffered placeholder */}
                  <div className="h-full rounded-full" style={{ width: `${Math.min(pct + 15, 100)}%`, background: "rgba(255,255,255,0.2)" }} />
                  {/* played */}
                  <div className="h-full rounded-full -mt-full transition-all"
                    style={{ width: `${pct}%`, background: "#5AEACF", marginTop: "-100%" }} />
                </div>
                {/* thumb */}
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-md opacity-0 group-hover/seek:opacity-100 transition-opacity"
                  style={{ left: `calc(${pct}% - 7px)` }} />
              </div>

              {/* buttons row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* fullscreen */}
                  <button onClick={toggleFullscreen}
                    className="text-white/80 hover:text-white transition p-1 rounded"
                    title={fullscr ? "خروج من وضع ملء الشاشة" : "ملء الشاشة"}>
                    {fullscr ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
                        <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/>
                        <path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                      </svg>
                    )}
                  </button>

                  {/* download */}
                  {url && (
                    <a href={url} download
                      className="text-white/80 hover:text-white transition p-1 rounded"
                      title="تحميل">
                      <IcoDownload/>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* time */}
                  <span className="text-white/70 text-[11px] font-mono tabular-nums">
                    {fmt(current)} / {displayDuration}
                  </span>

                  {/* volume */}
                  <div className="flex items-center gap-1.5 group/vol">
                    <button onClick={toggleMute} className="text-white/80 hover:text-white transition p-1">
                      <VolumeIcon/>
                    </button>
                    <input
                      type="range" min="0" max="1" step="0.05"
                      value={muted ? 0 : volume}
                      onChange={changeVolume}
                      className="w-0 group-hover/vol:w-16 transition-all duration-200 accent-[#5AEACF] cursor-pointer"
                      style={{ height: 3 }}
                    />
                  </div>

                  {/* play/pause */}
                  <button onClick={toggle}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:scale-110 transition"
                    style={{ background: "#5AEACF" }}>
                    {playing ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                        <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#0d1b2e" stroke="none">
                        <polygon points="6 3 20 12 6 21 6 3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function UserSessionViewPage({ session: sessionProp, sessionId: sessionIdProp, onBack }) {
  const initialId = sessionProp?.rawId ?? sessionProp?.id ?? sessionIdProp ?? null;
  const [activeId, setActiveId] = useState(initialId);

  const [data,      setData]      = useState(null);
  const [siblings,  setSiblings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const playerWrapRef = useRef(null);

  useEffect(() => { setActiveId(initialId); }, [initialId]);

  useEffect(() => {
    if (!activeId) { setLoading(false); return; }
    setLoading(true);
    setError(null);

    Promise.all([
      fetchMySessionDetail(activeId),
      fetchMySessions({ filter: "all" }).catch(() => null),
    ])
      .then(async ([sessionRes, allRes]) => {
        const detail = sessionRes?.data ?? null;
        setData(detail);
        const all = allRes?.data?.sessions ?? [];
        const pid = detail?.program_id;
        const pickVideo = (raw) => raw?.video_url ?? raw?.videoUrl ?? raw?.video ?? raw?.recording_url ?? null;
        let mapped = all
          .filter(s => s.program_id === pid || !pid)
          .map((s, i) => ({
            id:       s.id ?? s.session_id,
            num:      s.session_number ?? i + 1,
            title:    s.session_title ?? s.title,
            date:     s.date,
            starts:   s.starts_at,
            ends:     s.ends_at,
            ends_at:  s.ends_at,
            type:     s.type,
            delivery_mode: s.delivery_mode ?? s.type?.delivery_mode,
            is_completed: s.is_completed,
            video_url: pickVideo(s),
            videoUrl: pickVideo(s),
            status:   computeSessionStatus(s),
          }));

        if (detail) {
          mapped = mapped.map(os =>
            String(os.id) === String(detail.id ?? detail.session_id)
              ? { ...os, videoUrl: pickVideo(detail) || os.videoUrl, video_url: pickVideo(detail) || os.video_url }
              : os
          );
        }

        if (pid) {
          try {
            const prog = await fetchMyProgramDetail(pid);
            const progSessions = prog?.data?.sessions ?? prog?.data?.program?.sessions ?? [];
            const byId = {};
            progSessions.forEach(ps => {
              const id = ps.id ?? ps.session_id;
              if (id == null) return;
              byId[String(id)] = {
                url: pickVideo(ps),
                title: ps.title ?? ps.session_title,
                date: ps.date,
                starts: ps.starts_at,
                ends: ps.ends_at,
                type: ps.type,
                delivery_mode: ps.delivery_mode ?? ps.type?.delivery_mode,
                is_completed: ps.is_completed,
              };
            });
            if (!mapped.length && progSessions.length) {
              mapped = progSessions.map((ps, i) => ({
                id:       ps.id ?? ps.session_id,
                num:      ps.session_number ?? i + 1,
                title:    ps.title ?? ps.session_title,
                date:     ps.date,
                starts:   ps.starts_at,
                ends:     ps.ends_at,
                ends_at:  ps.ends_at,
                type:     ps.type,
                delivery_mode: ps.delivery_mode ?? ps.type?.delivery_mode,
                is_completed: ps.is_completed,
                video_url: pickVideo(ps),
                videoUrl: pickVideo(ps),
                status:   computeSessionStatus(ps),
              }));
            } else {
              mapped = mapped.map(os => {
                const extra = byId[String(os.id)];
                const url = os.videoUrl || extra?.url || null;
                return extra || url
                  ? { ...os, ...(!os.title && extra?.title ? { title: extra.title } : {}), videoUrl: url, video_url: url }
                  : os;
              });
            }
          } catch { /* keep list videos */ }
        }

        const missing = mapped.filter(os => !os.videoUrl && os.id != null).slice(0, 8);
        if (missing.length) {
          const extras = await Promise.all(
            missing.map(os => fetchMySessionDetail(os.id).catch(() => null))
          );
          const extraById = {};
          extras.forEach((res, i) => {
            const url = pickVideo(res?.data);
            if (url) extraById[String(missing[i].id)] = url;
          });
          mapped = mapped.map(os => {
            const url = os.videoUrl || extraById[String(os.id)];
            return url ? { ...os, videoUrl: url, video_url: url } : os;
          });
        }

        setSiblings(mapped);
      })
      .catch(err => setError(err?.message || "حدث خطأ أثناء تحميل البيانات"))
      .finally(() => setLoading(false));
  }, [activeId]); // eslint-disable-line

  // ── derived ──────────────────────────────────────────────────────────────
  const s = data;

  const title       = s?.title       ?? sessionProp?.title       ?? sessionProp?.subtitle ?? "جلسة";
  const program     = s?.program_name ?? sessionProp?.title ?? "";
  const coachName   = s?.coach_name  ?? sessionProp?.trainer ?? "";
  const sessionNum  = s?.session_number ?? sessionProp?.sessionNum ?? "";
  const dateStr     = s?.date        ?? sessionProp?.date ?? "";
  const videoUrl    = (() => {
    const direct = s?.video_url ?? s?.videoUrl ?? s?.video ?? s?.recording_url ?? sessionProp?.videoUrl;
    if (typeof direct === "string" && direct) return direct;
    if (direct && typeof direct === "object") return direct.url ?? direct.path ?? null;
    const vidFile = collectSessionFiles(s).find(f =>
      f.kind === "video" || (f.url && /\.(mp4|webm|mov)(\?|$)/i.test(f.url))
    );
    return vidFile?.url ?? null;
  })();
  const sessionId   = activeId;

  const selectSibling = (os) => {
    const id = os?.id;
    if (id == null || String(id) === String(activeId)) return;
    setActiveId(id);
    playerWrapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const durationMin = s?.duration_minutes ?? null;
  const durationFmt = fmtDuration(durationMin);
  const checkIn     = s?.check_in;
  const isCheckedIn = sessionLooksCheckedIn(s, sessionId) ||
    checkIn?.status === 1 || checkIn?.status === 2 || checkIn?.status === "checked_in" || !!checkIn?.checked_in_at;
  const sessionEnded = sessionIsOver({
    ...sessionProp,
    ...s,
    date: s?.date ?? sessionProp?.date,
    ends_at: s?.ends_at ?? sessionProp?.timeTo ?? sessionProp?.ends_at,
    timeTo: s?.ends_at ?? sessionProp?.timeTo,
  }) || sessionProp?.status === "completed" || sessionProp?.status === "ended";

  // جلسة مسجلة (recorded) → الفيديو متاح دايماً بغض النظر عن الوقت
  const sessionTypeRaw = s?.type ?? sessionProp?.type;
  const isRecorded = (() => {
    if (!sessionTypeRaw && sessionTypeRaw !== 0) return false;
    if (typeof sessionTypeRaw === "object") return sessionTypeRaw?.value === 1 || sessionTypeRaw?.text === "recorded";
    return Number(sessionTypeRaw) === 1 || String(sessionTypeRaw).toLowerCase() === "recorded";
  })();
  const canShowVideo = sessionEnded || isRecorded;

  const files = collectSessionFiles(s);

  // ── sibling status helper ─────────────────────────────────────────────────
  function computeSessionStatus(s) {
    if (s.is_completed) return "completed";
    const today = new Date();
    const sd = new Date((s.date ?? "") + "T00:00:00");
    const td = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const sdDate = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate());
    if (sdDate.getTime() === td.getTime()) return "today";
    if (sdDate < td) return "ended";
    return "upcoming";
  }

  // ── status config ─────────────────────────────────────────────────────────
  const STATUS_CFG = {
    completed: { label: "مكتملة", color: "#22c55e", bg: "#f0fdf4", border: "#22c55e30" },
    today:     { label: "اليوم",  color: "#f59e0b", bg: "#fef9ee", border: "#f59e0b30" },
    upcoming:  { label: "قادمة",  color: "#31AFEA", bg: "#EBF7FF", border: "#31AFEA30" },
    ended:     { label: "انتهت",  color: "#94a3b8", bg: "#f8fafc", border: "#94a3b830" },
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0 w-full" dir="ltr">
      <div
        className="w-full px-3 sm:px-5 lg:px-8 py-4 sm:py-6"
        style={{ maxWidth: "100%", minHeight: "100%" }}
        dir="rtl"
      >
        {/* ── breadcrumb / header card ── */}
        <div
          className="rounded-2xl bg-white border border-slate-100 px-4 sm:px-6 py-4 mb-3 mx-auto"
          style={{ maxWidth: 900, boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
        >
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 text-[12px] font-semibold hover:underline transition"
              style={{ color: "#31AFEA" }}
            >
              <IcoChevL/> {program || "الجلسات"}
            </button>
            {sessionNum && (
              <>
                <span className="text-slate-300 text-[12px]">›</span>
                <span className="text-[12px] text-slate-400">الجلسة {sessionNum}</span>
              </>
            )}
          </div>

          {/* title + status */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-800 leading-tight">{title}</h1>
            <span
              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
              style={sessionEnded
                ? { color: "#22c55e", background: "#f0fdf4", border: "1px solid #22c55e30" }
                : { color: "#f59e0b", background: "#fef9ee", border: "1px solid #f59e0b30" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: sessionEnded ? "#22c55e" : "#f59e0b" }}/>
              {sessionEnded ? "مكتملة" : "جارية"}
            </span>
          </div>
        </div>

        {/* ── centered gray content area ── */}
        <div
          className="mx-auto rounded-2xl px-3 sm:px-5 lg:px-8 py-4 sm:py-6"
          style={{ maxWidth: 900, background: "#F2F5F8" }}
        >
          {loading && !data && <Skeleton/>}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-sm text-center">
              {error}
            </div>
          )}

          {data && !error && (
            <div className="space-y-3">

              {/* ── attendance + rate row ── */}
              <div
                className="rounded-2xl bg-white px-4 sm:px-5 py-3 flex items-center justify-between flex-wrap gap-2"
                style={{ boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
              >
                <div className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
                  <IcoCheck/>
                  {isCheckedIn
                    ? "تم تسجيل حضورك بنجاح"
                    : (typeof checkIn?.status_label === "object"
                        ? (checkIn.status_label?.text ?? checkIn.status_label?.value ?? "لم يتم تسجيل الحضور")
                        : (checkIn?.status_label ?? "لم يتم تسجيل الحضور"))}
                </div>
                <button
                  className="inline-flex items-center gap-1.5 text-[12px] sm:text-[13px] font-bold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                >
                  <IcoStar/> تقييم الجلسة
                </button>
              </div>

              {/* ── video card — recording only after the session ends ── */}
              <div
                className="rounded-2xl bg-white px-4 sm:px-5 py-4"
                style={{ boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
              >
                <div className="flex justify-start mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold"
                    style={{ color: sessionEnded ? "#31AFEA" : "#94a3b8" }}
                  >
                    <IcoRec/> تسجيل الجلسة
                  </span>
                </div>

                {canShowVideo && videoUrl ? (
                  <div ref={playerWrapRef} style={{ borderRadius: 12, overflow: "hidden" }}>
                    <VideoPlayer
                      key={s?.id ?? videoUrl}
                      url={videoUrl}
                      title={title}
                      duration={durationFmt}
                      sessionId={s?.id ?? sessionId}
                      programId={s?.program_id}
                    />
                  </div>
                ) : (
                  <div
                    className="rounded-xl px-4 py-8 text-center text-[13px] text-slate-500"
                    style={{ background: "#F2F5F8" }}
                  >
                    {canShowVideo
                      ? "لا يوجد تسجيل فيديو لهذه الجلسة"
                      : "سيظهر تسجيل الجلسة هنا بعد انتهائها"}
                  </div>
                )}
              </div>

              {/* ── ماذا تعلمنا ── */}
              {s?.objectives && s.objectives.length > 0 && (
                <div
                  className="rounded-2xl bg-white px-4 sm:px-5 py-4 sm:py-5"
                  style={{ boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
                >
                  <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800 text-right mb-3">
                    ماذا تعلمنا
                  </h3>
                  <ol className="space-y-2.5" dir="rtl">
                    {s.objectives.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 mt-0.5"
                          style={{ background: "#EBF7FF", color: "#31AFEA" }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[13px] sm:text-[14px] text-slate-600 flex-1 leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* ── ملفات الجلسة ── */}
              {files.length > 0 && (
                <div
                  className="rounded-2xl bg-white px-4 sm:px-5 py-4 sm:py-5"
                  style={{ boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800">ملفات الجلسة</h3>
                    <button className="text-slate-400 hover:text-slate-600 transition shrink-0">
                      <IcoDownload/>
                    </button>
                  </div>

                  <div className="space-y-2" dir="rtl">
                    {files.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl flex-wrap"
                        style={{ background: "#F2F5F8" }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                            style={{ background: "#EBF7FF" }}
                          >
                            {f.kind === "video" ? <IcoVideoFile/> : <IcoFile/>}
                          </div>
                          <span className="text-[13px] sm:text-[14px] font-semibold text-slate-700 break-all leading-snug">
                            {f.name}
                          </span>
                        </div>
                        {f.url ? (
                          <a
                            href={f.url}
                            download
                            className="inline-flex items-center gap-1 text-[12px] sm:text-[13px] font-bold text-slate-500 hover:text-slate-700 transition shrink-0"
                          >
                            <IcoDownload/> {f.size ?? "تحميل"}
                          </a>
                        ) : (
                          <span className="text-[12px] text-slate-400 shrink-0">{f.size}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ملخص المحاضرة ── */}
              {s?.description && (
                <div
                  className="rounded-2xl bg-white px-4 sm:px-5 py-4 sm:py-5"
                  style={{ boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
                >
                  <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                    <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800">ملخص المحاضرة</h3>
                    <span
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0"
                      style={{ color: "#31AFEA", background: "#EBF7FF", border: "1px solid #31AFEA30" }}
                    >
                      ملف الملخص
                    </span>
                  </div>
                  <p className="text-[13px] sm:text-[14px] text-slate-600 leading-relaxed text-right">
                    {s.description}
                  </p>
                </div>
              )}

              {/* ── جلسات أخرى من نفس البرنامج ── */}
              <div
                className="rounded-2xl bg-white px-4 sm:px-5 py-4 sm:py-5"
                style={{ boxShadow: "0 1px 4px rgba(8,15,52,0.06)" }}
              >
                <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                  <h3 className="text-[15px] sm:text-[16px] font-extrabold text-slate-800">
                    جلسات أخرى من نفس البرنامج
                  </h3>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "#F2F5F8" }}
                  >
                    <IcoCal/>
                  </div>
                </div>

                {siblings.length === 0 ? (
                  <p className="text-[13px] text-slate-400 text-center py-4">لا توجد جلسات أخرى</p>
                ) : (
                  <div className="space-y-2" dir="rtl">
                    {siblings.map(os => {
                      const sc = STATUS_CFG[os.status] ?? STATUS_CFG.upcoming;
                      const displayDate = os.date ? formatDate(os.date) : "";
                      const timeStr = os.starts ? os.starts : "";
                      const isActive = String(os.id) === String(activeId);
                      const thumbUrl = os.videoUrl || visibleSessionVideo(os);
                      return (
                        <button
                          type="button"
                          key={os.id}
                          onClick={() => selectSibling(os)}
                          className="w-full text-right flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border transition cursor-pointer flex-wrap"
                          style={{
                            borderColor: isActive ? "#31AFEA" : "#f1f5f9",
                            background:  isActive ? "#EBF7FF" : "#fff",
                          }}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {thumbUrl && (
                              <div
                                className="relative shrink-0 rounded-lg overflow-hidden"
                                style={{ width: 48, height: 36, background: "#0d1b2e" }}
                              >
                                <video
                                  src={thumbUrl}
                                  preload="metadata"
                                  muted
                                  playsInline
                                  className="absolute inset-0 w-full h-full"
                                  style={{ objectFit: "cover", pointerEvents: "none" }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center"
                                  style={{ background: "rgba(0,0,0,0.28)" }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff" stroke="none">
                                    <polygon points="6 3 20 12 6 21 6 3"/>
                                  </svg>
                                </div>
                              </div>
                            )}
                            <div className="text-right min-w-0">
                              <p className="text-[13px] font-bold text-slate-800 break-words leading-snug">
                                {os.title}
                              </p>
                              {(displayDate || timeStr) && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {displayDate}{displayDate && timeStr ? "، " : ""}{timeStr}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* status badge */}
                          <span
                            className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
                            style={{
                              color: sc.color,
                              background: sc.bg,
                              border: `1px solid ${sc.border}`,
                            }}
                          >
                            {sc.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
