import { useState, useEffect } from "react";
import { useToast } from "../../shared/ToastProvider";
import CategoriesPage from "../CategoriesPage";
import UsersPage      from "../UsersPage";
import { fetchProviderSettings, updateProviderSettings } from "../../../services/api";
import { isIndeCoach } from "../../../services/auth";

// ── toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex items-center w-11 h-6 rounded-full p-0.5 transition-colors shrink-0
        ${on ? "bg-[#0ABFBF] justify-start" : "bg-slate-200 justify-end"}`}>
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  );
}

// ── setting row ───────────────────────────────────────────────────────────────
function SettingRow({ title, icon, children }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200
      bg-white py-2.5 px-3.5 sm:px-6" dir="rtl">
      <div className="flex items-center gap-1.5 min-w-0">
        {icon && <span className="text-slate-400 shrink-0">{icon}</span>}
        <p className="text-[11px] font-semibold text-slate-700 leading-snug">{title}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ── icons ─────────────────────────────────────────────────────────────────────
function IcoBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}
function IcoSettings() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
      stroke="#0ABFBF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IcoSave() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}
function IcoVideo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2"/>
    </svg>
  );
}
function IcoCheck() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
      stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IcoEye({ off }) {
  if (off) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

// ── radio option ──────────────────────────────────────────────────────────────
function RadioOption({ value, checked, onChange, label, description }) {
  return (
    <button type="button" onClick={() => onChange(value)} dir="rtl"
      className={`flex items-start gap-2.5 rounded-xl border bg-white py-3 px-3.5 text-right transition
        ${checked ? "border-[#0ABFBF] ring-1 ring-[#0ABFBF]" : "border-slate-200 hover:border-slate-300"}`}>
      <span className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0
        ${checked ? "bg-[#0ABFBF] border-[#0ABFBF]" : "border-slate-300"}`}>
        {checked && <IcoCheck />}
      </span>
      <span>
        <span className="block text-xs font-bold text-slate-800">{label}</span>
        <span className="block text-[11px] text-slate-400 mt-0.5">{description}</span>
      </span>
    </button>
  );
}

// ── section card ──────────────────────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3.5 sm:p-5">
      {(icon || title) && (
        <div className="flex items-center gap-2.5 mb-2.5">
          {icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#F0F7FF", color: "#024677" }}>
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

function CredField({ label, value, onChange, placeholder, secret, showSecret, onToggleSecret }) {
  return (
    <label className="block" dir="rtl">
      <span className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</span>
      <div className="relative">
        <input
          type={secret && !showSecret ? "password" : "text"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          className={`w-full h-10 rounded-xl border border-slate-200 bg-white px-3
            text-xs text-slate-700 focus:outline-none focus:border-[#0ABFBF] transition
            ${secret ? "pl-10" : ""}`}
        />
        {secret && (
          <button
            type="button"
            onClick={onToggleSecret}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showSecret ? "إخفاء" : "إظهار"}
          >
            <IcoEye off={showSecret} />
          </button>
        )}
      </div>
    </label>
  );
}

const DEFAULT_ZOOM_MODES = [
  {
    value: "api",
    label: "ربط تلقائي عبر API",
    description: "يقوم النظام بتوليد رابط Zoom تلقائياً عند إنشاء كل جلسة جديدة.",
  },
  {
    value: "manual",
    label: "إدخال يدوي",
    description: "يقوم المدرب بإدخال رابط Zoom يدوياً عند إنشاء كل جلسة.",
  },
];

// ── main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage({
  onAddProgram, initialView, onViewChange, onViewProgram, onAddUser, orgName,
}) {
  const showToast = useToast();
  const indeCoach = isIndeCoach();
  const fallbackView = indeCoach ? "categories" : "main";
  const requested = initialView ?? fallbackView;
  const [view, setView] = useState(indeCoach && (requested === "main" || requested === "users") ? "categories" : requested);

  useEffect(() => {
    if (initialView) {
      setView(indeCoach && (initialView === "main" || initialView === "users") ? "categories" : initialView);
      onViewChange?.();
    }
  }, [initialView]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (indeCoach && (view === "main" || view === "users")) setView("categories");
  }, [indeCoach, view]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const [notifAbsence,  setNotifAbsence]  = useState(false);
  const [notifReminder, setNotifReminder] = useState(true);

  const [maxDistance,   setMaxDistance]   = useState(100);
  const [minAttendance, setMinAttendance] = useState(75);

  const [zoomMode, setZoomMode] = useState("api");
  const [zoomModes, setZoomModes] = useState(DEFAULT_ZOOM_MODES);
  const [apiConfigured, setApiConfigured] = useState(false);

  const [accountId, setAccountId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (view !== "main" || indeCoach) return;
    let on = true;
    setLoading(true);
    setLoadError(null);
    fetchProviderSettings()
      .then(res => {
        if (!on) return;
        const d = res?.data ?? {};
        const n = d.notifications ?? {};
        const a = d.attendance ?? {};
        const z = d.zoom ?? {};
        const modes = d.options?.zoom_modes;

        setNotifAbsence(!!n.high_absence_rate);
        setNotifReminder(n.trainee_reminder_before_session !== false);
        setMaxDistance(Number(a.allowed_distance_meters ?? 100) || 100);
        setMinAttendance(Number(a.required_attendance_percentage ?? 75) || 75);
        setZoomMode(z.mode === "manual" ? "manual" : "api");
        setApiConfigured(!!z.api_configured);
        if (Array.isArray(modes) && modes.length) setZoomModes(modes);

        // credentials are rarely returned; keep blanks for re-entry
        setAccountId(z.account_id ?? z.accountId ?? "");
        setClientId(z.client_id ?? z.clientId ?? "");
        setClientSecret(z.client_secret ?? z.clientSecret ?? "");
      })
      .catch(err => {
        if (!on) return;
        setLoadError(err.message ?? "تعذر تحميل الإعدادات");
      })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [view]);

  const handleSave = async () => {
    if (zoomMode === "api" && !apiConfigured) {
      if (!accountId.trim() || !clientId.trim() || !clientSecret.trim()) {
        showToast("أدخل بيانات Zoom (Account ID و Client ID و Client Secret)", "error");
        return;
      }
    }

    const payload = {
      notifications: {
        high_absence_rate: !!notifAbsence,
        trainee_reminder_before_session: !!notifReminder,
      },
      attendance: {
        allowed_distance_meters: Number(maxDistance) || 0,
        required_attendance_percentage: Number(minAttendance) || 0,
      },
      zoom: {
        mode: zoomMode,
      },
    };

    if (zoomMode === "api") {
      if (accountId.trim()) payload.zoom.account_id = accountId.trim();
      if (clientId.trim()) payload.zoom.client_id = clientId.trim();
      if (clientSecret.trim()) payload.zoom.client_secret = clientSecret.trim();
    }

    setSaving(true);
    try {
      const res = await updateProviderSettings(payload);
      const z = res?.data?.zoom ?? {};
      if (typeof z.api_configured === "boolean") setApiConfigured(z.api_configured);
      else if (zoomMode === "api" && (accountId || clientId || clientSecret)) setApiConfigured(true);
      if (zoomMode === "api" && clientSecret.trim()) setClientSecret("");
      showToast(res?.message ?? "تم حفظ التغييرات بنجاح", "success");
    } catch (err) {
      showToast(err.message ?? "تعذر حفظ الإعدادات", "error");
    } finally {
      setSaving(false);
    }
  };

  if (view === "categories") {
    return (
      <CategoriesPage
        onBack={indeCoach ? undefined : () => setView("main")}
        onAddProgram={onAddProgram}
        onGoProgram={onViewProgram}
      />
    );
  }
  if (view === "users" && !indeCoach) {
    return (
      <UsersPage
        onBack={indeCoach ? () => setView("categories") : () => setView("main")}
        onAddUser={onAddUser}
        orgName={orgName}
      />
    );
  }

  if (indeCoach) {
    return (
      <CategoriesPage
        onAddProgram={onAddProgram}
        onGoProgram={onViewProgram}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white" dir="ltr">
      <div className="max-w-4xl mx-auto px-3 py-3 space-y-3" dir="rtl">

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <IcoSettings />
            <h1 className="text-base font-bold text-slate-800">الإعدادات</h1>
          </div>
          <button type="button"
            disabled={loading || saving}
            onClick={handleSave}
            className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-bold h-[30px] px-4 rounded-lg border border-slate-200 bg-white transition hover:bg-slate-50 shrink-0 disabled:opacity-50">
            <IcoSave /> {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>

        {loading && (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {!loading && loadError && (
          <p className="text-sm text-red-500 text-center py-8">{loadError}</p>
        )}

        {!loading && !loadError && (
          <>
            <SectionCard icon={<IcoBell />} title="الاشعارات" subtitle="تحكّم في الإشعارات التي يرسلها النظام">
              <div className="space-y-2">
                <SettingRow title="تنبيه المدرب/الأدمن عند ارتفاع نسبة الغياب" icon={<IcoBell />}>
                  <Toggle on={notifAbsence} onChange={setNotifAbsence} />
                </SettingRow>
                <SettingRow title="تفعيل تذكير المتدرب قبل موعد الجلسة" icon={<IcoBell />}>
                  <Toggle on={notifReminder} onChange={setNotifReminder} />
                </SettingRow>
              </div>
            </SectionCard>

            <SectionCard title="إعدادات الحضور">
              <div className="space-y-2">
                <div className="flex flex-col items-start gap-2 rounded-xl border border-slate-200
                  bg-white py-2.5 px-3.5 sm:px-6" dir="rtl">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">المسافة المسموحة (بالمتر)</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      الحد الأقصى للمسافة بين موقع المتدرب ومكان الجلسة لاعتبار تسجيل الحضور صحيحاً
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input type="number" min={0} value={maxDistance}
                      onChange={e => setMaxDistance(+e.target.value)}
                      className="w-16 h-8 rounded-lg border border-slate-200 text-center
                        text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0ABFBF] transition" />
                    <span className="text-[11px] text-slate-500 font-medium">متر</span>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-2 rounded-xl border border-slate-200
                  bg-white py-2.5 px-3.5 sm:px-6" dir="rtl">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700">
                      نسبة الحضور المطلوبة لاعتبار البرنامج مكتملاً (%)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      تُطبّق هذه النسبة على جميع البرامج التدريبية في النظام
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <input type="number" min={0} max={100} value={minAttendance}
                      onChange={e => setMinAttendance(+e.target.value)}
                      className="w-16 h-8 rounded-lg border border-slate-200 text-center
                        text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#0ABFBF] transition" />
                    <span className="text-[11px] text-slate-500 font-medium">%</span>
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={<IcoVideo />}
              title="التكامل مع Zoom"
              subtitle="كيفية ربط الجلسات باجتماعات Zoom">
              <p className="text-xs font-semibold text-slate-700 mb-2">وضع التشغيل الافتراضي</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {zoomModes.map(m => (
                  <RadioOption
                    key={m.value}
                    value={m.value}
                    checked={zoomMode === m.value}
                    onChange={setZoomMode}
                    label={m.label}
                    description={m.description}
                  />
                ))}
              </div>

              {zoomMode === "api" && (
                <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-4">
                  <div className="flex items-center justify-between gap-2" dir="rtl">
                    <div>
                      <p className="text-xs font-bold text-slate-800">بيانات تطبيق Zoom</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Account ID و Client ID و Client Secret من Zoom App Marketplace
                      </p>
                    </div>
                    {apiConfigured && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                        مربوط
                      </span>
                    )}
                  </div>

                  <CredField
                    label="Account ID"
                    value={accountId}
                    onChange={setAccountId}
                    placeholder="Account ID"
                  />
                  <CredField
                    label="Client ID"
                    value={clientId}
                    onChange={setClientId}
                    placeholder="Client ID"
                  />
                  <CredField
                    label="Client Secret"
                    value={clientSecret}
                    onChange={setClientSecret}
                    placeholder={apiConfigured ? "اتركه فارغاً للإبقاء على السر الحالي" : "Client Secret"}
                    secret
                    showSecret={showSecret}
                    onToggleSecret={() => setShowSecret(s => !s)}
                  />
                </div>
              )}
            </SectionCard>
          </>
        )}

      </div>
    </div>
  );
}
