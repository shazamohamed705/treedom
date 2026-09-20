import { useState, useRef } from "react";
import { sendMyContactMessage } from "../services/api";

// ── icons ─────────────────────────────────────────────────────────────────────
const Ico = ({ d, size = 15, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const IcoSupport = () => <Ico size={20} stroke="#31AFEA" d={<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>}/>;
const IcoSearch  = () => <Ico d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
const IcoSort    = () => <Ico d={<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>}/>;
const IcoChevD   = () => <Ico size={16} d={<polyline points="6 9 12 15 18 9"/>}/>;
const IcoChevU   = () => <Ico size={16} d={<polyline points="18 15 12 9 6 15"/>}/>;
const IcoUpload  = () => <Ico size={28} stroke="#024677" sw={1.5} d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>}/>;

// ── FAQ data ──────────────────────────────────────────────────────────────────
const FAQS = [
  { id:1, q:"كيف أسجل في برنامج تدريبي؟",              a:"يمكنك تصفح البرامج ثم الضغط على \"سجل الآن\" واتباع خطوات الدفع." },
  { id:2, q:"لم يصلني رمز التحقق، ماذا أفعل؟",         a:"تأكد من صحة البريد الإلكتروني أو رقم الجوال، وتحقق من مجلد الرسائل غير المرغوب فيها." },
  { id:3, q:"كيف يمكنني استرجاع كلمة المرور؟",          a:"اضغط على \"نسيت كلمة المرور\" في صفحة تسجيل الدخول، وستصلك رسالة على بريدك." },
  { id:4, q:"كيف يمكنني تصفح البرامج التدريبية؟",       a:"انتقل إلى صفحة \"تصفح البرامج\" من القائمة الجانبية." },
];

// ── accordion item ────────────────────────────────────────────────────────────
function FaqItem({ item }) {
  const [open, setOpen] = useState(item.id === 1);
  return (
    <div className="border rounded-xl overflow-hidden" style={{ borderColor:"#B4C8D7" }}>
      <button onClick={() => setOpen(o=>!o)}
        className="w-full flex items-center justify-between px-5 py-7 text-right hover:bg-slate-50 transition"
        dir="rtl">
        <span className="text-[14px] font-semibold text-slate-800">{item.q}</span>
        <span className="shrink-0 text-slate-400 mr-3">{open ? <IcoChevU/> : <IcoChevD/>}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 border-t" style={{ borderColor:"#B4C8D7" }} dir="rtl">
          <p className="text-[13px] text-slate-500 leading-relaxed mt-3 flex gap-2">
            <span className="text-[#31AFEA] font-bold shrink-0">•</span>
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

// ── sort dropdown ─────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value:"newest",  label:"من الأحدث للأقدم" },
  { value:"popular", label:"الأكثر شيوعاً"     },
];
function SortBtn({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = SORT_OPTS.find(o => o.value === value);
  return (
    <div className="relative" dir="rtl">
      <button onClick={() => setOpen(o=>!o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-600 font-medium hover:border-[#31AFEA] transition whitespace-nowrap">
        <IcoSort/>{sel?.label}<IcoChevD/>
      </button>
      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[170px] overflow-hidden">
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

// ── success modal ─────────────────────────────────────────────────────────────
function SuccessModal({ ticket, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "rgba(2,17,38,0.50)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        dir="rtl"
        className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl flex flex-col items-center px-6 pt-8 pb-6 gap-4 text-center"
        style={{ animation: "fadeUp 0.2s ease-out" }}
        onClick={e => e.stopPropagation()}
      >
        {/* icon */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "rgba(49,175,234,0.12)" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
            stroke="#31AFEA" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <div>
          <p className="text-[16px] font-extrabold text-slate-800">تم إرسال رسالتك بنجاح</p>
          <p className="text-[12px] text-slate-400 mt-1">سنتواصل معك في أقرب وقت</p>
        </div>

        {ticket?.ticket_number && (
          <div className="w-full rounded-xl px-4 py-2.5 text-center"
            style={{ background: "#F4F7FA", border: "1px solid #E4EBF1" }}>
            <p className="text-[11px] text-slate-400 mb-0.5">رقم التذكرة</p>
            <p className="text-[13px] font-bold" style={{ color: "#31AFEA" }}>
              {ticket.ticket_number}
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-[14px] font-extrabold text-white hover:opacity-90 transition"
          style={{ background: "#024677" }}>
          حسناً
        </button>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── contact form ──────────────────────────────────────────────────────────────
function ContactForm() {
  const [title,    setTitle]    = useState("");
  const [desc,     setDesc]     = useState("");
  const [files,    setFiles]    = useState([]);
  const [ticket,   setTicket]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const fileRef = useRef();

  const handleFiles = (e) => setFiles(Array.from(e.target.files || []));
  const handleDrop  = (e) => { e.preventDefault(); setFiles(Array.from(e.dataTransfer.files || [])); };

  const handleSubmit = async () => {
    if (!title.trim() || !desc.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await sendMyContactMessage({
        subject:     title.trim(),
        message:     desc.trim(),
        attachments: files,
      });
      setTicket(res?.data ?? { ticket_number: "", subject: title.trim(), created_at: "" });
    } catch (err) {
      setError(err?.message || "حدث خطأ، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTicket(null);
    setTitle("");
    setDesc("");
    setFiles([]);
    setError(null);
  };

  return (
    <div className="space-y-5" dir="rtl">

      {/* success modal */}
      {ticket && <SuccessModal ticket={ticket} onClose={handleClose} />}

      {/* error banner */}
      {error && (
        <div className="rounded-xl px-4 py-3 text-[13px] text-red-600 font-medium"
          style={{ background:"#fff1f2", border:"1px solid #fecdd3" }}>
          {error}
        </div>
      )}

      {/* عنوان المشكلة */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-slate-700 text-right">عنوان المشكلة</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="مثال: مشكلة في الدخول للجلسة"
          className="w-full px-4 py-3 rounded-xl text-[13px] text-slate-700 text-right outline-none transition placeholder:text-slate-300"
          style={{ border:"1px solid #B4C8D7" }}/>
      </div>

      {/* وصف المشكلة */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-slate-700 text-right">وصف المشكلة</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="اشرح مشكلتك بالتفصيل..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl text-[13px] text-slate-700 text-right outline-none transition resize-none placeholder:text-slate-300"
          style={{ border:"1px solid #B4C8D7" }}/>
      </div>

      {/* إرفاق صور أو ملفات */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px] font-semibold text-slate-700 text-right">إرفاق صور أو ملفات</label>
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="rounded-xl flex flex-col items-center justify-center py-8 gap-3 cursor-pointer"
          style={{ border:"1px solid #B4C8D7", background:"#f9fbfc" }}
          onClick={() => fileRef.current?.click()}>
          <div className="rounded-xl flex items-center justify-center"
            style={{ width:80, height:60, background:"#E8EDF2" }}>
            <IcoUpload/>
          </div>
          <p className="text-[12px] text-center" style={{ color:"#31AFEA" }}>
            اسحب الملفات هنا<br/>
            <span className="text-slate-400">أو</span>
          </p>
          <div className="px-6 py-2.5 rounded-xl text-[13px] font-bold text-white"
            style={{ background:"#024677" }}>
            إختر الملفات
          </div>
          <p className="text-[10px] text-slate-400">صور، فيديو، PowerPoint، PDF</p>
          {files.length > 0 && (
            <p className="text-[11px] text-teal-600 font-medium">
              {files.length} ملف مختار
            </p>
          )}
          <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles}/>
        </div>
      </div>

      {/* إرسال */}
      <button
        onClick={handleSubmit}
        disabled={loading || !title.trim() || !desc.trim()}
        className="w-full py-3.5 rounded-xl text-[14px] font-bold text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background:"#024677" }}>
        {loading ? "جارٍ الإرسال..." : "إرسال"}
      </button>

    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [tab,    setTab]    = useState("faq");
  const [search, setSearch] = useState("");
  const [sort,   setSort]   = useState("newest");

  const filtered = FAQS.filter(f =>
    !search.trim() || f.q.includes(search.trim()) || f.a.includes(search.trim())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-white min-h-0" dir="rtl">
      <div className="w-full max-w-[950px] mx-auto px-8 py-6">

        {/* ── header ── */}
        <div className="flex items-center justify-start gap-2 mb-4">
          <IcoSupport/>
          <h1 className="text-[18px] font-bold" style={{ color:"#31AFEA" }}>الدعم</h1>
        </div>

        {/* ── tabs ── */}
        <div className="flex items-center justify-end gap-0 border-b border-slate-200 mb-6" dir="ltr">
          {[
            { key:"faq",     label:"الأسئلة الشائعة (FAQ)" },
            { key:"contact", label:"تواصل معنا"              },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-5 py-3 text-[13px] font-semibold transition-all relative"
              style={{ color: tab===t.key ? "#31AFEA" : "#64748b" }}>
              {t.label}
              {tab===t.key && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                  style={{ background:"#31AFEA" }}/>
              )}
            </button>
          ))}
        </div>

        {/* ══ FAQ tab ══ */}
        {tab === "faq" && (
          <>
            {/* toolbar */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative flex-1">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <IcoSearch/>
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن سؤالك..."
                  className="w-full pr-9 pl-4 py-2 rounded-xl text-[13px] text-slate-700 placeholder-slate-400 outline-none focus:border-[#31AFEA] transition text-right"
                  style={{ border:"1px solid #B4C8D7" }}/>
              </div>
              <SortBtn value={sort} onChange={setSort}/>
            </div>

            {/* accordion */}
            <div className="space-y-3">
              {filtered.map(f => <FaqItem key={f.id} item={f}/>)}
              {filtered.length === 0 && (
                <p className="text-center text-slate-400 text-[13px] py-10">لا توجد نتائج مطابقة</p>
              )}
            </div>

            {/* contact line */}
            <div className="flex items-center gap-1.5 mt-6 text-[12px] text-slate-500" dir="ltr">
              <span>لم تجد إجابة؟</span>
              <button onClick={() => setTab("contact")}
                className="font-bold hover:opacity-70 transition" style={{ color:"#31AFEA" }}>
                تواصل معنا
              </button>
            </div>
          </>
        )}

        {/* ══ contact tab ══ */}
        {tab === "contact" && <ContactForm/>}

      </div>
    </div>
  );
}
