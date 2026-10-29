import { useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IconSearch, IconBell, IconMenu } from "./shared/Icons";
import { useNotifications, isUrgentSessionNotif } from "../context/NotificationContext";
import { markNotificationRead, markAllNotificationsRead, globalSearchPrograms } from "../services/api";
import { getUserRole, getUser, isIndeCoach } from "../services/auth";
import { NOTIF_COLORS, TEAL } from "../constants/colors";

// ── cycling constants — mirrors NotifFeed ─────────────────────────────────────
const DROP_PAGE  = 4;   // items visible at once in the dropdown
const CYCLE_MS   = 3200; // same as NotifFeed

// ── type → color mapping — now from central colors file ──────────────────────
function dotColor(type) { return NOTIF_COLORS[type] ?? TEAL; }

// ── mini bell icon (inline, no external dep) ──────────────────────────────────
function BellSvg({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

// ── dropdown notification row ─────────────────────────────────────────────────
function DropRow({ notif, role, onRead }) {
  const urgent = !notif.is_read && isUrgentSessionNotif(notif);
  const color = urgent ? "#dc2626" : dotColor(notif.type);

  const handleClick = async () => {
    if (!notif.is_read) {
      if (isIndeCoach()) {
        onRead(notif.id);
      } else {
        try { await markNotificationRead(notif.id, role); } catch { /* silent */ }
        onRead(notif.id);
      }
    }
    if (notif.url) window.open(notif.url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-right transition-colors
                  ${notif.is_read ? "hover:bg-slate-50" : urgent ? "bg-red-50 hover:bg-red-100" : "bg-teal-50/50 hover:bg-teal-50/80"}`}
      dir="rtl"
    >
      {/* colored left-border indicator */}
      <span className="shrink-0 w-1 self-stretch rounded-full mt-0.5"
        style={{ background: notif.is_read ? "#e2e8f0" : color }} />

      <div className="flex-1 min-w-0">
        <p className={`text-xs leading-snug truncate
                       ${notif.is_read ? "text-slate-500" : "text-slate-800 font-medium"}`}>
          {notif.title ?? notif.text ?? ""}
        </p>
        {notif.body && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
            {notif.body}
          </p>
        )}
        <p className="text-[10px] text-slate-400 mt-1">{notif.created_at ?? notif.time ?? ""}</p>
      </div>

      {!notif.is_read && (
        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
          style={{ background: color }} />
      )}
    </button>
  );
}

// ── Saudi Riyal icon (small, inline) ─────────────────────────────────────────
function RiyalSm() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39"
      width={9} height={10} style={{ display:"inline-block", verticalAlign:"middle", marginLeft:1, flexShrink:0 }}>
      <path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/>
      <path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/>
    </svg>
  );
}

// ── type label map ────────────────────────────────────────────────────────────
const TYPE_LABEL = { online:"أونلاين", offline:"حضوري", recorded:"مسجل" };

// ── search result row ─────────────────────────────────────────────────────────
function SearchResultRow({ item, onSelect }) {
  const typeKey = (item.type ?? "").toLowerCase();
  const typeColor = typeKey === "online" || typeKey === "أونلاين"   ? "#0B5CFF"
                  : typeKey === "offline"|| typeKey === "حضوري"     ? "#6b7280"
                  : typeKey === "recorded"||typeKey === "مسجل"      ? "#d97706"
                  : "#6b7280";
  const typeText = TYPE_LABEL[typeKey] ?? item.type ?? "";

  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition text-right"
      dir="rtl"
    >
      {/* thumbnail */}
      <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-[#0a1628] flex items-center justify-center">
        {item.img
          ? <img src={item.img} alt="" className="w-full h-full object-cover" />
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        }
      </div>
      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-800 truncate leading-snug">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {typeText && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: `${typeColor}18`, color: typeColor }}>
              {typeText}
            </span>
          )}
          {item.trainer && (
            <span className="text-[10px] text-slate-400 truncate">{item.trainer}</span>
          )}
        </div>
      </div>
      {/* price */}
      {item.price > 0 && (
        <span className="shrink-0 text-[11px] font-bold flex items-center" style={{ color:"#31AFEA" }}>
          {item.price.toFixed(0)}<RiyalSm/>
        </span>
      )}
    </button>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Topbar({ onToggleSidebar, systemLabel, onGoNotifications, onSearchSelect }) {
  const navigate   = useNavigate();
  const role       = getUserRole() ?? "org";
  const ctx        = useNotifications();
  const currentUser = getUser();

  // ── search state ──────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const searchRef   = useRef(null);
  const debounceRef = useRef(null);

  // debounced fetch
  const doSearch = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await globalSearchPrograms(q.trim());
        setSearchResults(results);
        setSearchOpen(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    doSearch(q);
  };

  const handleSearchSelect = (item) => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    if (onSearchSelect) onSearchSelect(item);
  };

  // close on outside click
  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen]);

  const unread     = ctx?.unread     ?? 0;
  const recentList = ctx?.recentList ?? [];

  const [open,    setOpen]    = useState(false);
  const [ringing, setRinging] = useState(false);
  const prevUnread            = useRef(unread);
  const ringTimer             = useRef(null);
  const panelRef              = useRef(null);
  const bellRef               = useRef(null);

  // ── cycling state (mirrors NotifFeed) ────────────────────────────────────
  const [cycleStart, setCycleStart] = useState(0);
  const [fade,       setFade]       = useState(true);
  const cycleTimer                  = useRef(null);

  // restart cycling whenever the list changes or dropdown opens
  useEffect(() => {
    clearInterval(cycleTimer.current);
    setCycleStart(0);
    setFade(true);
    if (!open || recentList.length <= DROP_PAGE) return;
    cycleTimer.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCycleStart(prev => (prev + DROP_PAGE) % recentList.length);
        setFade(true);
      }, 250); // same fade-out delay as NotifFeed
    }, CYCLE_MS);
    return () => clearInterval(cycleTimer.current);
  }, [open, recentList.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // visible slice (circular), same logic as NotifFeed
  const visibleDrop = (() => {
    const total = recentList.length;
    if (total === 0) return [];
    const result = [];
    for (let i = 0; i < Math.min(DROP_PAGE, total); i++) {
      result.push(recentList[(cycleStart + i) % total]);
    }
    return result;
  })();

  // fire bell animation whenever unread count increases
  useEffect(() => {
    if (unread > prevUnread.current) {
      // reset first so re-trigger works even on back-to-back notifications
      setRinging(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setRinging(true);
          clearTimeout(ringTimer.current);
          ringTimer.current = setTimeout(() => setRinging(false), 2100);
        });
      });
    }
    prevUnread.current = unread;
    return () => clearTimeout(ringTimer.current);
  }, [unread]);

  // close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleBellClick = () => {
    setOpen(o => !o);
    // refresh list when opening
    if (!open) ctx?.refresh?.();
  };

  const handleReadOne = (id) => {
    if (isIndeCoach()) {
      ctx?.markLocalRead?.(id);
      return;
    }
    ctx?.decrementUnread();
    if (ctx?.recentList) {
      ctx.recentList.forEach(n => { if (n.id === id) n.is_read = true; });
    }
  };

  const handleMarkAll = async () => {
    try {
      if (isIndeCoach()) {
        ctx?.markAllLocalRead?.();
        return;
      }
      await markAllNotificationsRead(role);
      ctx?.setUnread(0);
      if (ctx?.recentList) ctx.recentList.forEach(n => { n.is_read = true; });
    } catch { /* silent */ }
  };

  const handleViewAll = () => {
    setOpen(false);
    if (onGoNotifications) onGoNotifications();
    else if (isIndeCoach()) navigate("/dashboard/activity-log");
    else navigate("/dashboard/notifications");
  };

  // badge label: cap at 99+
  const badgeLabel = unread > 99 ? "99+" : String(unread);

  return (
    <header
      className="h-16 sm:h-[72px] bg-[#024677] border-b border-white/10 flex items-center
                 px-3 sm:px-6 gap-2 sm:gap-4 shrink-0 z-20"
      dir="rtl"
    >
      {/* Right: toggle + welcome */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="text-white/80 hover:text-white transition p-2 rounded-lg
                     hover:bg-white/10 shrink-0"
          aria-label="تبديل الشريط الجانبي"
        >
          <IconMenu size={22} />
        </button>
        <div className="hidden md:block min-w-0 max-w-[220px]">
          <p className="text-base font-semibold text-white truncate">
            مرحباً،{" "}
            <span className="text-teal-300">{currentUser?.name ?? currentUser?.full_name ?? ""}</span>
          </p>
          <p className="text-xs text-white/50 leading-tight mt-0.5">{systemLabel}</p>
        </div>
      </div>

      {/* search + bell */}
      <div className="flex items-center gap-2 flex-1 min-w-0 relative">

        {/* ── smart search box ── */}
        <div className="relative flex-1 min-w-0 sm:flex-none sm:ms-auto" ref={searchRef}>
          <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 sm:px-3.5 sm:py-2.5 shadow-sm w-full sm:w-[340px] sm:min-w-[260px]">
            {searchLoading ? (
              <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className="shrink-0">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            )}
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
              placeholder={role === "coach" || role === "trainer"
                ? "ابحث في البرامج والجلسات..."
                : "البحث في البرامج..."}
              className="flex-1 min-w-0 text-sm text-slate-700 placeholder:text-slate-400
                         bg-transparent outline-none border-none"
              dir="rtl"
            />
            {searchQuery && (
              <button onMouseDown={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                className="shrink-0 text-slate-400 hover:text-slate-600 transition">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* dropdown */}
          {searchOpen && (
            <div className="absolute top-full mt-1.5 left-0 right-0 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-2xl
                            border border-slate-100 overflow-hidden z-50" dir="rtl">
              <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">
                  {searchLoading ? "جارٍ البحث..." : `${searchResults.length} نتيجة`}
                </span>
                <button onMouseDown={() => { setSearchOpen(false); setSearchQuery(""); setSearchResults([]); }}
                  className="text-slate-400 hover:text-slate-600 transition">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {searchResults.length === 0 && !searchLoading && (
                  <div className="py-8 text-center">
                    <p className="text-sm text-slate-400">لا توجد نتائج</p>
                  </div>
                )}
                {searchResults.map(item => (
                  <SearchResultRow key={item.id} item={item} onSelect={handleSearchSelect} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* bell button */}
        <button
          ref={bellRef}
          onClick={handleBellClick}
          className={`relative p-2 sm:p-2.5 rounded-xl transition shrink-0
                      ${ringing ? "bell-ringing" : ""}
                      ${open
                        ? "bg-white/20 text-white"
                        : "text-white/60 hover:bg-white/10 hover:text-white"}`}
          aria-label="الإشعارات"
          aria-expanded={open}
        >
          <IconBell size={20} />

          {/* badge — only show when there are unread notifications */}
          {unread > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5
                         bg-red-500 text-white text-[9px] font-bold
                         rounded-full flex items-center justify-center leading-none"
            >
              {badgeLabel}
            </span>
          )}
        </button>

        {/* ── dropdown panel ── */}
        {open && (
          <div
            ref={panelRef}
            className="absolute left-0 top-full mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-2xl
                       shadow-xl border border-slate-100 overflow-hidden z-50"
            dir="rtl"
          >
            {/* panel header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[#024677]"><BellSvg size={15} /></span>
                <span className="text-sm font-bold text-slate-800">الإشعارات</span>
                {unread > 0 && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                    {unread} جديد
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* refresh button */}
                <button
                  onClick={() => ctx?.refresh?.()}
                  title="تحديث"
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-100 transition text-slate-400 hover:text-[#31AFEA]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                    className={ctx?.loading ? "animate-spin" : ""}>
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </button>
                {unread > 0 && (
                  <button
                    onClick={handleMarkAll}
                    className="text-[11px] font-medium text-teal-600 hover:text-teal-700 transition"
                  >
                    قراءة الكل
                  </button>
                )}
              </div>
            </div>

            {/* notification list */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
              {ctx?.loading && recentList.length === 0 && (
                <div className="py-6 text-center">
                  <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent
                                  rounded-full animate-spin mx-auto" />
                </div>
              )}
              {!ctx?.loading && recentList.length === 0 && (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-400">لا توجد إشعارات</p>
                </div>
              )}
              {/* cycling list — same fade behaviour as NotifFeed */}
              <div
                className="transition-opacity duration-300"
                style={{ opacity: fade ? 1 : 0 }}
              >
                {visibleDrop.map(n => (
                  <DropRow
                    key={`${cycleStart}-${n.id}`}
                    notif={n}
                    role={role}
                    onRead={handleReadOne}
                  />
                ))}
              </div>
              {/* pager dots — shown when there are more than DROP_PAGE items */}
              {recentList.length > DROP_PAGE && (
                <div className="flex justify-center gap-1 py-2">
                  {Array.from({ length: Math.ceil(recentList.length / DROP_PAGE) }).map((_, i) => {
                    const active = Math.floor(cycleStart / DROP_PAGE) === i;
                    return (
                      <span
                        key={i}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width:      active ? 14 : 6,
                          height:     6,
                          background: active ? "#14b8a6" : "#e2e8f0",
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* panel footer */}
            <div className="border-t border-slate-100 px-3 py-2 text-center">
              <button
                onClick={handleViewAll}
                className="text-xs font-semibold text-[#024677] hover:text-teal-600 transition"
              >
                {isIndeCoach() ? "عرض سجل النشاطات ←" : "عرض جميع الإشعارات ←"}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
