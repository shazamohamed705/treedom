// ── SAR icon ─────────────────────────────────────────────────────────────────
function SAR({ size = 12, color = "currentColor" }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39"
      width={size} height={size + 1} aria-label="Saudi Riyal"
      style={{ display: "inline-block", verticalAlign: "middle", marginLeft: 2 }}>
      <path fill={color} d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill={color} d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

// ── small icon helper ─────────────────────────────────────────────────────────
const Ico = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {d}
  </svg>
);

const IcoWallet    = () => <Ico size={20} stroke="#31AFEA" d={<><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 13a1 1 0 1 0 2 0 1 1 0 0 0-2 0"/><path d="M2 10h20"/></>}/>;
const IcoChevR     = () => <Ico size={14} d={<polyline points="9 18 15 12 9 6"/>}/>;
const IcoShield    = () => <Ico size={18} stroke="#009966" d={<><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>}/>;
const IcoDownload  = () => <Ico size={15} stroke="#31AFEA" d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;

// ── Amount helper ─────────────────────────────────────────────────────────────
function Amount({ value, color = "#1e293b", size = 13 }) {
  return (
    <span className="inline-flex items-center gap-0.5 font-bold" style={{ color, fontSize: size }}>
      {typeof value === "number" ? value.toLocaleString("en-US", { minimumFractionDigits: 2 }) : value}
      <SAR size={size - 1} color={color} />
    </span>
  );
}

// ── mock invoice data (company purchases of training seats) ───────────────────
const INVOICES = {
  "INV-2026-0041": {
    id:          "INV-2026-0041",
    programName: "برنامج إدارة المشاريع",
    provider:    "كود كلين للتدريب",
    issueDate:   "10 يناير 2026",
    dueDate:     "30 يناير 2026",
    payMethod:   "فيزا",
    seats:       20,
    tag:         "مدفوعة بالكامل",
    tagColor:    "#009966",
    paid:        true,
    items: [
      { name: "برنامج إدارة المشاريع", price: 900.00, discount: 0.00, total: 18000.00 },
    ],
    subtotal:   18000.00,
    discount:   0.00,
    grandTotal: 18000.00,
    deposit:    null,
  },
  "DEP-2026-0037": {
    id:          "DEP-2026-0037",
    programName: "الذكاء الاصطناعي للمديرين",
    provider:    "كود كلين للتدريب",
    issueDate:   "20 يناير 2026",
    dueDate:     "30 فبراير 2026",
    payMethod:   "مدى",
    seats:       6,
    tag:         "دفعة عربون 30%",
    tagColor:    "#009966",
    paid:        false,
    items: [
      { name: "الذكاء الاصطناعي للمديرين", price: 700.00, discount: 0.00, total: 14000.00 },
    ],
    subtotal:   14000.00,
    discount:   0.00,
    grandTotal: 14000.00,
    deposit: {
      label30:  "دفعة عربون 30%",
      amount30: 4200.00,
      label70:  "الباقي المستحق 70%",
      amount70: 9800.00,
      dueDate:  "30 فبراير 2026",
    },
  },
};

// ── component ─────────────────────────────────────────────────────────────────
export default function CompanyInvoiceDetailPage({ invoiceId, onBack }) {

  const inv = INVOICES[invoiceId] ?? INVOICES["INV-2026-0041"];

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="ltr">
      <div className="w-full px-3 sm:px-10 py-6" dir="rtl">

        {/* ── breadcrumb + page title ── */}
        <div className="flex items-center gap-2 mb-5">
          <IcoWallet />
          <button
            onClick={onBack}
            className="text-[18px] font-bold hover:underline transition"
            style={{ color: "#31AFEA" }}>
            المدفوعات والفواتير
          </button>
          <span className="text-slate-400 text-[14px]">/</span>
          <span className="text-[15px] font-bold text-slate-700">تفاصيل الفاتورة</span>
        </div>

        {/* ── deposit guarantee notice — only for deposit invoices ── */}
        {!inv.paid && (
        <div className="rounded-2xl border bg-white px-5 py-4 mb-5 flex items-start gap-3"
          style={{ borderColor: "#00996640", boxShadow: "0 2px 10px rgba(0,153,102,0.07)" }}>
          <div className="mt-0.5 shrink-0">
            <IcoShield />
          </div>
          <div className="text-right">
            <p className="text-[13px] font-bold mb-0.5" style={{ color: "#009966" }}>العربون مضمون</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "#009966" }}>
              إذا لم يكتمل عدد المقاعد المطلوبة للموظفين، سيتم استرداد العربون كاملاً تلقائياً — بدون أي رسوم.
            </p>
          </div>
        </div>
        )}

        {/* ── invoice header card ── */}
        <div className="rounded-2xl bg-white px-6 py-5 mb-5" dir="ltr"
          style={{ border: "1px solid #B4C8D7", boxShadow: "0 2px 10px rgba(8,15,52,0.05)" }}>

          {/* top row: invoice number + deposit tag */}
          <div className="flex items-center justify-between mb-5">
            <div
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ color: inv.tagColor, background: `${inv.tagColor}15`, border: `1px solid ${inv.tagColor}40` }}>
              {inv.tag}
            </div>
            <h2 className="text-[20px] font-extrabold" style={{ color: "#024677" }}>
              فاتورة رقم {inv.id}
            </h2>
          </div>

          {/* info grid: responsive — 1 col on mobile, 3 cols on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 sm:gap-x-8 gap-y-4">
            {/* row 1 */}
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">اسم البرنامج</p>
              <p className="text-[13px] font-bold text-slate-800">{inv.programName}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">مقدم التدريب</p>
              <p className="text-[13px] font-bold text-slate-800">{inv.provider}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">جهة الشراء</p>
              <p className="text-[13px] font-bold text-slate-800">كود كلين للتدريب</p>
            </div>

            {/* row 2 */}
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">عدد المقاعد</p>
              <p className="text-[13px] font-bold text-slate-800">{inv.seats} مقعد</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">تاريخ الإصدار</p>
              <p className="text-[13px] font-bold text-slate-800">{inv.issueDate}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">تاريخ الاستحقاق</p>
              <p className="text-[13px] font-bold text-slate-800">{inv.dueDate}</p>
            </div>

            {/* row 3 */}
            <div className="text-right">
              <p className="text-[11px] text-slate-400 mb-0.5">طريقة الدفع</p>
              <p className="text-[13px] font-bold" style={{ color: "#009966" }}>{inv.payMethod}</p>
            </div>
            <div />
            <div />
          </div>
        </div>

        {/* ── invoice items table title (outside the card) ── */}
        <h3 className="text-[15px] font-bold text-slate-800 mb-3 text-right">تفاصيل الفاتورة</h3>

        {/* ── invoice items table ── */}
        <div className="rounded-2xl border border-slate-200 bg-white mb-5 overflow-x-auto"
          style={{ boxShadow: "0 2px 10px rgba(8,15,52,0.05)" }}>

          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr style={{ background: "#F2F5F8" }}>
                <th className="text-right px-6 py-3 text-[11px] font-bold" style={{ color: "#024677" }}>اسم البرنامج</th>
                <th className="text-center px-6 py-3 text-[11px] font-bold" style={{ color: "#024677" }}>سعر المقعد</th>
                <th className="text-center px-6 py-3 text-[11px] font-bold" style={{ color: "#024677" }}>الخصم</th>
                <th className="text-center px-6 py-3 text-[11px] font-bold" style={{ color: "#024677" }}>الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-6 py-4 text-right text-[13px] font-medium text-slate-700">{item.name}</td>
                  <td className="px-6 py-4 text-center">
                    <Amount value={item.price} size={13} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Amount value={item.discount} size={13} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Amount value={item.total} size={13} />
                  </td>
                </tr>
              ))}
              {/* spacer row */}
              <tr style={{ background: "#F2F5F8" }}>
                <td colSpan={4} className="py-3" />
              </tr>
            </tbody>
          </table>
        </div>

        {/* ── bottom: download button + totals ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* left: download PDF */}
          <div className="flex flex-col justify-start">
            <button
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-200
                         text-[13px] font-bold transition hover:opacity-80 w-fit"
              style={{ color: "#31AFEA", background: "#F2F5F8" }}>
              <IcoDownload />
              تحميل الفاتورة (PDF)
            </button>
          </div>

          {/* right: cost breakdown */}
          <div className="rounded-2xl border border-slate-200 px-10 py-5 sm:ml-10"
            style={{ background: "#F2F5F8", boxShadow: "0 2px 10px rgba(8,15,52,0.05)" }}>

            <h3 className="text-[14px] font-bold text-slate-700 mb-4 text-right">التكلفة الإجمالية</h3>

            <div className="space-y-3">
              {/* subtotal */}
              <div className="flex items-center justify-between" dir="ltr">
                <Amount value={inv.subtotal} size={13} />
                <span className="text-[13px] font-bold text-slate-700">المجموع الجزئي</span>
              </div>
              {/* discount */}
              <div className="flex items-center justify-between" dir="ltr">
                <Amount value={inv.discount} size={13} />
                <span className="text-[13px] font-bold text-slate-700">الخصومات</span>
              </div>
              {/* grand total */}
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5" dir="ltr">
                <Amount value={inv.grandTotal} color="#024677" size={14} />
                <span className="text-[13px] font-bold text-slate-800">المجموع الكلي</span>
              </div>
            </div>

            {/* deposit breakdown — only for deposit invoices */}
            {!inv.paid && inv.deposit && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-[12px] text-slate-400 text-right mb-3">تفاصيل العربون</p>

              <div className="space-y-2.5">
                {/* due date row */}
                <div className="flex items-center justify-between" dir="ltr">
                  <span className="text-[12px] font-medium text-slate-500">{inv.deposit.dueDate}</span>
                  <span className="text-[12px] text-slate-500 font-medium">تاريخ استحقاق الدفعة المتبقية</span>
                </div>
                {/* 30% row */}
                <div className="flex items-center justify-between" dir="ltr">
                  <Amount value={inv.deposit.amount30} size={13} />
                  <span className="text-[12px] font-bold" style={{ color: "#31AFEA" }}>
                    {inv.deposit.label30}
                  </span>
                </div>
                {/* 70% row */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5" dir="ltr">
                  <Amount value={inv.deposit.amount70} size={13} />
                  <span className="text-[12px] font-bold text-slate-700">
                    {inv.deposit.label70}
                  </span>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}