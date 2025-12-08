// ==================== 사용자 관련 타입 ====================
export type UserStatus =
  | 'PROFILE_WRITING'  // 프로필 작성 중
  | 'UNDER_REVIEW'     // 심사 중
  | 'APPROVED'         // 승인
  | 'REJECTED'         // 반려
  | 'BANNED'           // 영구 정지

export type UserGrade = 'USER' | 'ADMIN'

// 현재 로그인한 사용자 정보
export interface CurrentUser {
  publicId: string  // UUID → string 자동 변환
  status: UserStatus
  grade: UserGrade
  hasProfile: boolean  // 프로필 작성 여부
  nickname: string | null  // 프로필이 있으면 닉네임, 없으면 null
  rejectionReason: string | null  // 반려 사유 (REJECTED 상태일 때만 값 존재)
}

// ==================== 인증 관련 타입 ====================
export interface KakaoLoginRequest {
  code: string
}

export interface KakaoLoginResponse {
  accessToken: string
  refreshToken: string
}

export interface AuthError {
  message: string
  code?: string
  status?: number
}
