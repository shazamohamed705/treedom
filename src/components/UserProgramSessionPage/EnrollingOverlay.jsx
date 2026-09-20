export default function EnrollingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(2,17,38,0.4)" }}>
      <div className="bg-white rounded-2xl px-8 py-6 flex flex-col items-center gap-3">
        <div className="w-9 h-9 rounded-full border-[3px] border-[#31AFEA] border-t-transparent animate-spin" />
        <p className="text-[13px] font-bold text-slate-700">جارٍ إتمام التسجيل...</p>
      </div>
    </div>
  );
}
