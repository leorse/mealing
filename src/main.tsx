import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ensureCiqualSeed, ensureCiqualPortions } from './db/seed.ts'

void ensureCiqualSeed().then(ensureCiqualPortions)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
