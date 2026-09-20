import { createContext, useContext, useState, useCallback } from "react";

export const QuizModeContext = createContext(null);

export function QuizModeProvider({ children }) {
  const [quizActive, setQuizActive] = useState(false);

  const enterQuiz = useCallback(() => setQuizActive(true),  []);
  const exitQuiz  = useCallback(() => setQuizActive(false), []);

  return (
    <QuizModeContext.Provider value={{ quizActive, enterQuiz, exitQuiz }}>
      {children}
    </QuizModeContext.Provider>
  );
}

export function useQuizMode() {
  return useContext(QuizModeContext);
}
