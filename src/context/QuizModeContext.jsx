import { createContext, useContext, useState, useCallback } from "react";

export const QuizModeContext = createContext(null);

export function QuizModeProvider({ children }) {
  const [quizActive,  setQuizActive]  = useState(false);
  const [quizMeta,    setQuizMeta]    = useState(null);
  // { title, questionsCount, durationMinutes, currentQuestion }

  const enterQuiz = useCallback((meta = null) => {
    setQuizMeta(meta ? { ...meta, currentQuestion: 1 } : null);
    setQuizActive(true);
  }, []);

  const exitQuiz = useCallback(() => {
    setQuizActive(false);
    setQuizMeta(null);
  }, []);

  // يُستدعى من QuizForm عند الانتقال لسؤال جديد
  const setCurrentQuestion = useCallback((n) => {
    setQuizMeta(prev => prev ? { ...prev, currentQuestion: n } : prev);
  }, []);

  return (
    <QuizModeContext.Provider value={{ quizActive, quizMeta, enterQuiz, exitQuiz, setCurrentQuestion }}>
      {children}
    </QuizModeContext.Provider>
  );
}

export function useQuizMode() {
  return useContext(QuizModeContext);
}
