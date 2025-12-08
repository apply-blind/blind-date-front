import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AdminAuthProvider } from '../contexts/AdminAuthContext'

const AdminSignupPage = lazy(() => import('../pages/AdminSignupPage').then(m => ({ default: m.AdminSignupPage })))
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })))
const ReviewListPage = lazy(() => import('../pages/ReviewListPage').then(m => ({ default: m.ReviewListPage })))
const ReviewDetailPage = lazy(() => import('../pages/ReviewDetailPage').then(m => ({ default: m.ReviewDetailPage })))

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-coral-pink rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}

/**
 * 관리자 전용 라우트
 * - 일반 사용자 AuthProvider와 완전히 분리됨
 * - 별도의 AdminAuthProvider 사용
 */
export function AdminRoutes() {
  return (
    <AdminAuthProvider>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="signup" element={<AdminSignupPage />} />
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="reviews" element={<ReviewListPage />} />
          <Route path="reviews/:publicId" element={<ReviewDetailPage />} />
        </Routes>
      </Suspense>
    </AdminAuthProvider>
  )
}
