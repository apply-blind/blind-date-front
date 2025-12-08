import axios from 'axios'
import api from '@/shared/api/axios'
import type {
  AdminLoginRequest,
  ReviewListResponse,
  ReviewDetailResponse,
  ReviewStatusUpdateRequest,
  UserStatus
} from '../types/admin.types'

/**
 * 관리자 로그인 API
 * POST /api/v1/admin/auth/tokens
 *
 * 성공 시 access_token, refresh_token이 HttpOnly Cookie로 설정됨
 */
export async function adminLogin(credentials: AdminLoginRequest): Promise<void> {
  try {
    await api.post('/api/v1/admin/auth/tokens', credentials)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail || err.message
      if (import.meta.env.DEV) {
        console.error('[adminLogin Error]', message)
      }
    }
    throw err
  }
}

/**
 * 심사 대기 목록 조회 API
 * GET /api/v1/admin/reviews?status=UNDER_REVIEW
 */
export async function getReviewList(status: UserStatus = 'UNDER_REVIEW'): Promise<ReviewListResponse> {
  try {
    const response = await api.get<ReviewListResponse>('/api/v1/admin/reviews', {
      params: { status }
    })
    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail || err.message
      if (import.meta.env.DEV) {
        console.error('[getReviewList Error]', message)
      }
    }
    throw err
  }
}

/**
 * 심사 대상 상세 정보 조회 API
 * GET /api/v1/admin/reviews/{publicId}
 */
export async function getReviewDetail(publicId: string): Promise<ReviewDetailResponse> {
  try {
    const response = await api.get<ReviewDetailResponse>(`/api/v1/admin/reviews/${publicId}`)
    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail || err.message
      if (import.meta.env.DEV) {
        console.error('[getReviewDetail Error]', message)
      }
    }
    throw err
  }
}

/**
 * 심사 상태 변경 API (승인/반려/밴)
 * PATCH /api/v1/admin/reviews/{publicId}
 */
export async function updateReviewStatus(
  publicId: string,
  request: ReviewStatusUpdateRequest
): Promise<void> {
  try {
    await api.patch(`/api/v1/admin/reviews/${publicId}`, request)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const message = err.response?.data?.detail || err.message
      if (import.meta.env.DEV) {
        console.error('[updateReviewStatus Error]', message)
      }
    }
    throw err
  }
}
