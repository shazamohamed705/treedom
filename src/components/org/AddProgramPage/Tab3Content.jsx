import { useEffect } from "react";
import { INPUT_CLS } from "./constants";
import { IcoPlus, IcoSend, IcoSpinner } from "./icons";

// ── helpers ──────────────────────────────────────────────────────────────────
const UNIT_ORD = [
  "الأولى","الثانية","الثالثة","الرابعة","الخامسة","السادسة","السابسة","الثامنة",
  "التاسعة","العاشرة","الحادية عشرة","الثانية عشرة",
];
const unitName   = (i) => `الوحدة ${UNIT_ORD[i] ?? (i + 1)}`;
const lessonName = (n) => `الجلسة ${n}`;               // ترقيم متواصل عبر الوحدات
const nameOf     = (l) => (typeof l === "object" ? l.name : l) || "";

// 12 ÷ 3 = [4,4,4]  •  10 ÷ 3 = [4,3,3]  (الباقي لأول الوحدات)
function splitSessions(total, n) {
  if (n <= 0) return [];
  const base  = Math.floor(total / n);
  const extra = total % n;
  return Array.from({ length: n }, (_, i) => base + (i < extra ? 1 : 0));
}

// اقتراح عدد وحدات بيقسم بالتساوي (3 أو 4)، وإلا الأقرب لـ total/4
function suggestUnitsCount(total) {
  if (total <= 0) return 1;
  for (const n of [3, 4, 2, 5]) if (n < total && total % n === 0) return n;
  return Math.max(2, Math.min(5, Math.round(total / 4))) || 1;
}

// ════ TAB 3: المحتوى والتقييمات ════
export default function Tab3Content({
  form, set, handleSubmit, saving, onBack, error,
}) {
  const total        = Number(form.totalSessions) || 0;
  const units        = form.units || [];
  const totalLessons = units.reduce((s, u) => s + (u.lessonNames?.length ?? 0), 0);
  const remaining    = total - totalLessons;
  const balanced     = totalLessons === total;
  const unitsCount   = form.unitsCount ?? units.length ?? 0;

  // أول فتح للتبويب ومفيش وحدات → اقترح عدد وحدات وقسّم الجلسات تلقائياً
  useEffect(() => {
    if (!form.units?.length && form.unitsCount == null && total > 0) {
      const n = suggestUnitsCount(total);
      const counts = splitSessions(total, n);
      let start = 0;
      const newUnits = counts.map((count, i) => {
        const lessons = Array.from({ length: count }, (_, j) => lessonName(start + j + 1));
        start += count;
        return { id: Date.now() + i, title: unitName(i), desc: "", hours: 0, lessonNames: lessons };
      });
      set("unitsCount", n);
      set("units", newUnits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.units?.length, form.unitsCount, total]);

  // ── تغيير عدد الوحدات: إعادة تقسيم مع الحفاظ على الأسماء المكتوبة ──
  const changeUnitsCount = (n) => {
    const next = Math.max(1, Math.min(n, total || 1));
    const counts = splitSessions(total, next);
    const prev = form.units || [];
    let start = 0;
    const newUnits = counts.map((count, i) => {
      const p = prev[i];
      const prevLessons = p?.lessonNames || [];
      const lessons = Array.from({ length: count }, (_, j) =>
        prevLessons[j] ?? lessonName(start + j + 1)
      );
      start += count;
      return {
        id: p?.id ?? Date.now() + i,
        title: p?.title || unitName(i),
        desc: p?.desc || "",
        hours: p?.hours ?? 0,
        lessonNames: lessons,
      };
    });
    set("unitsCount", next);
    set("units", newUnits);
  };

  // ── رقم بداية دروس الوحدة (للترقيم المتواصل) ──
  const unitStart = (idx) =>
    units.slice(0, idx).reduce((s, u) => s + (u.lessonNames?.length ?? 0), 0);

  // ── زيادة/نقص درس في وحدة (مع إعادة توزيع لتثبيت المجموع = عدد الجلسات) ──
  const changeLessonCount = (unitIndex, delta) => {
    const cur = form.units || [];
    const target = cur[unitIndex];
    if (!target) return;
    const len = target.lessonNames?.length ?? 0;

    if (delta > 0) {
      const used = cur.reduce((s, u) => s + (u.lessonNames?.length ?? 0), 0);
      if (used >= total) {
        // مفيش جلسات متبقية → خد درس من آخر وحدة تقدر تتبرع
        let donor = -1;
        for (let i = cur.length - 1; i >= 0; i--) {
          if (i !== unitIndex && (cur[i].lessonNames?.length ?? 0) > 1) { donor = i; break; }
        }
        if (donor === -1) return;
        set("units", cur.map((u, i) => {
          if (i === unitIndex) {
            const g = unitStart(i) + (u.lessonNames?.length ?? 0) + 1;
            return { ...u, lessonNames: [...(u.lessonNames || []), lessonName(g)] };
          }
          if (i === donor) return { ...u, lessonNames: (u.lessonNames || []).slice(0, -1) };
          return u;
        }));
      } else {
        set("units", cur.map((u, i) => {
          if (i !== unitIndex) return u;
          const g = unitStart(i) + (u.lessonNames?.length ?? 0) + 1;
          return { ...u, lessonNames: [...(u.lessonNames || []), lessonName(g)] };
        }));
      }
    } else {
      if (len <= 1) return; // الوحدة لازم فيها درس واحد على الأقل
      set("units", cur.map((u, i) =>
        i === unitIndex ? { ...u, lessonNames: (u.lessonNames || []).slice(0, -1) } : u
      ));
    }
  };

  // ── تعديل اسم درس (مع الحفاظ على المحتوى لو الدرس اتعمل له edit قبل كده) ──
  const setLessonName = (unitIndex, lessonIndex, value) => {
    set("units", (form.units || []).map((u, i) => {
      if (i !== unitIndex) return u;
      const names = [...(u.lessonNames || [])];
      const cur = names[lessonIndex];
      names[lessonIndex] = typeof cur === "object" ? { ...cur, name: value } : value;
      return { ...u, lessonNames: names };
    }));
  };

  // ── إضافة وحدة يدوي: تاخد جلسة واحدة من الوحدة الأخيرة ──
  const addUnit = () => {
    const cur = form.units || [];
    const last = cur[cur.length - 1];
    if (last && (last.lessonNames?.length ?? 0) > 1) {
      const taken = last.lessonNames[last.lessonNames.length - 1];
      const newUnits = cur.map((u, i) =>
        i === cur.length - 1 ? { ...u, lessonNames: u.lessonNames.slice(0, -1) } : u
      );
      newUnits.push({ id: Date.now(), title: unitName(cur.length), desc: "", hours: 0, lessonNames: [taken] });
      set("units", newUnits);
      set("unitsCount", cur.length + 1);
    } else if (totalLessons < total) {
      // في جلسات متبقية → ضيف وحدة بدرس جديد من المتبقي
      const g = totalLessons + 1;
      set("units", [...cur, { id: Date.now(), title: unitName(cur.length), desc: "", hours: 0, lessonNames: [lessonName(g)] }]);
      set("unitsCount", cur.length + 1);
    }
  };

  // ─ـ progress strip values ──
  const pct        = total > 0 ? Math.min(100, Math.round((totalLessons / total) * 100)) : 0;
  const overBudget = totalLessons > total;

  return (
    <>
      {/* ── progress strip ── */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 mb-3" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-28 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${pct}%`, background: overBudget ? "#ef4444" : totalLessons === total ? "#16a34a" : "#024677" }} />
          </div>
          <span className="text-xs text-slate-400">{pct}%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs" dir="rtl">
          <span className="font-semibold" style={{ color: overBudget ? "#ef4444" : "#1e293b" }}>{totalLessons}</span>
          <span className="text-slate-400">من</span>
          <span className="font-semibold text-slate-700">{total}</span>
          <span className="text-slate-400">جلسة</span>
          {!overBudget && remaining > 0 && (
            <span className="mr-2 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500">{remaining} متبقية</span>
          )}
          {overBudget && (
            <span className="mr-2 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-500 border border-red-100">تجاوزت الحد</span>
          )}
          {balanced && total > 0 && (
            <span className="mr-2 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-green-50 text-green-600 border border-green-100">مكتمل</span>
          )}
        </div>
      </div>

      {/* ── تنبيه: عدد الجلسات اتغير أو المجموع مش مكتمل ── */}
      {units.length > 0 && !balanced && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 mb-3" dir="rtl">
          <span className="text-xs text-amber-700 font-medium">
            {remaining > 0 ? `باقي ${remaining} جلسات لم توزع بعد` : `تجاوزت ${-remaining} جلسات`}
          </span>
          <button type="button"
            onClick={() => changeUnitsCount(unitsCount || units.length)}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-700 hover:bg-amber-100 transition">
            إعادة التقسيم
          </button>
        </div>
      )}

      {/* ── عدد الوحدات + إضافة وحدة ── */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 mb-4" dir="rtl">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">عدد الوحدات</span>
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => changeUnitsCount((unitsCount || 1) - 1)}
              disabled={(unitsCount || 1) <= 1}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 transition text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed">−</button>
            <span className="w-6 text-center text-sm font-semibold text-slate-700">{unitsCount || units.length || 0}</span>
            <button type="button"
              onClick={() => changeUnitsCount((unitsCount || 1) + 1)}
              disabled={(unitsCount || 1) >= total}
              className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 transition text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed">+</button>
          </div>
        </div>
        <button type="button" onClick={addUnit} disabled={total <= 0 || units.length >= total}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:border-teal-400 hover:text-teal-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
          <IcoPlus /> إضافة وحدة
        </button>
      </div>

      {/* ── كروت الوحدات ── */}
      <div className="space-y-4" dir="rtl">
        {units.length === 0 && (
          <div className="border border-dashed border-slate-300 rounded-2xl p-8 text-center text-sm text-slate-400">
            حدد عدد الجلسات في تبويب الجدول الزمني أولاً ليتم تقسيمها على الوحدات.
          </div>
        )}
        {units.map((unit, i) => {
          const start = unitStart(i);
          const len = unit.lessonNames?.length ?? 0;
          return (
            <div key={unit.id ?? i} className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4">
              {/* header: unit number + title + range */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: "#024677" }}>{i + 1}</span>
                  <input
                    value={unit.title || ""}
                    onChange={e => set("units", units.map((u, k) => k === i ? { ...u, title: e.target.value } : u))}
                    placeholder={unitName(i)}
                    className={INPUT_CLS}
                  />
                </div>
                {len > 0 && (
                  <span className="text-xs text-slate-400 shrink-0 whitespace-nowrap">دروس {start + 1}–{start + len}</span>
                )}
              </div>

              {/* description */}
              <textarea
                value={unit.desc || ""}
                onChange={e => set("units", units.map((u, k) => k === i ? { ...u, desc: e.target.value } : u))}
                placeholder="وصف الوحدة"
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right resize-none"
              />

              {/* lesson count stepper */}
              <div className="flex items-center justify-between px-4 py-2.5 border border-slate-200 rounded-xl bg-white" dir="ltr">
                <span className="text-sm font-semibold text-slate-700" dir="rtl">{len} دروس</span>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => changeLessonCount(i, -1)}
                    disabled={len <= 1}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 transition text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed">−</button>
                  <button type="button"
                    onClick={() => changeLessonCount(i, +1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:border-teal-400 hover:text-teal-500 transition text-base font-bold">+</button>
                </div>
              </div>

              {/* lessons list (continuously numbered across units) */}
              <div className="space-y-2">
                {(unit.lessonNames || []).map((ln, j) => {
                  const g = start + j + 1;
                  return (
                    <div key={j} className="flex items-center gap-2" dir="rtl">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: "#14b8a6" }}>{g}</span>
                      <input
                        value={nameOf(ln)}
                        onChange={e => setLessonName(i, j, e.target.value)}
                        placeholder={lessonName(g)}
                        dir="rtl"
                        className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition placeholder:text-slate-400 text-right"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* error */}
      {error && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-4 py-2 text-right mt-4">{error}</p>
      )}

      {/* not-balanced message */}
      {units.length > 0 && !balanced && (
        <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-2 text-right mt-3">
          {remaining > 0 ? `باقي ${remaining} جلسات لم توزع — وزّعها قبل الإرسال` : `تجاوزت عدد الجلسات بمقدار ${-remaining}`}
        </p>
      )}

      {/* actions */}
      <div className="flex items-center gap-3 pt-4 pb-8">
        <button onClick={handleSubmit} disabled={saving || (units.length > 0 && !balanced)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: "#024677" }}>
          {saving ? <IcoSpinner /> : <IcoSend />}
          إرسال للمراجعة
        </button>
        <button onClick={onBack}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
          إلغاء
        </button>
      </div>
    </>
  );
}
