import { IcoRefresh } from "./icons";
import { getWatchProgress } from "../../../services/watchProgress";
import { isOnlineSession, sessionIsOver, visibleSessionVideo } from "./sessionHelpers";

const IcoLink = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
);
const IcoPlayMini = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="6 3 20 12 6 21 6 3"/>
  </svg>
);
const IcoLockMini = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function sessionMeetingUrl(s) {
  return s?.meeting_url || s?.url || null;
}

export function sessionWasWatched(s) {
  const sid = s?.sessionId ?? s?.id;
  const local = getWatchProgress(sid);
  if (local && Number(local.percent) > 0) return true;
  const pct = Number(s?.progress ?? s?.progress_percent ?? 0);
  return pct > 0;
}

/**
 * join     → أونلاين + فيه لينك + لسه ما خلصتش
 * watch    → فيه فيديو متاح ومش اتفرج عليه
 * rewatch  → فيه فيديو ومتفرّج عليه قبل كده
 * locked   → فيه فيديو بس مش مشترك
 */
export function resolveSessionAction(s, { isEnrolled = true, lockedVideo = false } = {}) {
  if (!isEnrolled && lockedVideo) {
    return { key: "locked", label: "اشترك للمشاهدة", variant: "locked", Icon: IcoLockMini };
  }

  const meeting = sessionMeetingUrl(s);
  const ended = sessionIsOver(s);
  const video = isEnrolled ? visibleSessionVideo(s) : null;

  if (isEnrolled && isOnlineSession(s) && meeting && !ended && s?.can_check_in !== false) {
    return { key: "join", label: "دخول الجلسة", variant: "navy", Icon: IcoLink };
  }
  if (video) {
    if (sessionWasWatched(s)) {
      return { key: "rewatch", label: "إعادة المشاهدة", variant: "outline", Icon: IcoRefresh };
    }
    return { key: "watch", label: "شاهد الفيديو", variant: "blue", Icon: IcoPlayMini };
  }
  return null;
}

const STYLES = {
  navy:    { bg: "#024677", color: "#fff",    border: "transparent" },
  blue:    { bg: "#31AFEA", color: "#fff",    border: "transparent" },
  outline: { bg: "#fff",    color: "#334155", border: "#cbd5e1" },
  locked:  { bg: "#64748b", color: "#fff",    border: "transparent" },
};

export default function SessionActionButton({
  s,
  busy,
  isEnrolled = true,
  lockedVideo = false,
  onJoin,
  onWatch,
  onRewatch,
  onAskEnroll,
}) {
  const action = resolveSessionAction(s, { isEnrolled, lockedVideo });
  if (!action) return null;

  const onClick = () => {
    if (action.key === "locked") onAskEnroll?.(s);
    else if (action.key === "join") onJoin?.(s);
    else if (action.key === "rewatch") (onRewatch ?? onWatch)?.(s);
    else onWatch?.(s);
  };

  const style = STYLES[action.variant] ?? STYLES.outline;
  const Icon = action.Icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-[138px] inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-bold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {busy ? (
        <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 2a10 10 0 0 1 10 10"/>
        </svg>
      ) : (
        <Icon />
      )}
      {busy ? "جارِ..." : action.label}
    </button>
  );
}
