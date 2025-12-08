import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { adminLogin } from '../api/adminApi'
import type { AdminLoginRequest } from '../types/admin.types'

/**
 * 관리자 로그인 페이지
 * POST /api/v1/admin/auth/tokens
 */
export function AdminLoginPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<AdminLoginRequest>({
    username: '',
    password: ''
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
    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요')
      return
    }

    setIsLoading(true)

    try {
      await adminLogin(formData)

      if (import.meta.env.DEV) {
        console.log('✅ 관리자 로그인 성공')
      }

      // 심사 목록 페이지로 이동
      navigate('/admin/reviews')
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('관리자 로그인 실패:', err)
      }

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.detail || '로그인에 실패했습니다'
        setError(message)
      } else {
        setError('로그인 중 오류가 발생했습니다')
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
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-gray-600">Blind Admin Console</p>
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
                아이디
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
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:outline-none transition-colors"
                placeholder="비밀번호"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 text-lg font-semibold rounded-xl transition-all min-h-touch bg-gradient-to-r from-gray-700 to-gray-900 text-white hover:from-gray-600 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {isLoading ? '로그인 중...' : '로그인'}
          </button>

          {/* 회원가입 링크 */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <button
                type="button"
                onClick={() => navigate('/admin/signup')}
                className="text-gray-900 font-semibold hover:underline"
              >
                회원가입
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
