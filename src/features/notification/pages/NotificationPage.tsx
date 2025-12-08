import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Bell, RefreshCw } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead } from '../api/notification.api'
import type { NotificationResponse } from '../types'
import { useNotification } from '../context/NotificationContext'
import alertRingIcon from '@/assets/images/alert_riing.png'
import readAllIcon from '@/assets/images/read_all.png'

/**
 * 알림 목록 페이지
 * - 최신순 알림 표시
 * - 읽음/읽지 않음 구분
 * - 알림 클릭 시 해당 게시글로 이동 + 읽음 처리
 */
export function NotificationPage() {
  const navigate = useNavigate()
  const { refreshUnreadCount } = useNotification()
  const [notifications, setNotifications] = useState<NotificationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 알림 목록 조회
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getNotifications(0, 50) // 최신 50개
        setNotifications(data.content)
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('알림 목록 조회 실패:', err)
        }
        setError('알림을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  // 새로고침 처리
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true)
      const data = await getNotifications(0, 50)
      setNotifications(data.content)
      // 읽지 않은 알림 개수도 갱신
      await refreshUnreadCount()
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('알림 새로고침 실패:', err)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  // 모두 읽음 처리
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      await refreshUnreadCount()
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('모두 읽음 처리 실패:', err)
      }
    }
  }

  // 알림 클릭 처리
  const handleNotificationClick = async (notification: NotificationResponse) => {
    try {
      // 읽지 않은 알림이면 읽음 처리
      if (!notification.isRead) {
        await markAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, isRead: true } : n))
        )
        // 읽지 않은 알림 개수 갱신
        await refreshUnreadCount()
      }

      // 알림 타입별 페이지 이동
      if (notification.type === 'COMMENT_CREATED' || notification.type === 'REPLY_CREATED') {
        // 댓글 알림 → 게시글 상세 페이지로 이동 (URL 해시로 댓글 위치 전달)
        if (notification.postPublicId) {
          const hash = notification.commentPublicId ? `#comment-${notification.commentPublicId}` : ''
          navigate(`/board/${notification.postPublicId}${hash}`)
        }
      } else if (notification.type === 'REVIEW_APPROVED' || notification.type === 'REVIEW_REJECTED') {
        // 프로필 심사 알림 → 마이페이지로 이동
        navigate('/main?tab=my')
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('알림 처리 실패:', err)
      }
    }
  }

  // 알림 메시지 생성
  const getNotificationMessage = (notification: NotificationResponse) => {
    switch (notification.type) {
      case 'COMMENT_CREATED':
        return `${notification.postTitle} 글에 댓글이 달렸습니다.`
      case 'REPLY_CREATED':
        return `${notification.postTitle} 글에 대댓글이 달렸습니다.`
      case 'REVIEW_APPROVED':
        return '프로필 심사가 승인되었습니다'
      case 'REVIEW_REJECTED':
        return `프로필 심사가 반려되었습니다${notification.reason ? `: ${notification.reason}` : ''}`
      default:
        return '새로운 알림이 있습니다'
    }
  }

  // 시간 포맷
  // 오늘 (24:00 기준 내): "03:32" (시:분)
  // 오늘 이전: "25-12-05" (년-월-일)
  const formatTime = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()

    // 오늘 자정 (00:00:00)
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 오늘인지 확인
    const isToday = created >= todayMidnight

    if (isToday) {
      // 오늘: "03:32" 형식
      const hours = created.getHours().toString().padStart(2, '0')
      const minutes = created.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } else {
      // 오늘 이전: "25-12-05" 형식
      const year = created.getFullYear().toString().slice(2) // 2025 → 25
      const month = (created.getMonth() + 1).toString().padStart(2, '0')
      const day = created.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <Bell className="w-full h-full text-coral-pink animate-pulse" />
          </div>
          <p className="text-gray-500">알림을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-500 mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/main')}
            className="px-6 py-3 bg-coral-pink hover:bg-coral-pink/90 text-white font-semibold rounded-full transition-all duration-200 active:scale-95 shadow-button"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white pb-24">
      {/* 상단 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md pt-safe z-40 border-b border-gray-100">
        <div className="flex items-center justify-between h-20 px-4 sm:px-5 max-w-screen-xl mx-auto">
          {/* 뒤로 가기 버튼 */}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:bg-coral-pink/5 rounded-xl px-2 py-1.5 transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
            aria-label="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">알림</span>
          </button>

          {/* 우측 버튼 그룹 */}
          <div className="flex items-center gap-2">
            {/* 모두 읽음 버튼 */}
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="p-2 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
              aria-label="모두 읽음"
            >
              <img src={readAllIcon} alt="모두 읽음" className="w-5 h-5" />
            </button>

            {/* 새로고침 버튼 */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-coral-pink/5 rounded-xl transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="새로고침"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-900 ${isRefreshing ? 'animate-spin' : ''}`}
                strokeWidth={2}
              />
            </button>
          </div>
        </div>
      </header>

      {/* 알림 목록 */}
      <div className="pt-20 px-4 sm:px-5 max-w-screen-xl mx-auto">
        {notifications.length === 0 ? (
          <div className="mt-20 text-center">
            <img
              src={alertRingIcon}
              alt="알림 없음"
              className="w-16 h-16 mx-auto mb-4 opacity-30"
            />
            <p className="text-gray-500">알림이 없습니다</p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {notifications.map(notification => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                  notification.isRead
                    ? 'bg-white hover:bg-gray-50'
                    : 'bg-coral-pink/5 hover:bg-coral-pink/10 border border-coral-pink/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* 알림 아이콘 */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    notification.isRead ? 'bg-gray-100' : 'bg-coral-pink/10'
                  }`}>
                    <img
                      src={alertRingIcon}
                      alt="알림"
                      className="w-5 h-5"
                    />
                  </div>

                  {/* 알림 내용 */}
                  <div className="flex-1 min-w-0">
                    {/* 알림 출처 */}
                    <p className="text-xs text-gray-500 mb-1">블라인드룸의 댓글</p>

                    {/* 알림 메시지 */}
                    <p className={`text-sm sm:text-base font-medium mb-2 ${
                      notification.isRead ? 'text-gray-600' : 'text-gray-900'
                    }`}>
                      {getNotificationMessage(notification)}
                    </p>

                    {/* 시간 */}
                    <p className="text-xs text-gray-400">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* 읽지 않음 배지 */}
                  {!notification.isRead && (
                    <div className="flex-shrink-0 w-2 h-2 bg-coral-pink rounded-full mt-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}