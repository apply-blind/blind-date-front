import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { getReviewDetail, updateReviewStatus } from '../api/adminApi'
import { REJECTION_REASONS } from '../types/admin.types'
import type { ReviewDetailResponse } from '../types/admin.types'

/**
 * 심사 상세 페이지
 * GET /api/v1/admin/reviews/{publicId}
 * PATCH /api/v1/admin/reviews/{publicId}
 */
export function ReviewDetailPage() {
  const navigate = useNavigate()
  const { publicId } = useParams<{ publicId: string }>()

  const [detail, setDetail] = useState<ReviewDetailResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // 심사 상태 변경 관련
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'APPROVED' | 'REJECTED' | 'BANNED' | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 심사 상세 정보 로드 (publicId 변경 시 자동 로드)
  useEffect(() => {
    const loadDetail = async () => {
      if (!publicId) return

      setIsLoading(true)
      setError('')

      try {
        const data = await getReviewDetail(publicId)
        setDetail(data)

        if (import.meta.env.DEV) {
          console.log('✅ 심사 상세 조회 완료:', data)
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('심사 상세 조회 실패:', err)
        }

        if (axios.isAxiosError(err)) {
          const status = err.response?.status
          if (status === 401) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.')
            navigate('/admin/login')
            return
          }
          const message = err.response?.data?.detail || '상세 정보 조회에 실패했습니다'
          setError(message)
        } else {
          setError('상세 정보 조회 중 오류가 발생했습니다')
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadDetail()
  }, [publicId, navigate])

  const handleActionClick = (action: 'APPROVED' | 'REJECTED' | 'BANNED') => {
    setSelectedAction(action)
    setRejectionReason('')
    setIsModalOpen(true)
  }

  const handleSubmitAction = async () => {
    if (!publicId || !selectedAction) return

    // REJECTED, BANNED일 때 사유 필수
    if ((selectedAction === 'REJECTED' || selectedAction === 'BANNED') && !rejectionReason.trim()) {
      alert('사유를 입력해주세요')
      return
    }

    const actionLabels = {
      APPROVED: '승인',
      REJECTED: '반려',
      BANNED: '영구 정지'
    }
    const confirmMessage = selectedAction === 'APPROVED'
      ? `정말 승인하시겠습니까?`
      : `정말 ${actionLabels[selectedAction]}하시겠습니까?\n\n사유: ${rejectionReason}`

    if (!window.confirm(confirmMessage)) return

    setIsSubmitting(true)

    try {
      await updateReviewStatus(publicId, {
        status: selectedAction,
        reason: rejectionReason || undefined
      })

      alert(`${actionLabels[selectedAction]} 완료되었습니다`)
      navigate('/admin/reviews')
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('심사 상태 변경 실패:', err)
      }

      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.detail || '심사 처리에 실패했습니다'
        alert(message)
      } else {
        alert('심사 처리 중 오류가 발생했습니다')
      }
    } finally {
      setIsSubmitting(false)
      setIsModalOpen(false)
    }
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <p className="text-red-600 mb-4">{error || '데이터를 불러올 수 없습니다'}</p>
          <button
            type="button"
            onClick={() => navigate('/admin/reviews')}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  const { profile, images, status, createdAt, isInitialReview } = detail

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/reviews')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">심사 상세</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isInitialReview
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {isInitialReview ? '최초 심사' : '수정 심사'}
                </span>
              </div>
              <p className="text-sm text-gray-500">{formatDate(createdAt)}</p>
            </div>
          </div>

          {/* 심사 중일 때만 액션 버튼 표시 */}
          {status === 'UNDER_REVIEW' && (
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => handleActionClick('APPROVED')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm min-h-touch flex-shrink-0"
              >
                승인
              </button>
              <button
                type="button"
                onClick={() => handleActionClick('REJECTED')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm min-h-touch flex-shrink-0"
              >
                반려
              </button>
              <button
                type="button"
                onClick={() => handleActionClick('BANNED')}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-black hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors text-xs sm:text-sm min-h-touch flex-shrink-0 whitespace-nowrap"
              >
                영구 정지
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 이미지 섹션 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">프로필 사진 ({images.length}장)</h2>
            <div className="grid grid-cols-2 gap-4">
              {images
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((image, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={image.imageUrl}
                      alt={`프로필 사진 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 w-8 h-8 bg-gray-900/70 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {image.displayOrder}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* 프로필 정보 섹션 */}
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">기본 정보</h2>
              <div className="space-y-3">
                <InfoRow label="닉네임" value={profile.nickname} />
                <InfoRow label="성별" value={profile.gender === 'MALE' ? '남성' : '여성'} />
                <InfoRow label="생년월일" value={profile.birthday} />
                <InfoRow label="키" value={`${profile.height}cm`} />
                <InfoRow label="혈액형" value={`${profile.bloodType}형`} />
                <InfoRow label="체형" value={profile.bodyType} />
                <InfoRow label="성격" value={profile.personalities.join(', ')} />
              </div>
            </div>

            {/* 직업 및 학력 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">직업 및 학력</h2>
              <div className="space-y-3">
                <InfoRow label="직업 분류" value={profile.jobCategory} />
                <InfoRow label="직업명" value={profile.jobTitle} />
                <InfoRow label="직장" value={profile.company} />
                <InfoRow label="학교" value={profile.school} />
              </div>
            </div>

            {/* 지역 정보 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">지역 정보</h2>
              <div className="space-y-3">
                <InfoRow label="거주지" value={`${profile.residenceCity} ${profile.residenceDistrict}`} />
                <InfoRow label="직장 지역" value={`${profile.workCity} ${profile.workDistrict}`} />
              </div>
            </div>

            {/* 라이프스타일 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">라이프스타일</h2>
              <div className="space-y-3">
                <InfoRow label="종교" value={profile.religion} />
                <InfoRow label="음주" value={profile.drinking} />
                <InfoRow label="흡연" value={profile.smoking} />
                <InfoRow label="자차 보유" value={profile.hasCar ? '있음' : '없음'} />
              </div>
            </div>

            {/* 자기소개 */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">자기소개</h2>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{profile.introduction}</p>
            </div>
          </div>
        </div>
      </main>

      {/* 심사 모달 */}
      {isModalOpen && selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-modal-in">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {selectedAction === 'APPROVED' ? '승인' : selectedAction === 'REJECTED' ? '반려' : '영구 정지'}
            </h3>

            {selectedAction !== 'APPROVED' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  사유 (필수)
                </label>

                {/* 자주 사용하는 사유 선택 */}
                <select
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl mb-3 focus:border-gray-500 focus:outline-none text-base"
                  onChange={(e) => setRejectionReason(e.target.value)}
                  value={rejectionReason}
                >
                  <option value="">사유 선택 또는 직접 입력</option>
                  {REJECTION_REASONS.map((reason) => (
                    <option key={reason} value={reason === '기타 (직접 입력)' ? '' : reason}>
                      {reason}
                    </option>
                  ))}
                </select>

                {/* 직접 입력 */}
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-gray-500 focus:outline-none resize-none text-base"
                  rows={4}
                  placeholder="사유를 입력해주세요"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold text-sm sm:text-base rounded-xl transition-colors min-h-touch"
                disabled={isSubmitting}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmitAction}
                className={`flex-1 py-2.5 sm:py-3 text-white font-semibold text-sm sm:text-base rounded-xl transition-colors min-h-touch ${
                  selectedAction === 'APPROVED'
                    ? 'bg-green-600 hover:bg-green-700'
                    : selectedAction === 'REJECTED'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-black hover:bg-gray-800'
                }`}
                disabled={isSubmitting}
              >
                {isSubmitting ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 정보 행 컴포넌트
interface InfoRowProps {
  label: string
  value: string | number
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="text-xs sm:text-sm font-semibold text-gray-600 w-20 sm:w-24 flex-shrink-0">{label}</span>
      <span className="text-xs sm:text-sm text-gray-900 font-medium flex-1 min-w-0 break-words">{value}</span>
    </div>
  )
}
