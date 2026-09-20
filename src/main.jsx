import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { QuizModeProvider } from './context/QuizModeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <QuizModeProvider>
        <App />
      </QuizModeProvider>
    </BrowserRouter>
  </StrictMode>,
)
