import { useState, useMemo, useEffect } from "react";
import { fetchMyFundingRequests } from "../../services/api";

// ── status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending: {
    label: "قيد المراجعة",
    color: "#f59e0b",
    bg: "#fef9ee",
    border: "#f59e0b40",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  approved: {
    label: "موافق عليه",
    color: "#22c55e",
    bg: "#f0fdf4",
    border: "#22c55e40",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  rejected: {
    label: "مرفوض",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#ef444440",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
};

// ── sort options ──────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value: "newest", label: "من الأحدث للأقدم" },
  { value: "oldest", label: "من الأقدم للأحدث" },
];

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoCreditCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#31AFEA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 15h2" />
      <path d="M11 15h4" />
    </svg>
  );
}
function IcoSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function IcoSort() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6"  x2="3.01" y2="6"  />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
function IcoChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ── sort dropdown ─────────────────────────────────────────────────────────────
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = SORT_OPTS.find(o => o.value === value);
  return (
    <div className="relative" dir="rtl">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-[11px] text-slate-600 font-medium hover:border-[#31AFEA] transition whitespace-nowrap">
        <IcoSort />
        {selected?.label}
        <IcoChevron />
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
          {SORT_OPTS.map(opt => (
            <button key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-right px-3 py-2 text-[11px] hover:bg-slate-50 transition
                ${value === opt.value ? "text-[#31AFEA] font-bold" : "text-slate-600"}`}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── request card ──────────────────────────────────────────────────────────────
function RequestCard({ req }) {
  const cfg = STATUS_CFG[req.status] ?? STATUS_CFG.pending;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
      style={{ boxShadow: "0 2px 8px rgba(8,15,52,0.05)" }}>

      {/* header row */}
      <div className="flex items-start justify-between gap-3">
        {/* status icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          {cfg.icon}
        </div>

        {/* program info */}
        <div className="flex-1 min-w-0 text-right">
          <p className="text-[13px] font-bold text-slate-800 leading-snug">{req.program}</p>
          {req.provider && req.provider !== "—" && (
            <p className="text-[11px] text-slate-400 mt-0.5">{req.provider}</p>
          )}
          <div className="flex items-center justify-end gap-3 mt-1 flex-wrap">
            {req.price > 0 && (
              <span className="text-[11px] font-bold" style={{ color: "#024677", direction: "ltr" }}>
                {req.price.toLocaleString("en-US")} ﷼
              </span>
            )}
            <span className="text-[11px] text-slate-400">
              تاريخ الإرسال: <span dir="ltr">{req.date}</span>
            </span>
          </div>
        </div>

        {/* status badge */}
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap"
          style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          {req.statusLabel || cfg.label}
        </span>
      </div>

      {/* body note */}
      {req.body && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-right">
          <p className="text-[11px] text-slate-400 mb-1">ملاحظتك:</p>
          <p className="text-[12px] text-slate-600 leading-relaxed">{req.body}</p>
        </div>
      )}

      {/* rejection reason */}
      {req.status === "rejected" && req.rejectReason && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-right">
          <p className="text-[11px] text-slate-400 mb-1">سبب الرفض:</p>
          <p className="text-[12px] text-slate-600 leading-relaxed">{req.rejectReason}</p>
          <div className="flex justify-end mt-2">
            <button
              className="px-4 py-1.5 rounded-xl text-[12px] font-bold text-white transition hover:opacity-90"
              style={{ background: "#024677" }}>
              اشتر بنفسك الآن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── filter tabs ───────────────────────────────────────────────────────────────
const FILTER_TABS = [
  { key: "all",      label: "الكل"          },
  { key: "approved", label: "تم الموافقة"   },
  { key: "rejected", label: "مرفوض"         },
  { key: "pending",  label: "قيد المراجعة"  },
];

// ── main ──────────────────────────────────────────────────────────────────────
export default function FinanceRequestPage() {
  const [search,    setSearch]    = useState("");
  const [sort,      setSort]      = useState("newest");
  const [activeTab, setActiveTab] = useState("all");
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetchMyFundingRequests({ per_page: 100 })
      .then(res => {
        const list = res?.data?.data ?? res?.data ?? [];
        setRequests(Array.isArray(list) ? list.map(r => ({
          id:           r.id,
          program:      r.program?.name ?? r.program_name ?? "—",
          provider:     r.program?.provider ?? "—",
          price:        parseFloat(r.program?.price_amount) || 0,
          date:         r.submitted_at ?? r.created_at?.split("T")[0] ?? "",
          reviewedAt:   r.reviewed_at ?? null,
          status:       r.status ?? "pending",
          statusLabel:  r.status_label ?? "قيد المراجعة",
          body:         r.body ?? "",
          rejectReason: r.reject_reason ?? null,
        })) : []);
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...requests];

    // status filter
    if (activeTab !== "all") list = list.filter(r => r.status === activeTab);

    // search
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(r => r.program.toLowerCase().includes(q));

    // sort
    list.sort((a, b) => sort === "oldest" ? a.id - b.id : b.id - a.id);

    return list;
  }, [requests, search, sort, activeTab]);

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="ltr">
      <div className="w-full px-4 sm:px-16 py-6" dir="rtl">

        {/* header */}
        <div className="flex items-center gap-2 mb-5">
          <IcoCreditCard />
          <h1 className="text-[18px] font-bold" style={{ color: "#31AFEA" }}>
            طلبات التمويل
          </h1>
        </div>

        {/* search + sort */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <IcoSearch />
            </span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في طلباتك..."
              className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-400 outline-none focus:border-[#31AFEA] transition text-right" />
          </div>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {/* filter tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap" dir="rtl">
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold transition"
              style={{
                background: activeTab === tab.key ? "#024677" : "transparent",
                color:      activeTab === tab.key ? "#fff"    : "#64748b",
                border:     activeTab === tab.key ? "none"    : "1px solid #e2e8f0",
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* list */}
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-[#31AFEA] animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-[13px]">
              لا توجد طلبات
            </div>
          ) : filtered.map(req => (
            <RequestCard key={req.id} req={req} />
          ))}
        </div>
      </div>
    </div>
  );
}
