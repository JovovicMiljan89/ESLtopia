import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import EnglishGenerator from './EnglishGenerator.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EnglishGenerator />
  </StrictMode>,
)
