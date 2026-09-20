import { useState, useEffect } from "react";
import { fetchCompanyMyRequests } from "../services/api";

// ─── colours ──────────────────────────────────────────────────────────────────
const DARK  = "#00527F";
const BLUE  = "#169CF5";
const BORD  = "#E5EDF1";
const TEXT  = "#333333";
const SUB   = "#A0AAB2";
const GREEN = "#20A86B";
const WHITE = "#FFFFFF";
const RED   = "#E95E63";
const TEAL  = "#45D8C8";

// ─── icons ────────────────────────────────────────────────────────────────────
const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none", style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke={stroke} strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block", flexShrink: 0, ...style }}>{d}</svg>
);
const IcoSearch  = (p) => <I {...p} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoFilter  = (p) => <I {...p} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoChev    = (p) => <I {...p} d={<polyline points="15 18 9 12 15 6"/>} />;
const IcoList    = (p) => <I {...p} d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>} />;

// ─── status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  invoiced: { label: "تم إصدار الفاتورة", color: GREEN,  bg: "#E6F9F2" },
  pending:  { label: "قيد المراجعة",      color: SUB,    bg: "#F4F7F9" },
  approved: { label: "تمت الموافقة",      color: BLUE,   bg: "#E4F4FE" },
  rejected: { label: "مرفوض",            color: RED,    bg: "#FDEAEA" },
  paid:     { label: "مدفوع",            color: GREEN,  bg: "#E6F9F2" },
};

function getStatus(s) {
  // API may return status as an object { value, text } or { value, label }
  const key = (s != null && typeof s === "object") ? (s.value ?? s.text ?? s.label ?? "") : s;
  return STATUS_CFG[key] ?? { label: (typeof key === "string" ? key : null) ?? "—", color: SUB, bg: "#F4F7F9" };
}

// ─── badge ────────────────────────────────────────────────────────────────────
function Badge({ label, color, bg }) {
  return (
    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap"
      style={{ color, background: bg, border: `1px solid ${color}33` }}>
      {label}
    </span>
  );
}

// ─── skeleton rows ────────────────────────────────────────────────────────────
function Sk({ w = "w-24", h = "h-3" }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${w} ${h}`} />;
}
function SkRow({ cols }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <Sk w={i === 0 ? "w-36" : "w-20"} />
        </td>
      ))}
    </tr>
  );
}

// ─── program bookings table ───────────────────────────────────────────────────
const BOOKING_COLS = ["البرنامج", "مقدم من", "المتدربين", "الإجمالي", "تاريخ الطلب", "الحالة", "رقم الفاتورة"];

function BookingsTable({ rows, loading }) {
  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${BORD}` }}>
      <table className="w-full text-right" style={{ minWidth: 700, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#F6F8FA", borderBottom: `1.5px solid ${BORD}` }}>
            {BOOKING_COLS.map((h, i) => (
              <th key={i} className="px-4 py-3 text-xs font-bold whitespace-nowrap" style={{ color: DARK }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkRow key={i} cols={7} />)
            : rows.length === 0
              ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm" style={{ color: SUB }}>
                    لا توجد طلبات حجز
                  </td>
                </tr>
              )
              : rows.map((r, i) => {
                const st = getStatus(r.status);
                return (
                  <tr key={`${r.type}-${r.id}`}
                    style={{ background: i % 2 === 0 ? WHITE : "#F8FBFD", borderBottom: `1px solid ${BORD}` }}>
                    <td className="px-4 py-3 text-sm font-semibold" style={{ color: DARK }}>{r.program_name ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: TEXT }}>{r.provider ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-center" style={{ color: TEXT }}>{r.trainees_count ?? "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: DARK }}>
                      {(() => { const amt = typeof r.total_amount === "object" ? null : r.total_amount; return amt != null ? `${Number(amt).toLocaleString("en-US")} ر.س` : "—"; })()}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: SUB }}>{r.created_at ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge label={st.label} color={st.color} bg={st.bg} />
                    </td>
                    <td className="px-4 py-3 text-xs" dir="ltr" style={{ color: r.invoice_num && typeof r.invoice_num !== "object" ? BLUE : SUB }}>
                      {(() => {
                        const extractInvNum = (raw) => {
                          if (raw == null) return "—";
                          if (typeof raw !== "object") return String(raw);
                          const inner = raw.invoice_num;
                          if (inner != null && typeof inner !== "object") return String(inner);
                          if (raw.id != null && typeof raw.id !== "object") return String(raw.id);
                          if (inner != null) return extractInvNum(inner);
                          return "—";
                        };
                        return extractInvNum(r.invoice_num);
                      })()}
                    </td>
                  </tr>
                );
              })
          }
        </tbody>
      </table>
    </div>
  );
}

// ─── filter pills ─────────────────────────────────────────────────────────────
const TABS = [
  { key: "bookings", label: "حجوزات البرامج" },
];

// ─── main page ────────────────────────────────────────────────────────────────
export default function NegotiationRequestsPage() {
  const [search,  setSearch]   = useState("");
  const [filter,  setFilter]   = useState("all");
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState(null);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchCompanyMyRequests()
      .then(res => {
        const d = res?.data ?? {};
        setBookings(d.program_bookings ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // client-side search + status filter
  const filterBookings = bookings.filter(r => {
    const q = search.trim().toLowerCase();
    if (q && !r.program_name?.toLowerCase().includes(q) && !r.provider?.toLowerCase().includes(q)) return false;
    if (filter !== "all" && r.status !== filter) return false;
    return true;
  });

  const activeRows = filterBookings;

  const STATUS_PILLS = [
    { key: "all",      label: "الكل"               },
    { key: "invoiced", label: "تم إصدار الفاتورة"  },
    { key: "pending",  label: "قيد المراجعة"        },
    { key: "approved", label: "تمت الموافقة"         },
    { key: "rejected", label: "مرفوض"               },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-white" dir="rtl">

      {/* ── header ───────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-5 pb-0 shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <IcoList size={18} stroke={TEAL} />
          <h1 className="text-lg font-extrabold" style={{ color: DARK }}>طلاباتي</h1>
        </div>

        {/* section tabs */}
        <div className="flex items-center border-b" style={{ borderColor: BORD }}>
          {TABS.map(t => (
            <button key={t.key}
              className="px-4 pb-3 text-sm font-bold transition-colors relative whitespace-nowrap"
              style={{ color: DARK }}>
              {t.label}
              <span className="absolute bottom-0 right-0 left-0 h-0.5 rounded-full" style={{ background: DARK }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── toolbar ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* status pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_PILLS.map(p => (
              <button key={p.key} onClick={() => setFilter(p.key)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap"
                style={filter === p.key
                  ? { background: DARK,  color: WHITE, border: `1px solid ${DARK}` }
                  : { background: WHITE, color: SUB,   border: `1px solid ${BORD}` }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* search + total */}
          <div className="flex items-center gap-3">
            {!loading && (
              <span className="text-xs" style={{ color: SUB }}>
                إجمالي {activeRows.length} طلب
              </span>
            )}
            <div className="relative">
              <IcoSearch size={13} stroke={SUB}
                style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="بحث..."
                className="pr-7 pl-3 py-1.5 rounded-lg text-xs transition"
                style={{ border: `1px solid ${BORD}`, outline: "none", color: TEXT, width: 160, background: WHITE }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── content ──────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-6">
        {error ? (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <p className="text-sm" style={{ color: RED }}>{error}</p>
            <button
              onClick={() => { setLoading(true); setError(null); fetchCompanyMyRequests().then(res => { const d = res?.data ?? {}; setBookings(d.program_bookings ?? []); }).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: DARK }}>
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <BookingsTable rows={filterBookings} loading={loading} />
        )}
      </div>

    </div>
  );
}
