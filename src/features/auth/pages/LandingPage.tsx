import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function LandingPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  // ✅ 2025 Best Practice: 로그인된 사용자는 자동으로 메인 페이지로 리다이렉트
  useEffect(() => {
    // 재발급 실패 플래그 제거
    localStorage.removeItem('auth_refresh_failed')

    // 로그인된 사용자 자동 리다이렉트
    if (!loading && user) {
      if (import.meta.env.DEV) {
        console.log('[LandingPage] 이미 로그인됨 - 상태별 페이지로 리다이렉트:', user.status)
      }

      // 사용자 상태에 따라 적절한 페이지로 이동
      switch (user.status) {
        case 'PROFILE_WRITING':
          navigate('/profile/create', { replace: true })
          break
        case 'UNDER_REVIEW':
          // ⭐ hasProfile로 신규/수정 구분
          // hasProfile=false: 신규 사용자 최초 제출 → 심사 대기 페이지
          // hasProfile=true: 승인된 사용자 재제출 → 메인 페이지 (앱 계속 사용 가능)
          if (user.hasProfile) {
            navigate('/main', { replace: true })
          } else {
            navigate('/review-pending', { replace: true })
          }
          break
        case 'APPROVED':
          navigate('/main', { replace: true })
          break
        case 'REJECTED':
          navigate('/rejected', { replace: true })
          break
        case 'BANNED':
          navigate('/banned', { replace: true })
          break
        default:
          navigate('/profile/create', { replace: true })
      }
    }
  }, [user, loading, navigate])

  const handleKakaoLogin = (): void => {
    // 환경변수에서 Redirect URI 가져오기 (카카오 콘솔에 등록된 URI와 정확히 일치)
    const redirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI

    // prompt=login: 매번 로그인 화면 표시 (기존 세션 무시)
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&prompt=login`

    window.location.href = kakaoAuthUrl
  }

  // ✅ 로그인 상태 확인 중이면 로딩 표시
  if (loading) {
    return (
      <div className="min-h-screen-dynamic bg-white flex items-center justify-center">
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

  return (
    <div className="min-h-screen-dynamic bg-white flex items-center justify-center px-6">
      <div className="max-w-3xl w-full text-center">
        {/* Main Title */}
        <h1 className="relative inline-block text-7xl sm:text-8xl lg:text-9xl font-bold text-gray-900 mb-8 tracking-tight">
          Blind
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-1 bg-gradient-to-r from-coral-pink/0 via-coral-pink to-coral-pink/0 rounded-full" />
        </h1>

        {/* Subtitle */}
        <p className="text-xl sm:text-2xl text-gray-600 mb-16 word-break-keep-all">
          진심으로 만나는 특별한 인연
        </p>

        {/* CTA Button */}
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#FEE500] hover:bg-[#FDDC00] text-gray-900 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md min-h-touch"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
          </svg>
          카카오로 시작하기
        </button>

        {/* Footer */}
        <p className="mt-16 text-xs text-gray-400">
          © 2025 Blind. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default LandingPage
