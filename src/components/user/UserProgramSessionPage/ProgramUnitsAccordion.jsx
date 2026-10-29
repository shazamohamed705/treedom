import { useState } from "react";
import { IcoChevD, IcoChevU, IcoClock, IcoPlay } from "./icons";

/**
 * ProgramUnitsAccordion — RTL curriculum accordion for the main program view.
 *
 * In RTL flex-row the first DOM child appears on the RIGHT.
 * So we put: [number+title]  then  [count+chevron]
 * which renders as:  RIGHT: number+title  |  LEFT: count+chevron  ✓
 */
export default function ProgramUnitsAccordion({ units = [], isEnrolled = false, onOpenSession }) {
  const [openUnit, setOpenUnit] = useState(null);

  if (!units.length) return null;

  const totalLessons = units.reduce((s, u) => s + (u.lessons?.length ?? 0), 0);

  return (
    <div dir="rtl">
      {/* ── header ── */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100">
        <h2 className="text-[14px] font-extrabold text-slate-800">المنهج الدراسي</h2>
        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          <span>{units.length} وحدة</span>
          <span className="text-slate-300">|</span>
          <span>{totalLessons} درس</span>
        </div>
      </div>

      {/* ── unit rows ── */}
      {units.map((unit, unitIdx) => {
        const isOpen  = openUnit === unit.id;
        const lessons = unit.lessons ?? [];

        return (
          <div key={unit.id} className="border-b border-slate-100 last:border-0">
            <button
              onClick={() => setOpenUnit(isOpen ? null : unit.id)}
              className="w-full flex items-center justify-between py-3 hover:bg-slate-50 transition"
            >
              {/* RIGHT (first in DOM): number + title */}
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-bold text-slate-400 shrink-0">
                  {unitIdx + 1}
                </span>
                <span className="text-[13px] font-semibold text-slate-800 text-right">
                  {unit.title}
                </span>
              </div>

              {/* LEFT (second in DOM): lesson count + chevron */}
              <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
                <span>{lessons.length} درس</span>
                {isOpen ? <IcoChevU /> : <IcoChevD />}
              </div>
            </button>

            {/* ── lessons list ── */}
            {isOpen && (
              <div className="bg-slate-50 border-t border-slate-100">
                {lessons.length === 0 ? (
                  <p className="px-5 py-3 text-[12px] text-slate-400">لا توجد دروس في هذه الوحدة</p>
                ) : (
                  lessons.map((lesson) => {
                    const clickable = isEnrolled && onOpenSession;
                    return (
                      <div
                        key={lesson.id}
                        onClick={clickable ? () => onOpenSession(lesson.id) : undefined}
                        className={[
                          "flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 pr-4",
                          clickable ? "cursor-pointer hover:bg-blue-50 transition" : "cursor-default",
                        ].join(" ")}
                      >
                        {/* RIGHT: icon + title */}
                        <div className="flex items-center gap-2">
                          {isEnrolled ? (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                              style={{ background: "#EBF7FF" }}
                            >
                              <IcoPlay />
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-400 shrink-0">
                              {lesson.num}
                            </span>
                          )}
                          <span className="text-[12px] text-slate-700 font-medium">{lesson.title}</span>
                        </div>

                        {/* LEFT: duration */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                          <IcoClock />
                          <span>{lesson.duration}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
