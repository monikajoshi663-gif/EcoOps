import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <SWRConfig value={{ revalidateOnFocus: true, dedupingInterval: 1000 }}>
        <ToastProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </ToastProvider>
      </SWRConfig>
    </BrowserRouter>
  </StrictMode>,
)
