import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import App from './App'
import ErrorBoundary from '@/shared/components/layout/ErrorBoundary'
import { validateEnv } from '@/shared/utils/env'
import '@/shared/styles/index.css'

// 환경 변수 검증
try {
  validateEnv()
} catch (error) {
  if (import.meta.env.DEV) {
    console.error(error)
  }
  alert(error instanceof Error ? error.message : '환경 변수 검증 실패')
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

// ⭐ ErrorBoundary에 navigate를 전달하기 위한 Wrapper
function AppWithErrorBoundary() {
  const navigate = useNavigate()

  return (
    <ErrorBoundary onReset={() => navigate('/')}>
      <App />
    </ErrorBoundary>
  )
}

ReactDOM.createRoot(rootElement).render(
  <BrowserRouter>
    <AppWithErrorBoundary />
  </BrowserRouter>,
)
