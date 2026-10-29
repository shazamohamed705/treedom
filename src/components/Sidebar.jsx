import { useState, useEffect, useRef } from "react";
import { getNavIcon, IconLogout } from "./shared/Icons";
import { isIndeCoach } from "../services/auth";

// ── collapse toggle icon ─────────────────────────────────────────────────────
function IconChevronLeft({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

// ── Treedom tree logo ────────────────────────────────────────────────────────
function TreedomLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* trunk */}
      <rect x="18" y="32" width="4" height="10" rx="2" fill="#5AEACF" />
      {/* main branches */}
      <path d="M20 30 L20 10" stroke="#5AEACF" strokeWidth="2.5" strokeLinecap="round"/>
      {/* left branches */}
      <path d="M20 24 L10 18" stroke="#5AEACF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 18 L12 13" stroke="#5AEACF" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M20 13 L14 9"  stroke="#5AEACF" strokeWidth="1.5" strokeLinecap="round"/>
      {/* right branches */}
      <path d="M20 24 L30 18" stroke="#5AEACF" strokeWidth="2" strokeLinecap="round"/>
      <path d="M20 18 L28 13" stroke="#5AEACF" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M20 13 L26 9"  stroke="#5AEACF" strokeWidth="1.5" strokeLinecap="round"/>
      {/* leaf dots */}
      <circle cx="10" cy="17" r="2.5" fill="#5AEACF" />
      <circle cx="12" cy="12" r="2"   fill="#5AEACF" opacity=".8"/>
      <circle cx="14" cy="8"  r="1.8" fill="#5AEACF" opacity=".6"/>
      <circle cx="30" cy="17" r="2.5" fill="#5AEACF" />
      <circle cx="28" cy="12" r="2"   fill="#5AEACF" opacity=".8"/>
      <circle cx="26" cy="8"  r="1.8" fill="#5AEACF" opacity=".6"/>
      <circle cx="20" cy="9"  r="2.5" fill="#5AEACF" />
    </svg>
  );
}

export default function Sidebar({ data, activeNav, setActiveNav, collapsed, setCollapsed, mobileOpen = false, onClose, onLogout, onSettingsSub, onChildNav, activeSettingsChild, activeChildPath }) {
  const isOpen = mobileOpen;

  // initialise open state from current active path (handles direct URL navigation)
  const [openNav, setOpenNav] = useState(() => {
    if (activeChildPath) {
      const idx = (data.navItems ?? []).findIndex(
        it => it.children?.some(c => c.path === activeChildPath)
      );
      if (idx >= 0) return idx;
    }
    return -1;
  });
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!activeSettingsChild) return;
    const idx = (data.navItems ?? []).findIndex(it => it.icon === "settings");
    if (idx >= 0) setOpenNav(idx);
  }, [activeSettingsChild, data.navItems]);

  // Auto-open parent when a child route is active (e.g. direct URL navigation)
  useEffect(() => {
    if (!activeChildPath) return;
    const idx = (data.navItems ?? []).findIndex(
      it => it.children?.some(c => c.path === activeChildPath)
    );
    if (idx >= 0) setOpenNav(idx);
  }, [activeChildPath, data.navItems]); // eslint-disable-line react-hooks/exhaustive-deps

  // Also auto-open if activeNav points to an item that has children
  useEffect(() => {
    const item = data.navItems?.[activeNav];
    if (item?.children?.length) setOpenNav(activeNav);
  }, [activeNav, data.navItems]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (openNav < 0) return;
    const el = itemRefs.current[openNav];
    if (!el) return;
    const t = setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
    }, 40);
    return () => clearTimeout(t);
  }, [openNav]);

  return (
    <>
      {/* backdrop — only on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          flex flex-col bg-[#024677] text-white
          transition-transform duration-300 ease-in-out
          fixed inset-y-0 right-0 z-50 w-[260px]
          ${isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full shadow-none"}
          lg:static lg:translate-x-0 lg:shadow-none lg:z-auto lg:transition-[width]
          ${collapsed ? "lg:w-[64px]" : "lg:w-[260px]"}
          overflow-hidden
        `}
        dir="rtl"
      >
        {/* ── Move to top & scroll: make nav area fill remaining height ── */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* ── Logo ─────────────────────────────────────────────── */}
          <div className={`py-4 border-b border-white/10 px-4
                           ${collapsed ? "lg:py-3 lg:px-0" : ""}`}>
            <div className={`flex items-center justify-center ${collapsed ? "lg:justify-center" : ""}`}>
              <img src="/Treedom-02-01 1.png" alt="Treedom"
                className="shrink-0 block"
                style={{ width: collapsed ? 40 : 132, height: collapsed ? 40 : 132,
                         objectFit: "contain", margin: "0 auto" }} />
            </div>
          </div>

          {/* ── Org name ─────────────────────────────────────────── */}
          <div className={`px-4 py-2.5 border-b border-white/10 ${collapsed ? "lg:hidden" : ""}`}>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">{data.systemName}</p>
            <p className="text-xs font-semibold text-white mt-0.5 truncate">{data.orgName}</p>
          </div>

          {/* ── Nav ──────────────────────────────────────────────── */}
          <nav className="flex-1 overflow-y-auto scrollbar-hide py-3 px-2 space-y-0.5">
            {data.navItems.map((item, i) => {
              const isSettings  = item.icon === "settings";
              const hasChildren = !!(item.children?.length);
              const isOpenMenu  = openNav === i && !collapsed;
              // child active: current URL segment matches one of the children paths
              const childIsActive = !!(activeChildPath && hasChildren &&
                item.children.some(c => c.path === activeChildPath));
              // also active if activeNav points to this parent (set by navIndexFromPath via kids.some)
              const parentActive = hasChildren && activeNav === i;
              const isActive     = !isSettings && !hasChildren && activeNav === i;
              // highlight whenever: child page is open, activeNav points here, or dropdown is open
              const parentHighlight = childIsActive || parentActive || (hasChildren && isOpenMenu);
              const showSubMenu  = (isSettings || hasChildren) && isOpenMenu;

              return (
                <div key={i} ref={el => { itemRefs.current[i] = el; }}>
                  <button
                    onClick={() => {
                      if (isSettings || hasChildren) {
                        setOpenNav(openNav === i ? -1 : i);
                        return;
                      }
                      setOpenNav(-1);
                      setActiveNav(i);
                      onClose?.();
                    }}
                    title={collapsed ? item.label : undefined}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                      transition-all duration-150
                      ${collapsed ? "lg:justify-center" : ""}
                      ${isActive || parentHighlight
                        ? "bg-teal-400 text-[#0f2a4a] font-semibold shadow-sm"
                        : "text-white"
                      }
                    `}
                  >
                    <span className="shrink-0">{getNavIcon(item.icon, 17)}</span>
                    <span className={`truncate flex-1 text-right ${collapsed ? "lg:hidden" : ""}`}>{item.label}</span>
                    {(isSettings || hasChildren) && !collapsed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        className={`shrink-0 transition-transform duration-200 ${isOpenMenu ? "rotate-180" : ""}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    )}
                  </button>

                  {showSubMenu && isSettings && (
                    <div className="mt-0.5 mr-3 space-y-0.5">
                      {(hasChildren
                        // use children from navItems data (supports sub or path)
                        ? item.children.filter(s => !(isIndeCoach() && (s.sub === "main" || s.sub === "users" || s.sub === "trainees")))
                        // fallback: hardcoded list
                        : [
                            { label: "إعدادات المنظومة العامة",   sub: "main"       },
                            { label: "إدارة المجالات والتصنيفات", sub: "categories" },
                            { label: "الصلاحيات والمستخدمين",     sub: "users"      },
                            { label: "إضافة طلاب",               sub: "trainees"   },
                          ].filter(s => !(isIndeCoach() && (s.sub === "main" || s.sub === "users" || s.sub === "trainees")))
                      ).map(s => {
                        const subKey = s.sub ?? s.path;
                        const childActive = activeSettingsChild === subKey;
                        return (
                          <button
                            key={subKey}
                            onClick={() => { onSettingsSub?.(subKey); onClose?.(); }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-right
                              ${childActive ? "bg-teal-400 text-[#0f2a4a] font-semibold" : "text-white hover:bg-white/10"}`}
                          >
                            <span className={`w-1 h-1 rounded-full shrink-0 ${childActive ? "bg-[#0f2a4a]" : "bg-teal-400/60"}`} />
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {showSubMenu && hasChildren && (
                    <div className="mt-0.5 mr-3 space-y-0.5">
                      {item.children.map(child => {
                        const childActive = activeChildPath === child.path;
                        return (
                          <button
                            key={child.path}
                            onClick={() => {
                              if (onChildNav) onChildNav(child.path);
                              else onClose?.();
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all text-right
                              ${childActive ? "bg-teal-400 text-[#0f2a4a] font-semibold" : "text-white hover:bg-white/10"}`}
                          >
                            <span className={`w-1 h-1 rounded-full shrink-0 ${childActive ? "bg-[#0f2a4a]" : "bg-teal-400/60"}`} />
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* ── Quick stats ────────────────────────────────────────── */}
        {data.stats?.length >= 3 && data.hideStats !== true && (
        <div className={`mx-3 mb-3 rounded-xl bg-white/5 px-3 py-3 border border-white/8 ${collapsed ? "lg:hidden" : ""}`}>
            <div className="flex justify-around text-center gap-1">
              <div>
                <p className="text-xs font-bold text-teal-400">{data.stats[0].value}</p>
                <p className="text-[9px] text-white/80 mt-0.5">متدرب</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs font-bold text-blue-400">{data.stats[1].value}</p>
                <p className="text-[9px] text-white/80 mt-0.5">برنامج</p>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <p className="text-xs font-bold text-purple-400">{data.stats[2].value}</p>
                <p className="text-[9px] text-white/80 mt-0.5">جلسة</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Logout ─────────────────────────────────────────────── */}
        <div className={`px-2 pb-4 pt-1 border-t border-white/10`}>
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-white transition-all text-sm
                        ${collapsed ? "lg:justify-center" : ""}`}
            title={collapsed ? "تسجيل الخروج" : undefined}
          >
            <span className="shrink-0"><IconLogout size={17} /></span>
              <span className={collapsed ? "lg:hidden" : ""}>تسجيل الخروج</span>
          </button>
        </div>


      </aside>
    </>
  );
}