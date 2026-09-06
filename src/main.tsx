import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App'
import { ensureBootstrapData } from '@/db/bootstrap'
import '@/index.css'

ensureBootstrapData().catch((err) => {
  console.error('Bootstrap dati iniziali fallito', err)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
