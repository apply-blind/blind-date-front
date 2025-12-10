// ==================== 프로필 작성 관련 타입 ====================
export interface ProfileFormData {
  nickname: string                      // 닉네임 (중복확인 필요)
  gender: 'MALE' | 'FEMALE' | ''       // 성별 (빈 문자열은 미선택 상태)
  birthday: string                      // 생일 (YYYY-MM-DD 형식, 예: 1995-08-29)
  occupation: string                    // 직업 (대분류/소분류 형식, 예: "일반/대기업직원")
  company: string                       // 직장 (한글만, 띄어쓰기 없이, 최대 250자)
  school: string                        // 학교
  region: string                        // 거주지 (예: "경기도 용인시 수지구")
  workRegion: string                    // 직장지역
  height: number                        // 키 (140~230cm, 0은 미선택 상태)
  bloodType: 'A' | 'B' | 'O' | 'AB' | ''    // 혈액형 (빈 문자열은 미선택 상태)
  bodyType: '마른' | '슬림' | '보통' | '다소 볼륨' | '글래머' | '통통' | ''  // 체형 (빈 문자열은 미선택 상태)
  personalities: string[]               // 성격 (최대 3개)
  religion: '무교' | '기독교' | '불교' | '천주교' | '원불교' | '기타' | ''  // 종교 (빈 문자열은 미선택 상태)
  drinking: '전혀 안 함' | '가끔' | '자주' | '매일' | ''  // 음주여부 (빈 문자열은 미선택 상태)
  smoking: '비흡연' | '가끔' | '흡연' | ''  // 흡연 (빈 문자열은 미선택 상태) - 중복 제거
  hasCar: boolean | null                // 자차여부 (null은 미선택 상태)
}

// 프로필 이미지 정보
export interface ImageInfo {
  imagePublicId: string
  imageUrl: string
  displayOrder: number
}

// 프로필 전체 정보 응답 (백엔드에서 받는 형식)
export interface UserProfileResponse {
  nickname: string
  gender: 'MALE' | 'FEMALE'
  birthday: string  // LocalDate → string (YYYY-MM-DD)
  jobCategory: string  // ENUM 문자열
  jobTitle: string
  company: string
  school: string
  residenceCity: string  // ENUM 문자열
  residenceDistrict: string
  workCity: string  // ENUM 문자열
  workDistrict: string
  height: number
  bloodType: 'A' | 'B' | 'O' | 'AB'
  bodyType: string  // ENUM 문자열
  personalities: string[]  // ENUM 문자열 배열
  religion: string  // ENUM 문자열
  drinking: string  // ENUM 문자열
  smoking: string  // ENUM 문자열
  hasCar: boolean
  introduction: string
  images: ImageInfo[]  // 이미지 배열 (imageUrl + displayOrder)
}

// 백엔드 프로필 완성 요청
export interface BackendProfileRequest {
  nickname: string
  gender: 'MALE' | 'FEMALE'
  birthday: string  // YYYY-MM-DD
  jobCategory: string  // ENUM 문자열
  jobTitle: string
  company: string
  school: string
  residenceCity: string  // ENUM 문자열
  residenceDistrict: string
  workCity: string  // ENUM 문자열
  workDistrict: string
  height: number
  bloodType: 'A' | 'B' | 'O' | 'AB'
  bodyType: string  // ENUM 문자열
  personalities: string[]  // ENUM 문자열 배열
  religion: string  // ENUM 문자열
  drinking: string  // ENUM 문자열
  smoking: string  // ENUM 문자열
  hasCar: boolean
  introduction: string
}

// ==================== Presigned URL 패턴 관련 타입 ====================

/**
 * 이미지 수정 메타데이터 (프로필 등록 및 수정)
 * EXISTING: 기존 이미지 유지
 * NEW: 신규 이미지 추가
 */
export interface ImageUpdateMetadata {
  type: 'EXISTING' | 'NEW'
  imagePublicId?: string     // EXISTING 타입인 경우 필수
  displayOrder: number       // 모든 타입 필수
  filename?: string          // NEW 타입인 경우 필수
  contentType?: string       // NEW 타입인 경우 필수
}

/**
 * Presigned URL 정보 (응답)
 * 백엔드는 항상 imagePublicId를 생성하여 제공
 */
export interface PresignedUrlInfo {
  imagePublicId: string      // 서버가 생성한 UUID (항상 포함)
  presignedUrl: string
  s3Key: string
  displayOrder: number
}

/**
 * 프로필 등록/수정 요청
 */
export interface ProfileUpdateRequest {
  profile: BackendProfileRequest
  imageMetadata: ImageUpdateMetadata[]
}

/**
 * 프로필 등록/수정 응답
 */
export interface ProfileUpdateResponse {
  presignedUrls: PresignedUrlInfo[]  // 신규 이미지에 대한 Presigned URLs만 반환
}
