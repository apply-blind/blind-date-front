import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { BottomNavigation } from '../components/layout/BottomNavigation'
import { TopNavigation } from '../components/layout/TopNavigation'
import type { BottomTabType } from '../types/main.types'
import { useNotification } from '@/features/notification/context/NotificationContext'

// 각 탭 페이지 import (나중에 구현)
import { MatchingPage } from './MatchingPage'
import { CardListPage } from './CardListPage'
import { BoardPage } from './BoardPage'
import { ContentPage } from './ContentPage'
import { MyPage } from './MyPage'

export function MainLayout() {
  const navigate = useNavigate()
  const { unreadCount } = useNotification()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabFromUrl = (searchParams.get('tab') as BottomTabType) || 'matching'
  const [currentTab, setCurrentTab] = useState<BottomTabType>(tabFromUrl)

  // 🔍 디버깅: unreadCount 변화 추적
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [MainLayout] unreadCount 변화 감지:', {
        unreadCount,
        hasNotification: unreadCount > 0,
        timestamp: new Date().toISOString()
      })
    }
  }, [unreadCount])

  // URL 파라미터가 변경되면 탭 상태 업데이트
  useEffect(() => {
    const tab = (searchParams.get('tab') as BottomTabType) || 'matching'
    setCurrentTab(tab)
  }, [searchParams])

  // 탭별 타이틀 매핑
  const getTitle = (): string => {
    switch (currentTab) {
      case 'matching':
        return '매칭'
      case 'card-list':
        return '카드목록'
      case 'board':
        return '익명게시판'
      case 'content':
        return '콘텐츠'
      case 'mypage':
        return '마이페이지'
      default:
        return '블라인드'
    }
  }

  // 핸들러 함수들
  const handleCartClick = () => {
    if (import.meta.env.DEV) {
      console.log('상품 카트 클릭')
    }
    // TODO: 카트 페이지로 이동 또는 모달 오픈
  }

  const handleNotificationClick = () => {
    navigate('/notifications')
  }

  const handleSearchClick = () => {
    navigate('/board/search')
  }

  const handleMyPostsClick = () => {
    navigate('/board/my-posts')
  }

  // 현재 탭에 맞는 페이지 렌더링
  const renderCurrentPage = () => {
    switch (currentTab) {
      case 'matching':
        return <MatchingPage />
      case 'card-list':
        return <CardListPage />
      case 'board':
        return <BoardPage />
      case 'content':
        return <ContentPage />
      case 'mypage':
        return <MyPage />
      default:
        return <MatchingPage />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-white flex flex-col">
      {/* 상단 네비게이션 */}
      <TopNavigation
        currentTab={currentTab}
        title={getTitle()}
        unreadCount={unreadCount}
        onCartClick={handleCartClick}
        onNotificationClick={handleNotificationClick}
        onSearchClick={handleSearchClick}
        onMyPostsClick={handleMyPostsClick}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 pt-20 pb-20 overflow-y-auto">
        {renderCurrentPage()}
      </main>

      {/* 하단 네비게이션 */}
      <BottomNavigation
        currentTab={currentTab}
        onTabChange={(tab) => setSearchParams({ tab })}
      />
    </div>
  )
}

export default MainLayout
