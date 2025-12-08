import { useEffect, useRef } from 'react'
import { EventSourcePolyfill } from 'event-source-polyfill'
import type { NotificationDto } from '../types'

interface UseNotificationStreamParams {
  onNotification: (notification: NotificationDto) => void
  onSessionExpired?: () => void
  enabled?: boolean
}

const MAX_RECONNECT_ATTEMPTS = 10
const INITIAL_RECONNECT_DELAY = 1000 // 1초 (2025 베스트 프렉티스)
const MAX_RECONNECT_DELAY = 60000
const HEARTBEAT_TIMEOUT = 30000 // 30초 (서버 Heartbeat 15초의 2배)

/**
 * SSE 알림 스트림 훅 (EventSource Polyfill 사용)
 *
 * EventSource Polyfill을 사용하여 브라우저 간 일관성 보장 및 Heartbeat timeout 자동 감지
 * - heartbeatTimeout: 30초 (서버 Heartbeat 15초의 2배)
 * - 30초 동안 Heartbeat 없으면 자동으로 onerror 발생 → 재연결
 *
 * @param onNotification - 알림 수신 콜백
 * @param onSessionExpired - 세션 만료 콜백
 * @param enabled - SSE 연결 활성화 여부 (기본값: true)
 */
export function useNotificationStream({
  onNotification,
  onSessionExpired,
  enabled = true
}: UseNotificationStreamParams) {
  const eventSourceRef = useRef<EventSourcePolyfill | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const hasConnectedRef = useRef(false)

  // 최신 콜백을 ref로 저장하여 connect가 재생성되지 않도록 함
  const onNotificationRef = useRef(onNotification)
  const onSessionExpiredRef = useRef(onSessionExpired)

  useEffect(() => {
    onNotificationRef.current = onNotification
    onSessionExpiredRef.current = onSessionExpired
  }, [onNotification, onSessionExpired])

  useEffect(() => {
    // 🔍 디버깅: useEffect 진입 확인
    if (import.meta.env.DEV) {
      console.log('🔍 [SSE] useNotificationStream useEffect 실행:', {
        enabled,
        hasConnectedRef: hasConnectedRef.current,
        eventSourceExists: !!eventSourceRef.current,
        readyState: eventSourceRef.current?.readyState,
        timestamp: new Date().toISOString()
      })
    }

    if (!enabled) {
      // enabled가 false면 연결 완전히 정리
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        if (import.meta.env.DEV) {
          console.log('[SSE] 연결 종료 (enabled=false)')
        }
      }

      // ✅ hasConnectedRef 초기화 (다음 enabled=true 시 재연결 가능)
      hasConnectedRef.current = false
      reconnectAttemptsRef.current = 0
      return
    }

    // ✅ 이미 연결 중이거나 연결된 경우 중복 연결 방지 (React Strict Mode 대응)
    const isConnectedOrConnecting = eventSourceRef.current &&
                                     (eventSourceRef.current.readyState === 0 ||  // CONNECTING
                                      eventSourceRef.current.readyState === 1)    // OPEN

    if (hasConnectedRef.current && isConnectedOrConnecting) {
      if (import.meta.env.DEV) {
        console.log('[SSE] 이미 연결 중/연결됨 - 스킵 (readyState:', eventSourceRef.current?.readyState, ')')
      }
      return
    }

    // ✅ 연결이 끊겼거나 한 번도 연결 안 한 경우에만 연결
    if (import.meta.env.DEV) {
      console.log('[SSE] 새 연결 시작 (hasConnected:', hasConnectedRef.current, 'readyState:', eventSourceRef.current?.readyState, ')')
    }
    hasConnectedRef.current = true

    const connect = () => {
      // 🔍 디버깅: connect 함수 시작
      if (import.meta.env.DEV) {
        console.log('🔍 [SSE] connect() 함수 실행 시작')
      }

      // 기존 타이머 정리
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // 기존 연결 정리
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }

      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || ''
        const sseUrl = `${apiBaseUrl}/api/v1/notifications/stream`

        // 🔍 디버깅: EventSource Polyfill 생성 시도
        if (import.meta.env.DEV) {
          console.log('🔍 [SSE] EventSource Polyfill 생성 시도:', {
            url: sseUrl,
            apiBaseUrl,
            withCredentials: true,
            heartbeatTimeout: `${HEARTBEAT_TIMEOUT}ms (${HEARTBEAT_TIMEOUT / 1000}초)`
          })
        }

        const eventSource = new EventSourcePolyfill(sseUrl, {
          withCredentials: true,
          heartbeatTimeout: HEARTBEAT_TIMEOUT // 30초 동안 Heartbeat 없으면 자동 재연결
        })

        eventSourceRef.current = eventSource

        // 🔍 디버깅: EventSource Polyfill 생성 완료
        if (import.meta.env.DEV) {
          console.log('🔍 [SSE] EventSource Polyfill 생성 완료, readyState:', eventSource.readyState)
        }

        // 🔍 디버깅: onopen 이벤트 (표준 SSE 연결 성공)
        eventSource.onopen = () => {
          if (import.meta.env.DEV) {
            console.log('✅ [SSE] onopen - 연결 성공! readyState:', eventSource.readyState)
          }
        }

        // 🔍 디버깅: onmessage 이벤트 (이름 없는 메시지)
        eventSource.onmessage = (event: MessageEvent) => {
          if (import.meta.env.DEV) {
            console.log('🔍 [SSE] onmessage - 이름 없는 메시지 수신:', event.data)
          }
        }

        // 연결 성공
        eventSource.addEventListener('connected', () => {
          // 재연결 카운터 리셋
          reconnectAttemptsRef.current = 0
          if (import.meta.env.DEV) {
            console.log('[SSE] 연결 성공')
          }
        })

        // Heartbeat (연결 유지)
        eventSource.addEventListener('heartbeat', () => {
          if (import.meta.env.DEV) {
            console.log('[SSE] Heartbeat 수신')
          }
        })

        // 알림 수신
        eventSource.addEventListener('notification', ((event: MessageEvent) => {
          try {
            const notification: NotificationDto = JSON.parse(event.data)
            if (import.meta.env.DEV) {
              console.log('[SSE] 알림 수신:', notification)
            }
            onNotificationRef.current(notification)
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('[SSE] 알림 파싱 실패:', error)
            }
          }
        }) as EventListener)

        // 세션 만료 (다른 곳에서 로그인)
        eventSource.addEventListener('session-expired', ((event: MessageEvent) => {
          if (import.meta.env.DEV) {
            console.log('[SSE] 세션 만료:', event.data)
          }
          alert(event.data || '다른 곳에서 로그인되었습니다.')

          // cleanup
          eventSource.close()
          eventSourceRef.current = null

          onSessionExpiredRef.current?.()
        }) as EventListener)

        // 연결 오류 (서버 종료, 네트워크 오류, Heartbeat timeout 포함)
        eventSource.onerror = (error: Event) => {
          if (import.meta.env.DEV) {
            console.error('[SSE] 연결 오류 (서버 종료 또는 Heartbeat timeout 30초 초과):', error)
          }

          // cleanup
          eventSource.close()
          eventSourceRef.current = null

          // 재연결 횟수 제한
          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            if (import.meta.env.DEV) {
              console.error('[SSE] 최대 재연결 횟수 초과 - 재연결 중단')
            }
            return
          }

          reconnectAttemptsRef.current += 1

          // Exponential backoff
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1),
            MAX_RECONNECT_DELAY
          )

          if (import.meta.env.DEV) {
            console.log(
              `[SSE] 재연결 시도 예정 (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}) - ${delay}ms 후`
            )
          }

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[SSE] EventSource 생성 실패:', error)
        }
      }
    }

    connect()

    return () => {
      // ✅ cleanup: 모든 ref 초기화 (React Strict Mode 대응)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
        if (import.meta.env.DEV) {
          console.log('[SSE] 연결 종료 (cleanup)')
        }
      }

      // ⭐ React Strict Mode에서 재마운트 시 깨끗한 상태로 시작
      hasConnectedRef.current = false
      reconnectAttemptsRef.current = 0
    }
  }, [enabled])

  return { disconnect: () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  } }
}
