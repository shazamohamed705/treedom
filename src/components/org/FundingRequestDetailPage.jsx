import {
  C, Icon, StatusBadge, Card, InfoRow, FileCard, Button, REQUESTS,
} from "./FundingShared";

export default function FundingRequestDetailPage({ requestId, onBack, onReview }) {
  const request = REQUESTS.find(r => r.id === requestId) ?? REQUESTS[0];
  const p = request.program;

  return (
    <div className="flex-1 overflow-y-auto min-h-0" style={{ background: C.pageBg }} dir="rtl">
      <div className="w-full max-w-none p-5 sm:p-8">

        {/* ── header : back + title + badge + ref ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 h-[36px] px-4 rounded-xl text-[12px] font-bold
              bg-white border transition hover:border-[#075985]/40"
            style={{ borderColor: C.border, color: C.primary }}>
            <Icon name="back" size="14" color={C.primary} sw={2} />
            العودة إلى الطلبات
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge status={request.status} />
            <span className="text-[11px] font-semibold px-3 h-[24px] flex items-center rounded-full"
              style={{ background: C.pageBg, color: C.muted }}>
              رقم الطلب: {request.id}
            </span>
          </div>
        </div>

        {/* ── program title ── */}
        <div className="mb-6">
          <h1 className="text-[20px] font-bold" style={{ color: C.text }}>{request.title}</h1>
          <p className="text-[12px] mt-1.5" style={{ color: C.muted }}>
            {request.employee} — {request.role} • {request.org}
          </p>
        </div>

        {/* ── معلومات الموظف ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card
            title="معلومات الموظف"
            icon={<Icon name="user" size="16" color={C.primary} />}
          >
            <InfoRow label="اسم الموظف" value={request.employee} />
            <InfoRow label="المسمى الوظيفي" value={request.employeeInfo.title} />
            <InfoRow label="الإدارة" value={request.employeeInfo.dept} />
            <InfoRow label="البريد الإلكتروني" value={request.employeeInfo.email} icon={<Icon name="mail" size="11" color={C.muted} />} />
            <InfoRow label="رقم الموظف" value={request.employeeInfo.empNo} />
          </Card>

          {/* ── تفاصيل البرنامج ── */}
          <Card
            title="تفاصيل البرنامج"
            icon={<Icon name="briefcase" size="15" color={C.primary} />}
          >
            <InfoRow label="اسم البرنامج" value={p.name} />
            <InfoRow label="الجهة التدريبية" value={p.provider} />
            <InfoRow label="تاريخ بداية البرنامج" value={p.start} icon={<Icon name="calendar" size="11" color={C.muted} />} />
            <InfoRow label="تاريخ نهاية البرنامج" value={p.end} />
            <InfoRow label="مدة البرنامج" value={p.duration} />
            <InfoRow label="نوع التدريب" value={p.type} />
            <InfoRow label="مكان التدريب" value={p.location} />
            <InfoRow label="التكلفة" value={p.cost} icon={<Icon name="money" size="11" color={C.muted} />} />
          </Card>
        </div>

        {/* ── المرفقات ── */}
        <Card
          title="المرفقات"
          icon={<Icon name="file" size="15" color={C.primary} />}
          className="mb-6"
        >
          <div className="space-y-2.5">
            {request.files.map(f => (
              <FileCard key={f.name} name={f.name} type={f.type} size={f.size} />
            ))}
          </div>
        </Card>

        {/* ── review action (pending only) ── */}
        {request.status === "pending" && (
          <div className="flex items-center justify-end gap-3">
            <Button variant="primary" icon={<Icon name="chev-left" size="15" color="#fff" sw={2.2} />}
              onClick={onReview}>
              مراجعة الطلب
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
