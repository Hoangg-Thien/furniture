import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './user/index.css'
import App from './user/App.jsx'
import { clearLegacyBrowserData } from './lib/browserStorage.js'

clearLegacyBrowserData()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
