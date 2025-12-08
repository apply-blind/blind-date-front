import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { getCurrentUser } from '../api/authApi'
import type { CurrentUser } from '../types/auth.types'
import { useNotificationStream } from '@/features/notification/hooks/useNotificationStream'
import { useNotification } from '@/features/notification/context/NotificationContext'
import type { NotificationDto } from '@/features/notification/types'

interface AuthContextType {
  user: CurrentUser | null
  loading: boolean
  error: string | null
  isRefreshFailed: boolean  // ⭐ RefreshToken 재발급 실패 상태
  refetch: () => Promise<void>
  clearRefreshFailed: () => void  // ⭐ 로그인 성공 시 플래그 초기화
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

const REFRESH_FAILED_KEY = 'auth_refresh_failed'

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshFailed, setIsRefreshFailed] = useState(() => {
    // ⭐ 초기값: localStorage에서 읽어옴 (페이지 새로고침 대응)
    return localStorage.getItem(REFRESH_FAILED_KEY) === 'true'
  })
  const hasCalledApi = useRef(false)  // React Strict Mode 대응
  const isFetchingRef = useRef(false)

  // ⭐ RefreshToken 재발급 실패 플래그 초기화 (로그인 성공 시 호출)
  const clearRefreshFailed = useCallback(() => {
    setIsRefreshFailed(false)
    localStorage.removeItem(REFRESH_FAILED_KEY)
  }, [])

  // fetchUser를 useCallback으로 감싸서 dependencies 문제 해결
  const fetchUser = useCallback(async (signal?: AbortSignal) => {
    if (import.meta.env.DEV) {
      console.log('🔍 [fetchUser] 호출', {
        isFetching: isFetchingRef.current,
        timestamp: new Date().toISOString()
      })
    }

    // 중복 호출 방지
    if (isFetchingRef.current) {
      if (import.meta.env.DEV) {
        console.log('⚠️ [fetchUser] 이미 요청 중 - 스킵')
      }
      return
    }

    isFetchingRef.current = true
    // ⭐ finally 블록에서 조건부 처리를 위한 플래그
    let wasCanceled = false

    try {
      setLoading(true)
      setError(null)

      if (import.meta.env.DEV) {
        console.log('🔍 [fetchUser] API 호출 시작')
      }

      const userData = await getCurrentUser(signal)
      setUser(userData)

      // ✅ API 호출 성공 시 재발급 실패 플래그 초기화
      if (isRefreshFailed) {
        clearRefreshFailed()
      }

      if (import.meta.env.DEV) {
        console.log('✅ [fetchUser] API 호출 성공', {
          nickname: userData.nickname,
          status: userData.status
        })
      }
    } catch (err) {
      // AbortError는 정상적인 취소이므로 무시
      if (axios.isAxiosError(err) && (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')) {
        if (import.meta.env.DEV) {
          console.log('[fetchUser] 요청 취소됨 (cleanup)')
        }
        wasCanceled = true  // ⭐ 플래그 설정 (finally 블록에서 사용)
        return  // ⭐ early return (loading 상태 유지)
      }

      if (import.meta.env.DEV) {
        console.error('❌ [fetchUser] API 호출 실패:', err)
      }

      // ✅ Axios 인터셉터가 이미 토큰 재발급을 시도했음
      // ✅ 여기까지 에러가 전파되었다면:
      //   1) 재발급 실패 (isRefreshFailed=true) → ProtectedRoute가 리다이렉트
      //   2) 재시도 후에도 401/403 → 진짜 권한 오류
      //   3) 네트워크 오류 또는 서버 오류

      // ⚠️ 조용히 처리 (user를 null로 설정하면 ProtectedRoute가 리다이렉트 루프 유발)
      // setUser(null)은 호출하지 않음 → 기존 user 상태 유지

      if (axios.isAxiosError(err)) {
        const status = err.response?.status
        const message = err.response?.data?.detail || err.message

        // 401/403은 이미 axios 인터셉터에서 처리되었으므로 조용히 로그만
        if (status === 401 || status === 403) {
          if (import.meta.env.DEV) {
            console.log('[fetchUser] 인증 오류 (이미 axios 인터셉터에서 처리됨):', message)
          }
          // user를 null로 설정하지 않음 (리다이렉트는 axios.ts에서 처리)
          setError(null)  // 에러 메시지도 표시하지 않음
        } else {
          // 그 외 에러 (네트워크, 서버 오류 등)
          setError(`사용자 정보를 불러올 수 없습니다: ${message}`)
          setUser(null)
        }
      } else {
        setError('알 수 없는 오류가 발생했습니다.')
        setUser(null)
      }
    } finally {
      // ⭐⭐ 핵심 수정: 취소된 요청은 loading 상태를 변경하지 않음
      // React Strict Mode에서 1차 요청이 취소되어도 2차 요청의 loading을 방해하지 않음
      if (!wasCanceled) {
        setLoading(false)
      }
      isFetchingRef.current = false
    }
  }, [isRefreshFailed, clearRefreshFailed])

  // fetchUser를 ref로 저장 (handleNotification dependencies 문제 해결)
  const fetchUserRef = useRef(fetchUser)
  useEffect(() => {
    fetchUserRef.current = fetchUser
  }, [fetchUser])

  // 마운트 시 사용자 정보 조회 (React Strict Mode 대응)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [useAuth] useEffect 실행:', {
        hasCalledApi: hasCalledApi.current,
        pathname: window.location.pathname,
        timestamp: new Date().toISOString()
      })
    }

    // ✅ 카카오 콜백 페이지에서만 fetchUser 스킵 (KakaoCallback이 직접 처리)
    const isKakaoCallback = window.location.pathname.startsWith('/auth/kakao/callback')

    if (isKakaoCallback) {
      if (import.meta.env.DEV) {
        console.log('⚠️ [useAuth] 카카오 콜백 페이지 - fetchUser 스킵')
      }
      setLoading(false)
      return
    }

    if (hasCalledApi.current) {
      if (import.meta.env.DEV) {
        console.log('⚠️ [useAuth] 이미 API 호출됨 - 스킵')
      }
      return
    }

    hasCalledApi.current = true
    if (import.meta.env.DEV) {
      console.log('✅ [useAuth] 최초 fetchUser 호출')
    }

    // ⭐ AbortController로 cleanup 시 요청 취소 (React 18 Best Practice)
    const controller = new AbortController()
    fetchUser(controller.signal)

    return () => {
      if (import.meta.env.DEV) {
        console.log('🔍 [useAuth] cleanup 실행 - AbortController 취소 및 플래그 리셋')
      }
      controller.abort()  // 컴포넌트 언마운트 시 요청 취소
      hasCalledApi.current = false  // ⭐ cleanup 시 플래그 리셋 (Strict Mode 대응)
      isFetchingRef.current = false  // ⭐ cleanup 시 fetching 상태도 리셋
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // NotificationContext에 알림 전파
  const { setLatestNotification, incrementUnreadCount } = useNotification()

  // 알림 수신 처리
  const handleNotification = useCallback(async (notification: NotificationDto) => {
    if (notification.type === 'REVIEW_APPROVED') {
      if (import.meta.env.DEV) {
        console.log('[알림] 프로필 승인됨')
      }
      // ⭐ 일회성 시스템 알림 - DB 저장 안 함, unreadCount 증가 안 함
      try {
        await fetchUserRef.current()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[알림] 사용자 정보 갱신 실패:', err)
        }
      }
    } else if (notification.type === 'REVIEW_REJECTED') {
      if (import.meta.env.DEV) {
        console.log('[알림] 프로필 반려됨 - 사유:', notification.reason)
      }
      // ⭐ 일회성 시스템 알림 - DB 저장 안 함, unreadCount 증가 안 함
      try {
        await fetchUserRef.current()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[알림] 사용자 정보 갱신 실패:', err)
        }
      }
    } else if (notification.type === 'POST_CREATED') {
      // ⭐ NotificationContext로 전파 (BoardPage가 구독)
      if (import.meta.env.DEV) {
        console.log('[알림] 새 게시글 생성됨:', notification)
      }
      setLatestNotification(notification)
      // 브로드캐스트 알림 - DB 저장 안 함, unreadCount 증가 안 함
    } else if (notification.type === 'COMMENT_CREATED') {
      // ⭐ 내 게시글에 댓글 작성됨 (1:1 알림)
      if (import.meta.env.DEV) {
        console.log('[알림] 내 게시글에 댓글 작성됨:', {
          postTitle: notification.postTitle,
          commentContent: notification.commentContent
        })
      }
      incrementUnreadCount()  // DB 저장 알림 - 개수 증가
      setLatestNotification(notification)
      // TODO: 토스트 알림 UI 표시
    } else if (notification.type === 'REPLY_CREATED') {
      // ⭐ 나를 멘션한 대댓글 (1:1 알림)
      if (import.meta.env.DEV) {
        console.log('[알림] 나를 멘션한 대댓글:', {
          postTitle: notification.postTitle,
          commentContent: notification.commentContent
        })
      }
      incrementUnreadCount()  // DB 저장 알림 - 개수 증가
      setLatestNotification(notification)
      // TODO: 토스트 알림 UI 표시
    } else if (notification.type === 'COMMENT_ADDED') {
      // ⭐ 댓글 추가 브로드캐스트 알림
      if (import.meta.env.DEV) {
        console.log('[알림] 댓글 추가됨 (브로드캐스트):', {
          postPublicId: notification.postPublicId,
          commentPublicId: notification.commentPublicId,
          nickname: notification.anonymousNickname
        })
      }
      setLatestNotification(notification)
      // 브로드캐스트 알림 - DB 저장 안 함, unreadCount 증가 안 함
      // PostDetailPage가 구독하여 댓글 목록 자동 갱신
    } else if (notification.type === 'POST_DELETED') {
      // ⭐ 게시글 삭제 브로드캐스트 알림
      if (import.meta.env.DEV) {
        console.log('[알림] 게시글 삭제됨 (브로드캐스트):', {
          postPublicId: notification.postPublicId,
          category: notification.category
        })
      }
      setLatestNotification(notification)
      // 브로드캐스트 알림 - DB 저장 안 함, unreadCount 증가 안 함
      // BoardPage가 구독하여 게시글 목록에서 실시간 제거
    } else if (notification.type === 'COMMENT_DELETED') {
      // ⭐ 댓글 삭제 브로드캐스트 알림
      if (import.meta.env.DEV) {
        console.log('[알림] 댓글 삭제됨 (브로드캐스트):', {
          postPublicId: notification.postPublicId,
          commentPublicId: notification.commentPublicId
        })
      }
      setLatestNotification(notification)
      // 브로드캐스트 알림 - DB 저장 안 함, unreadCount 증가 안 함
      // PostDetailPage가 구독하여 댓글 목록 자동 갱신
    }
  }, [setLatestNotification, incrementUnreadCount])

  // 세션 만료 처리 (다른 곳에서 로그인)
  const handleSessionExpired = useCallback(() => {
    setUser(null)
    // ✅ 리다이렉트는 ProtectedRoute에서 자동 처리 (user=null 감지)
    // window.location.href 제거 (무한 새로고침 방지)
  }, [])

  // ⭐ RefreshToken 만료 이벤트 리스너 (axios.ts에서 발행)
  useEffect(() => {
    const handleRefreshFailed = () => {
      if (import.meta.env.DEV) {
        console.log('[useAuth] RefreshToken 만료 감지 - 로그아웃 처리')
      }
      setIsRefreshFailed(true)
      localStorage.setItem(REFRESH_FAILED_KEY, 'true')
      setUser(null)  // ⭐ 즉시 로그아웃
      setLoading(false)
      setError('세션이 만료되었습니다. 다시 로그인해주세요.')
    }

    window.addEventListener('auth:token-refresh-failed', handleRefreshFailed)
    return () => window.removeEventListener('auth:token-refresh-failed', handleRefreshFailed)
  }, [])

  // SSE 연결 (로그인된 사용자에게만)
  const sseEnabled = user !== null

  // 🔍 디버깅: SSE 연결 상태 로그
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔍 [useAuth] SSE 연결 상태 확인:', {
        user: user ? `${user.nickname} (${user.status})` : 'null',
        sseEnabled,
        timestamp: new Date().toISOString()
      })
    }
  }, [user, sseEnabled])

  useNotificationStream({
    onNotification: handleNotification,
    onSessionExpired: handleSessionExpired,
    enabled: sseEnabled
  })

  const value = {
    user,
    loading,
    error,
    isRefreshFailed,
    refetch: fetchUser,
    clearRefreshFailed
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
