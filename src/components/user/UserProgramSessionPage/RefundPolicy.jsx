import { useState } from "react";
import { IcoChevD, IcoChevU } from "./icons";

export default function RefundPolicy() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden" dir="rtl">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition">
        <span className="text-[12px] font-bold text-slate-700">سياسة الاسترداد</span>
        {open ? <IcoChevU /> : <IcoChevD />}
      </button>
      {open && (
        <div className="px-4 pb-4 bg-white space-y-2">
          <div className="flex items-start gap-2 text-[11px] text-slate-600">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <span>إلغاء قبل مشاهدة 10%: استرداد كامل</span>
          </div>
          <div className="flex items-start gap-2 text-[11px] text-slate-600">
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5" />
            <span>إلغاء بعد ذلك: لا يوجد استرداد</span>
          </div>
        </div>
      )}
    </div>
  );
}
