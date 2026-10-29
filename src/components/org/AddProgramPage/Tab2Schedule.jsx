import { IcoChevron } from "./icons";
import MultiDatePicker from "./MultiDatePicker";

// ════ TAB 2: الجدول الزمني ════
export default function Tab2Schedule({ form, set, setActiveTab, setError }) {
  return (
    <>
      {/* ── بوكس الجدول الزمني ── */}
      <div className="border border-slate-200 rounded-2xl p-5 space-y-4" style={{ background: "#fff" }}>
        <h3 className="text-sm font-bold text-slate-800 text-right">الجدول الزمني</h3>

        {/* صف 1: تاريخ البداية + تاريخ الانتهاء */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">تاريخ البداية <span className="text-red-400">*</span></p>
            <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">تاريخ الانتهاء <span className="text-red-400">*</span></p>
            <input type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)}
              min={form.startDate || undefined}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
        </div>

        {/* صف 2: التكرار + موعد التسجيل */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">التكرار <span className="text-red-400">*</span></p>
            <div className="relative">
              <select value={form.recurrence || "weekly"} onChange={e => set("recurrence", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right appearance-none cursor-pointer">
                <option value="weekly">أسبوعي</option>
                <option value="biweekly">كل أسبوعين</option>
                <option value="monthly">شهري</option>
                <option value="daily">يومي</option>
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoChevron /></span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">آخر موعد للتسجيل</p>
            <input type="date" value={form.registrationDeadline || ""}
              onChange={e => set("registrationDeadline", e.target.value)}
              max={form.endDate || undefined}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
        </div>

        {/* صف 2: وقت بداية الجلسة + مدة الجلسة */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">وقت بداية الجلسة</p>
            <input type="time" value={form.sessionTime || ""} onChange={e => set("sessionTime", e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">مدة الجلسة</p>
            <div className="relative">
              <select value={form.sessionDuration || "60"} onChange={e => set("sessionDuration", e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right appearance-none cursor-pointer">
                <option value="30">30 دقيقة</option>
                <option value="60">60 دقيقة</option>
                <option value="90">90 دقيقة</option>
                <option value="120">120 دقيقة</option>
                <option value="180">180 دقيقة</option>
              </select>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><IcoChevron /></span>
            </div>
          </div>
        </div>

        {/* صف 3: عدد الجلسات + تواريخ مستثناة */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">عدد الجلسات</p>
            <input type="number" min="1" value={form.totalSessions} onChange={e => set("totalSessions", e.target.value)}
              placeholder="14"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-teal-400 transition text-right placeholder:text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1.5 font-medium text-right">تواريخ مستثناة (إجازات)</p>
            <MultiDatePicker
              selected={form.excludedDates || []}
              onChange={val => set("excludedDates", val)}
            />
          </div>
        </div>

        {/* أيام الجلسات الأسبوعية */}
        <div>
          <p className="text-xs text-slate-500 mb-2 font-medium text-right">أيام الجلسات الأسبوعية</p>
          <div className="flex items-center gap-4 flex-wrap" dir="rtl">
            {["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"].map(day => (
              <label key={day} className="flex items-center gap-1.5 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={(form.weekDays || []).includes(day)}
                  onChange={e => {
                    const days = form.weekDays || [];
                    set("weekDays", e.target.checked ? [...days, day] : days.filter(d => d !== day));
                  }}
                  className="w-4 h-4 rounded border-slate-300 accent-teal-500"
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* nav buttons */}
      <div className="flex items-center gap-3 pt-4 pb-2">
        <button type="button" onClick={() => {
          if (!form.startDate || !form.endDate) {
            setError("يرجى تحديد تاريخ البداية والانتهاء");
            return;
          }
          setError(null);
          setActiveTab(3);
        }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition"
          style={{ background: "#024677" }}>
          التالي: مراجعة نهائية
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button type="button" onClick={() => setActiveTab(1)}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition">
          السابق
        </button>
      </div>
    </>
  );
}
