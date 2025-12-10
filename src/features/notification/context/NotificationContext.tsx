import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { NotificationDto } from '../types'
import { getUnreadCount } from '../api/notification.api'
import { useAuth } from '@/features/auth'

interface NotificationContextType {
  latestNotification: NotificationDto | null
  setLatestNotification: (notification: NotificationDto | null) => void
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  incrementUnreadCount: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [latestNotification, setLatestNotification] = useState<NotificationDto | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // 읽지 않은 알림 개수 조회
  const refreshUnreadCount = async () => {
    // APPROVED 사용자만 조회 (UNDER_REVIEW 등은 403 에러 방지)
    if (user?.status !== 'APPROVED') {
      if (import.meta.env.DEV) {
        console.log('[NotificationContext] APPROVED 사용자가 아니므로 unread-count API 호출 스킵:', user?.status)
      }
      return
    }

    try {
      const count = await getUnreadCount()
      setUnreadCount(count)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('읽지 않은 알림 개수 조회 실패:', error)
      }
    }
  }

  // 읽지 않은 알림 개수 증가 (SSE로 새 알림 수신 시 사용)
  const incrementUnreadCount = () => {
    setUnreadCount(prev => {
      const newCount = prev + 1
      if (import.meta.env.DEV) {
        console.log('🔔 [NotificationContext] unreadCount 증가:', {
          before: prev,
          after: newCount,
          timestamp: new Date().toISOString()
        })
      }
      return newCount
    })
  }

  // user.status가 APPROVED로 변경될 때 읽지 않은 알림 개수 조회
  useEffect(() => {
    if (user?.status === 'APPROVED') {
      refreshUnreadCount()
    }
  }, [user?.status])

  return (
    <NotificationContext.Provider
      value={{
        latestNotification,
        setLatestNotification,
        unreadCount,
        refreshUnreadCount,
        incrementUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
