import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { NotificationDto } from '../types'
import { getUnreadCount } from '../api/notification.api'

interface NotificationContextType {
  latestNotification: NotificationDto | null
  setLatestNotification: (notification: NotificationDto | null) => void
  unreadCount: number
  refreshUnreadCount: () => Promise<void>
  incrementUnreadCount: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [latestNotification, setLatestNotification] = useState<NotificationDto | null>(null)
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // 읽지 않은 알림 개수 조회
  const refreshUnreadCount = async () => {
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

  // 초기 로드 시 읽지 않은 알림 개수 조회
  useEffect(() => {
    refreshUnreadCount()
  }, [])

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
