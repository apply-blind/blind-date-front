import { useState } from 'react'
import { MessageCircleMore } from 'lucide-react'
import type { MatchingSubTab } from '../types/main.types'
import introduceMoreBg from '@/assets/images/introduce_more.png'
import onIntroduceMoreIcon from '@/assets/images/on_the_introduce_more.png'
import matchingLowIcon from '@/assets/images/mathcing_low.png'

export function MatchingPage() {
  const [activeTab, setActiveTab] = useState<MatchingSubTab>('daily')

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* 서브 탭 - 고정 (TopNavigation 바로 아래 배치) */}
      <div className="fixed top-[calc(env(safe-area-inset-top)+5rem)] sm:top-[calc(env(safe-area-inset-top)+5rem)] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-5 py-3 sm:py-4">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth scroll-fade-right"
          >
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'daily'
              ? 'pill-tab-active text-white'
              : 'pill-tab text-gray-800'
          }`}
        >
          데일리카드
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'past'
              ? 'pill-tab-active text-white'
              : 'pill-tab text-gray-800'
          }`}
        >
          지난카드
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('review')}
          className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
            activeTab === 'review'
              ? 'pill-tab-active text-white'
              : 'pill-tab text-gray-800'
          }`}
        >
          회원심사
        </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 (TopNavigation 80px + Sub Tabs ~68px = ~148px) */}
      <div className="px-4 sm:px-5 pt-[calc(5rem+4.25rem)] sm:pt-[calc(5rem+4.5rem)] pb-6 pb-safe">
      {activeTab === 'daily' && <DailyCardSection />}
      {activeTab === 'past' && <PastCardSection />}
      {activeTab === 'review' && <ReviewSection />}
      </div>
    </div>
  )
}

// 데일리카드 섹션
function DailyCardSection() {
  // TODO: 서버에서 데일리카드 데이터 가져오기

  const handleMoreIntroduce = () => {
    if (import.meta.env.DEV) {
      console.log('한번 더 소개받기 클릭')
    }
    // TODO: 추가 소개 기능 구현
  }

  const handleOnlineMembersIntroduce = () => {
    if (import.meta.env.DEV) {
      console.log('지금 접속중인 회원 소개받기 클릭')
    }
    // TODO: 접속중인 회원 소개 기능 구현
  }

  const handleInviteFriend = () => {
    if (import.meta.env.DEV) {
      console.log('친구 초대하기 클릭')
    }
    // TODO: 친구 초대 기능 구현
  }

  return (
    <div className="space-y-10">
      <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-12 shadow-card w-full mx-auto" style={{ maxWidth: '600px' }}>
        <div className="text-center word-break-keep-all">
          <p className="text-gray-800 font-semibold text-base sm:text-lg mb-2 text-wrap-balance leading-relaxed">
            오늘의 데일리카드가 준비 중입니다
          </p>
          <p className="text-xs sm:text-sm text-gray-500 text-wrap-pretty leading-relaxed">
            매일 특정 시간에 5장의 카드를 받을 수 있습니다
          </p>
        </div>
      </div>

      {/* 더 많은 이성 소개 배너 */}
      <div
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg w-full mx-auto mb-8 sm:mb-10 min-h-[320px] sm:min-h-[360px] md:min-h-[380px]"
        style={{
          backgroundImage: `url(${introduceMoreBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          maxWidth: '600px'
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 py-6 sm:py-8">
          {/* 돋보기 아이콘 */}
          <img
            src={onIntroduceMoreIcon}
            alt="돋보기"
            className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4"
          />

          {/* 텍스트 */}
          <h3 className="text-white font-bold text-lg sm:text-xl md:text-2xl mb-2 text-center whitespace-pre-line leading-relaxed word-break-keep-all">
            더 많은 이성을{'\n'}소개받고 싶으신가요?
          </h3>

          {/* 버튼 */}
          <button
            type="button"
            onClick={handleMoreIntroduce}
            className="mt-3 sm:mt-4 px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-white text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-white/20 transition-all duration-300 active:scale-95 focus:outline-none word-break-keep-all"
          >
            한번 더 소개받기
          </button>
        </div>
      </div>

      {/* 지금 접속중인 회원 소개받기 */}
      <button
        type="button"
        onClick={handleOnlineMembersIntroduce}
        className="w-full bg-sky-300 hover:bg-sky-400 rounded-3xl py-3 sm:py-4 px-4 sm:px-6 shadow-lg transition-all duration-300 active:scale-[0.98] focus:outline-none flex items-center justify-center gap-3 sm:gap-4 mx-auto my-10"
        style={{ maxWidth: '600px' }}
      >
        <MessageCircleMore
          className="w-6 h-6 sm:w-8 sm:h-8 text-white scale-x-[-1] flex-shrink-0"
          strokeWidth={2.5}
        />
        <span className="text-white font-bold text-sm sm:text-base md:text-lg word-break-keep-all leading-relaxed">
          지금 접속중인 회원 소개받기
        </span>
      </button>

      {/* 친구 초대 섹션 */}
      <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '600px' }}>
        <div className="text-center space-y-5 sm:space-y-7">
          {/* 설명 텍스트 */}
          <p className="text-gray-900 font-bold text-xl sm:text-2xl leading-relaxed whitespace-pre-line word-break-keep-all">
            블라인드는 회원이{'\n'}
            <span className="text-sky-400 font-bold text-2xl sm:text-3xl">NEW</span> 가입자를 심사하고 있습니다.
          </p>

          {/* 이미지 + 블러 효과 */}
          <div className="relative inline-block py-4">
            <div className="absolute inset-0 bg-blue-200/40 blur-3xl rounded-full scale-125"></div>
            <img
              src={matchingLowIcon}
              alt="회원 초대"
              className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto"
            />
          </div>

          {/* 안내 텍스트 */}
          <p className="text-gray-700 text-base sm:text-lg font-medium leading-relaxed whitespace-pre-line word-break-keep-all px-2">
            회원님의 믿을 수 있는 지인을 초대해주세요.{'\n'}
            가입 심사 통과 시, 하트 50개를 드립니다.
          </p>

          {/* 친구 초대 버튼 */}
          <button
            type="button"
            onClick={handleInviteFriend}
            className="w-full py-3 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-gray-800 text-gray-900 font-bold text-base sm:text-lg rounded-full hover:bg-white/20 hover:border-gray-900 transition-all duration-300 active:scale-95 focus:outline-none shadow-lg word-break-keep-all"
          >
            친구 초대하기
          </button>
        </div>
      </div>
    </div>
  )
}

// 지난카드 섹션
function PastCardSection() {
  // TODO: 서버에서 지난카드 데이터 가져오기
  return (
    <div className="space-y-5">
      <div className="bg-blue-50/40 backdrop-blur-2xl rounded-xl p-3 sm:p-4 border border-blue-200/60 shadow-2xl w-full mx-auto" style={{ maxWidth: '600px' }}>
        <p className="text-xs sm:text-sm text-blue-900 font-medium word-break-keep-all text-wrap-pretty leading-relaxed">
          💡 지난카드는 최대 6일 동안 볼 수 있습니다. (총 7일간 열람 가능)
        </p>
      </div>
      <div className="bg-white rounded-3xl p-8 sm:p-10 md:p-12 shadow-card w-full mx-auto" style={{ maxWidth: '600px' }}>
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600 font-medium word-break-keep-all text-wrap-balance leading-relaxed">
            아직 지난카드가 없습니다
          </p>
        </div>
      </div>
    </div>
  )
}

// 회원심사 섹션
function ReviewSection() {
  const handleInviteFriend = () => {
    if (import.meta.env.DEV) {
      console.log('친구 초대하기 클릭')
    }
    // TODO: 친구 초대 기능 구현
  }

  return (
    <div className="w-full mx-auto px-4 sm:px-6 py-6 sm:py-8" style={{ maxWidth: '600px' }}>
      <div className="text-center space-y-5 sm:space-y-7">
        {/* 현재 평가할 가입 희망자가 없습니다 */}
        <p className="text-gray-800 font-semibold text-base sm:text-lg text-wrap-balance leading-relaxed word-break-keep-all whitespace-pre-line">
          현재 평가할{'\n'}가입 희망자가 없습니다.
        </p>

        {/* 이미지 + 블러 효과 */}
        <div className="relative inline-block py-4">
          <div className="absolute inset-0 bg-blue-200/40 blur-3xl rounded-full scale-125"></div>
          <img
            src={matchingLowIcon}
            alt="회원 초대"
            className="relative w-40 h-40 sm:w-48 sm:h-48 mx-auto"
          />
        </div>

        {/* 안내 텍스트 */}
        <p className="text-gray-700 text-base sm:text-lg font-medium leading-relaxed whitespace-pre-line word-break-keep-all px-2">
          회원님의 믿을 수 있는 지인을 초대해주세요.{'\n'}
          가입 심사 통과 시, 하트 50개를 드립니다.
        </p>

        {/* 친구 초대 버튼 */}
        <button
          type="button"
          onClick={handleInviteFriend}
          className="w-full py-3 sm:py-4 bg-white/10 backdrop-blur-md border-2 border-gray-800 text-gray-900 font-bold text-base sm:text-lg rounded-full hover:bg-white/20 hover:border-gray-900 transition-all duration-300 active:scale-95 focus:outline-none shadow-lg word-break-keep-all"
        >
          친구 초대하기
        </button>
      </div>
    </div>
  )
}
