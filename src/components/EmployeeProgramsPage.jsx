import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCompanyEnrolledPrograms } from "../services/api";

// ─── colours ──────────────────────────────────────────────────────────────────
const BRAND = "#024677";
const TEAL  = "#14b8a6";
const GOLD  = "#f59e0b";

// ─── icon helper ──────────────────────────────────────────────────────────────
const I = ({ d, size = 16, stroke = "currentColor", sw = 1.8, fill = "none" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ display: "block" }}>{d}</svg>
);
const IcoGrad     = ({ size = 20 }) => <I size={size} d={<><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></>} />;
const IcoLock     = ({ size = 20 }) => <I size={size} d={<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>} />;
const IcoChart    = ({ size = 20 }) => <I size={size} d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>} />;
const IcoUsers    = ({ size = 20 }) => <I size={size} d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>} />;
const IcoCalendar = ({ size = 13 }) => <I size={size} d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />;
const IcoSeat     = ({ size = 13 }) => <I size={size} d={<><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>} />;
const IcoUserSm   = ({ size = 13 }) => <I size={size} d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>} />;
const IcoSearch   = ({ size = 14 }) => <I size={size} d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />;
const IcoFilter   = ({ size = 14 }) => <I size={size} d={<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>} />;
const IcoChevron  = ({ size = 12 }) => <I size={size} d={<polyline points="6 9 12 15 18 9"/>} />;
const IcoBack     = ({ size = 16 }) => <I size={size} sw={2} d={<><polyline points="15 18 9 12 15 6"/></>} />;
const IcoPin      = ({ size = 14 }) => <I size={size} d={<><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>} />;

// ─── stat icons (brand navy / green-check variants) ──────────────────────────
function IcoStat1({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path fillRule="evenodd" clipRule="evenodd" d="M22.9173 1.43646C24.627 1.09222 26.3713 0.951241 28.114 1.01646C28.5165 1.0321 28.8984 1.19902 29.1832 1.48388C29.4681 1.76874 29.635 2.15058 29.6507 2.55313C29.6907 3.49713 29.6953 5.48579 29.2307 7.74979C28.9573 9.08513 27.3513 9.44713 26.466 8.56113L25.188 7.28379C24.6903 7.73404 24.1985 8.19074 23.7127 8.65379C22.452 9.85446 20.8707 11.4418 19.5367 13.0265C18.402 14.3745 16.2253 14.3651 15.16 12.8731C14.4863 11.9272 13.7865 11.0002 13.0613 10.0931C11.572 11.1125 8.48 13.4585 5.004 17.4331C4.788 17.6798 4.57111 17.9327 4.35333 18.1918C4.12551 18.4623 3.79956 18.6313 3.44718 18.6614C3.0948 18.6916 2.74485 18.5806 2.47433 18.3528C2.20381 18.125 2.03487 17.799 2.00468 17.4466C1.97449 17.0943 2.08551 16.7443 2.31333 16.4738C2.54267 16.2027 2.77022 15.9376 2.996 15.6785C6.72267 11.4171 10.054 8.91046 11.658 7.82246C12.78 7.06179 14.252 7.32379 15.0753 8.34246C15.8552 9.31409 16.6069 10.3081 17.3293 11.3231C17.3342 11.3292 17.34 11.3344 17.3467 11.3385C17.3621 11.345 17.3786 11.3487 17.3953 11.3491C17.4141 11.3504 17.433 11.3475 17.4505 11.3406C17.468 11.3337 17.4838 11.3229 17.4967 11.3091C18.9207 9.61779 20.5807 7.95446 21.8727 6.72313C22.428 6.19446 22.9193 5.74113 23.3 5.39646L22.1067 4.20046C21.2207 3.31513 21.5827 1.70979 22.918 1.43579M22.51 28.4825C22.422 27.2758 22.334 25.1231 22.334 21.3325C22.334 17.5418 22.422 15.3898 22.51 14.1818C22.6073 12.8418 23.586 11.7965 24.978 11.7111C25.4207 11.6845 25.976 11.6658 26.6673 11.6658C27.3587 11.6658 27.914 11.6845 28.3567 11.7111C29.7487 11.7965 30.7273 12.8418 30.8247 14.1818C30.9127 15.3898 31.0007 17.5418 31.0007 21.3325C31.0007 25.1231 30.9127 27.2751 30.8247 28.4831C30.7273 29.8231 29.7487 30.8685 28.3567 30.9538C27.914 30.9805 27.3587 30.9991 26.6673 30.9991C25.976 30.9991 25.4207 30.9805 24.978 30.9538C23.586 30.8685 22.6073 29.8225 22.51 28.4825ZM1.11333 28.8465C1.04867 28.2171 1 27.3105 1 25.9998C1 24.6891 1.04867 23.7825 1.11267 23.1531C1.24667 21.8265 2.31133 21.0658 3.47733 21.0265C4.09581 21.0073 4.71456 20.9984 5.33333 20.9998C6.12467 20.9998 6.73133 21.0111 7.18933 21.0265C8.35533 21.0658 9.42 21.8265 9.554 23.1531C9.618 23.7825 9.66667 24.6891 9.66667 25.9998C9.66667 27.3105 9.618 28.2171 9.55467 28.8465C9.42 30.1731 8.35467 30.9338 7.18933 30.9731C6.73133 30.9885 6.12467 30.9998 5.33333 30.9998C4.542 30.9998 3.93533 30.9885 3.47733 30.9731C2.31133 30.9338 1.24733 30.1731 1.11333 28.8465ZM11.6667 23.9998C11.6667 26.2738 11.7327 27.7091 11.8087 28.6111C11.9233 29.9765 12.9687 30.9091 14.2887 30.9671C14.7313 30.9865 15.2927 30.9998 16 30.9998C16.7073 30.9998 17.2687 30.9865 17.7113 30.9665C19.0313 30.9091 20.0767 29.9765 20.1913 28.6111C20.2673 27.7091 20.3333 26.2738 20.3333 23.9998C20.3333 21.7258 20.2673 20.2905 20.192 19.3885C20.0767 18.0231 19.032 17.0905 17.7113 17.0325C17.2687 17.0131 16.7073 16.9998 16 16.9998C15.2927 16.9998 14.7313 17.0131 14.2893 17.0331C12.9687 17.0905 11.9227 18.0231 11.808 19.3885C11.7333 20.2905 11.6667 21.7258 11.6667 23.9998Z" fill="#024677"/>
    </svg>
  );
}
function IcoStat2({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M24.8469 15.475C23.4716 14.0998 21.6064 13.3271 19.6615 13.3271C17.7165 13.3271 15.8513 14.0998 14.476 15.475C13.1007 16.8503 12.3281 18.7156 12.3281 20.6605C12.3281 22.6054 13.1007 24.4707 14.476 25.8459C15.8513 27.2212 17.7165 27.9938 19.6615 27.9938C21.6064 27.9938 23.4716 27.2212 24.8469 25.8459C26.2222 24.4707 26.9948 22.6054 26.9948 20.6605C26.9948 18.7156 26.2222 16.8503 24.8469 15.475Z" fill="#26AA57"/>
      <path d="M2.39453 3.72734C2.39453 2.87865 2.73167 2.06472 3.33179 1.4646C3.93191 0.864486 4.74584 0.527344 5.59453 0.527344H18.3945C19.2432 0.527344 20.0572 0.864486 20.6573 1.4646C21.2574 2.06472 21.5945 2.87865 21.5945 3.72734V12.0585C20.0873 11.6306 18.4931 11.6129 16.9766 12.0072C15.4602 12.4015 14.0766 13.1935 12.9686 14.3015C11.8607 15.4094 11.0687 16.793 10.6744 18.3095C10.2801 19.8259 10.2978 21.4201 10.7257 22.9273H3.99453C3.99453 23.3517 4.1631 23.7587 4.46316 24.0587C4.76322 24.3588 5.17018 24.5273 5.59453 24.5273H11.3545C11.6489 25.1012 11.9993 25.6345 12.4057 26.1273H5.59453C4.74584 26.1273 3.93191 25.7902 3.33179 25.1901C2.73167 24.59 2.39453 23.776 2.39453 22.9273V3.72734ZM6.79453 3.72734C6.47627 3.72734 6.17105 3.85377 5.946 4.07882C5.72096 4.30386 5.59453 4.60908 5.59453 4.92734V5.72734C5.59453 6.38974 6.13213 6.92734 6.79453 6.92734H17.1945C17.5128 6.92734 17.818 6.80092 18.0431 6.57587C18.2681 6.35083 18.3945 6.0456 18.3945 5.72734V4.92734C18.3945 4.60908 18.2681 4.30386 18.0431 4.07882C17.818 3.85377 17.5128 3.72734 17.1945 3.72734H6.79453Z" fill="#024677"/>
    </svg>
  );
}
function IcoStat3({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M23.4286 27.2246L29.1837 21.4286C29.5102 21.1021 29.8982 20.9389 30.3477 20.9389C30.7973 20.9389 31.1848 21.1021 31.5102 21.4286C31.8356 21.7552 31.9989 22.1432 32 22.5927C32.0011 23.0423 31.8378 23.4297 31.5102 23.7552L24.5714 30.694C24.2449 31.0205 23.8574 31.1837 23.409 31.1837C22.9605 31.1837 22.5725 31.0205 22.2449 30.694L18.7755 27.2246C18.4762 26.898 18.3265 26.5105 18.3265 26.0621C18.3265 25.6137 18.4898 25.2257 18.8163 24.898C19.1429 24.5704 19.5238 24.4072 19.9592 24.4082C20.3946 24.4093 20.7755 24.5726 21.102 24.898L23.4286 27.2246ZM9.32571 16.6744C9.63918 16.3609 9.79592 15.9729 9.79592 15.5103C9.79592 15.0477 9.63918 14.6602 9.32571 14.3478C9.01224 14.0355 8.62476 13.8787 8.16326 13.8776C7.70177 13.8765 7.31428 14.0333 7.00082 14.3478C6.68735 14.6624 6.53061 15.0499 6.53061 15.5103C6.53061 15.9707 6.68735 16.3587 7.00082 16.6744C7.31428 16.99 7.70177 17.1462 8.16326 17.1429C8.62476 17.1397 9.01279 16.9829 9.32735 16.6727M9.32735 10.1421C9.63973 9.83083 9.79592 9.44334 9.79592 8.97967C9.79592 8.516 9.63918 8.12851 9.32571 7.81722C9.01224 7.50593 8.62476 7.34919 8.16326 7.34702C7.70177 7.34484 7.31428 7.50158 7.00082 7.81722C6.68735 8.13287 6.53061 8.52035 6.53061 8.97967C6.53061 9.43899 6.68735 9.82702 7.00082 10.1438C7.31428 10.4605 7.70177 10.6167 8.16326 10.6123C8.62476 10.608 9.01279 10.4512 9.32735 10.1421ZM21.2245 17.1429C21.6871 17.1429 22.0751 16.9862 22.3886 16.6727C22.702 16.3593 22.8582 15.9718 22.8571 15.5103C22.8561 15.0488 22.6993 14.6613 22.3869 14.3478C22.0746 14.0344 21.6871 13.8776 21.2245 13.8776H14.6939C14.2313 13.8776 13.8438 14.0344 13.5314 14.3478C13.219 14.6613 13.0623 15.0488 13.0612 15.5103C13.0601 15.9718 13.2169 16.3598 13.5314 16.6744C13.846 16.9889 14.2335 17.1451 14.6939 17.1429H21.2245ZM21.2245 10.6123C21.6871 10.6123 22.0751 10.4556 22.3886 10.1421C22.702 9.82865 22.8582 9.44117 22.8571 8.97967C22.8561 8.51817 22.6993 8.13069 22.3869 7.81722C22.0746 7.50375 21.6871 7.34702 21.2245 7.34702H14.6939C14.2313 7.34702 13.8438 7.50375 13.5314 7.81722C13.219 8.13069 13.0623 8.51817 13.0612 8.97967C13.0601 9.44117 13.2169 9.82919 13.5314 10.1438C13.846 10.4583 14.2335 10.6145 14.6939 10.6123H21.2245ZM3.26531 30.2042C2.36735 30.2042 1.59891 29.8847 0.96 29.2458C0.321088 28.6069 0.00108844 27.8379 0 26.9389V4.08171C0 3.18375 0.32 2.41532 0.96 1.77641C1.6 1.13749 2.36843 0.817495 3.26531 0.816406H26.1224C27.0204 0.816406 27.7894 1.13641 28.4294 1.77641C29.0694 2.41641 29.3888 3.18484 29.3877 4.08171V15.3062C29.3877 15.7416 29.2996 16.1568 29.1233 16.5519C28.9469 16.947 28.7086 17.2937 28.4082 17.5919L23.4286 22.6123L22.2449 21.4286C21.619 20.8028 20.8506 20.4899 19.9396 20.4899C19.0286 20.4899 18.2596 20.8028 17.6327 21.4286L15.3469 23.7552C15.0204 24.0817 14.7755 24.4425 14.6122 24.8376C14.449 25.2327 14.3673 25.6338 14.3673 26.0409C14.3673 26.4218 14.4218 26.7691 14.5306 27.0825C14.6395 27.396 14.8027 27.7018 15.0204 28.0001C15.3469 28.4627 15.4084 28.9459 15.2049 29.4499C15.0014 29.9538 14.6405 30.2052 14.1224 30.2042H3.26531Z" fill="#024677"/>
    </svg>
  );
}
function IcoStatNotYet({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M23.9987 14.6663C24.932 14.6663 25.8254 14.7997 26.6654 15.053V13.333C26.6654 11.8663 25.4654 10.6663 23.9987 10.6663H22.6654V7.99967C22.6654 4.31967 19.6787 1.33301 15.9987 1.33301C12.3187 1.33301 9.33203 4.31967 9.33203 7.99967V10.6663H7.9987C6.53203 10.6663 5.33203 11.8663 5.33203 13.333V26.6663C5.33203 28.133 6.53203 29.333 7.9987 29.333H16.3454C15.3687 27.9345 14.7943 26.2949 14.6846 24.5926C14.575 22.8903 14.9342 21.1906 15.7234 19.6783C16.5125 18.166 17.7013 16.8991 19.1604 16.0154C20.6194 15.1317 22.2929 14.6651 23.9987 14.6663ZM11.9987 7.99967C11.9987 5.78634 13.7854 3.99967 15.9987 3.99967C18.212 3.99967 19.9987 5.78634 19.9987 7.99967V10.6663H11.9987V7.99967Z" fill="#024677"/>
      <path d="M23.9987 17.333C20.3187 17.333 17.332 20.3197 17.332 23.9997C17.332 27.6797 20.3187 30.6663 23.9987 30.6663C27.6787 30.6663 30.6654 27.6797 30.6654 23.9997C30.6654 20.3197 27.6787 17.333 23.9987 17.333ZM26.6654 26.6663C26.3987 26.933 25.9854 26.933 25.7187 26.6663L23.5187 24.4663C23.3931 24.3433 23.3212 24.1755 23.3187 23.9997V20.6663C23.3187 20.293 23.612 19.9997 23.9854 19.9997C24.3587 19.9997 24.652 20.293 24.652 20.6663V23.7197L26.652 25.7197C26.932 25.9863 26.932 26.3997 26.6654 26.6663Z" fill="#024677"/>
    </svg>
  );
}
function IcoStat4({ size = 22 }) {
  return IcoStat3({ size });
}

// ─── mock data ────────────────────────────────────────────────────────────────
const PROGRAMS = [
  {
    id: 1,
    name: "الدليل الشامل لشهادة مهندس حلول AWS المعتمد – Associate SAA-C03 –",
    category: "التقنية والمعلومات",
    mode: "أونلاين",
    status: "قيد التنفيذ",
    daysLeft: 11,
    enrolled: 12, enrolledTotal: 20,
    seatsLeft: 8,
    startDate: "12 مايو 2026",
    trainer: "م. كريم مصطفى الزيات",
    trainerRole: "أكاديمية الريادة الخليجية",
    sessions: 6, sessionsTotal: 12,
    endDate: "28 فبراير 2026",
  },
  {
    id: 2,
    name: "الدليل الشامل لشهادة مهندس حلول AWS المعتمد – Associate SAA-C03 –",
    category: "التقنية والمعلومات",
    mode: "أوفلاين",
    status: "مكتمل",
    daysLeft: null,
    enrolled: 12, enrolledTotal: 20,
    seatsLeft: 0,
    startDate: null,
    trainer: "م. كريم مصطفى الزيات",
    trainerRole: "أكاديمية الريادة الخليجية",
    sessions: 6, sessionsTotal: 6,
    endDate: "28 فبراير 2026",
  },
  {
    id: 3,
    name: "الدليل الشامل لشهادة مهندس حلول AWS المعتمد – Associate SAA-C03 –",
    category: "التقنية والمعلومات",
    mode: "أونلاين",
    status: "قيد التنفيذ",
    daysLeft: 5,
    enrolled: 8, enrolledTotal: 20,
    seatsLeft: 12,
    startDate: "15 مايو 2026",
    trainer: "م. كريم مصطفى الزيات",
    trainerRole: "أكاديمية الريادة الخليجية",
    sessions: 3, sessionsTotal: 12,
    endDate: "30 مارس 2026",
  },
  {
    id: 4,
    name: "الدليل الشامل لشهادة مهندس حلول AWS المعتمد – Associate SAA-C03 –",
    category: "التقنية والمعلومات",
    mode: "أوفلاين",
    status: "لم يبدأ",
    daysLeft: null,
    enrolled: 0, enrolledTotal: 20,
    seatsLeft: 20,
    startDate: null,
    trainer: "م. كريم مصطفى الزيات",
    trainerRole: "أكاديمية الريادة الخليجية",
    sessions: 0, sessionsTotal: 12,
    endDate: null,
  },
];

// ─── status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  "مكتمل":       { color: TEAL,      bg: "#d1faf5" },
  "قيد التنفيذ": { color: GOLD,      bg: "#fef3c7" },
  "لم يبدأ":     { color: "#94a3b8", bg: "#f1f5f9" },
};

// ─── thumbnail gradients ──────────────────────────────────────────────────────
const GRADS = [
  "linear-gradient(135deg,#0a2540 0%,#1e4d8c 100%)",
  "linear-gradient(135deg,#0f3460 0%,#16213e 100%)",
  "linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)",
  "linear-gradient(135deg,#0d1b2a 0%,#1b4332 100%)",
];

// ─── filter dropdown ──────────────────────────────────────────────────────────
const ALL_STATUSES = ["الكل", "مكتمل", "قيد التنفيذ", "لم يبدأ"];

function FilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200
          bg-white text-xs font-semibold text-slate-600 hover:border-[#024677]/30
          hover:text-[#024677] transition">
        <IcoFilter />
        فلترة البرامج
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}><IcoChevron /></span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1.5 z-40 bg-white border border-slate-200
          rounded-xl shadow-lg overflow-hidden min-w-[140px]" dir="rtl">
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }}
              className="w-full text-right px-4 py-2.5 text-xs transition hover:bg-slate-50"
              style={value === s ? { color: BRAND, fontWeight: 700, background: "#f0f7ff" } : { color: "#64748b" }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── online/offline ribbon badge (like the user dashboard video cards) ────────
function ModeRibbon({ mode }) {
  const isOnline = mode === "أونلاين";
  const fill = isOnline ? "#0B5CFF" : "#A7ABAB";
  const icon = isOnline
    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
  const W = 44, H = 56, tip = 14, bodyH = H - tip, midX = W / 2;
  return (
    <div className="relative pointer-events-none" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{ display: "block" }}>
        <path d={`M0 0 H${W} V${bodyH} L${midX} ${H} L0 ${bodyH} Z`} fill={fill}/>
      </svg>
      <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-0.5 pt-2">
        {icon}
        <span className="font-extrabold text-white leading-tight text-center px-0.5 text-[8px]">{mode}</span>
      </div>
    </div>
  );
}

// ─── program card ─────────────────────────────────────────────────────────────
function ProgramCard({ p, idx, onView }) {
  const cfg  = STATUS_CFG[p.status] ?? { color: "#64748b", bg: "#f1f5f9" };
  const grad = GRADS[idx % GRADS.length];

  return (
    <div className="rounded-xl border border-[#E1E1E1] overflow-hidden flex flex-col sm:flex-row"
      dir="rtl" style={{ background: "#F2F5F8" }}>

      {/* ── right: thumbnail (not touching card edges) ── */}
      <div className="p-2 shrink-0 sm:self-stretch">
        <div className="relative h-24 sm:h-full sm:w-28 lg:w-32 rounded-lg overflow-hidden"
          style={{ background: grad }}>

          {/* decorative */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 select-none">
            <span className="font-mono text-white font-black" style={{ fontSize: 36 }}>&lt;/&gt;</span>
          </div>

          {/* online/offline ribbon badge — pendant hangs down inside the thumb */}
          <div className="absolute top-1.5 right-1 z-10">
            <ModeRibbon mode={p.mode} />
          </div>

          {/* status badge bottom */}
          {p.status !== "قيد التنفيذ" && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: cfg.bg }}>
              <span className="text-[11px] font-bold" style={{ color: cfg.color }}>
                {p.status === "مكتمل" ? "✓ مكتمل" : p.status}
              </span>
            </div>
          )}

          {/* sessions pill */}
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-lg text-[11px] font-bold text-white"
            style={{ background: "rgba(0,0,0,0.35)" }}>
            {p.sessions}/{p.sessionsTotal}
          </div>
        </div>
      </div>

      {/* ── left: content ── */}
      <div className="flex flex-col gap-2 p-3 flex-1 min-w-0">

        {/* days left badge — top, at the left edge of the card content */}
        {p.daysLeft != null && (
          <span className="self-end text-xs font-bold"
            style={{ color: GOLD }}>
            بعد {p.daysLeft} يوم
          </span>
        )}

        {/* title */}
        <p className="text-sm font-bold leading-snug" style={{ color: "#1D293D" }}>
          {p.name}
        </p>

        {/* category */}
        <p className="text-xs font-semibold" style={{ color: TEAL }}>{typeof p.category === 'object' ? p.category?.name : p.category}</p>

        {/* meta rows */}
        <div className="flex flex-col gap-1.5 text-xs" style={{ color: "#64748b" }}>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "#94a3b8" }}><IcoUsers size={13} /></span>
            <span>الموظفون المسجلون: {p.enrolled}/{p.enrolledTotal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: "#94a3b8" }}><IcoSeat /></span>
            <span>المقاعد المتبقية: {p.seatsLeft}</span>
          </div>
          {p.startDate && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#94a3b8" }}><IcoCalendar /></span>
              <span>تاريخ البدء: {p.startDate}</span>
            </div>
          )}
          {p.endDate && (
            <div className="flex items-center gap-1.5">
              <span style={{ color: "#94a3b8" }}><IcoCalendar /></span>
              <span>انتهى في: {p.endDate}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span style={{ color: "#94a3b8" }}><IcoUserSm /></span>
            <div>
              <span className="font-semibold" style={{ color: "#1D293D" }}>{typeof p.trainer === 'object' ? p.trainer?.name : p.trainer}</span>
              <span className="text-[11px] block" style={{ color: "#94a3b8" }}>{p.trainerRole}</span>
            </div>
          </div>
        </div>

        {/* cta */}
        <button
          onClick={() => onView?.(p)}
          className="mt-auto w-full py-2.5 rounded-xl text-sm font-bold text-white
            transition hover:opacity-90"
          style={{ background: BRAND }}>
          عرض البرنامج
        </button>
      </div>

    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export default function EmployeeProgramsPage({ employee, onBack, onViewProgram }) {
  const navigate = useNavigate();
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState("الكل");
  const [programs, setPrograms] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const emp = employee ?? { name: "أحمد محمد ماهر" };

  // ── status map ────────────────────────────────────────────────────────────
  const statusMap = (e) => {
    const prog = e.program ?? {};
    const now  = new Date();
    const start = prog.start_date ? new Date(prog.start_date) : null;
    const end   = prog.end_date   ? new Date(prog.end_date)   : null;
    if (e.status === "pending" || e.payment_status === "pending") return "لم يبدأ";
    if (end && end < now) return "مكتمل";
    if (start && start > now) return "لم يبدأ";
    return "قيد التنفيذ";
  };

  // ── load enrolled programs ────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    fetchCompanyEnrolledPrograms({ per_page: 100 })
      .then(res => {
        const list = res?.data?.data ?? [];
        setPrograms(list.map(e => {
          const prog = e.program ?? {};
          const name = prog.name?.ar ?? prog.name?.en
            ?? (typeof prog.name === "string" ? prog.name : "—");
          return {
            id:            e.id,
            programId:     prog.id,
            name,
            trainer:       prog.coach?.name ?? prog.trainer?.name ?? "—",
            trainerAvatar: (prog.coach?.name ?? prog.trainer?.name ?? "م")[0],
            trainerRole:   prog.provider?.name ?? "—",
            category:      prog.category?.name ?? "—",
            status:        statusMap(e),
            daysLeft:      null,
            enrolled:      e.registered_employees ?? e.members_count ?? 0,
            enrolledTotal: e.seats_count ?? 0,
            seatsLeft:     e.remaining_seats ?? e.available_seats ?? 0,
            startDate:     prog.start_date?.split("T")[0] ?? null,
            completion:    e.completion_rate ?? 0,
            sessions:      e.sessions_total ?? 0,
            sessionsCompleted: e.sessions_completed ?? 0,
            price:         e.price ?? prog.price_amount ?? "0",
          };
        }));
      })
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  const total  = programs.length;
  const active = programs.filter(p => p.status === "قيد التنفيذ").length;
  const notYet = programs.filter(p => p.status === "لم يبدأ").length;
  const done   = programs.filter(p => p.status === "مكتمل").length;

  const filtered = useMemo(() => {
    const q = search.trim();
    return programs.filter(p =>
      (!q || p.name.includes(q)) && (filter === "الكل" || p.status === filter)
    );
  }, [programs, search, filter]);

  const handleBack = () => { if (onBack) onBack(); else navigate(-1); };

  const STATS = [
    { label: "إجمالي البرامج المسجلة", value: total,  icon: <IcoStat1 size={22} /> },
    { label: "البرامج النشطة",          value: active, icon: <IcoStat2 size={22} /> },
    { label: "برامج لم تبدأ بعد",       value: notYet, icon: <IcoStatNotYet size={22} /> },
    { label: "البرامج المكتملة",        value: done,   icon: <IcoStat4 size={22} /> },
  ];

  return (
    <main className="flex-1 overflow-y-auto bg-white p-3 sm:p-6" dir="rtl">
      <div className="max-w-[1100px] mx-auto space-y-5">

        {/* ── page title ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "#0246770D", color: BRAND }}>
              <IcoGrad size={14} />
            </div>
            <h1 className="text-sm font-extrabold" style={{ color: BRAND }}>البرامج المسجلة</h1>
          </div>
          <button onClick={handleBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
              text-white hover:opacity-90 transition"
            style={{ background: BRAND }}>
            <IcoBack />
            رجوع
          </button>
        </div>

        {/* ── stats strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map((s, i) => (
            <div key={i}
              className="bg-white rounded-2xl border border-[#E1E1E1] flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "#0246770D", color: BRAND }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs leading-tight" style={{ color: "#94a3b8" }}>{s.label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold mt-1" style={{ color: "#1D293D" }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── programs section ── */}
        <div className="bg-white rounded-2xl border border-[#E1E1E1] overflow-visible">

          {/* toolbar */}
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4
            border-b border-[#F0F0F0] flex-wrap">
            <h2 className="text-sm font-extrabold" style={{ color: BRAND }}>البرامج المسجلة</h2>
            <div className="flex items-center gap-2 flex-wrap">
              {/* search */}
              <div className="relative w-full sm:w-auto">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <IcoSearch />
                </span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="ابحث عن برنامج تدريبي"
                  className="pr-8 pl-3 py-2 text-xs rounded-xl border border-slate-200 w-full sm:w-52
                    focus:outline-none focus:ring-2 focus:ring-[#024677]/20 focus:border-[#024677]
                    transition placeholder:text-slate-300"
                />
              </div>
              <FilterDropdown value={filter} onChange={setFilter} />
            </div>
          </div>

          {/* grid */}
          <div className="p-5">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center py-16 text-sm text-slate-400">لا توجد برامج مسجلة بعد</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((p, idx) => (
                  <ProgramCard key={p.id} p={p} idx={idx} onView={onViewProgram} />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
