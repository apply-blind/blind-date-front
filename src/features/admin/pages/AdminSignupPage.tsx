import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import api from '@/shared/api/axios'

/**
 * 관리자 회원가입 페이지 (개발용)
 * POST /api/v1/admin/admins
 */
export function AdminSignupPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: ''
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 유효성 검사
    if (!formData.username.trim()) {
      setError('아이디를 입력해주세요')
      return
    }
    if (formData.username.length < 4 || formData.username.length > 20) {
      setError('아이디는 4-20자여야 합니다')
      return
    }
    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요')
      return
    }
    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다')
      return
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    setIsLoading(true)

    try {
      await api.post('/api/v1/admin/admins', {
        username: formData.username,
        password: formData.password
      })

      alert('관리자 계정이 생성되었습니다!')

      if (import.meta.env.DEV) {
        console.log('✅ 관리자 회원가입 성공')
      }

      // 로그인 페이지로 이동
      navigate('/admin/login')
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('관리자 회원가입 실패:', err)
      }

      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const detail = err.response?.data?.detail
        const message = err.response?.data?.message

        // 🔍 디버깅: 전체 응답 출력
        if (import.meta.env.DEV) {
          console.error('❌ 회원가입 실패 상세:', {
            status,
            detail,
            message,
            fullResponse: err.response?.data
          })
        }

        // 403 Forbidden 특별 처리
        if (status === 403) {
          const errorMsg = detail || message || '접근 권한이 없습니다. 관리자 회원가입이 제한되어 있을 수 있습니다.'
          setError(errorMsg)
        } else {
          const errorMsg = detail || message || '회원가입에 실패했습니다'
          setError(errorMsg)
        }
      } else {
        setError('회원가입 중 오류가 발생했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          {/* 헤더 */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 회원가입</h1>
            <p className="text-gray-600">Blind Admin Console</p>
          </div>

          {/* 개발용 경고 */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800 font-medium text-center">
              ⚠️ 개발용 페이지입니다
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          {/* 입력 필드 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">
                아이디 (4-20자)
              </label>
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:outline-none transition-colors"
                placeholder="관리자 아이디"
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호 (최소 8자)
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:outline-none transition-colors"
                placeholder="비밀번호"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                id="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:outline-none transition-colors"
                placeholder="비밀번호 확인"
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 회원가입 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 text-lg font-semibold rounded-xl transition-all min-h-touch bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-600 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? '회원가입 중...' : '회원가입'}
          </button>

          {/* 로그인 링크 */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="text-gray-900 font-semibold hover:underline"
              >
                로그인
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
