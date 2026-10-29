import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
const InvoiceDetailPage = lazy(() => import("../org/InvoiceDetailPage"));
import { fetchMyInvoices } from "../../services/api";
function SAR({ size = 12, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39"
      width={size} height={size + 1} aria-label="Saudi Riyal"
      style={{ display:"inline-block", verticalAlign:"middle", marginLeft:2 }}>
      <path fill={color} d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill={color} d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 15, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoWallet  = () => <Ico size={20} stroke="#31AFEA" d={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M2 10h20"/></>}/>;
const IcoSearch  = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoSort    = () => <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;
const IcoChevD   = () => <Ico size={12} d={<polyline points="6 9 12 15 18 9"/>}/>;
const IcoChevR   = () => <Ico size={12} d={<polyline points="9 18 15 12 9 6"/>}/>;
const IcoRefresh = () => <Ico size={16} stroke="#f59e0b" d={<><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>}/>;
const IcoCheck   = () => <Ico size={16} stroke="#22c55e" d={<polyline points="20 6 9 17 4 12"/>}/>;
const IcoUser    = () => <Ico size={14} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>;
const IcoBuild   = () => <Ico size={14} d={<><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>}/>;

// ── status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  paid:       { label:"مدفوعة",              color:"#22c55e", dot:"#22c55e"  },
  refunded:   { label:"مُسترد",              color:"#ef4444", dot:"#ef4444"  },
  deposit:    { label:"عربون مدفوع",         color:"#31AFEA", dot:"#31AFEA"  },
  pending:    { label:"معلقة",               color:"#f59e0b", dot:"#f59e0b"  },
  cancelled:  { label:"ملغاة",               color:"#94a3b8", dot:"#94a3b8"  },
  refunding:  { label:"في انتظار الاسترداد", color:"#f59e0b", dot:"#f59e0b"  },
};

// ── amount with SAR ───────────────────────────────────────────────────────────
function Amount({ value, color = "#1e293b", size = 13 }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-bold" style={{ color, fontSize:size }}>
      {value.toLocaleString("ar-SA")}
      <SAR size={size - 1} color={color}/>
    </span>
  );
}

// ── date helper: "2026-09-06 14:49" → "6 سبتمبر 2026" ─────────────────────────
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
function prettyDate(s) {
  const m = String(s ?? "").match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return s ?? "—";
  return `${parseInt(m[3], 10)} ${MONTHS_AR[parseInt(m[2], 10) - 1] ?? ""} ${m[1]}`;
}

// ── sort dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value:"newest",  label:"من الأحدث للأقدم" },
  { value:"oldest",  label:"من الأقدم للأحدث" },
  { value:"amount",  label:"الأعلى مبلغاً"     },
];
function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = SORT_OPTS.find(o => o.value === value);
  return (
    <div className="relative" dir="rtl">
      <button onClick={() => setOpen(o=>!o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 font-medium hover:border-[#31AFEA] transition whitespace-nowrap">
        <IcoSort/>{sel?.label}<IcoChevD/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
          {SORT_OPTS.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
              className={`w-full text-right px-3 py-2 text-[11px] hover:bg-slate-50 transition ${value===o.value?"text-[#31AFEA] font-bold":"text-slate-600"}`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const [search,     setSearch]     = useState("");
  const [sort,       setSort]       = useState("newest");
  const [tab,        setTab]        = useState("all"); // all | personal | company
  const [viewInvoice, setViewInvoice] = useState(null); // invoice row or null
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);

  // ── load real payments from the API ──
  useEffect(() => {
    let on = true;
    fetchMyInvoices()
      .then(res => {
        if (!on) return;
        const list = res?.data?.invoices ?? [];
        setItems(list.map(inv => {
          const rawLabel  = inv.status_label ?? "";
          const label     = (typeof rawLabel === "object" ? (rawLabel.text ?? rawLabel.value ?? "") : rawLabel).toLowerCase().trim();
          const statusKey = label === "paid" ? "paid"
                          : STATUS_CFG[label] ? label
                          : (inv.status === 1 ? "paid" : "pending");
          return {
            id:      inv.id,
            date:    prettyDate(inv.paid_at ?? inv.created_at),
            program: inv.program?.name ?? "—",
            inv: (() => {
                       const extractInvNum = (raw) => {
                         if (raw == null) return "—";
                         if (typeof raw !== "object") return String(raw);
                         const inner = raw.invoice_num;
                         if (inner != null && typeof inner !== "object") return String(inner);
                         if (raw.id != null && typeof raw.id !== "object") return String(raw.id);
                         if (inner != null) return extractInvNum(inner);
                         return "—";
                       };
                       return extractInvNum(inv.invoice_num);
                     })(),
            amount:  parseFloat(
                       typeof inv.total_amount === "object"
                         ? (inv.total_amount?.total_amount ?? inv.total_amount?.id ?? 0)
                         : inv.total_amount
                     ) || 0,
            from:    "شخصي",
            status:  statusKey,
          };
        }));
      })
      .catch(() => { if (on) setItems([]); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, []);

  const list = useMemo(() => {
    let r = [...items];
    if (tab === "personal") r = r.filter(x => x.from === "شخصي");
    if (tab === "company")  r = r.filter(x => x.from === "شركة");
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(x => x.program.toLowerCase().includes(q) || x.inv.toLowerCase().includes(q));
    }
    if (sort === "oldest") r.sort((a,b) => a.id - b.id);
    if (sort === "amount") r.sort((a,b) => b.amount - a.amount);
    return r;
  }, [search, sort, tab, items]);

  const paidInvoices  = items.filter(x => x.status === "paid");
  const totalPaid     = paidInvoices.reduce((s,x) => s + x.amount, 0);
  const activeDeposit = items.filter(x => x.status === "deposit").length;
  const pendingCount  = items.filter(x => x.status === "refunding").length;

  // ── show invoice detail ──
  if (viewInvoice) {
    return (
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center h-full">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#024677] animate-spin" />
        </div>
      }>
        <InvoiceDetailPage
          invoice={viewInvoice}
          onBack={() => setViewInvoice(null)}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="ltr">
      <div className="w-full px-6 py-6" dir="rtl">

        {/* ── header ── */}
        <div className="flex items-center justify-start gap-2 mb-5">
          <IcoWallet/>
          <h1 className="text-[18px] font-bold" style={{ color:"#31AFEA" }}>المدفوعات و الفواتير</h1>
        </div>

        {/* ── summary cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* total */}
          <div className="rounded-2xl border border-slate-200 px-5 py-4 text-right" dir="rtl" style={{ boxShadow:"0 2px 10px rgba(8,15,52,0.05)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400"><IcoCheck/></span>
              <span className="text-[11px] text-slate-400">إجمالي المدفوعات</span>
            </div>
            <Amount value={totalPaid} color="#024677" size={20}/>
            <p className="text-[10px] text-slate-400 mt-1">{paidInvoices.length} فاتورة مدفوعة</p>
          </div>
          {/* deposit */}
          <div className="rounded-2xl border border-slate-200 px-5 py-4 text-right" dir="rtl" style={{ boxShadow:"0 2px 10px rgba(8,15,52,0.05)" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400"><IcoCheck/></span>
              <span className="text-[11px] text-slate-400">عرابين نشطة</span>
            </div>
            <p className="text-[20px] font-extrabold" style={{ color:"#31AFEA" }}>
              {activeDeposit} <span className="text-[14px]">عربون</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">في انتظار اكتمال العدد حتى 13 ديسمبر</p>
          </div>
          {/* pending refund */}
          <div className="rounded-2xl border border-slate-200 px-5 py-4 text-right" dir="rtl" style={{ boxShadow:"0 2px 10px rgba(8,15,52,0.05)" }}>
            <div className="flex items-center justify-between mb-1">
              <span><IcoRefresh/></span>
              <span className="text-[11px] text-slate-400">مساردات قيد المعالجة</span>
            </div>
            <p className="text-[20px] font-extrabold" style={{ color:"#f59e0b" }}>
              {pendingCount} <span className="text-[14px]">مبلغ</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">تحقق من تفاصيل الاسترداد</p>
          </div>
        </div>

        {/* ── toolbar ── */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><IcoSearch/></span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث في سجلك التدريبي..."
              className="w-full pr-9 pl-4 py-2 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-400 outline-none focus:border-[#31AFEA] transition text-right"/>
          </div>
          <SortDropdown value={sort} onChange={setSort}/>
        </div>

        {/* ── tabs ── */}
        <div className="flex items-center gap-2 mb-4" dir="rtl">
          {[
            { key:"all",      label:"الكل"      },
            { key:"personal", label:"مدفوعاتي"  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-xl text-[12px] font-bold transition"
              style={{
                background: tab===t.key ? "#024677" : "transparent",
                color:      tab===t.key ? "#fff"    : "#64748b",
                border:     tab===t.key ? "none"    : "1px solid #e2e8f0",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── table ── */}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background:"#f8fafc", borderBottom:"1px solid #e2e8f0" }}>
                <th className="text-right px-4 py-3 text-[11px] font-bold text-slate-500 w-[24%]">التاريخ / البرنامج</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 w-[18%]">المبلغ</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 w-[12%]">الجهة</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 w-[18%]">الحالة</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-500 w-[10%]"></th>
              </tr>
            </thead>
            <tbody>
              {list.map((row, i) => {
                const st = STATUS_CFG[row.status] ?? STATUS_CFG.paid;
                return (
                  <tr key={row.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    style={{ background: i%2===0 ? "#fff" : "#fafbfc" }}>

                    {/* date + program */}
                    <td className="px-4 py-3.5 text-right">
                      <p className="text-[12px] font-bold text-slate-800 line-clamp-1">{row.program}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-slate-400">{row.date}</span>
                        <span className="text-[9px] text-slate-300">·</span>
                        <span className="text-[10px] text-slate-400">{row.inv}</span>
                        {row.status === "deposit" && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white"
                            style={{ background:"#31AFEA" }}>عربون</span>
                        )}
                      </div>
                    </td>

                    {/* amount */}
                    <td className="px-4 py-3.5 text-center">
                      <Amount value={row.amount} size={13}/>
                      {row.oldAmount && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          من <Amount value={row.oldAmount} color="#94a3b8" size={10}/>
                        </div>
                      )}
                    </td>

                    {/* source */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        {row.from === "شركة" ? <IcoBuild/> : <IcoUser/>}
                        {row.from}
                      </span>
                    </td>

                    {/* status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold" style={{ color:st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background:st.dot }}/>
                        {st.label}
                      </span>
                    </td>

                    {/* action */}
                    <td className="px-4 py-3.5 text-center">
                      <button onClick={() => setViewInvoice(row)}
                        className="inline-flex items-center gap-0.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600">
                        عرض <IcoChevR/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400 text-[13px]">
                  {loading ? "جارِ تحميل الفواتير..." : "لا توجد فواتير"}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
