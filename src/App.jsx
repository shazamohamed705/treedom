import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { isAuthenticated, getUserRole, roleToPreviewId, clearAuth, hasPermission, isIndeCoach } from "./services/auth";
import { getAccessRole, canAccessDashboardPath } from "./services/routeAccess";
import {
  REG_ROLES,
  roleFromAccountType,
  saveRegisterDraft,
  loadRegisterDraft,
  clearRegisterDraft,
} from "./services/registerDraft";

// ── always-loaded (part of the shell) ────────────────────────────────────────
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { NotificationProvider } from "./context/NotificationContext";
import { useQuizMode } from "./context/QuizModeContext";
import SessionNotifyBanner from "./components/SessionNotifyBanner";
import ToastProvider      from "./components/ToastProvider";
import { treedomData, companyData } from "./data/mockData";
import { fetchCompanyDashboard } from "./services/api";

// ── lazy page chunks ──────────────────────────────────────────────────────────
const Dashboard              = lazy(() => import("./components/Dashboard"));
const CompanyDashboard       = lazy(() => import("./components/CompanyDashboard"));
const ProgramsGrid           = lazy(() => import("./components/ProgramsGrid"));
const AddProgramPage         = lazy(() => import("./components/AddProgramPage"));
const CompanyAddProgramPage  = lazy(() => import("./components/CompanyAddProgramPage"));
const EditProgramPage        = lazy(() => import("./components/EditProgramPage"));
const ProgramViewPage        = lazy(() => import("./components/ProgramViewPage"));
const SessionsPage           = lazy(() => import("./components/SessionsPage"));
const QuizzesPage            = lazy(() => import("./components/QuizzesPage"));
const SessionViewPage        = lazy(() => import("./components/SessionViewPage"));
const SessionAddContentPage  = lazy(() => import("./components/SessionEditPage"));
const ReviewRequestsPage     = lazy(() => import("./components/ReviewRequestsPage"));
const TodaySessionsPage      = lazy(() => import("./components/TodaySessionsPage"));
const AddSessionPage         = lazy(() => import("./components/AddSessionPage"));
const AttendancePage         = lazy(() => import("./components/AttendancePage"));
const TrainerDashboardPage   = lazy(() => import("./components/TrainerDashboardPage"));
const TrainerMyRequestsPage  = lazy(() => import("./components/TrainerMyRequestsPage"));
const TrainerMyProfilePage   = lazy(() => import("./components/TrainerMyProfilePage"));
const TrainerProgramsPage    = lazy(() => import("./components/TrainerProgramsPage"));
const TrainerProgramViewPage = lazy(() => import("./components/TrainerProgramViewPage"));
const TrainerEditProgramPage = lazy(() => import("./components/TrainerEditProgramPage"));
const CoachAddProgramPage    = lazy(() => import("./components/CoachAddProgramPage"));
const TrainerSessionsPage    = lazy(() => import("./components/TrainerSessionsPage"));
const TrainerSessionViewPage = lazy(() => import("./components/TrainerSessionViewPage"));
const AddCoachSessionPage    = lazy(() => import("./components/AddCoachSessionPage"));
const TrainerRequestsPage    = lazy(() => import("./components/TrainerRequestsPage"));
const TrainerNotificationsPage = lazy(() => import("./components/TrainerNotificationsPage"));
const AssessmentsPage        = lazy(() => import("./components/AssessmentsPage"));
const TasksPage              = lazy(() => import("./components/TasksPage"));
const GradingPage            = lazy(() => import("./components/GradingPage"));
const CompanyNotificationsPage = lazy(() => import("./components/CompanyNotificationsPage"));
const NotificationsPage      = lazy(() => import("./components/NotificationsPage"));
const OrgActivityLogPage     = lazy(() => import("./components/OrgActivityLogPage"));
const UserDashboardPage      = lazy(() => import("./components/UserDashboard"));
const ProgramsBrowsePage     = lazy(() => import("./components/ProgramsBrowsePage"));
const MyProgramsPage         = lazy(() => import("./components/MyProgramsPage"));
const ContinueWatchingPage   = lazy(() => import("./components/ContinueWatchingPage"));
const MyEnrolledProgramsPage = lazy(() => import("./components/MyEnrolledProgramsPage"));
const SuggestedProgramsPage  = lazy(() => import("./components/SuggestedProgramsPage"));
const UserProfilePage        = lazy(() => import("./components/UserProfilePage"));
const TrainingRecordPage     = lazy(() => import("./components/TrainingRecordPage"));
const FavoritesPage          = lazy(() => import("./components/FavoritesPage"));
const SupportPage            = lazy(() => import("./components/SupportPage"));
const PaymentsPage           = lazy(() => import("./components/PaymentsPage"));
const EmployeesPage          = lazy(() => import("./components/EmployeesPage"));
const EmployeeViewPage       = lazy(() => import("./components/EmployeeViewPage"));
const EmployeeProgramsPage   = lazy(() => import("./components/EmployeeProgramsPage"));
const EnrolledProgramDetailPage = lazy(() => import("./components/EnrolledProgramDetailPage"));
const ProgramDetailPage      = lazy(() => import("./components/ProgramDetailPage"));
const CustomRequestPage      = lazy(() => import("./components/CustomRequestPage"));
const NegotiationRequestsPage = lazy(() => import("./components/NegotiationRequestsPage"));
const CompanyBrowseProgramsPage = lazy(() => import("./components/CompanyBrowseProgramsPage"));
const CompanyPaymentsPage    = lazy(() => import("./components/CompanyPaymentsPage"));
const CompanySecuritySettingsPage = lazy(() => import("./components/CompanySecuritySettingsPage"));
const CompanyUsersSettingsPage = lazy(() => import("./components/CompanyUsersSettingsPage"));
const CompanyProfileSettingsPage = lazy(() => import("./components/CompanyProfileSettingsPage"));
const TrainersPage           = lazy(() => import("./components/TrainersPage"));
const AddTrainerPage         = lazy(() => import("./components/AddTrainerPage"));
const TrainerProfilePage     = lazy(() => import("./components/TrainerProfilePage"));
const TraineesPage           = lazy(() => import("./components/TraineesPage"));
const RegisterPage           = lazy(() => import("./components/RegisterPage"));
const RegisterStep2Page      = lazy(() => import("./components/RegisterStep2Page"));
const RegisterStep2Individual = lazy(() => import("./components/RegisterStep2Individual"));
const RegisterStep3Individual = lazy(() => import("./components/RegisterStep3Individual"));
const RegisterStep4Individual = lazy(() => import("./components/RegisterStep4Individual"));
const RegisterTraineeStep3Page = lazy(() => import("./components/RegisterTraineeStep3Page"));
const RegisterTraineeActivatePage = lazy(() => import("./components/RegisterTraineeActivatePage"));
const RegisterStep3Page      = lazy(() => import("./components/RegisterStep3Page"));
const RegisterStep3bPage     = lazy(() => import("./components/RegisterStep3bPage"));
const RegisterStep4Page      = lazy(() => import("./components/RegisterStep4Page"));
const RegisterCompanyStep2Page = lazy(() => import("./components/RegisterCompanyStep2Page"));
const RegisterCompanyActivatePage = lazy(() => import("./components/RegisterCompanyActivatePage"));
const RegisterSuccessPage    = lazy(() => import("./components/RegisterSuccessPage"));
const LoginPage              = lazy(() => import("./components/LoginPage"));
const FinancePage            = lazy(() => import("./components/FinancePage"));
const FinanceRequestPage     = lazy(() => import("./components/FinanceRequestPage"));
const UserSessionsPage       = lazy(() => import("./components/UserSessionsPage"));
const UserSessionViewPage    = lazy(() => import("./components/UserSessionViewPage"));
const UserProgramViewPage    = lazy(() => import("./components/UserProgramViewPage"));
const UserProgramSessionPage = lazy(() => import("./components/UserProgramSessionPage"));
const SettingsPage           = lazy(() => import("./components/SettingsPage"));
const FundingRequestsPage    = lazy(() => import("./components/FundingRequestsPage"));
const FundingRequestReviewPage = lazy(() => import("./components/FundingRequestReviewPage"));

// ── Systems (org-level switcher) ───────────────────────────────────────────
const SYSTEMS = [
  { id: "treedom", label: "هيئة تريب واو",    sublabel: "نظام التدريب الحكومي", data: treedomData },
  { id: "company", label: "كود كلين للتدريب", sublabel: "شركة التدريب التقني",  data: companyData },
];

// ── Roles (user-type switcher for UI preview) ─────────────────────────────
// Each role controls which layout / nav the user sees
const ROLES = [
  { id: "org",             label: "هيئة تدريب",     icon: "🏛️",  isTrainer: false, isPending: false, isEmployee: false, isUser: false },
  { id: "company",         label: "شركة",            icon: "🏢",  isTrainer: false, isPending: false, isEmployee: false, isUser: false },
  { id: "trainer",         label: "مدرب",            icon: "👨‍🏫",  isTrainer: true,  isPending: false, isEmployee: false, isUser: false },
  { id: "pending_trainer", label: "مدرب مستقبل",    icon: "⏳",  isTrainer: false, isPending: true,  isEmployee: false, isUser: false },
  { id: "employee",        label: "موظف",            icon: "💼",  isTrainer: false, isPending: false, isEmployee: true,  isUser: false },
  { id: "user",            label: "يوزر",            icon: "👤",  isTrainer: false, isPending: false, isEmployee: false, isUser: true  },
];

// ── Guard: redirect to /login if no token ──────────────────────────────────
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

// ── Guard: block typed/navigated URLs that belong to another system ───────
function DashboardRoleGate({ children }) {
  const location = useLocation();
  if (!canAccessDashboardPath(location.pathname, getAccessRole())) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

// ── Guard: redirect to /dashboard if already logged in ────────────────────
function RedirectIfAuth({ children }) {
  return localStorage.getItem("token") ? <Navigate to="/dashboard" replace /> : children;
}

// ── Trainer placeholders are now real components imported above ───────────────

// ── Register flow wrapper (keeps shared state across steps + per-role drafts) ─
function RegisterFlow() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState(null);
  const [indivRole,   setIndivRole]   = useState(null);
  const [regData,     setRegData]     = useState({});
  const [companyEmail, setCompanyEmail] = useState("");
  const [traineeEmail, setTraineeEmail] = useState("");

  const mergeReg = (role, patch) => {
    setRegData(prev => {
      const next = { ...prev, ...patch };
      if (role) saveRegisterDraft(role, next);
      return next;
    });
  };

  const startRole = (type) => {
    const role = roleFromAccountType(type);
    setAccountType(type);
    const draft = role ? loadRegisterDraft(role) : {};
    setRegData(draft);
    if (draft.role === "trainee" || draft.role === "trainer") setIndivRole(draft.role);
    if (draft.email && role === REG_ROLES.company) setCompanyEmail(draft.email);
    if (draft.email && role === REG_ROLES.trainee) setTraineeEmail(draft.email);
    return role;
  };

  return (
    <Routes>
      <Route index element={
        <RegisterPage onContinue={(type) => {
          const role = startRole(type);
          const key = type?.key;
          if (key === "individual" || key === "individual_trainer") {
            navigate("step2-individual");
          } else if (key === "company") {
            navigate("step2-company");
          } else {
            navigate("step2");
          }
          void role;
        }} onLoginRedirect={() => navigate("/login")} />
      } />

      <Route path="step2-individual" element={
        <RegisterStep2Individual
          accountType={accountType}
          initialData={regData}
          onContinue={(data) => {
            const role = data.role === "trainee" ? REG_ROLES.trainee : REG_ROLES.trainer;
            setIndivRole(data.role);
            mergeReg(role, data);
            if (data.role === "trainee") navigate("step3-trainee");
            else navigate("step3-individual");
          }}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step3-individual" element={
        <RegisterStep3Individual
          role={indivRole}
          initialData={regData}
          onContinue={(data) => {
            mergeReg(REG_ROLES.trainer, data);
            navigate("step4-individual");
          }}
          onBack={() => navigate("step2-individual")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step4-individual" element={
        <RegisterStep4Individual
          collectedData={regData}
          onSubmit={() => {
            clearRegisterDraft(REG_ROLES.trainer);
            navigate("/login");
          }}
          onBack={() => navigate("step3-individual")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step3-trainee" element={
        <RegisterTraineeStep3Page
          regData={regData}
          initialData={regData}
          onContinue={(data) => {
            setTraineeEmail(data.email);
            mergeReg(REG_ROLES.trainee, data);
            navigate("activate-trainee");
          }}
          onBack={() => navigate("step2-individual")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="activate-trainee" element={
        <RegisterTraineeActivatePage
          email={traineeEmail || regData.email}
          onSuccess={() => {
            clearRegisterDraft(REG_ROLES.trainee);
            navigate("/login");
          }}
          onBack={() => navigate("step3-trainee")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step2-company" element={
        <RegisterCompanyStep2Page
          initialData={regData}
          onContinue={(data) => {
            setCompanyEmail(data.email);
            mergeReg(REG_ROLES.company, data);
            navigate("activate-company");
          }}
          onBack={() => navigate("")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="activate-company" element={
        <RegisterCompanyActivatePage
          email={companyEmail || regData.email}
          onSuccess={() => {
            clearRegisterDraft(REG_ROLES.company);
            navigate("/login");
          }}
          onBack={() => navigate("step2-company")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step2" element={
        <RegisterStep2Page
          accountType={accountType}
          initialData={regData}
          onContinue={(data) => {
            mergeReg(REG_ROLES.provider, data);
            navigate("step3");
          }}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step3" element={
        <RegisterStep3Page
          initialData={regData}
          onContinue={(data) => {
            mergeReg(REG_ROLES.provider, data);
            navigate("step3b");
          }}
          onBack={() => navigate("step2")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step3b" element={
        <RegisterStep3bPage
          initialData={regData}
          onContinue={(data) => {
            mergeReg(REG_ROLES.provider, data);
            navigate("step4");
          }}
          onBack={() => navigate("step3")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="step4" element={
        <RegisterStep4Page
          collectedData={regData}
          initialData={regData}
          onSubmit={(message) => {
            clearRegisterDraft(REG_ROLES.provider);
            navigate("success", { state: { message } });
          }}
          onBack={() => navigate("step3b")}
          onLoginRedirect={() => navigate("/login")}
        />
      } />

      <Route path="success" element={
        <RegisterSuccessPage onGoToLogin={() => navigate("/login")} />
      } />
    </Routes>
  );
}

// ── Main dashboard shell ───────────────────────────────────────────────────
function samePath(a, b) {
  const norm = p => String(p || "").replace(/\/+$/, "") || "/";
  return norm(a) === norm(b);
}

// Nested screens stay highlighted on their parent sidebar item.
const NAV_ALIASES = {
  "trainer-dashboard": "",
  "trainer-session-view": "trainer-sessions",
  "trainer-add-session": "trainer-sessions",
  "coach-add-session": "trainer-sessions",
  "trainer-program-view": "trainer-programs",
  "trainer-program-edit": "trainer-programs",
  "coach-add-program": "trainer-programs",
  "user-session-view": "sessions",
  "user-program-view": "my-programs",
  "user-program-session": "my-programs",
  "session-view": "sessions",
  "session-edit": "sessions",
  "session-add-content": "sessions",
  "add-session": "sessions",
  "view-program": "programs",
  "edit-program": "programs",
  "add-program": "programs",
  "trainer-profile": "trainers",
  "add-trainer": "trainers",
  "employee-view": "employees",
  "enrolled-program-detail": "employee-programs",
  "program-detail": "programs",
  "custom-request": "programs",
  "browse-programs": "programs",
  "funding-request-review": "funding-requests",
  "funding-request-detail": "funding-requests",
  "funding-request-locked": "funding-requests",
  "settings-security": "settings",
  "settings-users": "settings",
  "settings-company": "settings",
  "activity-log": "",
  "assessments": "assessments",
  "tasks": "tasks",
  "grading": "grading",
};

function dashboardSeg(pathname) {
  const parts = String(pathname || "").replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return "";
  return parts[1] ?? "";
}

function navIndexFromPath(pathname, items, getPath) {
  const seg = dashboardSeg(pathname);
  const mapped = Object.prototype.hasOwnProperty.call(NAV_ALIASES, seg) ? NAV_ALIASES[seg] : seg;
  const want = mapped === "dashboard" ? "" : mapped;

  for (let i = 0; i < items.length; i++) {
    const p = getPath(i);
    const norm = p === "dashboard" ? "" : p;
    if (norm === want) return i;
    const kids = items[i]?.children ?? [];
    if (kids.some(c => c.path === want || c.path === seg)) return i;
  }
  return 0;
}

function DashboardShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { quizActive, exitQuiz } = useQuizMode();

  // إذا تغير الـ route (المستخدم نفّذ navigate من مكان آخر) نعيد تعيين quizActive
  useEffect(() => {
    exitQuiz();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const [pageEpoch, setPageEpoch] = useState(0);
  const [activeSystem,   setActiveSystem]   = useState(() =>
    sessionStorage.getItem("previewRole") === "company"
      ? Math.max(0, SYSTEMS.findIndex(s => s.id === "company"))
      : 0
  );
  const [activeNav,      setActiveNav]      = useState(0);
  const [collapsed,      setCollapsed]      = useState(false);
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false);
  const [viewTrainer,    setViewTrainer]    = useState(null);
  const [viewEmployee,   setViewEmployee]   = useState(null);
  const [viewDetailProgram, setViewDetailProgramRaw] = useState(() => {
    try { const s = sessionStorage.getItem("viewDetailProgram"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const setViewDetailProgram = (p) => {
    sessionStorage.setItem("viewDetailProgram", p ? JSON.stringify(p) : "");
    setViewDetailProgramRaw(p);
  };
  const [viewFundingRequest, setViewFundingRequestRaw] = useState(() => {
    try { const s = sessionStorage.getItem("viewFundingRequest"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const setViewFundingRequest = (req) => {
    sessionStorage.setItem("viewFundingRequest", req ? JSON.stringify(req) : "");
    setViewFundingRequestRaw(req);
  };
  // ── Company sidebar live stats ─────────────────────────────────────────────
  const [companySidebarStats, setCompanySidebarStats] = useState(null);
  const [settingsSub,    setSettingsSub]    = useState(null);
  const [viewProgramId,  setViewProgramIdRaw]  = useState(() => sessionStorage.getItem("viewProgramId") ?? null);
  const [viewUserProgramId, setViewUserProgramIdRaw] = useState(() => sessionStorage.getItem("viewUserProgramId") ?? null);
  const [viewUserSessionId, setViewUserSessionIdRaw] = useState(() => sessionStorage.getItem("viewUserSessionId") ?? null);
  const [viewProgressProgramId, setViewProgressProgramIdRaw] = useState(() => sessionStorage.getItem("viewProgressProgramId") ?? null);
  const [trainerProgramId, setTrainerProgramIdRaw] = useState(() => sessionStorage.getItem("trainerProgramId") ?? null);
  const [trainerProgramData, setTrainerProgramData] = useState(() => {
    try { const r = sessionStorage.getItem("trainerProgramData"); return r ? JSON.parse(r) : null; } catch { return null; }
  });
  const [viewSession,    setViewSessionRaw]    = useState(() => { try { const r = sessionStorage.getItem("viewSession"); return r ? JSON.parse(r) : null; } catch { return null; } });
  const [editSession,    setEditSessionRaw]    = useState(() => { try { const r = sessionStorage.getItem("editSession"); return r ? JSON.parse(r) : null; } catch { return null; } });
  const setEditSession = (s) => { sessionStorage.setItem("editSession", s ? JSON.stringify(s) : ""); setEditSessionRaw(s); };

  const setTrainerProgramId = (id, data) => {
    sessionStorage.setItem("trainerProgramId", id ?? "");
    setTrainerProgramIdRaw(id);
    if (data) { sessionStorage.setItem("trainerProgramData", JSON.stringify(data)); setTrainerProgramData(data); }
  };

  // trainer session state
  const [trainerSessionId, setTrainerSessionIdRaw] = useState(() => sessionStorage.getItem("trainerSessionId") ?? null);
  const setTrainerSessionId = (id) => { sessionStorage.setItem("trainerSessionId", id ?? ""); setTrainerSessionIdRaw(id); };

  // ── PREVIEW ROLE STATE ─────────────────────────────────────────────────────
  // On first mount: derive role from the stored user (real login).
  // Falls back to sessionStorage preview switcher for dev mode.
  const [previewRoleId, setPreviewRoleId] = useState(() => {
    // If a real user is logged in, use their role.
    const storedRole = getUserRole();
    if (storedRole) {
      const pid = roleToPreviewId(storedRole);
      sessionStorage.setItem("previewRole", pid);
      return pid;
    }
    return sessionStorage.getItem("previewRole") ?? "org";
  });
  // Re-sync role when navigating back to dashboard (e.g. after login redirect)
  useEffect(() => {
    const storedRole = getUserRole();
    if (storedRole) {
      const pid = roleToPreviewId(storedRole);
      if (pid !== previewRoleId) {
        sessionStorage.setItem("previewRole", pid);
        setPreviewRoleId(pid);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch company sidebar stats from API (runs once on mount) ─────────────
  useEffect(() => {
    // only the company role has access to /company/dashboard
    if (previewRoleId !== "company") return;
    let active = true;
    fetchCompanyDashboard()
      .then(res => {
        if (!active) return;
        const s = res?.data?.stats ?? {};
        const trained  = Number(s.employees_trained ?? 0);
        const programs = Number(s.total_programs ?? s.active_programs ?? s.programs_count ?? 0);
        const sessions = Number(s.total_sessions  ?? s.sessions_count  ?? s.weekly_sessions ?? 0);
        setCompanySidebarStats([
          { value: trained.toLocaleString("en-US") },
          { value: String(programs) },
          { value: String(sessions) },
        ]);
      })
      .catch(() => { /* keep mockData values on error */ });
    return () => { active = false; };
  }, [previewRoleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const switchRole = (id) => {
    sessionStorage.setItem("previewRole", id);
    setPreviewRoleId(id);
    // org/company roles switch to their matching system so the company
    // dashboard shows up when previewing the "شركة" role
    if (id === "company") setActiveSystem(Math.max(0, SYSTEMS.findIndex(s => s.id === "company")));
    if (id === "org")     setActiveSystem(0);
    setActiveNav(0);
    navigate("/dashboard");
  };
  const activeRole = ROLES.find(r => r.id === previewRoleId) ?? ROLES[0];

  // Derive boolean flags from the active preview role
  const isTrainer   = activeRole.isTrainer;
  const isPending   = activeRole.isPending;
  const isEmployee  = activeRole.isEmployee;
  const isUser      = activeRole.isUser;
  // org/company roles get the full admin shell
  const isOrgRole   = !isTrainer && !isPending && !isEmployee && !isUser;

  const setViewProgramId = (id) => { sessionStorage.setItem("viewProgramId", id ?? ""); setViewProgramIdRaw(id); };
  const setViewUserProgramId = (id) => { sessionStorage.setItem("viewUserProgramId", id ?? ""); setViewUserProgramIdRaw(id); };
  const setViewUserSessionId = (id) => { sessionStorage.setItem("viewUserSessionId", String(id ?? "")); setViewUserSessionIdRaw(id); };
  const setViewUserSession   = (s)  => { try { sessionStorage.setItem("viewUserSession", s ? JSON.stringify(s) : ""); } catch {} };
  const getViewUserSession   = ()   => { try { const r = sessionStorage.getItem("viewUserSession"); return r ? JSON.parse(r) : null; } catch { return null; } };
  const setViewSession   = (s)  => { sessionStorage.setItem("viewSession", s ? JSON.stringify(s) : ""); setViewSessionRaw(s); };
  const [autoOpenSessionId, setAutoOpenSessionIdRaw] = useState(() => sessionStorage.getItem("autoOpenSessionId") ?? null);
  const setAutoOpenSessionId = (id) => { sessionStorage.setItem("autoOpenSessionId", String(id ?? "")); setAutoOpenSessionIdRaw(id ?? null); };

  // For org/company, keep SYSTEMS switcher active; for other roles it's hidden
  const current = SYSTEMS[activeSystem];

  // ── nav items per role ─────────────────────────────────────────────────────
  const navForRole = (() => {
    if (isTrainer) return [
      { label: "الصفحة الرئيسية", icon: "home"        },
      ...(hasPermission("programs.view") ? [{ label: "برامجي", icon: "graduation" }] : []),
      ...(hasPermission("sessions.view")  ? [{ label: "جلساتي", icon: "calendar"  }] : []),
      { label: "طلباتي",           icon: "review"      },
      { label: "الإشعارات",        icon: "bell"        },
      { label: "إدارة التقييمات والامتحانات", icon: "assessments", children: [
        { label: "التقييمات وبنك الأسئلة",   path: "assessments" },
        { label: "التاسكات والامتحانات",      path: "tasks"       },
        { label: "إدارة التقييمات والتصحيح", path: "grading"     },
      ]},
      { label: "الملف الشخصي",     icon: "profile"     },
    ];
    if (isPending) return [
      { label: "الصفحة الرئيسية",   icon: "home"      },
      { label: "طلباتي",             icon: "review"    },
      { label: "الملف الشخصي",       icon: "profile"   },
    ];
    if (isEmployee) return [
      { label: "الصفحة الرئيسية",    icon: "home"        },
      { label: "البرامج التدريبية",   icon: "graduation"  },
      { label: "برامجي",              icon: "myprograms"  },
      { label: "الجلسات",             icon: "calendar"    },
      { label: "سجلي التدريبي",       icon: "review"      },
      { label: "المفضلة",             icon: "star"        },
      { label: "المدفوعات والفواتير", icon: "finance",    children: [
        { label: "الفواتير",      path: "payments"         },
        { label: "طلبات التمويل", path: "finance-requests" },
      ]},
      { label: "الإشعارات",           icon: "bell"        },
      { label: "الدعم",               icon: "support"     },
      { label: "الملف الشخصي",        icon: "profile"     },
    ];
    if (isUser) return [
      { label: "الصفحة الرئيسية",    icon: "home"        },
      { label: "تصفح البرامج",        icon: "graduation"  },
      { label: "برامجي",              icon: "myprograms"  },
      { label: "جلساتي",              icon: "calendar"    },
      { label: "سجلي التدريبي",       icon: "review"      },
      { label: "المفضلة",             icon: "star"        },
      { label: "المدفوعات والفواتير", icon: "finance",    children: [
        { label: "الفواتير", path: "payments" },
      ]},
      { label: "الإشعارات",           icon: "bell"        },
      { label: "الدعم",               icon: "support"     },
      { label: "الملف الشخصي",        icon: "profile"     },
    ];
    // org / company
    const items = current.data.navItems;
    if (current.id !== "company" && isIndeCoach()) {
      return items
        .filter(it => it.label !== "إدارة المدربين")
        .map(it => it.label === "مراجعة الطلبات" ? { ...it, label: "الطلبات الخاصة" } : it);
    }
    return items;
  })();

  // ── path per nav index per role ────────────────────────────────────────────
  const pathFor = (i) => {
    if (isTrainer) {
      const TRAINER_ICON_PATH = {
        home:        "",
        graduation:  "trainer-programs",
        calendar:    "trainer-sessions",
        review:      "trainer-requests",
        bell:        "notifications",
        assessments: "",
        profile:     "profile",
      };
      return TRAINER_ICON_PATH[navForRole[i]?.icon] ?? "";
    }
    if (isPending)   return (["", "my-requests", "profile"])[i] ?? "";
    if (isEmployee) {
      // nav index 6 = "المدفوعات والفواتير" (has children – no direct route)
      // nav index 7 = notifications, 8 = support, 9 = user-profile
      const empPaths = ["", "programs", "my-programs", "sessions", "training-record", "favorites", "", "notifications", "support", "user-profile"];
      return empPaths[i] ?? "";
    }
    if (isUser) {
      // nav index 6 = "المدفوعات والفواتير" (has children – no direct route)
      // nav index 7 = notifications, 8 = support, 9 = user-profile
      const userPaths = ["", "programs", "my-programs", "sessions", "training-record", "favorites", "", "notifications", "support", "user-profile"];
      return userPaths[i] ?? "";
    }
    const orgPaths = ["dashboard", "programs", "sessions", "", "today-sessions", "trainers", "trainees", "attendance", "review", "finance", "settings"];
    const companyPaths = ["dashboard", "programs", "negotiation-requests", "employee-programs", "employees", "company-payments", "settings"];
    const list = current.id === "company"
      ? companyPaths
      : (isIndeCoach() ? orgPaths.filter(p => p !== "trainers") : orgPaths);
    return list[i] ?? "dashboard";
  };

  useEffect(() => {
    setActiveNav(navIndexFromPath(location.pathname, navForRole, pathFor));
  }, [location.pathname, previewRoleId, isTrainer, isPending, isEmployee, isUser, current.id, navForRole.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNav = (i) => {
    setActiveNav(i);
    setSettingsSub(null);
    const item = navForRole[i];
    if (item?.children?.length) return;
    const path = pathFor(i);
    if (path === "settings") return;
    const target = `/dashboard/${path}`.replace(/\/+$/, "") || "/dashboard";
    if (samePath(location.pathname, target)) setPageEpoch(e => e + 1);
    navigate(target);
  };

  const handleLogout = () => {
    clearAuth();
    sessionStorage.removeItem("previewRole");
    navigate("/login");
  };

  const handleToggleNav = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setMobileNavOpen(o => !o);
    } else {
      setCollapsed(c => !c);
    }
  };

  // ── Dynamic system label (shows real org/company name from logged-in user) ─
  const currentUser = (() => { try { const r = localStorage.getItem("user"); return r ? JSON.parse(r) : null; } catch { return null; } })();
  const dynamicSystemLabel = (() => {
    if (isTrainer || isPending) return "بوابة المدرب";
    if (isEmployee)             return currentUser?.company_name ?? currentUser?.organization ?? current.data.systemName;
    if (isUser)                 return "بوابة المتدرب";
    // org / company: prefer real name from stored user over mock
    return currentUser?.name
        ?? currentUser?.full_name
        ?? currentUser?.provider_name
        ?? currentUser?.organization_name
        ?? currentUser?.company_name
        ?? current.data.orgName
        ?? current.data.systemName;
  })();

  const sidebarData = {
    ...current.data,
    navItems: navForRole,
    // show real entity name from logged-in user
    orgName: dynamicSystemLabel,
    // hide quick-stats widget for non-org roles; use live API stats for company
    stats: isOrgRole
      ? (current.id === "company" && companySidebarStats
          ? companySidebarStats
          : current.data.stats)
      : [],
    // never show stats widget for company role
    hideStats: current.id === "company",
  };

  // ── home route per role ────────────────────────────────────────────────────
  const HomeRoute = () => {
    if (isTrainer || isPending) return (
      <TrainerDashboardPage onViewSession={(s) => { setTrainerSessionId(s.id); navigate("/dashboard/trainer-session-view"); }} onAddProgram={() => navigate("/dashboard/coach-add-program")} />
    );
    if (isEmployee) return <UserDashboardPage role="employee" onViewProgram={(p) => { setViewUserProgramId(p.programId ?? p.id ?? p); setAutoOpenSessionId(p.autoOpenSessionId ?? null); navigate("/dashboard/user-program-view"); }} onViewSession={(s) => { setViewUserSessionId(s.sessionId ?? s.id); setViewUserSession(s); navigate("/dashboard/user-session-view"); }} />;
    if (isUser)     return <UserDashboardPage role="user"     onViewProgram={(p) => { setViewUserProgramId(p.programId ?? p.id ?? p); setAutoOpenSessionId(p.autoOpenSessionId ?? null); navigate("/dashboard/user-program-view"); }} onViewSession={(s) => { setViewUserSessionId(s.sessionId ?? s.id); setViewUserSession(s); navigate("/dashboard/user-session-view"); }} />;
    // org / company → show org dashboard (company gets its own branded home)
    if (current.id === "company") return <CompanyDashboard data={current.data} onViewProgram={(p) => { setViewDetailProgram(p); navigate("/dashboard/program-detail"); }} />;
    return <Dashboard onAddTrainer={() => navigate("/dashboard/add-trainer")} onAddProgram={() => navigate("/dashboard/add-program")} onGoNotifications={() => navigate("/dashboard/activity-log")} onViewSession={(s) => { setViewSession(s); navigate("/dashboard/session-view"); }} />;
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {!quizActive && (
        <Sidebar
          data={sidebarData}
          activeNav={activeNav}
          setActiveNav={handleNav}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          onLogout={handleLogout}
          onSettingsSub={(sub) => {
            const next = isIndeCoach() && (sub === "main" || sub === "users") ? "categories" : sub;
            setSettingsSub(next);
            navigate("/dashboard/settings");
          }}
          activeSettingsChild={settingsSub}
          activeChildPath={dashboardSeg(location.pathname)}
          onChildNav={(path) => {
            const idx = navForRole.findIndex(it => it.children?.some(c => c.path === path));
            if (idx >= 0) setActiveNav(idx);
            navigate(`/dashboard/${path}`); setMobileNavOpen(false);
          }}
        />
      )}
      <div className="flex flex-col flex-1 min-w-0">



        {!quizActive && (
          <Topbar
            data={current.data}
            onToggleSidebar={handleToggleNav}
            systemLabel={dynamicSystemLabel}
            onSearchSelect={(item) => {
              // normalise the raw program object so detail pages get what they expect
              const prog = item.raw ?? item;
              if (isUser || isEmployee) {
                // trainee / employee → UserProgramViewPage
                setViewUserProgramId(prog.id ?? item.id);
                navigate("/dashboard/user-program-view");
              } else if (current.id === "company") {
                // company buyer → ProgramDetailPage
                setViewDetailProgram({
                  id:       prog.id ?? item.id,
                  title:    item.title,
                  name:     item.title,
                  type:     item.type,
                  trainer:  item.trainer,
                  img:      item.img,
                  price:    item.price,
                  ...prog,
                });
                navigate("/dashboard/program-detail");
              } else if (isTrainer || isPending) {
                if (item.kind === "session") {
                  setTrainerSessionId(item.id);
                  navigate("/dashboard/trainer-session-view");
                } else {
                  setTrainerProgramId(prog.id ?? item.id, prog);
                  navigate("/dashboard/trainer-program-view");
                }
              } else {
                // org provider → view-program
                setViewProgramId(prog.id ?? item.id);
                navigate("/dashboard/view-program");
              }
            }}
          />
        )}
        {!quizActive && <SessionNotifyBanner />}

        <div className="flex-1 min-h-0 flex flex-col" dir="ltr">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#024677] animate-spin" />
            </div>
          }>
          <DashboardRoleGate>
          <Routes key={`${location.pathname}-${pageEpoch}`}>
            <Route index element={<HomeRoute />} />
            <Route path="trainer-dashboard" element={<TrainerDashboardPage onViewSession={(s) => { setTrainerSessionId(s.id); navigate("/dashboard/trainer-session-view"); }} onAddProgram={() => navigate("/dashboard/coach-add-program")} />} />
            {/* ── trainer-specific routes ── */}
            <Route path="trainer-programs"      element={<TrainerProgramsPage    onViewProgram={(p) => { setTrainerProgramId(p.id); navigate("/dashboard/trainer-program-view"); }} onAddProgram={() => navigate("/dashboard/coach-add-program")} />} />
            <Route path="trainer-program-view"  element={<TrainerProgramViewPage key={trainerProgramId} programId={trainerProgramId} onBack={() => navigate("/dashboard/trainer-programs")} onEdit={(p) => { setTrainerProgramId(p.id, p); navigate("/dashboard/trainer-program-edit"); }} />} />
            <Route path="trainer-program-edit"  element={<TrainerEditProgramPage programId={trainerProgramId} initialData={trainerProgramData} onBack={() => navigate("/dashboard/trainer-program-view")} onSaved={() => navigate("/dashboard/trainer-programs")} />} />
            <Route path="coach-add-program"     element={<CoachAddProgramPage onBack={() => navigate("/dashboard/trainer-programs")} onSaved={() => navigate("/dashboard/trainer-programs")} />} />
            <Route path="coach-add-session"     element={<AddCoachSessionPage onBack={() => navigate("/dashboard/coach-add-program")} />} />
            <Route path="trainer-sessions"      element={<TrainerSessionsPage    onViewSession={(s) => { setTrainerSessionId(s.id); navigate("/dashboard/trainer-session-view"); }} onEditSession={(s) => { setTrainerSessionId(s.id); navigate("/dashboard/trainer-session-view"); }} onAddSession={() => navigate("/dashboard/coach-add-session")} />} />
            <Route path="trainer-add-session"   element={<AddCoachSessionPage onBack={() => navigate("/dashboard/trainer-sessions")} />} />
            <Route path="trainer-session-view"  element={<TrainerSessionViewPage key={trainerSessionId} sessionId={trainerSessionId} onBack={() => navigate("/dashboard/trainer-sessions")} />} />
            <Route path="trainer-requests"      element={<TrainerRequestsPage />} />
            <Route path="assessments"           element={<AssessmentsPage />} />
            <Route path="tasks"                 element={<TasksPage />} />
            <Route path="grading"               element={<GradingPage />} />
            <Route path="notifications"         element={
              isTrainer || isPending
                ? <TrainerNotificationsPage />
                : isEmployee
                  ? <NotificationsPage forceRole="employee" />
                  : isUser
                    ? <NotificationsPage forceRole="trainee" />
                    : previewRoleId === "company" || current.id === "company"
                      ? <CompanyNotificationsPage />
                      : <NotificationsPage forceRole="org" />
            } />
            <Route path="activity-log"          element={<OrgActivityLogPage />} />
            <Route path="programs"     element={
              isUser || isEmployee
                ? <ProgramsBrowsePage onViewProgram={(p) => { setViewUserProgramId(p.id ?? p); navigate("/dashboard/user-program-view"); }} />
                : current.id === "company"
                  ? <CompanyBrowseProgramsPage
                      onViewProgram={(p) => { setViewDetailProgram(p); navigate("/dashboard/program-detail"); }}
                      onCustomRequest={(p) => { setViewDetailProgram(p); navigate("/dashboard/custom-request"); }}
                    />
                  : <ProgramsGrid onAddProgram={() => navigate("/dashboard/add-program")} onEditProgram={(p) => { setViewProgramId(p.id); navigate("/dashboard/view-program"); }} />
            } />
            <Route path="my-programs"  element={<MyProgramsPage onViewProgram={(p) => { setViewUserProgramId(p.programId ?? p.id ?? p); setAutoOpenSessionId(p.autoOpenSessionId ?? null); navigate("/dashboard/user-program-view"); }} onViewSession={(s) => { setViewUserSessionId(s.id ?? s.sessionId); navigate("/dashboard/user-session-view"); }} />} />
            <Route path="continue-watching"   element={<ContinueWatchingPage   role={isEmployee ? "employee" : "user"} onViewProgram={(p) => { setViewUserProgramId(p.programId ?? p.id ?? p); setAutoOpenSessionId(p.autoOpenSessionId ?? null); navigate("/dashboard/user-program-view"); }} onBack={() => navigate(-1)} />} />
            <Route path="my-enrolled"         element={<MyEnrolledProgramsPage  role={isEmployee ? "employee" : "user"} onViewProgram={(p) => { setViewUserProgramId(p.programId ?? p.id ?? p); navigate("/dashboard/user-program-view"); }} onBack={() => navigate(-1)} />} />
            <Route path="suggested-programs"  element={<SuggestedProgramsPage   onViewProgram={(p) => { setViewUserProgramId(p.id ?? p); navigate("/dashboard/user-program-view"); }} onBack={() => navigate(-1)} />} />
            <Route path="user-program-view" element={<UserProgramViewPage programId={viewUserProgramId} autoOpenSessionId={autoOpenSessionId || null} onBack={() => { setAutoOpenSessionId(null); navigate(-1); }} onGoPayments={() => navigate("/dashboard/payments")} />} />
            <Route path="user-program-session" element={<UserProgramSessionPage onBack={() => navigate(-1)} onEnroll={() => navigate("/dashboard/user-program-view")} />} />
            <Route path="user-profile"     element={<UserProfilePage />} />
            <Route path="training-record"  element={<TrainingRecordPage />} />
            <Route path="favorites"        element={<FavoritesPage />} />
            <Route path="support"          element={<SupportPage />} />
            <Route path="payments"         element={<PaymentsPage />} />
            <Route path="add-program"  element={current.id === "company"
              ? <CompanyAddProgramPage onBack={() => navigate("/dashboard/programs")} />
              : <AddProgramPage onBack={() => navigate("/dashboard/programs")} />} />
            <Route path="edit-program" element={<EditProgramPage programId={viewProgramId} onBack={() => navigate("/dashboard/view-program")} />} />
            <Route path="view-program" element={<ProgramViewPage programId={viewProgramId} onBack={() => navigate("/dashboard/programs")} onEdit={(p) => { setViewProgramId(p?.id ?? viewProgramId); navigate("/dashboard/edit-program"); }} />} />
            <Route path="sessions"     element={isUser || isEmployee ? <UserSessionsPage onViewSession={(s) => { setViewUserSessionId(s.id ?? s.sessionId); navigate("/dashboard/user-session-view"); }} /> : <SessionsPage onViewSession={(s) => { setViewSession(s); navigate("/dashboard/session-view"); }} onEditSession={(s) => { setEditSession(s); navigate("/dashboard/session-edit"); }} onAddContent={(s) => { setViewSession(s); try { sessionStorage.setItem("addContentSession", JSON.stringify(s)); } catch{} navigate("/dashboard/session-add-content"); }} />} />
            <Route path="quizzes"      element={<QuizzesPage />} />
            <Route path="user-session-view" element={<UserSessionViewPage session={getViewUserSession()} sessionId={viewUserSessionId} onBack={() => navigate("/dashboard/sessions")} />} />
            <Route path="session-view" element={<SessionViewPage session={viewSession ?? {}} onBack={() => navigate("/dashboard/sessions")} />} />
            <Route path="session-add-content" element={(() => {
              const s = viewSession ?? (() => { try { return JSON.parse(sessionStorage.getItem("addContentSession") || "null"); } catch { return null; } })() ?? {};
              return <SessionAddContentPage
                lesson={{ name: s.title, date: s.date, time: s.timeFrom ?? s.starts_at, attachments: s.attachments ?? [], video: s.video ?? null }}
                unitTitle={s.unit ?? s.program ?? ""}
                programName={s.program ?? "إدارة الجلسات"}
                onSave={() => { sessionStorage.removeItem("addContentSession"); navigate("/dashboard/sessions"); }}
                onCancel={() => { sessionStorage.removeItem("addContentSession"); navigate("/dashboard/sessions"); }}
              />;
            })()} />
            <Route path="add-session"  element={<AddSessionPage onBack={() => navigate("/dashboard/sessions")} />} />
            <Route path="session-edit" element={<AddSessionPage session={editSession} onBack={() => navigate("/dashboard/sessions")} />} />
            <Route path="today-sessions" element={<TodaySessionsPage onViewSession={(s) => { setViewSession(s); navigate("/dashboard/session-view"); }} onEditSession={(s) => { setEditSession(s); navigate("/dashboard/session-edit"); }} />} />
            <Route path="my-requests"  element={<TrainerMyRequestsPage onViewSession={(s) => { setTrainerSessionId(s.id); navigate("/dashboard/trainer-session-view"); }} />} />
            <Route path="profile"      element={<TrainerMyProfilePage />} />
            <Route path="funding-requests" element={<FundingRequestsPage onReviewRequest={(r) => { setViewFundingRequest(r); navigate("/dashboard/funding-request-review"); }} />} />
            <Route path="funding-request-detail" element={<Navigate to="/dashboard/funding-requests" replace />} />
            <Route path="funding-request-locked" element={<Navigate to="/dashboard/funding-requests" replace />} />
            <Route path="funding-request-review" element={<FundingRequestReviewPage request={viewFundingRequest} onBack={() => navigate("/dashboard/funding-requests")} onDone={() => navigate("/dashboard/funding-requests")} />} />
            <Route path="employees"     element={<EmployeesPage onViewEmployee={(e) => { setViewEmployee(e); navigate("/dashboard/employee-view"); }} />} />
            <Route path="employee-view" element={<EmployeeViewPage employee={viewEmployee} onBack={() => navigate("/dashboard/employees")} onEdit={(e) => { setViewEmployee(e); navigate("/dashboard/employees"); }} />} />
            <Route path="employee-programs" element={<EmployeeProgramsPage employee={viewEmployee} onBack={() => navigate("/dashboard/employee-view")} onViewProgram={(p) => { setViewDetailProgram(p); navigate("/dashboard/enrolled-program-detail"); }} />} />
            <Route path="enrolled-program-detail" element={<EnrolledProgramDetailPage program={viewDetailProgram} onBack={() => navigate("/dashboard/employee-programs")} />} />
            <Route path="browse-programs"   element={<CompanyBrowseProgramsPage onViewProgram={(p) => { setViewDetailProgram(p); navigate("/dashboard/program-detail"); }} />} />
            <Route path="program-detail"    element={<ProgramDetailPage program={viewDetailProgram} onBack={() => navigate("/dashboard")} onCustomRequest={() => navigate("/dashboard/custom-request")} />} />
            <Route path="custom-request"    element={<CustomRequestPage program={viewDetailProgram} onBack={() => navigate("/dashboard/program-detail")} />} />
            <Route path="trainers"     element={<TrainersPage onAddTrainer={() => navigate("/dashboard/add-trainer")} onViewTrainer={(t) => { setViewTrainer(t); localStorage.setItem("viewTrainerId", t.id); navigate("/dashboard/trainer-profile"); }} />} />
            <Route path="add-trainer"  element={<AddTrainerPage onBack={() => {
              if (location.state?.backTo === "settings-users") {
                setSettingsSub("users");
                navigate("/dashboard/settings");
              } else {
                navigate("/dashboard/trainers");
              }
            }} />} />
            <Route path="trainer-profile" element={<TrainerProfilePage trainer={viewTrainer} onBack={() => navigate("/dashboard/trainers")} />} />
            <Route path="trainees"     element={<TraineesPage />} />
            <Route path="finance"      element={<FinancePage />} />
            <Route path="company-payments" element={<CompanyPaymentsPage />} />
            <Route path="finance-requests" element={<FinanceRequestPage />} />
            <Route path="attendance"   element={<AttendancePage />} />
            <Route path="review"       element={<ReviewRequestsPage />} />
            <Route path="negotiation-requests" element={<NegotiationRequestsPage />} />
            <Route path="settings"     element={<SettingsPage orgName={dynamicSystemLabel} onAddProgram={() => navigate("/dashboard/add-program")} onViewProgram={(p) => { setViewProgramId(p?.id); navigate("/dashboard/view-program"); }} onAddUser={() => navigate("/dashboard/add-trainer", { state: { backTo: "settings-users" } })} initialView={settingsSub} />} />
            <Route path="settings-security" element={<CompanySecuritySettingsPage />} />
            <Route path="settings-users" element={<CompanyUsersSettingsPage />} />
            <Route path="settings-company" element={<CompanyProfileSettingsPage />} />
            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </DashboardRoleGate>
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-white">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-[#024677] animate-spin" />
        </div>
      }>
      <Routes>
      <Route path="/login" element={
        <RedirectIfAuth>
          <LoginPage
            onLogin={() => { /* token already saved in LoginPage */ window.location.replace("/dashboard"); }}
            onRegister={() => window.location.replace("/register")}
          />
        </RedirectIfAuth>
      } />

      <Route path="/register/*" element={
        <RedirectIfAuth>
          <RegisterFlow />
        </RedirectIfAuth>
      } />

      <Route path="/dashboard/*" element={
        <RequireAuth>
          {/* key by role so switching systems remounts the bell on that system's API */}
          <NotificationProvider key={getUserRole() ?? "anon"}>
            <DashboardShell />
          </NotificationProvider>
        </RequireAuth>
      } />

      {/* default redirect */}
      <Route path="*" element={
        <Navigate to={localStorage.getItem("token") ? "/dashboard" : "/login"} replace />
      } />
      </Routes>
      </Suspense>
    </ToastProvider>
  );
}



