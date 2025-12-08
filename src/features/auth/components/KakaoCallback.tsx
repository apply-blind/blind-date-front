import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import api from '@/shared/api/axios'
import { useAuth } from '../hooks/useAuth'
import type { KakaoLoginResponse } from '../types/auth.types'
import type { ApiError } from '@/shared/types/common.types'

/**
 * ApiError 타입 가드
 * @param data - 검증할 데이터
 * @returns ApiError 타입 여부
 */
function isApiError(data: unknown): data is ApiError {
  return (
    typeof data === 'object' &&
    data !== null &&
    'detail' in data &&
    typeof (data as ApiError).detail === 'string'
  )
}

function KakaoCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refetch, clearRefreshFailed } = useAuth()  // ✅ refetch, clearRefreshFailed 함수 가져오기
  const [error, setError] = useState<string | null>(null)
  const [debugLog, setDebugLog] = useState<string[]>([])  // 디버그 로그
  const hasCalledApi = useRef<boolean>(false)  // ⭐ 중복 호출 방지 (React Strict Mode 대응)

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    if (import.meta.env.DEV) {
      console.log(message)
    }
  }

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')

    addLog(`페이지 로드됨: ${window.location.href}`)
    addLog(`code 파라미터: ${code ? '있음' : '없음'}`)
    addLog(`error 파라미터: ${errorParam || '없음'}`)

    if (errorParam) {
      addLog(`❌ 카카오 에러: ${errorParam}`)
      setError('카카오 로그인에 실패했습니다.')
      return
    }

    if (!code) {
      addLog('❌ 인증 코드 없음')
      setError('인증 코드를 받지 못했습니다.')
      return
    }

    // ⭐ 이미 API를 호출했으면 중복 실행 방지
    if (hasCalledApi.current) {
      addLog('⚠️ 이미 API 호출됨 - 중복 실행 방지')
      return
    }

    hasCalledApi.current = true  // ⭐ 플래그 설정
    handleKakaoLogin(code)
  }, [searchParams])

  const handleKakaoLogin = async (code: string): Promise<void> => {
    try {
      addLog('=== 카카오 로그인 시작 ===')
      addLog(`1. 카카오 인증 코드: ${code.substring(0, 10)}...`)
      addLog('2. 요청 URL: /api/v1/auth/tokens')

      // 백엔드 API로 code 전송 (현재 백엔드는 Void 반환)
      await api.post<KakaoLoginResponse>('/api/v1/auth/tokens', { code })

      addLog('3. 로그인 API 성공!')
      addLog('4. JWT 토큰이 HttpOnly Cookie로 설정됨')

      // ✅ 로그인 성공 시 재발급 실패 플래그 초기화 (Context 사용)
      clearRefreshFailed()

      // ✅ AuthProvider의 user 상태 갱신 (중요!)
      addLog('5. AuthProvider 사용자 정보 갱신 중...')
      await refetch()
      addLog('6. AuthProvider 사용자 정보 갱신 완료')

      // 사용자 정보 조회 후 상태에 따라 리다이렉트
      try {
        addLog('7. 사용자 상태 확인 중...')
        const userResponse = await api.get('/api/v1/users/me')
        const userStatus = userResponse.data.status

        addLog(`8. 사용자 상태: ${userStatus}`)

        addLog(`9. 리다이렉트: ${userStatus}에 맞는 페이지로 이동`)

        setTimeout(() => {
          // 상태별 리다이렉트
          switch (userStatus) {
            case 'PROFILE_WRITING':
              navigate('/profile/create')
              break
            case 'UNDER_REVIEW':
              navigate('/review-pending')
              break
            case 'APPROVED':
              navigate('/main')
              break
            case 'REJECTED':
              navigate('/rejected')  // ✅ 반려 페이지로 이동
              break
            case 'BANNED':
              navigate('/banned')
              break
            default:
              navigate('/profile/create')
          }
        }, 1500)
      } catch (userErr) {
        addLog('❌ 사용자 정보 조회 실패!')
        addLog(`에러: ${userErr instanceof Error ? userErr.message : '알 수 없는 에러'}`)
        if (import.meta.env.DEV) {
          console.error('사용자 정보 조회 실패:', userErr)
        }
        // 실패 시 기본 페이지로
        setTimeout(() => {
          navigate('/profile/create')
        }, 1500)
      }

    } catch (err) {
      addLog('=== 로그인 실패 ===')

      if (err instanceof AxiosError) {
        addLog(`HTTP 에러: ${err.response?.status} ${err.response?.statusText}`)
        addLog(`에러 메시지: ${err.message}`)
        addLog(`응답 데이터: ${JSON.stringify(err.response?.data)}`)

        if (import.meta.env.DEV) {
          console.error('에러 상세:', {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data,
            url: err.config?.url,
            method: err.config?.method,
          })
        }

        const errorData = err.response?.data
        const errorMessage = isApiError(errorData)
          ? errorData.detail
          : '로그인 처리 중 오류가 발생했습니다.'
        setError(errorMessage)
      } else {
        addLog(`알 수 없는 에러: ${err}`)
        if (import.meta.env.DEV) {
          console.error('알 수 없는 에러:', err)
        }
        setError('로그인 처리 중 오류가 발생했습니다.')
      }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900">로그인 실패</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-8 py-3.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors w-full"
          >
            처음으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-white">
      <div className="max-w-2xl w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6">
          <svg className="w-full h-full text-coral-pink animate-pulse" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900">로그인 처리 중</h2>
        <p className="text-gray-500 mb-6">잠시만 기다려주세요</p>

        {/* 디버그 로그 표시 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-4 text-left max-h-64 overflow-y-auto">
          <h3 className="text-sm font-bold text-gray-700 mb-2">로그:</h3>
          {debugLog.map((log, index) => (
            <p key={index} className="text-xs text-gray-600 font-mono mb-1">
              {log}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default KakaoCallback
