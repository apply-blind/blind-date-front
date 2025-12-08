import axios from '@/shared/api/axios'
import type { NotificationResponse } from '../types'

/**
 * 알림 목록 조회 (페이징)
 */
export async function getNotifications(page: number = 0, size: number = 20) {
  const { data } = await axios.get<{
    content: NotificationResponse[]
    totalElements: number
    totalPages: number
    number: number
    size: number
  }>('/api/v1/notifications', {
    params: { page, size }
  })
  return data
}

/**
 * 읽지 않은 알림 개수 조회
 */
export async function getUnreadCount() {
  const { data } = await axios.get<{ count: number }>('/api/v1/notifications/unread-count')
  return data.count
}

/**
 * 특정 알림 읽음 처리
 */
export async function markAsRead(notificationId: number) {
  await axios.patch(`/api/v1/notifications/${notificationId}/read`)
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllAsRead() {
  await axios.patch('/api/v1/notifications/read-all')
}
