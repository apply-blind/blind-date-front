import axios from 'axios'
import api from '@/shared/api/axios'
import type { CurrentUser } from '../types/auth.types'

/**
 * 현재 로그인한 사용자 정보 조회
 * JWT 토큰에서 파싱한 정보 반환
 * @param signal - AbortController signal (optional)
 */
export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser> {
  try {
    const response = await api.get<CurrentUser>('/api/v1/users/me', { signal })
    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      // AbortError는 정상적인 취소이므로 로그 출력 안 함
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
        throw err
      }
      const message = err.response?.data?.detail || err.message
      if (import.meta.env.DEV) {
        console.error('[getCurrentUser Error]', message)
      }
    }
    throw err
  }
}

/**
 * 로그아웃
 * DELETE /api/v1/auth/tokens
 */
export async function logout(): Promise<void> {
  try {
    await api.delete('/api/v1/auth/tokens')
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail || err.message
      if (import.meta.env.DEV) {
        console.error('[logout Error]', message)
      }
    }
    throw err
  }
}
