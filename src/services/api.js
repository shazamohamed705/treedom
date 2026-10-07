const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://treedom.storge-ai.com/api";

import { getToken, getUserRole, isIndeCoach } from "./auth";
import { assertApiPathAllowed, resolveNotificationRole } from "./apiScope";

// ── helpers ──────────────────────────────────────────────────────────────────

async function request(path, options = {}) {
  // Per-system isolation: block cross-role API calls (e.g. هيئة while in company/trainee)
  assertApiPathAllowed(path);

  const isFormData = options.body instanceof FormData;
  const { headers: optHeaders, ...restOptions } = options;
  const headers = {
    "Accept": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    // Don't set Content-Type for FormData — browser sets it with boundary automatically
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(optHeaders || {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, {
    ...restOptions,
    cache: "no-store",
    headers,
  });
  const json = await res.json();
  if (!res.ok || json?.status === false) {
    // collect Laravel validation errors if present
    const validationErrors = json?.errors
      ? Object.values(json.errors).flat().join(" | ")
      : null;
    throw new Error(validationErrors || json?.message || json?.msg || "حدث خطأ، حاول مرة أخرى");
  }
  return json;
}

// ── account types ─────────────────────────────────────────────────────────────

/**
 * GET /account-types
 * Returns array of account type objects.
 */
export async function fetchAccountTypes() {
  const data = await request("/account-types");
  return data?.data?.account_types ?? [];
}

/**
 * GET /specializations  (public, no auth needed)
 * Returns array of specialization objects: { id, name }
 */
export async function fetchSpecializations() {
  const data = await request("/specializations");
  return data?.data ?? [];
}

// ── registration ──────────────────────────────────────────────────────────────

/**
 * Login as a provider (training authority / company).
 * POST /provider/auth/login
 */
export async function loginProvider(payload) {
  return request("/provider/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function toFormData(payload) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, value);
    }
  });
  return fd;
}

/**
 * Register a trainee (individual account).
 * POST /trainee/auth/register
 */
export async function registerTrainee(payload) {
  const body = payload instanceof FormData ? payload : toFormData(payload);
  return request("/trainee/auth/register", {
    method: "POST",
    body,
  });
}

/**
 * Activate a trainee account with OTP code.
 * POST /trainee/auth/activate
 * Body: { email, code }
 */
export async function activateTrainee(payload) {
  return request("/trainee/auth/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Resend OTP code for trainee account activation.
 * POST /trainee/auth/resend-code
 * Body: { email, purpose: "register" }
 */
export async function resendTraineeCode(email) {
  return request("/trainee/auth/resend-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "register" }),
  });
}

/**
 * Register a trainer (individual_trainer account).
 * POST /trainer/auth/register
 */
export async function registerTrainer(payload) {
  const body = payload instanceof FormData ? payload : toFormData(payload);
  return request("/trainer/auth/register", {
    method: "POST",
    body,
  });
}

/**
 * Register a company.
 * POST /company/auth/register
 */
export async function registerCompany(payload) {
  return request("/company/auth/register", {
    method: "POST",
    body: toFormData(payload),
  });
}

/**
 * Login as a company.
 * POST /company/auth/login
 */
export async function loginCompany(payload) {
  return request("/company/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * GET /company/programs
 * @param {object} params — { search, page, per_page }
 */
export async function fetchCompanyPrograms(params = {}) {
  const query = new URLSearchParams();
  if (params.search   !== undefined) query.set("search",   params.search);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/company/programs${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/programs/:id
 * Returns full program detail for company role.
 */
export async function fetchCompanyProgramDetail(id) {
  return request(`/company/programs/${id}`, { headers: authHeaders() });
}

/**
 * GET /company/invoices
 * @param {object} params — { page, per_page, status }
 */
export async function fetchCompanyInvoices(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  if (params.status   !== undefined) query.set("status",   params.status);
  const qs = query.toString();
  return request(`/company/invoices${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /company/program-bookings
 * Body: { program_id, trainee_count, requested_date, notes? }
 */
export async function createCompanyProgramBooking(payload) {
  return request("/company/program-bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * GET /company/enrolled-programs
 * Returns programs the company has purchased seats for.
 * @param {object} params — { page, per_page }
 */
export async function fetchCompanyEnrolledPrograms(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/company/enrolled-programs${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/enrolled-programs/:id
 * Full detail of a purchased program: seats, price, invoice, program_details, employees.
 */
export async function fetchCompanyEnrolledProgram(id) {
  return request(`/company/enrolled-programs/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/enrolled-programs/:id/members
 * Paginated list of employees enrolled in this program.
 * @param {*} id — enrolled-program id
 * @param {object} params — { page, per_page }
 */
export async function fetchCompanyEnrolledProgramMembers(id, params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/company/enrolled-programs/${id}/members${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /company/enrolled-programs/:id/members
 * Adds company employees into this enrolled program.
 * @param {*} id — enrolled-program id
 * @param {number[]} employeeIds
 */
export async function addCompanyEnrolledProgramMembers(id, employeeIds) {
  return request(`/company/enrolled-programs/${id}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ employee_ids: employeeIds }),
  });
}

/**
 * GET /company/employees
 * @param {object} params — { search, page, per_page }
 */
export async function fetchCompanyEmployees(params = {}) {
  const query = new URLSearchParams();
  if (params.search   !== undefined) query.set("search",   params.search);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/company/employees${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employees/:id
 * Returns full employee detail: personal info, stats, programs, attendance.
 */
export async function fetchCompanyEmployee(id) {
  return request(`/company/employees/${id}`, { headers: authHeaders() });
}

/**
 * GET /company/departments
 * Returns array of department objects: { id, company_id, name, description, employees_count, ... }
 */
export async function fetchCompanyDepartments() {
  const data = await request("/company/departments", { headers: authHeaders() });
  return Array.isArray(data?.data) ? data.data : [];
}

/**
 * POST /company/departments
 * Create a new department.
 * Body: { name, job_title?, description?, details? }
 */
export async function createCompanyDepartment(payload) {
  return request("/company/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * POST /company/employees
 * Add a new employee to the company.
 * Body: { name, national_id, email, department_id, job_title }
 * Response data includes `temporary_password` (single-use login password).
 */
export async function createCompanyEmployee(payload) {
  return request("/company/employees", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * PUT /company/employees/:id
 * Update an existing employee.
 * Body: { name, national_id, email, department_id, job_title, enrolled_program_ids[] }
 */
export async function updateCompanyEmployee(id, payload) {
  return request(`/company/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /company/employees/:id
 * Delete an employee from the company.
 */
export async function deleteCompanyEmployee(id) {
  return request(`/company/employees/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

/**
 * POST /company/employees/import
 * Import employees from an Excel/CSV file.
 * @param {File} file — .xls / .xlsx / .csv file
 * Response: { status, message, data: { imported_count, updated_count, failed_rows[] } }
 */
export async function importCompanyEmployees(file) {
  const fd = new FormData();
  fd.append("file", file);
  return request("/company/employees/import", {
    method: "POST",
    headers: authHeaders(),   // no Content-Type — browser sets multipart boundary
    body: fd,
  });
}

/**
 * Activate a company account with OTP code.
 * POST /company/auth/activate
 * Body: { email, code }
 */
export async function activateCompany(payload) {
  return request("/company/auth/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * Resend OTP code for company account activation.
 * POST /company/auth/resend-code
 * Body: { email, purpose: "register" }
 */
export async function resendCompanyCode(email) {
  return request("/company/auth/resend-code", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, purpose: "register" }),
  });
}

/**
 * Register a training authority (هيئة تدريبية).
 * POST /provider/auth/register
 */
export async function registerProvider(payload) {
  return request("/provider/auth/register", {
    method: "POST",
    body: toFormData(payload),
  });
}

/**
 * Generic register — posts to the register_path returned by the API.
 * register_path example: "/api/trainee/auth/register"
 * We strip the leading "/api" since BASE_URL already includes it.
 */
export async function registerByPath(registerPath, payload) {
  const path = registerPath.replace(/^\/api/, "");
  return request(path, {
    method: "POST",
    body: toFormData(payload),
  });
}

// ── helpers (authenticated) ───────────────────────────────────────────────────

function authHeaders() {

  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── programs ──────────────────────────────────────────────────────────────────

function programsBase() {
  return isIndeCoach() ? "/trainer/programs" : "/provider/programs";
}

function sessionsBase() {
  return isIndeCoach() ? "/trainer/sessions" : "/provider/sessions";
}

function unwrapTrainerSessionsList(res) {
  if (!isIndeCoach()) return res;
  const data = res?.data;
  if (data?.all_sessions) return res;
  const paginator = Array.isArray(data) ? { data }
    : Array.isArray(data?.sessions?.data) ? data.sessions
    : Array.isArray(data?.sessions) ? { data: data.sessions, meta: data.meta }
    : Array.isArray(data?.data) ? data
    : { data: [], meta: {} };
  return {
    ...res,
    data: {
      tabs: data?.tabs ?? {},
      all_sessions: {
        data: paginator.data ?? [],
        meta: paginator.meta ?? { last_page: 1 },
        last_page: paginator.meta?.last_page ?? paginator.last_page ?? 1,
      },
    },
  };
}

/**
 * GET /provider/programs  or  GET /trainer/programs  (inde_coach)
 * @param {object} params — { status, activity, search, per_page, page }
 */
export async function fetchPrograms(params = {}) {
  const query = new URLSearchParams();
  if (isIndeCoach()) {
    query.set("status",   params.status   ?? "");
    query.set("activity", params.activity ?? "");
    query.set("search",   params.search   ?? "");
  } else {
    if (params.status   !== undefined) query.set("status",   params.status);
    if (params.activity !== undefined) query.set("activity", params.activity);
    if (params.search   !== undefined) query.set("search",   params.search);
    else                               query.set("search",   "");
  }
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  if (params.page     !== undefined) query.set("page",     params.page);

  const qs = query.toString();
  return request(`${programsBase()}${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/programs/approved  or  /trainer/programs/approved
 */
export async function fetchApprovedPrograms() {
  return request(`${programsBase()}/approved`, {
    headers: authHeaders(),
  });
}

// ── programs (create) ─────────────────────────────────────────────────────────

/**
 * POST /provider/programs  or  POST /trainer/programs
 * Accepts FormData (supports file uploads for sessions).
 * @param {FormData} formData
 */
export async function createProgram(formData) {
  return request(programsBase(), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
}

/**
 * GET /provider/programs/:id  or  GET /trainer/programs/:id
 */
export async function fetchProgram(id) {
  return request(`${programsBase()}/` + id, {
    headers: authHeaders(),
  });
}

/**
 * PUT /provider/programs/:id  or  PUT /trainer/programs/:id
 */
export async function updateProgram(id, payload) {
  if (payload instanceof FormData) {
    payload.set("_method", "PUT");
    return request(`${programsBase()}/` + id, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });
  }
  return request(`${programsBase()}/` + id, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}
export async function submitProgram(id) {
  return request(`${programsBase()}/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ── coaches ───────────────────────────────────────────────────────────────────

/**
 * GET /provider/coach-permissions
 * Returns roles, assignable_roles, matrix, permissions and presets.
 */
export async function fetchCoachPermissions() {
  return request("/provider/coach-permissions", {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/coaches
 */
export async function fetchCoaches(params = {}) {
  const query = new URLSearchParams();
  if (params.per_page)  query.set("per_page",   params.per_page);
  if (params.page)      query.set("page",        params.page);
  if (params.search)    query.set("search",      params.search);
  if (params.program_id) query.set("program_id", params.program_id);
  const qs = query.toString();
  return request(`/provider/coaches${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/coaches/:id/profile
 */
export async function fetchCoachProfile(id) {
  return request(`/provider/coaches/${id}/profile`, {
    headers: authHeaders(),
  });
}

// ── fields (المجالات) ─────────────────────────────────────────────────────────

/**
 * GET /provider/fields  or  GET /trainer/fields  (inde_coach)
 */
export async function fetchFields(params = {}) {
  const query = new URLSearchParams();
  if (params.per_page) query.set("per_page", params.per_page);
  if (params.page)     query.set("page",     params.page);
  if (isIndeCoach()) {
    query.set("search", params.search ?? "");
    query.set("status", params.status ?? "");
  }
  const qs = query.toString();
  const base = isIndeCoach() ? "/trainer/fields" : "/provider/fields";
  return request(`${base}${qs ? "?" + qs : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/fields  or  POST /trainer/fields
 * body: { name: { ar, en }, status: 1 }
 */
export async function createField(payload) {
  const base = isIndeCoach() ? "/trainer/fields" : "/provider/fields";
  return request(base, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /provider/fields/:id  or  DELETE /trainer/fields/:id
 */
export async function deleteField(id) {
  const base = isIndeCoach() ? "/trainer/fields/" : "/provider/fields/";
  return request(base + id, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * GET /categories  (public, no auth needed)
 */
export async function fetchCategories() {
  const res = await request("/categories");
  return res?.data ?? [];
}

/**
 * POST /provider/categories
 * Create a new category.
 */
export async function createCategory(payload) {
  return request("/provider/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /provider/categories/:id
 */
export async function deleteCategory(id) {
  return request("/provider/categories/" + id, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ── sessions ──────────────────────────────────────────────────────────────────

/**
 * GET /provider/sessions
 * @param {object} params — { status, delivery_mode, search, page }
 */
export async function fetchSessions(params = {}) {
  const query = new URLSearchParams();
  if (params.status        !== undefined) query.set("status",        params.status);
  if (params.delivery_mode !== undefined) query.set("delivery_mode", params.delivery_mode);
  if (params.search        !== undefined) query.set("search",        params.search);
  if (params.page          !== undefined) query.set("page",          params.page);
  if (params.per_page      !== undefined) query.set("per_page",      params.per_page);
  const qs = query.toString();
  const res = await request(`${sessionsBase()}${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
  return unwrapTrainerSessionsList(res);
}

/**
 * POST /provider/sessions
 * Create a standalone session (the same shape returned by the API).
 */
export async function createSession(payload) {
  const isFormData = payload instanceof FormData;
  return request(sessionsBase(), {
    method: "POST",
    // don't set Content-Type for FormData — browser sets it with the boundary
    headers: isFormData ? authHeaders() : { "Content-Type": "application/json", ...authHeaders() },
    body: payload,
  });
}

/**
 * PUT /provider/sessions/:id
 * Update an existing session (Laravel method spoofing via _method=PUT).
 */
export async function updateSession(id, payload) {
  const isFormData = payload instanceof FormData;
  if (isFormData && !isIndeCoach()) {
    payload.set("_method", "PUT");
  }
  return request(`${sessionsBase()}/${id}`, {
    method: "POST",
    headers: isFormData ? authHeaders() : { "Content-Type": "application/json", ...authHeaders() },
    body: payload,
  });
}

/**
 * GET /provider/sessions/:id  or  GET /trainer/sessions/:id (inde_coach)
 */
export async function fetchSession(id) {
  return request(`${sessionsBase()}/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/sessions/:id/attendance  or  GET /trainer/sessions/:id/attendance (inde_coach)
 */
export async function fetchSessionAttendance(id) {
  return request(`${sessionsBase()}/${id}/attendance`, {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/sessions/:id/notify  or  POST /trainer/sessions/:id/notify (inde_coach)
 */
export async function notifySession(id) {
  return request(`${sessionsBase()}/${id}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /trainer/sessions/:id/notify-trainee
 * Independent trainer only. Body: { trainee_id }
 */
export async function notifyTrainerTrainee(sessionId, traineeId) {
  return request(`/trainer/sessions/${sessionId}/notify-trainee`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ trainee_id: traineeId }),
  });
}

/**
 * POST /provider/sessions/:id/start  or  POST /trainer/sessions/:id/start (inde_coach)
 */
export async function startSession(id) {
  return request(`${sessionsBase()}/${id}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * Starts a session with the endpoint that matches the logged-in role.
 * Independent trainer → POST /trainer/sessions/:id/start
 * Coach under org     → POST /provider/coach-sessions/:id/start
 * Provider/org        → POST /provider/sessions/:id/start
 */
export async function startSessionForRole(id) {
  if (isIndeCoach()) return startSession(id);
  const role = getUserRole();
  if (role === "coach" || role === "trainer") return startCoachSession(id);
  return startSession(id);
}

/**
 * POST /provider/sessions/:id/end
 * Ends a running session.
 */
export async function endSession(id) {
  return request(`/provider/sessions/${id}/end`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /provider/coaches
 * Create a new coach (trainer).
 * Accepts FormData: name, email, phone, bio, years_of_experience,
 *                   specialization_id, id_card_image, cv, preset
 */
export async function createCoach(formData) {
  return request("/provider/coaches", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
}

/**
 * DELETE /provider/coaches/:id
 */
export async function deleteCoach(id) {
  return request(`/provider/coaches/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ── trainer auth ──────────────────────────────────────────────────────────────

/**
 * POST /provider/auth/coach/login
 * Login as a coach (مدرب تحت هيئة).
 * Returns token + coach data (permissions, assigned_programs, specialization, etc.)
 */
export async function loginCoach(payload) {
  return request("/provider/auth/coach/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /trainee/auth/login
 */
export async function loginTrainee(payload) {
  return request("/trainee/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /trainer/auth/login
 */
export async function loginTrainer(payload) {
  return request("/trainer/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /company/employee/auth/login
 * Response includes `type: "staff"` — normalised to "employee" in LoginPage.
 */
export async function loginEmployee(payload) {
  return request("/company/employee/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── employee (company staff) ─────────────────────────────────────────────────

/**
 * GET /company/employee/enrollments
 * Programs the logged-in employee is enrolled in (mirrors trainee enrollments).
 */
export async function fetchEmployeeEnrollments(params = {}) {
  const q = new URLSearchParams();
  if (params.page     !== undefined) q.set("page",     params.page);
  if (params.per_page !== undefined) q.set("per_page", params.per_page);
  const qs = q.toString();
  return request(`/company/employee/enrollments${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/sessions
 * Upcoming/past sessions for the logged-in employee.
 */
export async function fetchEmployeeSessions(params = {}) {
  const q = new URLSearchParams();
  if (params.filter   !== undefined) q.set("filter",   params.filter);
  if (params.page     !== undefined) q.set("page",     params.page);
  if (params.per_page !== undefined) q.set("per_page", params.per_page);
  const qs = q.toString();
  return request(`/company/employee/sessions${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/programs
 * Browse available programs (same as trainee programs browse).
 */
export async function fetchEmployeePrograms(params = {}) {
  const q = new URLSearchParams();
  if (params.page     !== undefined) q.set("page",     params.page);
  if (params.per_page !== undefined) q.set("per_page", params.per_page);
  if (params.search   !== undefined) q.set("search",   params.search);
  const qs = q.toString();
  return request(`/company/employee/programs${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/profile
 */
export async function fetchEmployeeProfile() {
  return request("/company/employee/profile", { headers: authHeaders() });
}

/**
 * GET /company/employee/enrollments/:programId
 */
export async function fetchEmployeeEnrollmentDetail(programId) {
  return request(`/company/employee/enrollments/${programId}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/programs/:id
 * Returns full program details for an employee.
 */
export async function fetchEmployeeProgramDetail(id) {
  return request(`/company/employee/programs/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/funding-requests
 * Returns the employee's own funding requests.
 * @param {object} params — { page, per_page, status }
 */
export async function fetchEmployeeFundingRequests(params = {}) {
  const q = new URLSearchParams();
  if (params.page     !== undefined) q.set("page",     params.page);
  if (params.per_page !== undefined) q.set("per_page", params.per_page);
  if (params.status   !== undefined) q.set("status",   params.status);
  const qs = q.toString();
  return request(`/company/employee/funding-requests${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/sessions/:id
 */
export async function fetchEmployeeSessionDetail(id) {
  return request(`/company/employee/sessions/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /company/employee/favourites
 */
export async function fetchEmployeeFavourites(params = {}) {
  const q = new URLSearchParams();
  if (params.per_page !== undefined) q.set("per_page", params.per_page);
  const qs = q.toString();
  return request(`/company/employee/favourites${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /company/employee/favourites
 * Body: { program_id }
 */
export async function addEmployeeFavourite(programId) {
  return request("/company/employee/favourites", {
    method: "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ program_id: programId }),
  });
}

/**
 * DELETE /company/employee/favourites/:programId — remove
 */
export async function removeEmployeeFavourite(programId) {
  return request(`/company/employee/favourites/${programId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

/**
 * POST /company/employee/funding-requests
 * Employee submits a funding request to their company for a program.
 * @param {{ program_id: number }} payload
 */
export async function submitEmployeeFundingRequest(payload) {
  return request("/company/employee/funding-requests", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
}

/**
 * GET /trainer/profile  (authenticated trainer)
 */
export async function fetchTrainerProfile() {
  return request("/trainer/profile", { headers: authHeaders() });
}

/**
 * GET /trainer/sessions  (sessions assigned to the logged-in trainer)
 */
export async function fetchTrainerSessions(params = {}) {
  return fetchSessions(params);
}



// ── financials ────────────────────────────────────────────────────────────────

/**
 * GET /provider/financials  or  GET /trainer/financials (inde_coach)
 * @param {"this_year"|"last_year"|"this_month"|"last_month"|"custom"} period
 * @param {{ from?: string, to?: string }} dateRange  — only used when period = "custom"
 *
 * Response shape (data field):
 * {
 *   period, summary, revenue_trend, revenue_by_field,
 *   programs_revenue, top_companies
 * }
 */
export async function fetchFinancials(period = "this_year", dateRange = {}) {
  const query = new URLSearchParams({ period });
  if (period === "custom") {
    if (dateRange.from) query.set("from", dateRange.from);
    if (dateRange.to)   query.set("to",   dateRange.to);
  }
  const base = isIndeCoach() ? "/trainer/financials" : "/provider/financials";
  return request(`${base}?${query.toString()}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ── dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /provider/dashboard
 * Returns the full org dashboard in one call.
 */
export async function fetchDashboard(params = {}) {
  const query = new URLSearchParams({
    upcoming_sessions_limit:   params.upcoming_sessions_limit   ?? 3,
    active_programs_per_page:  params.active_programs_per_page  ?? 10,
  });
  return request(`/provider/dashboard?${query.toString()}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * GET /trainer/dashboard
 * Independent trainer dashboard (same payload shape as provider dashboard).
 */
export async function fetchTrainerDashboard(params = {}) {
  const query = new URLSearchParams({
    upcoming_sessions_limit:   params.upcoming_sessions_limit   ?? 3,
    active_programs_per_page:  params.active_programs_per_page  ?? 10,
  });
  return request(`/trainer/dashboard?${query.toString()}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * GET /provider/settings
 * Org general settings: notifications, attendance, zoom (+ options).
 */
export async function fetchProviderSettings() {
  return request(`/provider/settings`, {
    headers: authHeaders(),
  });
}

/**
 * PUT /provider/settings
 * Update org general settings (no locale/language).
 * @param {object} payload
 */
export async function updateProviderSettings(payload = {}) {
  return request(`/provider/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * GET /company/dashboard
 * Company dashboard: stats, follow-up items, latest registered programs.
 */
export async function fetchCompanyDashboard() {
  return request(`/company/dashboard`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ── trainees ──────────────────────────────────────────────────────────────────

/**
 * GET /provider/trainees
 * @param {object} params — { search, per_page, page, program_id }
 */
export async function fetchTrainees(params = {}) {
  const query = new URLSearchParams();
  if (params.per_page  !== undefined) query.set("per_page",   params.per_page);
  if (params.page      !== undefined) query.set("page",       params.page);
  if (params.search    !== undefined) query.set("search",     params.search);
  if (params.program_id !== undefined) query.set("program_id", params.program_id);
  const qs = query.toString();
  return request(`/provider/trainees${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/owned-trainees
 * Students created by this training authority (not public purchasers).
 */
export async function fetchOwnedTrainees(params = {}) {
  const query = new URLSearchParams();
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.search   !== undefined) query.set("search",   params.search);
  const qs = query.toString();
  return request(`/provider/owned-trainees${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/owned-trainees
 * Body: { name, email, phone, country_code }
 */
export async function createOwnedTrainee(payload) {
  return request("/provider/owned-trainees", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * DELETE /provider/owned-trainees/:id
 */
export async function deleteOwnedTrainee(id) {
  return request(`/provider/owned-trainees/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ── purchasers (trainees who bought programs) ─────────────────────────────────

/**
 * GET /provider/purchasers
 * @param {object} params — { program_id, search }
 * Response: { statistics, individuals, companies }
 */
export async function fetchPurchasers(params = {}) {
  const query = new URLSearchParams();
  if (params.program_id !== undefined) query.set("program_id", params.program_id);
  if (params.search     !== undefined) query.set("search",     params.search);
  const qs = query.toString();
  return request(`/provider/purchasers${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/purchasers/individuals
 * @param {object} params — { per_page, search, page }
 */
export async function fetchPurchaserIndividuals(params = {}) {
  const query = new URLSearchParams();
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.search   !== undefined) query.set("search",   params.search);
  const qs = query.toString();
  return request(`/provider/purchasers/individuals${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/purchasers/companies
 * @param {object} params — { per_page, search, page }
 */
export async function fetchPurchaserCompanies(params = {}) {
  const query = new URLSearchParams();
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.search   !== undefined) query.set("search",   params.search);
  const qs = query.toString();
  return request(`/provider/purchasers/companies${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/purchasers/companies/:id
 * Company purchaser detail with enrolled employees.
 */
export async function fetchPurchaserCompany(id) {
  return request(`/provider/purchasers/companies/${id}`, {
    headers: authHeaders(),
  });
}

// ── program review requests ───────────────────────────────────────────────────

/**
 * GET /provider/review-requests
 * @param {object} params — { search, status, page, per_page }
 */
export async function fetchReviewRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.search   !== undefined) query.set("search",   params.search);
  if (params.status   !== undefined) query.set("status",   params.status);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/provider/review-requests${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/review-requests/:id
 */
export async function fetchReviewRequest(id) {
  return request(`/provider/review-requests/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/review-requests/:id/approve
 */
export async function approveReviewRequest(id) {
  return request(`/provider/review-requests/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /provider/review-requests/:id/reject
 * @param {string} reason — reject_reason sent to API
 */
export async function rejectReviewRequest(id, reason = "") {
  return request(`/provider/review-requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reject_reason: reason }),
  });
}

/**
 * GET /trainer/special-requests
 * Independent trainer special requests (Laravel paginator).
 */
export async function fetchTrainerSpecialRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.search   !== undefined) query.set("search",   params.search);
  if (params.status   !== undefined) query.set("status",   params.status);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/trainer/special-requests${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /trainer/special-requests/:id/approve
 */
export async function approveTrainerSpecialRequest(id) {
  return request(`/trainer/special-requests/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /trainer/special-requests/:id/reject
 */
export async function rejectTrainerSpecialRequest(id, reason = "") {
  return request(`/trainer/special-requests/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reject_reason: reason }),
  });
}

// ── coach self-profile ────────────────────────────────────────────────────────

/**
 * GET /provider/coach/profile
 * Returns the logged-in coach's own profile:
 * id, name, bio, email, phone, image, specialization,
 * role { key, name }, provider, permissions[], type, token, avg_rate, etc.
 */
export async function fetchMyCoachProfile() {
  return request("/provider/coach/profile", {
    headers: authHeaders(),
  });
}

// ── coach profile update & password ──────────────────────────────────────────

/**
 * POST /provider/coach/profile  (multipart FormData)
 * Update the logged-in coach's profile.
 * Fields: cv, id_card_image, image, lang, specialization_id, company_name,
 *         years_of_experience, country_code, phone, name, bio
 */
export async function updateCoachProfile(formData) {
  return request("/provider/coach/profile", {
    method: "POST",
    headers: authHeaders(),   // no Content-Type → browser sets multipart boundary
    body: formData,
  });
}

/**
 * POST /provider/coach/change-password
 * Body: { current_password, password, password_confirmation }
 */
export async function changeCoachPassword(payload) {
  return request("/provider/coach/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

// ── company change password ───────────────────────────────────────────────────

/**
 * POST /company/auth/change-password
 * @param {{ current_password: string, new_password: string, new_password_confirmation: string }} payload
 */
export async function changeCompanyPassword(payload) {
  return request("/company/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

// ── coach programs ────────────────────────────────────────────────────────────

/**
 * GET /provider/coach-programs
 * @param {object} params — { search, status, page, per_page }
 * Returns the logged-in coach's assigned programs.
 */
export async function fetchCoachPrograms(params = {}) {
  const query = new URLSearchParams();
  if (params.search   !== undefined) query.set("search",   params.search);
  if (params.status   !== undefined) query.set("status",   params.status);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/provider/coach-programs${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/coach-programs/:id
 * Returns full program details including sessions, checklist, readiness.
 */
export async function fetchCoachProgram(id) {
  return request(`/provider/coach-programs/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * PUT /provider/coach-programs/:id
 * Fields: name[ar], name[en], price_amount, field_id, description[ar], description[en],
 *         start_date, end_date, hours_count
 */
export async function updateCoachProgram(id, payload) {
  return request(`/provider/coach-programs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * POST /provider/coach-programs/:id/submit_for_review
 */
export async function submitCoachProgramForReview(id) {
  return request(`/provider/coach-programs/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

// ── coach sessions ────────────────────────────────────────────────────────────

/**
 * GET /provider/coach-sessions
 * Returns the logged-in coach's sessions:
 * coming_sessions: [...], all_sessions: { data: [...], meta: { current_page, last_page, ... } }
 * @param {object} params — { status, search, page, per_page }
 */
export async function fetchCoachSessions(params = {}) {
  const query = new URLSearchParams();
  if (params.status    !== undefined) query.set("status",    params.status);
  if (params.search    !== undefined) query.set("search",    params.search);
  if (params.page      !== undefined) query.set("page",      params.page);
  if (params.per_page  !== undefined) query.set("per_page",  params.per_page);
  const qs = query.toString();
  return request(`/provider/coach-sessions${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/coach-sessions/:id
 * Returns full details of a single coach session (timing, type, coach, ...).
 */
export async function fetchCoachSessionDetail(id) {
  return request(`/provider/coach-sessions/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /provider/coach-sessions/:id/attendance
 * Returns the attendance list of a coach session's enrolled trainees.
 */
export async function fetchCoachSessionAttendance(id) {
  return request(`/provider/coach-sessions/${id}/attendance`, {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/coach-sessions/:id/notify
 * Sends the session link to all enrolled trainees.
 */
export async function notifyCoachSession(id) {
  return request(`/provider/coach-sessions/${id}/notify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /provider/coach-sessions/:id/start
 * Starts the session and notifies trainees.
 */
export async function startCoachSession(id) {
  return request(`/provider/coach-sessions/${id}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /provider/coach-sessions
 * Create a coach session (the same shape returned by the session endpoints).
 * Fields: title[ar], title[en], program_id, date, starts_at, ends_at, duration_minutes,
 *         delivery_mode (online/offline), location, meeting_url, max_capacity, video
 */
export async function createCoachSession(payload) {
  const isFormData = payload instanceof FormData;
  return request("/provider/coach-sessions", {
    method: "POST",
    headers: isFormData ? authHeaders() : { "Content-Type": "application/json", ...authHeaders() },
    body: payload,
  });
}

/**
 * GET /provider/my-requests
 * Returns the logged-in coach's support/review requests:
 * data: { requests: [...], pagination: { total_items, per_page, total_pages, current_page } }
 * @param {object} params — { status (pending/approved/rejected), page, per_page }
 */
export async function fetchMyRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.status   !== undefined && params.status !== "all") query.set("status", params.status);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/provider/my-requests${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/my-requests
 * Create a new review/support request.
 * Body: { subject, message, program_id? }
 */
export async function createMyRequest(payload) {
  return request("/provider/my-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * POST /provider/coach-programs  (FormData)
 * Fields: name[ar], name[en], description[ar], description[en],
 *         field_id, price_amount, hours_count, max_capacity,
 *         start_date, end_date, is_draft (0/1), keywords[0]...
 */
export async function createCoachProgram(formData) {
  return request("/provider/coach-programs", {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
}

// ── trainee programs ──────────────────────────────────────────────────────────

/**
 * GET /trainee/enrollments
 * Returns programs the trainee is enrolled in.
 * @param {object} params — { page, per_page }
 */
export async function fetchTraineeEnrollments(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/trainee/enrollments${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /trainee/enrollments
 * Enrolls the trainee in a program. Returns message + enrollment data.
 * @param {object} payload — { program_id, payment_method?, trainee_count? }
 */
export async function enrollTrainee(payload = {}) {
  return request("/trainee/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
}

/**
 * POST /trainee/favourites
 * Adds a program to the trainee's favourites.
 * Body: { program_id }
 */
export async function addTraineeFavourite(programId) {
  return request("/trainee/favourites", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ program_id: programId }),
  });
}

/**
 * DELETE /trainee/favourites/:programId
 * Removes a program from the trainee's favourites.
 */
export async function removeTraineeFavourite(programId) {
  return request(`/trainee/favourites/${programId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * GET /trainee/favourites
 * Returns the trainee's favourite programs.
 * @param {object} params — { page, per_page }
 */
export async function fetchTraineeFavourites(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/trainee/favourites${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/enrollments/:program_id
 * Returns the trainee's enrollment detail for ONE program:
 * program + progress + sessions + session_progress (per-session status).
 */
export async function fetchTraineeEnrollmentDetail(programId) {
  return request(`/trainee/enrollments/${programId}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/programs/:id
 * Returns full program details for a trainee.
 */
export async function fetchTraineeProgramDetail(id) {
  return request(`/trainee/programs/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/programs
 * Returns programs grouped by category.
 * @param {object} params — { search, category, page }
 */
export async function fetchTraineePrograms(params = {}) {
  const query = new URLSearchParams();
  if (params.search   !== undefined) query.set("search",      params.search);
  if (params.category !== undefined) query.set("category_id", params.category);
  if (params.page     !== undefined) query.set("page",        params.page);
  const qs = query.toString();
  return request(`/trainee/programs${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/auth/profile
 * Returns the authenticated trainee's profile.
 * Response: data.id, name, email, phone, country_code, image,
 *           birth_date, nationality, city, fields[], identity_* …
 */
export async function fetchTraineeProfile() {
  return request("/trainee/auth/profile", {
    headers: authHeaders(),
  });
}

/**
 * POST /trainee/auth/profile
 * Updates the trainee's profile. Documented body keys: name, field_ids[].
 * Response: { status, message, data: profile }
 */
export async function updateTraineeProfile(payload = {}) {
  return request("/trainee/auth/profile", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

/**
 * GET /trainee/invoices
 * Returns the authenticated trainee's invoices.
 * Response: data.invoices[] with invoice_num, status/status_label,
 * currency, total_amount, paid_at, program, enrollment_num.
 * @param {object} params — { page, per_page }
 */
export async function fetchTraineeInvoices(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/trainee/invoices${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/payments
 * Returns the authenticated trainee's payment transactions.
 * Response: data.payments[] with invoice_id, invoice_num, amount,
 * method, status/status_label ("Success"…), provider_reference,
 * paid_at, program, created_at.
 * @param {object} params — { page, per_page }
 */
export async function fetchTraineePayments(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/trainee/payments${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}


/**
 * GET /trainee/sessions
 * Returns sessions for the authenticated trainee.
 * @param {object} params — { filter: "all"|"remaining"|"completed"|"upcoming", page, per_page }
 */
export async function fetchTraineeSessions(params = {}) {
  const query = new URLSearchParams();
  if (params.filter   !== undefined) query.set("filter",   params.filter);
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  const qs = query.toString();
  return request(`/trainee/sessions${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/sessions/:id
 * Returns full details of a single trainee session.
 * Response: data.id, data.title, data.program_name, data.coach_name,
 *           data.date, data.starts_at, data.ends_at, data.delivery_mode,
 *           data.meeting_url, data.location, data.session_started,
 *           data.can_check_in, data.check_in { status, status_label, checked_in_at }
 */
export async function fetchTraineeSessionDetail(id) {
  return request(`/trainee/sessions/${id}`, {
    headers: authHeaders(),
  });
}

/**
 * GET /trainee/progress/:program_id
 * Returns the trainee's detailed progress for a single program.
 * Response data: program_id, program_name, trainer, overall_progress_percent,
 * total_sessions, total_duration_hours, completed_units, total_units,
 * completion_ratio, units[], accreditation_number, accreditation_note
 */
export async function fetchTraineeProgress(programId) {
  return request(`/trainee/progress/${programId}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /trainee/sessions/:id/check-in
 * Records attendance for a live session (online or offline).
 * Response: data.session_id, delivery_mode, checked_in_at,
 *           check_in_location, progress_status, progress_status_label,
 *           meeting_url, attendance_summary { present_count, total_count, … }
 * Throws when the session is not started / check-in not allowed
 * → UI falls back to opening the recorded video.
 */
export async function checkInTraineeSession(sessionId) {
  return request(`/trainee/sessions/${sessionId}/check-in`, {
    method: "POST",
    headers: authHeaders(),
  });
}


// ── notifications ─────────────────────────────────────────────────────────────

/**
 * Returns the correct notification endpoint path based on user role.
 * Supported role values (same as getUserRole() output):
 *   "trainee" | "employee" | "trainer" | "coach" | "company" | "org"
 * Never falls back to هيئة /provider for unknown roles.
 */
function notifPath(role) {
  const r = resolveNotificationRole(role);
  if (r === "employee")                    return "/company/employee/notifications";
  if (r === "trainee")                     return "/trainee/notifications";
  if (r === "trainer" || r === "coach")    return "/trainer/notifications";
  if (r === "company")                     return "/company/notifications";
  if (r === "org")                         return "/provider/notifications";
  throw new Error("لا يمكن تحميل إشعارات بدون دور جلسة صالح");
}

/**
 * GET /{role}/notifications?page=1&per_page=20
 * @param {object} params — { page, per_page, role }
 *   role: value from getUserRole(). Always resolved against the live session.
 */
export async function fetchNotifications({ page = 1, per_page = 20, role } = {}) {
  const qs = new URLSearchParams({ page, per_page }).toString();
  return request(`${notifPath(role)}?${qs}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /{role}/notifications/{id}/read
 * Marks a single notification as read.
 */
export async function markNotificationRead(id, role) {
  return request(`${notifPath(role)}/${id}/read`, {
    method: "POST",
    headers: authHeaders(),
  });
}

/**
 * POST /{role}/notifications/read-all
 * Marks all notifications as read.
 */
export async function markAllNotificationsRead(role) {
  return request(`${notifPath(role)}/read-all`, {
    method: "POST",
    headers: authHeaders(),
  });
}

/**
 * GET /{role}/notifications/unread-count
 * Returns the unread notifications count.
 */
export async function fetchUnreadCount(role) {
  return request(`${notifPath(role)}/unread-count`, {
    headers: authHeaders(),
  });
}

// ── contact messages ──────────────────────────────────────────────────────────

/**
 * POST /trainee/contact-messages
 * Sends a support/contact message from the trainee.
 * @param {object} payload — { subject, message, attachments?: File[] }
 * Response: { status, message, data: { ticket_number, subject, created_at } }
 */
export async function sendTraineeContactMessage({ subject, message, attachments = [] }) {
  const fd = new FormData();
  fd.append("subject", subject);
  fd.append("message", message);
  attachments.forEach((file) => fd.append("attachments[]", file));
  return request("/trainee/contact-messages", {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
}

/**
 * POST /company/employee/contact-messages
 * Sends a support/contact message from an employee.
 * @param {object} payload — { subject, message, attachments?: File[] }
 * Response: { status, message, data: { ticket_number, subject, created_at } }
 */
export async function sendEmployeeContactMessage({ subject, message, attachments = [] }) {
  const fd = new FormData();
  fd.append("subject", subject);
  fd.append("message", message);
  attachments.forEach((file) => fd.append("attachments[]", file));
  return request("/company/employee/contact-messages", {
    method: "POST",
    headers: authHeaders(),
    body: fd,
  });
}

/**
 * Role-aware contact message — employee or trainee.
 */
export async function sendMyContactMessage(payload) {
  if (isEmployeeRole()) return sendEmployeeContactMessage(payload);
  return sendTraineeContactMessage(payload);
}

// ── Coach Home Dashboard ──────────────────────────────────────────────────────

/**
 * GET /provider/coach/home
 * Returns welcome, summary, upcoming_sessions, active_programs,
 * latest_updates, charts (enrollment_completion_trend, program_distribution).
 */
export async function fetchCoachHome() {
  return request("/provider/coach/home", {
    headers: authHeaders(),
  });
}

/**
 * POST /provider/coach-sessions/:id/notify-trainee
 * Sends a notification to a single trainee in the session.
 * Body: { trainee_id, message? }
 */
export async function notifyCoachTrainee(sessionId, traineeId, message = "") {
  return request(`/provider/coach-sessions/${sessionId}/notify-trainee`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify({
      trainee_id: traineeId,
      ...(message ? { message } : {}),
    }),
  });
}

/**
 * GET /company/funding-requests
 * Returns paginated list of employee funding requests.
 * @param {object} params — { page, per_page, status }
 */
export async function fetchCompanyFundingRequests(params = {}) {
  const query = new URLSearchParams();
  if (params.page     !== undefined) query.set("page",     params.page);
  if (params.per_page !== undefined) query.set("per_page", params.per_page);
  if (params.status   !== undefined) query.set("status",   params.status);
  const qs = query.toString();
  return request(`/company/funding-requests${qs ? `?${qs}` : ""}`, {
    headers: authHeaders(),
  });
}

/**
 * POST /company/funding-requests/:id/approve
 * Approve a funding request.
 */
export async function approveCompanyFundingRequest(id) {
  return request(`/company/funding-requests/${id}/approve`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
}

/**
 * POST /company/funding-requests/:id/reject
 * Reject a funding request.
 * @param {string} reason — rejection reason text
 */
export async function rejectCompanyFundingRequest(id, reason = "") {
  return request(`/company/funding-requests/${id}/reject`, {
    method:  "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body:    JSON.stringify({ reject_reason: reason }),
  });
}

/**
 * GET /company/my-requests
 * Returns the company's requests:
 * data: { program_bookings: [...], funding_requests: [...], invoice_postponements: [...] }
 */
export async function fetchCompanyMyRequests() {
  return request("/company/my-requests", {
    headers: authHeaders(),
  });
}

// ── Role-aware helpers ────────────────────────────────────────────────────────
// These functions automatically route to the correct endpoint based on the
// logged-in user's role (employee → /company/employee/*, trainee → /trainee/*).
// Import getUserRole from auth.js inside each helper to avoid circular deps
// (auth.js doesn't import from api.js).


function isEmployeeRole() {
  return getUserRole() === "employee";
}

/**
 * Program detail (employee → /company/employee/programs/:id, trainee → /trainee/programs/:id)
 */
export async function fetchMyProgramDetail(id) {
  if (isEmployeeRole()) return fetchEmployeeProgramDetail(id);
  return fetchTraineeProgramDetail(id);
}

/**
 * My funding requests (employee → /company/employee/funding-requests, trainee → no endpoint yet)
 */
export async function fetchMyFundingRequests(params = {}) {
  if (isEmployeeRole()) return fetchEmployeeFundingRequests(params);
  // trainee funding requests not yet implemented — return empty
  return { data: { data: [] } };
}

/**
 * Browse programs (employee → /company/employee/programs, trainee → /trainee/programs)
 *
 * Normalises the employee flat-programs response into the same
 * { data: { categories: [...], statistics: {} } } shape that the trainee
 * endpoint returns, so every consumer component works unchanged.
 */
export async function fetchMyBrowsePrograms(params = {}) {
  if (isEmployeeRole()) {
    const res = await fetchEmployeePrograms(params);
    const programs = res?.data?.programs ?? res?.data ?? [];
    const pagination = res?.data?.pagination ?? {};

    // Group flat programs into pseudo-categories by category.id
    const catMap = {};
    programs.forEach(p => {
      const cid   = p.category?.id   ?? 0;
      const cname = p.category?.name ?? "عام";
      if (!catMap[cid]) catMap[cid] = { id: cid, name: cname, programs: [] };
      catMap[cid].programs.push(p);
    });

    return {
      status: true,
      data: {
        categories: Object.values(catMap),
        statistics: { programs_count: pagination.total_items ?? programs.length },
      },
    };
  }
  return fetchTraineePrograms(params);
}

/**
 * My enrolled programs (employee → /company/employee/enrollments, trainee → /trainee/enrollments)
 *
 * Normalises the employee response to match the trainee shape:
 *   data.programs[] = [{ enrollment_id, program: {...}, progress: { total, progress_percent } }]
 */
export async function fetchMyEnrollments(params = {}) {
  if (isEmployeeRole()) {
    const res = await fetchEmployeeEnrollments(params);
    const raw = res?.data?.programs ?? res?.data ?? [];

    // If already in trainee shape (has enrollment_id), return as-is
    if (raw.length > 0 && raw[0].enrollment_id !== undefined) return res;

    // Normalise flat programs array → trainee enrollment shape
    const normalized = raw.map(p => ({
      enrollment_id: p.id,
      program: p,
      progress: {
        total:            p.sessions_count ?? 0,
        progress_percent: p.progress_percent ?? 0,
      },
    }));

    return {
      status: true,
      data: { programs: normalized },
    };
  }
  return fetchTraineeEnrollments(params);
}

/**
 * Enrollment detail for one program
 */
export async function fetchMyEnrollmentDetail(programId) {
  if (isEmployeeRole()) return fetchEmployeeEnrollmentDetail(programId);
  return fetchTraineeEnrollmentDetail(programId);
}

/**
 * My sessions (employee → /company/employee/sessions, trainee → /trainee/sessions)
 */
export async function fetchMySessions(params = {}) {
  if (isEmployeeRole()) return fetchEmployeeSessions(params);
  return fetchTraineeSessions(params);
}

/**
 * Session detail
 */
export async function fetchMySessionDetail(id) {
  if (isEmployeeRole()) return fetchEmployeeSessionDetail(id);
  return fetchTraineeSessionDetail(id);
}

/**
 * Check-in to a session
 */
export async function checkInMySession(sessionId) {
  // employee check-in uses the same endpoint pattern — employee sessions also
  // support check-in via /company/employee/sessions/:id/check-in
  if (isEmployeeRole()) {
    return request(`/company/employee/sessions/${sessionId}/check-in`, {
      method: "POST",
      headers: authHeaders(),
    });
  }
  return checkInTraineeSession(sessionId);
}

const CHECKED_IN_KEY = "traineeCheckedInSessions";

export function rememberSessionCheckIn(id) {
  if (id == null) return;
  try {
    const ids = JSON.parse(sessionStorage.getItem(CHECKED_IN_KEY) || "[]");
    const key = String(id);
    if (!ids.includes(key)) {
      ids.push(key);
      sessionStorage.setItem(CHECKED_IN_KEY, JSON.stringify(ids));
    }
  } catch { /* ignore */ }
}

export function hasRememberedCheckIn(id) {
  if (id == null) return false;
  try {
    return JSON.parse(sessionStorage.getItem(CHECKED_IN_KEY) || "[]").includes(String(id));
  } catch {
    return false;
  }
}

export function sessionLooksCheckedIn(s, id) {
  if (!s && id == null) return false;
  const sid = id ?? s?.session_id ?? s?.id ?? s?.rawId;
  if (hasRememberedCheckIn(sid)) return true;
  if (!s) return false;
  const checkIn = s.check_in ?? s.checkIn;
  return !!(
    s.checked_in_at ||
    checkIn?.checked_in_at ||
    checkIn?.status === 1 ||
    checkIn?.status === 2 ||
    checkIn?.status === "checked_in" ||
    s.progress_status === 2 ||
    s.progress_status === "present" ||
    s.progress_status_label === "حاضر" ||
    s.is_completed
  );
}

/**
 * My favourites
 */
export async function fetchMyFavourites(params = {}) {
  if (isEmployeeRole()) return fetchEmployeeFavourites(params);
  return fetchTraineeFavourites(params);
}

/**
 * Add to favourites
 */
export async function addMyFavourite(programId) {
  if (isEmployeeRole()) return addEmployeeFavourite(programId);
  return addTraineeFavourite(programId);
}

/**
 * Remove from favourites
 */
export async function removeMyFavourite(programId) {
  if (isEmployeeRole()) return removeEmployeeFavourite(programId);
  return removeTraineeFavourite(programId);
}

/**
 * My profile (employee → /company/employee/profile, trainee → /trainee/auth/profile)
 */
export async function fetchMyProfile() {
  if (isEmployeeRole()) return fetchEmployeeProfile();
  return fetchTraineeProfile();
}

/**
 * Update my profile — employee profile update (POST /company/employee/profile)
 * Trainee still uses updateTraineeProfile.
 */
export async function updateMyProfile(payload = {}) {
  if (isEmployeeRole()) {
    return request("/company/employee/profile", {
      method: "POST",
      headers: authHeaders(),
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
  }
  return updateTraineeProfile(payload);
}

/**
 * My invoices — employee doesn't have a separate invoices endpoint yet,
 * falls back to trainee invoices if not employee.
 */
export async function fetchMyInvoices(params = {}) {
  // employees use the same company/employee path; fall back gracefully
  if (isEmployeeRole()) {
    const q = new URLSearchParams();
    if (params.page     !== undefined) q.set("page",     params.page);
    if (params.per_page !== undefined) q.set("per_page", params.per_page);
    const qs = q.toString();
    return request(`/company/employee/invoices${qs ? `?${qs}` : ""}`, {
      headers: authHeaders(),
    });
  }
  return fetchTraineeInvoices(params);
}

/**
 * Training record / progress for a program
 */
export async function fetchMyProgress(programId) {
  // Both roles use the same trainee progress endpoint for now
  return fetchTraineeProgress(programId);
}

/**
 * GET /company/profile
 * Returns the logged-in company's profile data.
 */
export async function fetchCompanyProfile() {
  return request("/company/profile", { headers: authHeaders() });
}

/**
 * Global search — role-aware.
 * org/company → /provider/programs?search=q
 * company (buyer) → /company/programs?search=q
 * employee → /company/employee/programs?search=q
 * trainee/user → /trainee/programs?search=q
 *
 * Returns a normalised array of { id, title, type, trainer, img, price }
 */
export async function globalSearchPrograms(query) {
  const role = getUserRole();
  const q    = new URLSearchParams({ search: query, per_page: 8 });

  let raw = [];
  try {
    if (role === "company") {
      const res = await request(`/company/programs?${q}`, { headers: authHeaders() });
      raw = res?.data?.programs ?? res?.data ?? [];
    } else if (role === "employee") {
      const res = await request(`/company/employee/programs?${q}`, { headers: authHeaders() });
      raw = res?.data?.programs ?? res?.data ?? [];
    } else if (role === "trainee") {
      const res = await request(`/trainee/programs?${q}`, { headers: authHeaders() });
      raw = res?.data?.programs ?? res?.data ?? [];
    } else if (role === "coach" || role === "trainer") {
      const [progRes, sessRes] = await Promise.all([
        request(`/provider/coach-programs?${q}`, { headers: authHeaders() }).catch(() => null),
        fetchCoachSessions({ search: query, status: "all", page: 1, per_page: 8 }).catch(() => null),
      ]);
      const programs = progRes?.data?.programs ?? [];
      const sessions = sessRes?.data?.all_sessions?.data ?? [];
      const sessItems = sessions.slice(0, 5).map(s => ({
        id:      s.id,
        title:   s.title ?? "—",
        type:    typeof s.type === "object" ? (s.type?.text ?? s.type?.delivery_mode ?? "") : (s.type ?? s.delivery_mode ?? ""),
        trainer: s.program_name ?? "جلسة",
        img:     null,
        price:   0,
        kind:    "session",
        raw:     s,
      }));
      const progItems = programs.slice(0, 5).map(p => ({
        id:      p.id,
        title:   p.name ?? p.title ?? "—",
        type:    typeof p.session_type === "object" ? (p.session_type?.text ?? "") : (p.session_type ?? ""),
        trainer: "برنامج",
        img:     p.image ?? p.img ?? null,
        price:   parseFloat(p.price_amount ?? p.price ?? 0) || 0,
        kind:    "program",
        raw:     p,
      }));
      return [...sessItems, ...progItems].slice(0, 8);
    } else {
      const res = await request(`${programsBase()}?${q}`, { headers: authHeaders() });
      raw = res?.data?.programs ?? res?.data ?? [];
    }
  } catch {
    raw = [];
  }

  return raw.map(p => ({
    id:      p.id,
    title:   p.name ?? p.title ?? "—",
    type:    typeof p.session_type === "object"
               ? (p.session_type?.text ?? "")
               : (p.session_type ?? ""),
    trainer: typeof p.trainer === "object"
               ? (p.trainer?.name ?? "")
               : (p.trainer ?? ""),
    img:     p.image ?? p.img ?? null,
    price:   parseFloat(p.price_amount ?? p.price ?? 0) || 0,
    raw:     p,
  }));
}
