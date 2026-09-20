/** Session / program content type: 0 Zoom, 1 recorded, 2 offline. */
export const SESSION_TYPE_TO_INT = { zoom: 0, recorded: 1, offline: 2 };

export function sessionTypeToInt(type) {
  if (type && typeof type === "object") {
    return sessionTypeToInt(type.value ?? type.delivery_mode ?? type.key);
  }
  if (type === 1 || type === "1" || type === "recorded") return 1;
  if (type === 2 || type === "2" || type === "offline") return 2;
  if (type === 0 || type === "0" || type === "zoom" || type === "online" || type === "interactive") return 0;
  return SESSION_TYPE_TO_INT[type] ?? 0;
}

/** Recorded sessions keep a date but have no live start/end times. */
export function isRecordedSession(type) {
  return sessionTypeToInt(type) === 1;
}

/** Live/online/offline sessions need start/end times. Recorded does not. */
export function sessionNeedsSchedule(type) {
  return !isRecordedSession(type);
}

/** Badge / filter key: online | recorded | offline | mixed */
export function sessionTypeUiKey(type) {
  const text = String(
    typeof type === "object" ? (type?.text ?? type?.delivery_mode ?? "") : (type ?? "")
  ).toLowerCase();
  if (text.includes("مختلط") || text.includes("mixed")) return "mixed";
  if (text.includes("مسج") || text.includes("record")) return "recorded";
  if (text.includes("حضور") || text.includes("offline")) return "offline";
  const n = sessionTypeToInt(type);
  if (n === 1) return "recorded";
  if (n === 2) return "offline";
  return "online";
}

export function contentTypeUiKey(value) {
  if (value == null || value === "") return "";
  if (value === "recorded" || value === "offline" || value === "interactive") return value;
  const n = Number(value);
  if (n === 1) return "recorded";
  if (n === 2) return "offline";
  if (n === 0) return "interactive";
  return "";
}
