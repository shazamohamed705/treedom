import { useState, useEffect } from "react";
import { fetchCoachHome } from "../../services/api";
import { ActivityRow, mapCoachHomeUpdates } from "./TrainerActivityFeed";

export default function TrainerNotificationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchCoachHome()
      .then(res => {
        const data = res?.data ?? res ?? {};
        setItems(mapCoachHomeUpdates(data.latest_updates ?? []));
        setError(null);
      })
      .catch(err => setError(err.message ?? "حدث خطأ أثناء تحميل التحديثات"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="flex-1 overflow-y-auto bg-white px-3 py-3" dir="rtl">
      <div className="w-full max-w-[900px] mx-auto">
        <h1 className="text-lg font-bold text-slate-800 mb-5">الإشعارات</h1>

        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-3">آخر التحديثات</h2>

          {loading && (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-red-500 text-center py-6">{error}</p>
          )}

          {!loading && !error && (
            <div>
              {items.map(item => (
                <ActivityRow key={item.id} item={item} />
              ))}
              {items.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-6">لا توجد إشعارات</p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
