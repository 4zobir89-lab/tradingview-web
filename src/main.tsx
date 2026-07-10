import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/theme.css'

// Set initial theme and locale from localStorage
const theme = localStorage.getItem('theme') || 'dark'
const locale = localStorage.getItem('locale') || 'en'

document.documentElement.setAttribute('data-theme', theme)
document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
document.documentElement.lang = locale
document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
