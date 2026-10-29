// ── shared icon primitives ────────────────────────────────────────────────────
const Ico = ({ d, size = 14, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

export const IcoChevL    = () => <Ico size={15} d={<polyline points="15 18 9 12 15 6"/>}/>;
export const IcoChevD    = () => <Ico size={13} d={<polyline points="6 9 12 15 18 9"/>}/>;
export const IcoChevU    = () => <Ico size={13} d={<polyline points="18 15 12 9 6 15"/>}/>;
export const IcoSearch   = () => <Ico size={14} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>}/>;
export const IcoCheck    = () => <Ico size={13} stroke="#22c55e" sw={2.5} d={<polyline points="20 6 9 17 4 12"/>}/>;
export const IcoCalendar = () => <Ico size={13} stroke="#64748b" d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>}/>;
export const IcoPlay     = () => <Ico size={20} fill="#0d1b2e" stroke="none" d={<polygon points="6 3 20 12 6 21 6 3"/>}/>;
export const IcoPause    = () => <Ico size={20} fill="#0d1b2e" stroke="none" d={<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>}/>;
export const IcoSkipB    = () => <Ico size={16} stroke="#fff" sw={2} d={<><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/></>}/>;
export const IcoSkipF    = () => <Ico size={16} stroke="#fff" sw={2} d={<><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></>}/>;
export const IcoVol      = () => <Ico size={14} stroke="#fff" sw={2} d={<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></>}/>;
export const IcoDownload = () => <Ico size={13} stroke="#fff" d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
export const IcoDlDark   = () => <Ico size={13} stroke="currentColor" d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>}/>;
export const IcoFullscr  = () => <Ico size={14} stroke="#fff" sw={2} d={<><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>}/>;
export const IcoStar     = () => <Ico size={13} fill="#f59e0b" stroke="#f59e0b" d={<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>}/>;
export const IcoUsers    = () => <Ico size={13} stroke="#64748b" d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>;
export const IcoFile     = () => <Ico size={13} stroke="#64748b" d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}/>;
export const IcoClock    = () => <Ico size={13} stroke="#64748b" d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}/>;
export const IcoRefresh  = () => <Ico size={13} stroke="currentColor" d={<><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>}/>;
export const IcoSort     = () => <Ico size={14} stroke="#64748b" d={<><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></>}/>;
export const IcoFilter   = () => <Ico size={14} stroke="#64748b" d={<><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>}/>;
export const IcoHeart    = ({ filled = false }) => <Ico size={14} fill={filled ? "currentColor" : "none"} d={<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>}/>;
