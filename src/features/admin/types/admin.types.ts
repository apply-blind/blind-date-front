// ==================== 관리자 인증 관련 타입 ====================

/**
 * 관리자 로그인 요청
 */
export interface AdminLoginRequest {
  username: string
  password: string
}

// ==================== 심사 관련 타입 ====================

/**
 * 사용자 상태 (UserStatus Enum)
 */
export type UserStatus =
  | 'PROFILE_WRITING'   // 프로필 작성 중
  | 'UNDER_REVIEW'      // 심사 중
  | 'APPROVED'          // 승인
  | 'REJECTED'          // 반려
  | 'BANNED'            // 영구 정지

/**
 * 심사 목록 - 간략 정보
 */
export interface ReviewInfo {
  publicId: string      // UUID
  status: UserStatus
  createdAt: string     // ISO 8601 (YYYY-MM-DDTHH:mm:ss)
}

/**
 * 심사 목록 응답
 */
export interface ReviewListResponse {
  reviews: ReviewInfo[]
}

/**
 * 심사 상세 - 프로필 정보
 */
export interface ReviewProfileInfo {
  nickname: string
  gender: 'MALE' | 'FEMALE'
  birthday: string      // YYYY-MM-DD
  jobCategory: string   // ENUM 문자열
  jobTitle: string
  company: string
  school: string
  residenceCity: string
  residenceDistrict: string
  workCity: string
  workDistrict: string
  height: number
  bloodType: 'A' | 'B' | 'O' | 'AB'
  bodyType: string      // ENUM 문자열
  personalities: string[]
  religion: string      // ENUM 문자열
  drinking: string      // ENUM 문자열
  smoking: string       // ENUM 문자열
  hasCar: boolean
  introduction: string
}

/**
 * 심사 상세 - 이미지 정보
 */
export interface ReviewImageInfo {
  imageUrl: string
  displayOrder: number
}

/**
 * 심사 상세 응답
 */
export interface ReviewDetailResponse {
  publicId: string      // UUID
  status: UserStatus
  createdAt: string     // ISO 8601
  isInitialReview: boolean  // 최초 프로필 심사 여부 (true: 최초, false: 수정)
  profile: ReviewProfileInfo
  images: ReviewImageInfo[]
}

/**
 * 심사 상태 변경 요청
 */
export interface ReviewStatusUpdateRequest {
  status: 'APPROVED' | 'REJECTED' | 'BANNED'
  reason?: string       // REJECTED, BANNED일 때 필수
}

// ==================== 자주 사용하는 반려 사유 ====================

/**
 * 프론트엔드용 반려 사유 템플릿
 */
export const REJECTION_REASONS = [
  '프로필 사진이 명확하지 않습니다',
  '프로필 사진 가이드를 위반했습니다',
  '허위 정보가 포함되어 있습니다',
  '부적절한 내용이 포함되어 있습니다',
  '자기소개가 부적절합니다',
  '기타 (직접 입력)'
] as const

export type RejectionReason = typeof REJECTION_REASONS[number]
