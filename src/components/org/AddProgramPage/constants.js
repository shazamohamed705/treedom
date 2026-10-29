import { SESSION_TYPE_TO_INT } from "../../../services/sessionType";

// ── type map ──────────────────────────────────────────────────────────────────
export const TYPE_TO_INT = SESSION_TYPE_TO_INT;

// ── CSS ───────────────────────────────────────────────────────────────────────
export const INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right";

export const SESSION_INPUT_CLS =
  "w-full border border-slate-200 rounded-xl px-4 py-3 text-sm " +
  "focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right";

// ── session type options ──────────────────────────────────────────────────────
export const SESSION_TYPE_OPTIONS = [
  { value: "zoom",     label: "بث تفاعلي (zoom)",  sub: "جلسة حية"             },
  { value: "offline",  label: "حضوري (Offline)",    sub: "حضور فعلي داخل المقر" },
  { value: "recorded", label: "مسجلة",              sub: "يتم رفع فيديو الجلسة" },
];

// ── draft storage key ─────────────────────────────────────────────────────────
export const DRAFT_KEY = "addProgramDraft";

// ── default form ──────────────────────────────────────────────────────────────
export const DEFAULT_FORM = {
  name: "", desc: "",
  coachId: "", coachName: "", coachAvatar: "",
  backupCoachId: "", backupCoachName: "",
  categoryId: "", categoryName: "",
  totalSessions: "12", hours: "36",
  startDate: "", endDate: "",
  registrationDeadline: "",
  price: "", currency: "SAR",
  maxCapacity: "",
  recurrence: "weekly",
  weekDays: [],
  sessionTime: "",
  sessionDuration: "60",
  excludedDates: [],
  tags: [],
  coverImage: null,
  attachments: [],
};
