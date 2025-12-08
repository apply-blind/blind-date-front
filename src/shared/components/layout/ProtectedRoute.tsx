import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'
import type { UserStatus } from '@/features/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedStatuses: UserStatus[]  // 접근 허용할 상태 목록
}

/**
 * 사용자 상태(status)에 따라 라우트 접근을 제어하는 컴포넌트
 */
export function ProtectedRoute({ children, allowedStatuses }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <svg className="w-full h-full text-coral-pink animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
            </svg>
          </div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 로그인되지 않은 경우 → 랜딩 페이지로
  if (!user) {
    return <Navigate to="/" replace />
  }

  // 접근 권한 확인
  if (!allowedStatuses.includes(user.status)) {
    if (import.meta.env.DEV) {
      console.log('[ProtectedRoute] 접근 권한 없음:', {
        userStatus: user.status,
        allowedStatuses,
        redirecting: true
      })
    }

    // 상태별 리다이렉트 로직
    switch (user.status) {
      case 'PROFILE_WRITING':
        return <Navigate to="/profile/create" replace />
      case 'UNDER_REVIEW':
        // ⭐ hasProfile로 신규/수정 구분
        // hasProfile=false: 신규 사용자 최초 제출 → 심사 대기 페이지
        // hasProfile=true: 승인된 사용자 재제출 → 메인 페이지 (앱 계속 사용 가능)
        if (user.hasProfile) {
          return <Navigate to="/main" replace />
        } else {
          return <Navigate to="/review-pending" replace />
        }
      case 'APPROVED':
        return <Navigate to="/main" replace />
      case 'REJECTED':
        return <Navigate to="/rejected" replace />
      case 'BANNED':
        return <Navigate to="/banned" replace />
      default:
        return <Navigate to="/" replace />
    }
  }

  // 접근 허용
  return <>{children}</>
}
