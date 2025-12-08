import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/shared/types/common.types'

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true, // ⭐ HttpOnly Cookie 전송을 위해 필수!
  timeout: 30000, // 30초 타임아웃
})

// Token 재발급 중복 방지 플래그 (Mutex 패턴)
let isRefreshing = false
let refreshTokenPromise: Promise<void> | null = null

// ✅ 재발급 실패 플래그 (localStorage에 저장하여 페이지 새로고침 후에도 유지)
const REFRESH_FAILED_KEY = 'auth_refresh_failed'

/**
 * 토큰 재발급 실패 상태 설정 및 이벤트 발행
 * @param failed - true: 재발급 실패, false: 재발급 성공
 */
function setRefreshFailed(failed: boolean) {
  if (failed) {
    localStorage.setItem(REFRESH_FAILED_KEY, 'true')
    // ⭐ AuthProvider에 RefreshToken 만료 신호 전달
    window.dispatchEvent(new Event('auth:token-refresh-failed'))
  } else {
    localStorage.removeItem(REFRESH_FAILED_KEY)
  }
}

function isRefreshFailed(): boolean {
  return localStorage.getItem(REFRESH_FAILED_KEY) === 'true'
}

// 대기 중인 요청 큐 (2025 Best Practice: Queue Pattern)
interface QueuedRequest {
  config: InternalAxiosRequestConfig
  resolve: (value: AxiosResponse) => void
  reject: (reason: unknown) => void
}
let failedRequestsQueue: QueuedRequest[] = []

// ⭐ Singleton Pattern: 인터셉터 중복 등록 방지 (React Strict Mode 대응)
let interceptorsRegistered = false

/**
 * 인터셉터 등록 함수 (1회만 실행)
 * React Strict Mode에서 모듈이 2번 로드되어도 인터셉터는 1번만 등록
 */
function setupInterceptors() {
  if (interceptorsRegistered) {
    if (import.meta.env.DEV) {
      console.log('[axios.ts] 인터셉터 이미 등록됨 - 스킵')
    }
    return
  }

  interceptorsRegistered = true

  if (import.meta.env.DEV) {
    console.log('[axios.ts] 인터셉터 등록 시작')
  }

  // 요청 인터셉터
  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // ✅ 2025 Best Practice: FormData 자동 감지 후 조건부 헤더 설정
      // FormData가 아닌 경우에만 Content-Type을 application/json으로 설정
      // FormData인 경우 브라우저가 자동으로 multipart/form-data; boundary=... 설정
      if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json'
      }

      if (import.meta.env.DEV) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`)
      }
      return config
    },
    (error: AxiosError) => {
      if (import.meta.env.DEV) {
        console.error('[API Request Error]', error)
      }
      return Promise.reject(error)
    }
  )

  // 응답 인터셉터
  api.interceptors.response.use(
    (response: AxiosResponse) => {
      if (import.meta.env.DEV) {
        console.log(`[API Response] ${response.status} ${response.config.url}`)
      }
      return response
    },
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

      if (axios.isAxiosError(error)) {
        const status = error.response?.status
        // RFC 9457 형식: detail 필드 사용
        const message = error.response?.data?.detail || error.message

        // 🔍 디버깅: 에러 응답 상세 로그
        if (import.meta.env.DEV) {
          console.log('🔍 [axios interceptor] 에러 발생:', {
            url: originalRequest.url,
            method: originalRequest.method,
            status,
            message,
            _retry: originalRequest._retry,
            isRefreshing,
            isRefreshFailed: isRefreshFailed(),
            timestamp: new Date().toISOString()
          })
        }

        // ========================================
        // JWT 만료 자동 재발급 (401 Unauthorized / 403 Forbidden)
        // ========================================
        // Spring Security는 JWT 만료 시 403을 반환할 수 있으므로 401과 403 모두 처리
        // 진짜 권한 오류(Authorization 실패)는 재시도 후에도 403이 계속 나옴
        const isAuthError = status === 401 || status === 403
        const isFirstAttempt = !originalRequest._retry

        // ✅ 재발급 실패 시 에러만 throw (리다이렉트는 ProtectedRoute에서 처리)
        if (isAuthError && isRefreshFailed()) {
          if (import.meta.env.DEV) {
            console.error('[Token Reissue] 이미 재발급 실패 - 에러 반환')
          }
          return Promise.reject(error)
        }

        if (isAuthError && isFirstAttempt) {
          // 인증 API는 재시도하지 않음 (무한 루프 방지)
          const isAuthAPI = originalRequest.url?.includes('/api/v1/auth/tokens')
          if (isAuthAPI) {
            // PUT = 토큰 재발급 실패 (Refresh Token 만료)
            if (originalRequest.method?.toUpperCase() === 'PUT') {
              if (import.meta.env.DEV) {
                console.error('[Token Reissue] 재발급 API 실패 (Refresh Token 만료)')
              }
              // ✅ 플래그 설정만 하고 에러 반환 (리다이렉트는 ProtectedRoute에서)
              setRefreshFailed(true)
            }
            // POST = 카카오 로그인 실패 (백엔드 에러, 그대로 반환)
            else if (originalRequest.method?.toUpperCase() === 'POST') {
              if (import.meta.env.DEV) {
                console.error('[Kakao Login] 카카오 로그인 API 실패 - 에러 반환')
              }
            }
            return Promise.reject(error)
          }

          if (import.meta.env.DEV) {
            console.log(`[${status} ${status === 401 ? 'Unauthorized' : 'Forbidden'}] JWT 만료 추정 - 재발급 시도`)
          }

          // 🔒 Mutex Pattern: 재발급 중이 아닌 경우에만 재발급 시도
          if (!isRefreshing) {
            // 재시도 플래그 설정 (다음 401/403은 진짜 권한 오류로 판단)
            originalRequest._retry = true
            isRefreshing = true

            // 📌 2025 Best Practice: 재발급 Promise를 공유하여 Race Condition 방지
            refreshTokenPromise = (async () => {
              try {
                // Refresh Token으로 Access Token 재발급 (PUT /api/v1/auth/tokens)
                if (import.meta.env.DEV) {
                  console.log('🔍 [Token Reissue] 토큰 재발급 시도 중...')
                }

                const response = await api.put('/api/v1/auth/tokens')

                // ✅ 재발급 성공 시 실패 플래그 초기화
                setRefreshFailed(false)

                if (import.meta.env.DEV) {
                  console.log('✅ [Token Reissue] 토큰 재발급 성공:', {
                    status: response.status,
                    statusText: response.statusText,
                    queueLength: failedRequestsQueue.length
                  })
                }

                // ✅ 2025 Best Practice: 대기 큐를 먼저 완전히 처리
                const queueSnapshot = [...failedRequestsQueue]
                failedRequestsQueue = [] // 큐 초기화

                // 순차적으로 대기 요청 처리 (Promise.allSettled로 에러 격리)
                const results = await Promise.allSettled(
                  queueSnapshot.map(async ({ config, resolve, reject }) => {
                    try {
                      const response = await api(config)
                      resolve(response)
                      return response
                    } catch (err) {
                      reject(err)
                      throw err
                    }
                  })
                )

                if (import.meta.env.DEV) {
                  const successCount = results.filter(r => r.status === 'fulfilled').length
                  console.log(`[Token Reissue] 대기 요청 처리 완료: 성공 ${successCount}/${queueSnapshot.length}`)
                }
              } catch (refreshError) {
                if (import.meta.env.DEV) {
                  console.error('[Token Reissue] 토큰 재발급 실패')
                }

                // ✅ 재발급 실패 플래그 설정 (무한 루프 방지)
                setRefreshFailed(true)

                // 대기 중인 요청들 모두 실패 처리
                const queueSnapshot = [...failedRequestsQueue]
                failedRequestsQueue = []
                queueSnapshot.forEach(({ reject }) => reject(refreshError))

                throw refreshError
              } finally {
                isRefreshing = false
                refreshTokenPromise = null
              }
            })()

            // 원래 요청을 대기 큐 처리가 완료된 후에 재시도
            try {
              await refreshTokenPromise
              return api(originalRequest)
            } catch (err) {
              return Promise.reject(err)
            }
          }

          // 📝 이미 재발급 중인 경우: 대기열에 추가하고 재발급 완료 대기
          return new Promise((resolve, reject) => {
            failedRequestsQueue.push({
              config: originalRequest,
              resolve: (value: AxiosResponse) => resolve(value),
              reject: (err: unknown) => reject(err)
            })
          })
        }

        // ========================================
        // 재시도 후에도 실패 (진짜 권한 오류 등)
        // ========================================
        // 여기 도달 = 위 if (isAuthError && isFirstAttempt) 블록을 통과하지 못함
        // = originalRequest._retry === true (이미 토큰 재발급 시도했는데 또 에러)
        switch (status) {
          case 403:
            // 재시도 후에도 403 = 진짜 권한 부족 (Authorization 실패)
            if (originalRequest._retry) {
              if (import.meta.env.DEV) {
                console.error('[403 Forbidden - 권한 부족]', message)
              }
              alert('접근 권한이 없습니다.')
            }
            break
          case 404:
            if (import.meta.env.DEV) {
              console.error('[404 Not Found]', message)
            }
            break
          case 500:
            if (import.meta.env.DEV) {
              console.error('[500 Internal Server Error]', message)
            }
            alert('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
            break
          default:
            if (import.meta.env.DEV) {
              console.error(`[${status} Error]`, message)
            }
        }
      }
      return Promise.reject(error)
    }
  )

  if (import.meta.env.DEV) {
    console.log('[axios.ts] 인터셉터 등록 완료')
  }
}

// ⭐ 모듈 로드 시 인터셉터 등록
setupInterceptors()

export default api
