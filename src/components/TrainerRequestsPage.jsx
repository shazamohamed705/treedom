import { useState, useEffect, useCallback } from "react";
import { fetchMyRequests, createMyRequest, fetchCoachPrograms } from "../services/api";
import Pagination from "./Pagination";

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const STATUS = {
  pending:  { label: "قيد المراجعة",  color: "#f59e0b" },
  approved: { label: "تمت الموافقة",  color: "#14b8a6" },
  rejected: { label: "مرفوض",         color: "#ef4444" },
};

const FILTER_TABS = [
  { key: "all",      label: "الكل"          },
  { key: "pending",  label: "معلقة"         },
  { key: "approved", label: "تمت الموافقة"  },
  { key: "rejected", label: "مرفوضة"        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────
function IcoSearch() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
function IcoX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function IcoPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}
function IcoSpinner() {
  return (
    <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="#024677" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Detail modal
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ req, onClose }) {
  if (!req) return null;

  const st = STATUS[req.status] || { label: (typeof req.status_label === "object" ? (req.status_label?.text ?? req.status_label?.value ?? "—") : (req.status_label || "—")), color: "#64748b" };
  const statusText = typeof req.status_label === "object" ? (req.status_label?.text ?? req.status_label?.value ?? "—") : (req.status_label || st.label);
  const isPending  = req.status === "pending";
  const isRejected = req.status === "rejected";
  const isApproved = req.status === "approved";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" dir="rtl">

        {/* header */}
        <div className={`flex items-center justify-between px-8 py-5 border-b ${isPending ? "border-teal-400" : "border-slate-100"}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: `${st.color}1a`, color: st.color }}>
              {statusText}
            </span>
            <h2 className="text-lg font-extrabold" style={{ color: "#024677" }}>
              {req.subject || "تفاصيل الطلب"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 shrink-0">
            <IcoX />
          </button>
        </div>

        {/* meta row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-8 py-6 border-b border-slate-100">
          <div className="text-right">
            <p className="text-[11px] text-slate-400 mb-1">المقدم</p>
            <p className="text-sm font-bold text-slate-800">{req.coach?.name || "—"}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{req.coach?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400 mb-1">الجهة</p>
            <p className="text-sm font-bold text-slate-800">{req.provider?.name || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-400 mb-1">تاريخ التقديم</p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">{req.created_at}</p>
          </div>
        </div>

        {/* message */}
        <div className="px-8 py-5 space-y-2">
          <p className="text-[11px] text-slate-400">نص الطلب</p>
          <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-700 leading-7" dir="rtl">
            {req.message || "—"}
          </div>
        </div>

        {/* status-specific section */}
        <div className="px-8 pb-5 space-y-3">
          {isRejected && req.reject_reason && (
            <div className="rounded-xl border border-red-100 p-4 space-y-1.5 text-right" style={{ background: "#fff5f5" }}>
              <p className="text-sm font-bold" style={{ color: "#ef4444" }}>تم رفض الطلب</p>
              {req.reviewed_at && <p className="text-xs text-slate-500">مراجعة في {req.reviewed_at}</p>}
              <p className="text-xs text-slate-600">
                <strong>سبب الرفض:</strong> {req.reject_reason}
              </p>
            </div>
          )}

          {isRejected && !req.reject_reason && (
            <div className="rounded-xl border border-red-100 p-4 text-right" style={{ background: "#fff5f5" }}>
              <p className="text-sm font-bold" style={{ color: "#ef4444" }}>تم رفض الطلب</p>
            </div>
          )}

          {isApproved && (
            <div className="rounded-xl border border-teal-100 p-4 flex items-center gap-3 text-right" style={{ background: "#f0fdf4" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" className="shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <p className="text-sm font-bold text-teal-700">تمت الموافقة على طلبك</p>
                {req.reviewed_at && <p className="text-xs text-slate-400 mt-0.5">مراجعة في {req.reviewed_at}</p>}
              </div>
            </div>
          )}

          {isPending && (
            <div className="rounded-xl border border-amber-100 p-4 text-right" style={{ background: "#fffbeb" }}>
              <p className="text-sm font-bold text-amber-600">طلبك قيد المراجعة</p>
              <p className="text-xs text-slate-400 mt-0.5">سيتم إشعارك بمجرد اتخاذ قرار بشأن طلبك</p>
            </div>
          )}

          <div className="flex justify-start pt-2">
            <button onClick={onClose}
              className="px-8 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition"
              style={{ background: "#024677" }}>
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create request modal
// ─────────────────────────────────────────────────────────────────────────────
function CreateRequestModal({ onClose, onCreated }) {
  const [subject,   setSubject]   = useState("");
  const [message,   setMessage]   = useState("");
  const [programId, setProgramId] = useState("");
  const [programs,  setPrograms]  = useState([]);
  const [sending,   setSending]   = useState(false);
  const [err,       setErr]       = useState(null);

  useEffect(() => {
    fetchCoachPrograms({ per_page: 100 })
      .then(res => {
        const d = res.data ?? res;
        setPrograms(Array.isArray(d) ? d : (d.programs ?? d.data ?? []));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setErr("عنوان الطلب ونص الطلب مطلوبان");
      return;
    }
    setErr(null);
    setSending(true);
    try {
      await createMyRequest({
        subject: subject.trim(),
        message: message.trim(),
        ...(programId ? { program_id: programId } : {}),
      });
      onCreated?.();
    } catch (e) {
      setErr(e.message || "حدث خطأ أثناء إرسال الطلب");
      setSending(false);
    }
  };

  const INPUT_CLS =
    "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white " +
    "focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={e => e.target === e.currentTarget && !sending && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto" dir="rtl">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-extrabold" style={{ color: "#024677" }}>إرسال طلب جديد</h2>
          <button onClick={onClose} disabled={sending} className="text-slate-400 hover:text-slate-600 transition p-1 shrink-0">
            <IcoX />
          </button>
        </div>

        {/* fields */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              موضوع الطلب <span className="text-red-400">*</span>
            </label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="موضوع الطلب"
              className={INPUT_CLS}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              نص الطلب <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="اكتب تفاصيل الطلب..."
              rows={4}
              className={INPUT_CLS + " resize-none"}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
              البرنامج المعني
            </label>
            <select
              value={programId}
              onChange={e => setProgramId(e.target.value)}
              className={INPUT_CLS + " appearance-none cursor-pointer"}
            >
              <option value="">— اختر من برامجك —</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name?.ar ?? p.name?.en ?? p.name ?? "—"}
                </option>
              ))}
            </select>
          </div>

          {err && <p className="text-xs font-medium text-red-500">{err}</p>}
        </div>

        {/* actions */}
        <div className="flex items-center gap-3 flex-wrap px-6 py-4 border-t border-slate-100">
          <button onClick={handleSubmit} disabled={sending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white
              transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "#024677" }}>
            {sending && <IcoSpinner />}
            {sending ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </button>
          <button onClick={onClose} disabled={sending}
            className="px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter tab
// ─────────────────────────────────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
      style={active
        ? { background: "#024677", color: "#fff" }
        : { background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}>
      {label}
      <span className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
        style={active
          ? { background: "rgba(255,255,255,0.2)", color: "#fff" }
          : { background: "#f1f5f9", color: "#64748b" }}>
        {count}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Row + table
// ─────────────────────────────────────────────────────────────────────────────
function RequestRow({ req, onDetails }) {
  const safeLabel = typeof req.status_label === "object" ? (req.status_label?.text ?? req.status_label?.value ?? "—") : (req.status_label || "—");
  const st = STATUS[req.status] || { label: safeLabel, color: "#64748b" };
  return (
    <tr className="transition-colors" dir="rtl" style={{ background: req.id % 2 === 1 ? "#F0F4F8" : "#fff" }}>
      <td className="px-5 py-4 text-sm font-bold text-slate-800">{req.subject}</td>
      <td className="px-4 py-4 text-right text-xs text-slate-500 leading-5 max-w-[280px] truncate">{req.message}</td>
      <td className="px-4 py-4 text-center">
        <span className="text-xs font-semibold" style={{ color: st.color }}>{safeLabel}</span>
      </td>
      <td className="px-4 py-4 text-center text-xs text-slate-500 tabular-nums whitespace-nowrap">{req.created_at}</td>
      <td className="px-5 py-4 text-sm text-slate-600 text-right">{req.provider?.name || "—"}</td>
      <td className="px-4 py-4 text-center">
        <button onClick={onDetails}
          className="text-xs font-semibold border border-slate-200 bg-white text-slate-600
                     px-4 py-1.5 rounded-xl hover:bg-slate-50 transition whitespace-nowrap">
          عرض التفاصيل
        </button>
      </td>
    </tr>
  );
}

function RequestsTable({ data, totalItems, loading, tab, onTab, search, setSearch, page, lastPage, setPage, onAdd, onDetails }) {
  const filtered = data.filter(r =>
    (r.subject || "").includes(search) || (r.message || "").includes(search)
  );

  return (
    <div className="space-y-4">

      {/* add button */}
      <div className="flex justify-start">
        <button onClick={onAdd}
          className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition"
          style={{ background: "#14b8a6" }}>
          <IcoPlus />إرسال طلب جديد
        </button>
      </div>

      {/* filters + search */}
      <div className="flex items-center justify-between gap-3 flex-wrap" dir="rtl">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map(f => (
            <FilterTab key={f.key} label={f.label}
              count={tab === f.key ? totalItems : null}
              active={tab === f.key} onClick={() => onTab(f.key)} />
          ))}
        </div>
        <div className="relative">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <IcoSearch />
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث في الطلبات"
            className="pr-9 pl-4 py-2 text-xs bg-white border border-slate-200 rounded-xl w-56
                       focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400"/>
        </div>
      </div>

      {/* table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><IcoSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100" dir="rtl">
                  {["الموضوع", "الرسالة", "الحالة", "تاريخ الطلب", "الجهة", "إجراء"].map(h => (
                    <th key={h} className="text-center text-xs font-semibold text-slate-400 px-4 py-3 first:text-right last:text-center">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <RequestRow key={r.id} req={r} onDetails={() => onDetails?.(r)} />
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-sm text-slate-400">لا توجد طلبات</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && (
          <Pagination page={page} totalPages={lastPage} onChange={setPage}
            accent="#024677" className="px-4 py-3 border-t border-slate-100" />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function TrainerRequestsPage() {
  const [tab,       setTab]       = useState("all");
  const [search,    setSearch]    = useState("");
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [totalItems,setTotalItems]= useState(0);
  const [requests,  setRequests]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [details,   setDetails]   = useState(null);
  const [creating,  setCreating]  = useState(false);

  const load = useCallback((t, p) => {
    setLoading(true);
    setError(null);
    fetchMyRequests({ status: t, page: p, per_page: 15 })
      .then(res => {
        const d = res.data ?? res;
        setRequests(d.requests ?? []);
        setLastPage(d.pagination?.total_pages ?? 1);
        setTotalItems(d.pagination?.total_items ?? (d.requests ?? []).length);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(tab, page), 0);
    return () => clearTimeout(t);
  }, [tab, page, load]);

  const filtered = requests.filter(r =>
    (r.subject ?? "").includes(search) || (r.message ?? "").includes(search)
  );

  const totalPending = requests.filter(r => r.status === "pending").length;

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50" dir="rtl">
      <div className="px-4 sm:px-6 py-5 space-y-5 max-w-full">

        {/* header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "#14b8a6" }}>
              {totalPending}
            </span>
            <h1 className="text-xl font-extrabold" style={{ color: "#024677" }}>طلباتي</h1>
          </div>
          <p className="text-xs text-slate-400 mr-9">
            متابعة طلباتك المقدمة إلى الهيئة للمراجعة
          </p>
        </div>

        {/* tabs bar */}
        <div className="flex items-center justify-end gap-0 border-b border-slate-200">
          <button className="px-5 py-3 text-sm font-semibold border-b-2 border-teal-500 text-teal-600 transition-all -mb-px">
            طلبات المراجعة
          </button>
        </div>

        {/* error */}
        {error && (
          <div className="flex flex-col items-center py-10 gap-3 text-center">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button onClick={() => load(tab, page)}
              className="text-xs font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: "#024677" }}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* content */}
        {!error && (
          <RequestsTable
            data={filtered}
            totalItems={totalItems}
            loading={loading}
            tab={tab}
            onTab={t => { setTab(t); setPage(1); }}
            search={search}
            setSearch={setSearch}
            page={page}
            lastPage={lastPage}
            setPage={setPage}
            onAdd={() => setCreating(true)}
            onDetails={r => setDetails(r)}
          />
        )}
      </div>

      {/* modals */}
      <DetailModal req={details} onClose={() => setDetails(null)} />
      {creating && (
        <CreateRequestModal
          onClose={() => setCreating(false)}
          onCreated={() => { setCreating(false); load(tab, 1); }}
        />
      )}
    </main>
  );
}