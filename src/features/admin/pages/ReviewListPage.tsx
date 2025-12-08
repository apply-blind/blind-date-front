import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { getReviewList } from '../api/adminApi'
import { logout } from '@/features/auth/api/authApi'
import type { ReviewInfo, UserStatus } from '../types/admin.types'

/**
 * 심사 목록 페이지
 * GET /api/v1/admin/reviews?status=UNDER_REVIEW
 */
export function ReviewListPage() {
  const navigate = useNavigate()
  const [reviews, setReviews] = useState<ReviewInfo[]>([])
  const [selectedStatus, setSelectedStatus] = useState<UserStatus>('UNDER_REVIEW')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadReviews()
  }, [selectedStatus])

  const loadReviews = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = await getReviewList(selectedStatus)
      setReviews(data.reviews)

      if (import.meta.env.DEV) {
        console.log(`✅ ${selectedStatus} 목록 조회 완료:`, data.reviews.length, '건')
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('심사 목록 조회 실패:', err)
      }

      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        if (status === 401) {
          alert('로그인이 만료되었습니다. 다시 로그인해주세요.')
          navigate('/admin/login')
          return
        }
        const message = err.response?.data?.detail || '목록 조회에 실패했습니다'
        setError(message)
      } else {
        setError('목록 조회 중 오류가 발생했습니다')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return

    try {
      await logout()
      navigate('/admin/login')
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('로그아웃 실패:', err)
      }
      // 실패해도 로그인 페이지로 이동
      navigate('/admin/login')
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusLabel = (status: UserStatus) => {
    const labels: Record<UserStatus, string> = {
      PROFILE_WRITING: '프로필 작성 중',
      UNDER_REVIEW: '심사 중',
      APPROVED: '승인',
      REJECTED: '반려',
      BANNED: '영구 정지'
    }
    return labels[status]
  }

  const getStatusColor = (status: UserStatus) => {
    const colors: Record<UserStatus, string> = {
      PROFILE_WRITING: 'bg-gray-100 text-gray-700',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      BANNED: 'bg-black text-white'
    }
    return colors[status]
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
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
            <div>
              <h1 className="text-xl font-bold text-gray-900">Blind 관리자</h1>
              <p className="text-sm text-gray-500">회원 심사 관리</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 필터 탭 */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'BANNED'] as UserStatus[]).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                className={`px-6 py-2.5 font-semibold rounded-xl transition-all whitespace-nowrap ${
                  selectedStatus === status
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getStatusLabel(status)}
              </button>
            ))}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* 목록 */}
        {isLoading ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-600">심사 대상이 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">번호</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Public ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">등록일시</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reviews.map((review, index) => (
                  <tr key={review.publicId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600">
                      {review.publicId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          review.status
                        )}`}
                      >
                        {getStatusLabel(review.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(review.createdAt)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/reviews/${review.publicId}`)}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                      >
                        상세보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 통계 */}
        <div className="mt-6 text-center text-sm text-gray-600">
          총 <span className="font-bold text-gray-900">{reviews.length}</span>건
        </div>
      </main>
    </div>
  )
}
