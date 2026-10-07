# Treedom — Training Management Platform

منصة إدارة التدريب المؤسسي، تربط بين هيئات التدريب والشركات والمدربين والمتدربين في مكان واحد.

---

## المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المتطلبات](#المتطلبات)
- [التشغيل المحلي](#التشغيل-المحلي)
- [هيكل المشروع](#هيكل-المشروع)
- [الأدوار](#الأدوار)
- [المتغيرات البيئية](#المتغيرات-البيئية)
- [البناء للإنتاج](#البناء-للإنتاج)

---

## نظرة عامة

Treedom هي واجهة أمامية (Frontend) مبنية بـ **React 19 + Vite + Tailwind CSS**، تتواصل مع Backend API لإدارة:

- البرامج التدريبية والجلسات
- التقييمات والاختبارات والتصحيح
- إدارة الموظفين والمتدربين والمدربين
- المدفوعات والفواتير وطلبات التمويل
- الإشعارات وسجلات النشاط

---

## المتطلبات

| الأداة | الإصدار المطلوب |
|--------|-----------------|
| Node.js | >= 18.x |
| npm | >= 9.x |

---

## التشغيل المحلي

```bash
# 1. تثبيت الحزم
npm install

# 2. إنشاء ملف المتغيرات البيئية
cp .env.example .env.local
# ثم عدّل VITE_API_BASE_URL بعنوان الـ API

# 3. تشغيل السيرفر المحلي
npm run dev
```

يفتح التطبيق على `http://localhost:5173` افتراضياً.

---

## هيكل المشروع

```
src/
├── components/       # جميع صفحات ومكونات الواجهة
│   ├── Dashboard/
│   ├── LoginPage/
│   ├── RegisterPage/
│   ├── UserDashboard/
│   ├── TrainerDashboardPage/
│   ├── CompanyDashboard/
│   └── ...
├── context/          # React Context (إشعارات، وضع الكويز)
├── data/             # بيانات ثابتة / mock data
├── hooks/            # Custom React hooks
├── services/         # طبقة API والـ auth
│   ├── api.js        # جميع طلبات HTTP
│   ├── auth.js       # تسجيل الدخول والصلاحيات
│   └── ...
└── App.jsx           # الـ Router الرئيسي
```

---

## الأدوار

| الدور | الوصف |
|-------|-------|
| `org` | هيئة تدريب — صلاحيات كاملة |
| `company` | شركة — إدارة موظفين وبرامج |
| `trainer` | مدرب — إدارة برامجه وجلساته |
| `employee` | موظف — يتابع برامجه التدريبية |
| `user` | متدرب فردي — يتصفح ويلتحق بالبرامج |

---

## المتغيرات البيئية

أنشئ ملف `.env.local` في root المشروع:

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

> **تنبيه:** لا ترفع ملفات `.env` على GitHub أبداً — هي مضافة في `.gitignore`.

---

## البناء للإنتاج

```bash
npm run build
```

الناتج يكون في مجلد `dist/` جاهز للرفع على أي استضافة ثابتة (Vercel, Netlify, إلخ).

---

## التقنيات المستخدمة

- [React 19](https://react.dev/)
- [Vite 8](https://vite.dev/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [React Router v6](https://reactrouter.com/)
- [Recharts](https://recharts.org/)
- [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/)
- [SheetJS (xlsx)](https://sheetjs.com/)
