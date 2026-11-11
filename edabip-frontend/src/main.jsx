import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './assets/styles/globals.css'
import App from './app/App';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from './components/Toast/ToastContext'; 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <GoogleOAuthProvider clientId="268807511745-vceh0m5ijc3a0occ0ndo7bmgb9a0f7mp.apps.googleusercontent.com">
        <App />
      </GoogleOAuthProvider>
    </ToastProvider>
  </StrictMode>,
)
  