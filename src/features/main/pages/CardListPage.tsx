import { useState } from 'react'
import type { CardListTab } from '../types/main.types'
import sadFaceIcon from '@/assets/images/sad_face.png'
import questionIcon from '@/assets/images/question.png'

export function CardListPage() {
  const [activeTab, setActiveTab] = useState<CardListTab>('received')
  const [showInfoModal, setShowInfoModal] = useState(false)

  const tabs: Array<{ id: CardListTab; label: string }> = [
    { id: 'received', label: '받은카드' },
    { id: 'sent', label: '보낸카드' },
    { id: 'matched', label: '매칭' },
    { id: 'profile-exchange', label: '프로필교환' },
    { id: 'interest', label: '받은관심' }
  ]

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* 상단 탭 - 고정 (TopNavigation 바로 아래 배치) */}
      <div className="fixed top-[calc(env(safe-area-inset-top)+5rem)] sm:top-[calc(env(safe-area-inset-top)+5rem)] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth scroll-fade-right">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'pill-tab-active text-white'
                    : 'pill-tab text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 받은관심 탭 안내 - 탭 바로 아래 */}
        {activeTab === 'interest' && (
          <div className="max-w-screen-xl mx-auto px-4 sm:px-5 pb-3">
            <div className="bg-transparent rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1 word-break-keep-all">
                  <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base text-wrap-balance">받은 관심 카드</h3>
                    <button
                      type="button"
                      onClick={() => setShowInfoModal(true)}
                      className="flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
                      aria-label="받은 관심 카드 설명"
                    >
                      <img
                        src={questionIcon}
                        alt="?"
                        className="w-5 h-5 sm:w-6 sm:h-6"
                      />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium text-wrap-pretty leading-relaxed">
                    받은 관심 카드는 매일 밤 10시에 업데이트 되며, 12시간 후 사라집니다!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 컨텐츠 (TopNavigation 80px + Tabs ~68px = ~148px) */}
      <div className="px-4 sm:px-5 pt-[calc(5rem+4.25rem)] sm:pt-[calc(5rem+4.5rem)] pb-4 sm:pb-6 pb-safe">
        {activeTab === 'received' && <ReceivedCardSection />}
        {activeTab === 'sent' && <SentCardSection />}
        {activeTab === 'matched' && <MatchedSection />}
        {activeTab === 'profile-exchange' && <ProfileExchangeSection />}
        {activeTab === 'interest' && <InterestSection />}
      </div>

      {/* 정보 모달 */}
      {showInfoModal && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
            onClick={() => setShowInfoModal(false)}
          />

          {/* 모달 컨텐츠 */}
          <div className="fixed bottom-20 left-0 right-0 z-[61] animate-slide-up">
            <div className="max-w-screen-xl mx-auto">
              <div className="bg-white rounded-t-3xl shadow-2xl p-6 sm:p-8">
                {/* 상단 바 */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 word-break-keep-all">
                    받은 관심 카드란?
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(false)}
                    className="w-8 h-8 rounded-full hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center transition-colors"
                    aria-label="닫기"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-600"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>

                {/* 내용 */}
                <div className="space-y-4 text-gray-700 leading-relaxed word-break-keep-all">
                  <p className="text-sm sm:text-base">
                    내 프로필을 관심있게 조회한 이성 5명을 추천해드려요!
                  </p>
                  <p className="text-sm sm:text-base">
                    <span className="text-coral-pink font-bold">하트 5개</span>를 사용하면 자세한 프로필을 확인할 수 있습니다.
                  </p>
                  <p className="text-sm sm:text-base">
                    지금 바로 확인하고 새로운 인연을 시작해보세요!
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 pt-2 border-t border-gray-200">
                    * 오늘 관심을 보인 이성만 목록에 표시되고, 12시간 후 사라져요
                  </p>
                </div>

                {/* 확인 버튼 */}
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="w-full mt-6 py-3 bg-coral-pink text-white font-semibold rounded-xl hover:bg-coral-pink/90 active:scale-[0.98] transition-all shadow-lg word-break-keep-all"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// 받은카드 섹션
function ReceivedCardSection() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 받은 프리미엄 좋아요 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">받은 프리미엄 좋아요</h3>
        <EmptyState message="받은 프리미엄 좋아요가 없습니다." />
      </div>

      {/* 받은 좋아요 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">받은 좋아요</h3>
        <EmptyState message="받은 좋아요가 없습니다." />
      </div>

      {/* 받은 높은 점수 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">받은 높은 점수</h3>
        <EmptyState message="받은 높은 점수가 없습니다." />
      </div>
    </div>
  )
}

// 보낸카드 섹션
function SentCardSection() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 보낸 프리미엄 좋아요 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">보낸 프리미엄 좋아요</h3>
        <EmptyState message="보낸 프리미엄 좋아요가 없습니다." />
      </div>

      {/* 보낸 좋아요 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">보낸 좋아요</h3>
        <EmptyState message="보낸 좋아요가 없습니다." />
      </div>

      {/* 보낸 높은 점수 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">보낸 높은 점수</h3>
        <EmptyState message="보낸 높은 점수가 없습니다." />
      </div>
    </div>
  )
}

// 매칭 섹션
function MatchedSection() {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">매칭</h3>
      <EmptyState message="매칭된 목록이 없습니다." />
    </div>
  )
}

// 프로필교환 섹션
function ProfileExchangeSection() {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 받은 프로필 교환 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">받은 프로필 교환</h3>
        <EmptyState message="받은 프로필 교환이 없습니다." />
      </div>

      {/* 보낸 프로필 교환 */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-3 word-break-keep-all">보낸 프로필 교환</h3>
        <EmptyState message="보낸 프로필 교환이 없습니다." />
      </div>
    </div>
  )
}

// 받은관심 섹션
function InterestSection() {
  return (
    <div>
      <EmptyState message="받은 관심 카드가 없습니다." />
    </div>
  )
}

// 빈 상태 컴포넌트
interface EmptyStateProps {
  message: string
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 shadow-card text-center">
      <img
        src={sadFaceIcon}
        alt="슬픈 표정"
        className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 opacity-60"
      />
      <p className="text-sm sm:text-base text-gray-400 font-medium word-break-keep-all text-wrap-balance leading-relaxed">{message}</p>
    </div>
  )
}
