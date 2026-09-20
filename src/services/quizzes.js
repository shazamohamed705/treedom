import { getUser } from "./auth";

const KEY = "treedom.quizzes";

function ownerId() {
  const user = getUser();
  return String(user?.id ?? user?.email ?? "local");
}

function readAll() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function loadQuizzes() {
  const id = ownerId();
  return readAll()
    .filter(q => q.ownerId === id)
    .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
}

export function saveQuiz(quiz) {
  const id = ownerId();
  const all = readAll().filter(q => !(q.ownerId === id && q.id === quiz.id));
  const next = {
    ...quiz,
    ownerId: id,
    updatedAt: new Date().toISOString(),
  };
  all.push(next);
  localStorage.setItem(KEY, JSON.stringify(all));
  return next;
}

export function quizzesForSession(sessionId) {
  if (sessionId == null) return [];
  return readAll().filter(q => {
    if (q.status && q.status !== "sent") return false;
    return String(q.sessionId) === String(sessionId);
  });
}
export function deleteQuiz(id) {
  const owner = ownerId();
  localStorage.setItem(KEY, JSON.stringify(readAll().filter(q => !(q.ownerId === owner && q.id === id))));
}
