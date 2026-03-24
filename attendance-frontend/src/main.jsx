import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.jsx'

// Keep Render backend alive — ping every 4 minutes to prevent cold start
const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:5005/api";
setInterval(() => fetch(`${BACKEND.replace(/\/api$/, "/")}`).catch(() => {}), 4 * 60 * 1000);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
