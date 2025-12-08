import { useState, useEffect, useRef } from 'react'
import type { BottomTabType } from '../../types/main.types'
import alertIcon from '@/assets/images/alert.png'
import hasAlertIcon from '@/assets/images/has_alert.png'
import cartIcon from '@/assets/images/cart.png'
import searchIcon from '@/assets/images/search.png'
import boardHistoryIcon from '@/assets/images/borad_history.png'

interface TopNavigationProps {
  currentTab: BottomTabType
  title: string
  hasNotification?: boolean  // 알림 유무 (deprecated - unreadCount 사용 권장)
  unreadCount?: number  // 읽지 않은 알림 개수
  onCartClick?: () => void
  onNotificationClick?: () => void
  onSearchClick?: () => void
  onMyPostsClick?: () => void
}

export function TopNavigation({
  currentTab,
  title,
  hasNotification = false,  // 기본값 false (deprecated)
  unreadCount = 0,  // 기본값 0
  onCartClick,
  onNotificationClick,
  onSearchClick,
  onMyPostsClick
}: TopNavigationProps) {
  const isBoard = currentTab === 'board'

  // unreadCount가 제공되지 않은 경우 hasNotification으로 폴백
  const displayUnreadCount = unreadCount
  const hasUnreadNotification = unreadCount > 0 || hasNotification

  // ⭐ 알림 아이콘 흔들림 애니메이션
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const prevUnreadCountRef = useRef(unreadCount)
  const timerRef = useRef<number | null>(null)
  const rafRef = useRef<number | null>(null)

  // unreadCount가 증가할 때만 애니메이션 트리거 (새 알림 시 애니메이션 재시작)
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && unreadCount > 0) {
      // 기존 타이머와 RAF 취소 (애니메이션 진행 중이면 중단)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      // 애니메이션 클래스 제거 (CSS 애니메이션 리셋)
      setShouldAnimate(false)

      // requestAnimationFrame으로 DOM 업데이트 보장 후 애니메이션 재시작
      rafRef.current = requestAnimationFrame(() => {
        setShouldAnimate(true)

        // 5초 후 애니메이션 종료 (animate-bell-ring-safe는 1초 x 5회 = 5초)
        timerRef.current = window.setTimeout(() => setShouldAnimate(false), 5000)

        if (import.meta.env.DEV) {
          console.log('🔔 [TopNavigation] 알림 아이콘 애니메이션 재시작:', {
            prevCount: prevUnreadCountRef.current,
            newCount: unreadCount
          })
        }
      })
    }
    prevUnreadCountRef.current = unreadCount

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [unreadCount])

  // 🔍 디버깅: 알림 상태 추적
  if (import.meta.env.DEV) {
    console.log('🔍 [TopNavigation] 렌더링:', {
      unreadCount,
      hasNotification,
      hasUnreadNotification,
      currentTab,
      timestamp: new Date().toISOString()
    })
  }

  // 배지 렌더링 함수 (Material Design 3 + Apple HIG 베스트 프랙티스)
  const renderNotificationBadge = () => {
    if (displayUnreadCount === 0) return null

    const badgeText = displayUnreadCount > 99 ? '99+' : displayUnreadCount.toString()
    const isLargeNumber = displayUnreadCount > 99

    return (
      <span
        className={`
          absolute -top-1 -right-1.5
          flex items-center justify-center
          ${isLargeNumber ? 'min-w-[22px] h-5 px-1.5' : 'min-w-[18px] h-[18px] px-1'}
          bg-red-600 text-white
          text-[10px] sm:text-[11px] font-bold leading-none
          rounded-full
          shadow-md
          transition-transform duration-200
          hover:scale-110
        `}
        aria-label={`읽지 않은 알림 ${displayUnreadCount}개`}
        role="status"
      >
        {badgeText}
      </span>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md pt-safe z-40">
      <div className="flex items-center justify-between h-20 px-4 sm:px-5 max-w-screen-xl mx-auto">
        {/* 좌측: 타이틀 */}
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">{title}</h1>

        {/* 우측: 아이콘 버튼 */}
        <div className="flex items-center gap-1 sm:gap-2">
          {isBoard ? (
            <>
              {/* 익명게시판: 검색, 알림, 내글 */}
              <button
                type="button"
                onClick={onSearchClick}
                className="p-2.5 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
                aria-label="검색"
              >
                <img
                  src={searchIcon}
                  alt="검색"
                  className="w-6 h-6"
                />
              </button>
              <button
                type="button"
                onClick={onNotificationClick}
                className="p-2.5 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none relative"
                aria-label={displayUnreadCount > 0 ? `알림 (읽지 않음 ${displayUnreadCount}개)` : '알림'}
              >
                <div className={`relative inline-block ${shouldAnimate ? 'animate-bell-ring-safe' : ''}`}>
                  <img
                    src={hasUnreadNotification ? hasAlertIcon : alertIcon}
                    alt="알림"
                    className="w-6 h-6"
                  />
                  {renderNotificationBadge()}
                </div>
              </button>
              <button
                type="button"
                onClick={onMyPostsClick}
                className="p-2.5 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
                aria-label="내가 쓴 글"
              >
                <img
                  src={boardHistoryIcon}
                  alt="내가 쓴 글"
                  className="w-6 h-6"
                />
              </button>
            </>
          ) : (
            <>
              {/* 기타 페이지: 카트, 알림 */}
              <button
                type="button"
                onClick={onCartClick}
                className="p-2.5 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
                aria-label="상품 카트"
              >
                <img
                  src={cartIcon}
                  alt="카트"
                  className="w-6 h-6"
                />
              </button>
              <button
                type="button"
                onClick={onNotificationClick}
                className="p-2.5 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none relative"
                aria-label={displayUnreadCount > 0 ? `알림 (읽지 않음 ${displayUnreadCount}개)` : '알림'}
              >
                <div className={`relative inline-block ${shouldAnimate ? 'animate-bell-ring-safe' : ''}`}>
                  <img
                    src={hasUnreadNotification ? hasAlertIcon : alertIcon}
                    alt="알림"
                    className="w-6 h-6"
                  />
                  {renderNotificationBadge()}
                </div>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
