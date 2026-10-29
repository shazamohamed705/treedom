import { useState } from "react";
import { IcoChevD, IcoChevU, IcoClock } from "./icons";

export default function CurriculumRow({ item, onOpen }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => (onOpen ? onOpen(item) : setOpen(o => !o))}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition text-right">
        <div className="flex items-center gap-2">
          {open ? <IcoChevU /> : <IcoChevD />}
          <span className="text-[12px] text-slate-500">{item.duration}</span>
          <IcoClock />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-slate-800">{item.title}</span>
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0"
            style={{ background: "#EBF7FF", color: "#31AFEA" }}>
            {item.num}
          </span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 text-right">
          <p className="text-[12px] text-slate-500">محتوى الجلسة {item.num}</p>
        </div>
      )}
    </div>
  );
}
