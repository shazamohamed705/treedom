import Portal from "./Portal";

const IcoX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

export default function SuccessModal({ onClose }) {
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden w-full"
          style={{ maxWidth: 360 }} dir="rtl">

          {/* close */}
          <div className="flex justify-start px-4 pt-4 shrink-0">
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-slate-400
                hover:bg-slate-100 transition">
              <IcoX />
            </button>
          </div>

          {/* icon + content */}
          <div className="flex flex-col items-center px-8 pb-8 pt-2 text-center gap-4">

            {/* exact SVG from design: people body + green check badge */}
            <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"
              viewBox="0 0 127 127" fill="none">
              {/* body shape 1 */}
              <path d="M14.967 67.05C13.0047 67.0411 11.06 67.42 9.24447 68.1648C7.42898 68.9097 5.77849 70.0058 4.38779 71.3903C2.99709 72.7748 1.89356 74.4203 1.14058 76.2324C0.387591 78.0446 -1.98681e-05 79.9876 7.6382e-10 81.95C7.6382e-10 94.5479 6.20585 104.047 15.9058 110.238C25.4566 116.324 38.3302 119.2 52.15 119.2C65.9697 119.2 78.8433 116.324 88.3942 110.238C98.0941 104.054 104.3 94.5405 104.3 81.95C104.3 77.9982 102.73 74.2084 99.9359 71.4141C97.1416 68.6198 93.3517 67.05 89.4 67.05H14.967Z"
                fill="url(#sc1)"/>
              {/* body shape 2 overlay */}
              <path d="M14.967 67.05C13.0047 67.0411 11.06 67.42 9.24447 68.1648C7.42898 68.9097 5.77849 70.0058 4.38779 71.3903C2.99709 72.7748 1.89356 74.4203 1.14058 76.2324C0.387591 78.0446 -1.98681e-05 79.9876 7.6382e-10 81.95C7.6382e-10 94.5479 6.20585 104.047 15.9058 110.238C25.4566 116.324 38.3302 119.2 52.15 119.2C65.9697 119.2 78.8433 116.324 88.3942 110.238C98.0941 104.054 104.3 94.5405 104.3 81.95C104.3 77.9982 102.73 74.2084 99.9359 71.4141C97.1416 68.6198 93.3517 67.05 89.4 67.05H14.967Z"
                fill="url(#sc2)"/>
              {/* head circle */}
              <path d="M52.1516 0C44.2481 0 36.6684 3.13963 31.0798 8.72822C25.4912 14.3168 22.3516 21.8965 22.3516 29.8C22.3516 37.7035 25.4912 45.2832 31.0798 50.8718C36.6684 56.4604 44.2481 59.6 52.1516 59.6C60.055 59.6 67.6348 56.4604 73.2233 50.8718C78.8119 45.2832 81.9516 37.7035 81.9516 29.8C81.9516 21.8965 78.8119 14.3168 73.2233 8.72822C67.6348 3.13963 60.055 0 52.1516 0Z"
                fill="url(#sc3)"/>
              {/* green check circle */}
              <path d="M126.652 93.1246C126.652 84.2332 123.119 75.706 116.832 69.4189C110.545 63.1317 102.018 59.5996 93.1266 59.5996C84.2352 59.5996 75.708 63.1317 69.4208 69.4189C63.1337 75.706 59.6016 84.2332 59.6016 93.1246C59.6016 102.016 63.1337 110.543 69.4208 116.83C75.708 123.118 84.2352 126.65 93.1266 126.65C102.018 126.65 110.545 123.118 116.832 116.83C123.119 110.543 126.652 102.016 126.652 93.1246Z"
                fill="url(#sc4)"/>
              {/* white check mark */}
              <path fillRule="evenodd" clipRule="evenodd"
                d="M107.36 81.27C107.724 81.057 108.16 80.989 108.577 81.082C108.993 81.175 109.357 81.423 109.592 81.776L111.22 84.26C111.434 84.584 111.525 84.972 111.478 85.357C111.431 85.741 111.249 86.097 110.963 86.361L110.957 86.367L110.934 86.389L110.84 86.477L110.47 86.829C108.433 88.806 106.457 90.844 104.546 92.942C100.97 96.866 96.726 102 93.866 106.975C93.067 108.37 91.114 108.672 89.958 107.465L79.375 96.463C79.223 96.305 79.104 96.118 79.026 95.913C78.947 95.708 78.911 95.488 78.919 95.268C78.927 95.048 78.979 94.832 79.072 94.634C79.165 94.435 79.298 94.258 79.46 94.113L82.681 91.219C82.963 90.964 83.323 90.817 83.7 90.8C84.077 90.783 84.448 90.897 84.75 91.124L90.156 95.164C98.574 86.884 103.344 83.698 107.36 81.27Z"
                fill="white"/>
              <defs>
                <linearGradient id="sc1" x1="24.801" y1="73.9859" x2="41.6529" y2="127.79" gradientUnits="userSpaceOnUse">
                  <stop offset="0.125" stopColor="#2075B2"/><stop offset="1" stopColor="#075396"/>
                </linearGradient>
                <linearGradient id="sc2" x1="52.15" y1="60.8441" x2="75.7441" y2="149" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#075396"/><stop offset="1" stopColor="#2075B2"/>
                </linearGradient>
                <linearGradient id="sc3" x1="36.5215" y1="7.91935" x2="66.8951" y2="56.4263" gradientUnits="userSpaceOnUse">
                  <stop offset="0.125" stopColor="#2075B2"/><stop offset="1" stopColor="#075396"/>
                </linearGradient>
                <linearGradient id="sc4" x1="61.993" y1="72.1752" x2="108.265" y2="120.25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#52D17C"/><stop offset="1" stopColor="#22918B"/>
                </linearGradient>
              </defs>
            </svg>

            <h2 className="text-lg font-extrabold" style={{ color: "#1D293D" }}>
              تم تسجيل الموظفين بنجاح
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>
              تم تسجيل الموظفين في البرامج وإرسال إشعارات بالتفاصيل
            </p>
            <button onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-bold text-white mt-1
                transition hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#26AA57 0%,#22918B 100%)" }}>
              موافق
            </button>
          </div>

        </div>
      </div>
    </Portal>
  );
}
