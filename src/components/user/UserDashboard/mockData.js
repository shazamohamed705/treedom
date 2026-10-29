// ── type / status badge configs ───────────────────────────────────────────────
export const TYPE_BADGE = {
  online:   { label: "أونلاين", bg: "#14b8a6", color: "#fff" },
  offline:  { label: "حضوري",  bg: "#3b82f6", color: "#fff" },
  recorded: { label: "مسجل",   bg: "#8b5cf6", color: "#fff" },
};

export const STATUS_BADGE = {
  free: { label: "مجاناً",       bg: "#14b8a6", color: "#fff" },
  paid: { label: "مدفوع",        bg: "#f59e0b", color: "#fff" },
  soon: { label: "قريباً",       bg: "#64748b", color: "#fff" },
  last: { label: "الأخير دائماً", bg: "#ef4444", color: "#fff" },
};

// ── dark thumbnail background ─────────────────────────────────────────────────
export const THUMB_BG = "linear-gradient(135deg,#0a1628 0%,#0f2a4a 50%,#0d3a5c 100%)";

// ── stats row ─────────────────────────────────────────────────────────────────
export const STATS = [
  { label: "تصميم الجرافيك",       sub: "2/8 من المشاهدة", mode: "online"  },
  { label: "تصميم واجهة المستخدم", sub: "2/8 من المشاهدة", mode: "offline" },
  { label: "تصميم المنتجات",       sub: "2/8 من المشاهدة", mode: "online"  },
];

// ── continue watching ─────────────────────────────────────────────────────────
export const CONTINUE = [
  { id:"c1", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", hours:1, sessions:5, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", progress:55, price:79.99,  type:"online",  tags:["تطوير الويب"], img:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop" },
  { id:"c2", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", hours:1, sessions:5, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", progress:35, price:129.99, type:"online",  tags:["FRONTEND"],    img:"https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&q=80&auto=format&fit=crop" },
  { id:"c3", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", hours:1, sessions:5, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", progress:70, price:89.50,  type:"offline", tags:["قيادات تعليمية"], img:"https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80&auto=format&fit=crop" },
  { id:"c4", title:"دليل المبتدأن لتقنية إنشاء دورات عبر الإنترنت",       hours:1, sessions:5, trainees:200, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", progress:20, price:69.99,  type:"online",  tags:["الخطوة الثالثة"], img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop" },
];

// ── my programs ───────────────────────────────────────────────────────────────
export const MY_PROGRAMS = [
  { id:"m1", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", hours:1, sessions:12, duration:6, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", date:"12 يناير 2025", endDate:"22 سبتمبر 2026", price:79.99, oldPrice:129.99, rating:4.8, type:"online",  tags:["FRONTEND"],    state:"waiting",  enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", ownership:"company", best:true,  img:"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80&auto=format&fit=crop" },
  { id:"m2", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", hours:1, sessions:12, duration:6, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", date:"12 يناير 2025", endDate:"22 سبتمبر 2026", price:79.99, oldPrice:129.99, rating:4.8, type:"online",  tags:["تطوير الويب"], state:"waiting2", enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", ownership:"own",                img:"https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&q=80&auto=format&fit=crop" },
  { id:"m3", title:"دليل المبتدأن للتصميم المطور والواجهات أمامية محترف", hours:1, sessions:12, duration:6, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerAvatar:"م", date:"12 يناير 2025", endDate:"22 سبتمبر 2026", price:79.99, oldPrice:129.99, rating:4.8, type:"recorded", tags:["مسجل"],       state:"recorded", enrolledNum:20, totalSeats:40,                           ownership:"company",                img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop" },
];

// ── suggested programs ────────────────────────────────────────────────────────
export const SUGGESTED = [
  { id:"s1", title:"دليل المبتدأن لتصبح مطور واجهات أمامية محترف", hours:6, sessions:12, duration:6, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerSub:"أكاديمية الريادة الخليجية", trainerAvatar:"م", date:"15 أكتوبر 2026", enroll:"15 أكتوبر 2025", price:79.99, oldPrice:129.99, rating:4.8, type:"online",  badges:["وردة","وردة","وردة"], state:"waiting",  enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", best:true,  img:"https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&q=80&auto=format&fit=crop" },
  { id:"s2", title:"دليل المبتدأن لصنع مطور والواجهات أمامية محترف",  hours:6, sessions:12, duration:6, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerSub:"أكاديمية الريادة الخليجية", trainerAvatar:"م", date:"15 أكتوبر 2026", enroll:"15 أكتوبر 2025", price:79.99, oldPrice:129.99, rating:4.8, type:"offline", badges:["وردة","وردة","وردة"], state:"waiting2", enrolledNum:20, totalSeats:40, maxDate:"30 نوفمبر 2026", saved:true, img:"https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=600&q=80&auto=format&fit=crop" },
  { id:"s3", title:"دليل المبتدأن للتصميم مطور والواجهات أمامية محترف", hours:6, sessions:12, duration:6, trainees:130, trainer:"م. كريم مصطفى الزيات", trainerSub:"أكاديمية الريادة الخليجية", trainerAvatar:"م", date:"15 أكتوبر 2026", enroll:"15 أكتوبر 2025", price:79.99, oldPrice:129.99, rating:4.8, type:"recorded", badges:["وردة","وردة","وردة"], state:"recorded", enrolledNum:20, totalSeats:40,                           img:"https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80&auto=format&fit=crop" },
];

// ── upcoming sessions ─────────────────────────────────────────────────────────
export const UPCOMING = [
  { id:"u1", program:"AWS Solutions Architect شهادة", title:"الجلسة 3: إدارة الأمان والصلاحيات في بيئة AWS",  trainer:"م. كريم مصطفى الزيات", date:"اليوم", time:"3:00 — 3:30 م", duration:90, isLive:true  },
  { id:"u2", program:"AWS Solutions Architect شهادة", title:"الجلسة 3: إدارة الأمان والصلاحيات في بيئة AWS",  trainer:"م. كريم مصطفى الزيات", date:"اليوم", time:"3:00 — 3:30 م", duration:90, isLive:false },
  { id:"u3", program:"تصميم واجهات المستخدم",         title:"الجلسة 7: تطبيق تصميم UI/UX على مشروع حقيقي",    trainer:"م. سارة خالد",          date:"غداً",   time:"5:00 — 6:00 م", duration:60, isLive:false },
  { id:"u4", program:"تطوير الويب المتقدم",           title:"الجلسة 2: واجهات برمجية API وأمان النظم",         trainer:"م. عمر عادل",           date:"بعد غدٍ", time:"11:00 — 12:00 م", duration:60, isLive:false },
];
