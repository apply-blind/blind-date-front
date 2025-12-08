import api from '@/shared/api/axios'
import type {
  BackendProfileRequest,
  UserProfileResponse,
  ImageUpdateMetadata,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  PresignedUrlInfo
} from '../types/profile.types'

// ====================================================================
// S3 직접 업로드 헬퍼 함수
// ====================================================================

/**
 * S3에 파일 직접 업로드
 * Presigned URL을 사용하여 PUT 요청
 */
async function uploadToS3(file: File, presignedUrl: string): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  })

  // ✅ 2025 Best Practice: fetch는 4xx, 5xx도 성공으로 간주하므로 명시적 확인 필요
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`S3 업로드 실패 (${response.status}): ${errorText}`)
  }
}

// ====================================================================
// 프로필 심사 요청 Flow (최초 제출 + 재제출 + 수정 통합)
// 1. POST /api/v1/users/profiles/pending (UserProfilePending 리소스 생성)
// 2. 클라이언트: S3 직접 업로드
// 3. PATCH /api/v1/users/profiles/pending/images (S3 업로드 완료 처리)
// ====================================================================

/**
 * Step 1: 프로필 심사 요청 (Presigned URLs 발급)
 * POST /api/v1/users/profiles/pending
 *
 * 허용 상태:
 * - PROFILE_WRITING: 최초 제출
 * - REJECTED: 재제출 (반려 후 재수정)
 * - APPROVED: 프로필 수정
 *
 * 내부 헬퍼 함수 (submitProfile, updateProfile에서만 사용)
 */
async function submitProfileRequest(
  profileData: BackendProfileRequest,
  imageMetadata: ImageUpdateMetadata[]
): Promise<ProfileUpdateResponse> {
  const request: ProfileUpdateRequest = {
    profile: profileData,
    imageMetadata
  }

  const response = await api.post<ProfileUpdateResponse>('/api/v1/users/profiles/pending', request)
  return response.data
}

/**
 * Step 2: S3에 이미지 업로드
 * 내부 헬퍼 함수 (submitProfile, updateProfile에서만 사용)
 */
async function uploadImagesToS3(
  images: File[],
  presignedUrls: PresignedUrlInfo[]
): Promise<void> {
  // displayOrder 순서대로 정렬
  const sortedUrls = [...presignedUrls].sort((a, b) => a.displayOrder - b.displayOrder)

  // 병렬 업로드
  await Promise.all(
    sortedUrls.map((urlInfo, index) => {
      const file = images[index]
      if (!file) {
        throw new Error(`이미지 파일이 없습니다: displayOrder ${urlInfo.displayOrder}`)
      }
      return uploadToS3(file, urlInfo.presignedUrl)
    })
  )
}

/**
 * Step 3: S3 이미지 업로드 완료 처리
 * PATCH /api/v1/users/profiles/pending/images
 * 내부 헬퍼 함수 (submitProfile, updateProfile에서만 사용)
 */
async function completeImageUploads(): Promise<void> {
  const response = await api.patch('/api/v1/users/profiles/pending/images')

  if (import.meta.env.DEV) {
    console.log('[completeImageUploads] 업로드 완료 처리:', response.status, response.statusText)
  }
}

/**
 * 프로필 심사 요청 (전체 플로우) - 최초 제출 전용
 * 편의 함수: Step 1 → Step 2 → Step 3을 순서대로 실행
 *
 * @param profileData - 프로필 데이터
 * @param images - 업로드할 이미지 파일 배열 (displayOrder 순서대로)
 */
export async function submitProfile(
  profileData: BackendProfileRequest,
  images: File[]
): Promise<void> {
  // imageMetadata 자동 생성 (모든 이미지가 NEW 타입)
  const imageMetadata: ImageUpdateMetadata[] = images.map((file, index) => ({
    type: 'NEW',
    displayOrder: index + 1,  // 1-based
    filename: file.name,
    contentType: file.type
  }))

  // Step 1: Presigned URLs 발급
  const { presignedUrls } = await submitProfileRequest(profileData, imageMetadata)

  // Step 2: S3 업로드
  if (presignedUrls.length > 0 && images.length > 0) {
    await uploadImagesToS3(images, presignedUrls)
  }

  // Step 3: 업로드 완료 처리
  await completeImageUploads()
}

/**
 * 프로필 수정 요청 (전체 플로우) - 재제출/수정 전용
 * REJECTED 또는 APPROVED 상태에서 사용
 *
 * @param profileData - 프로필 데이터
 * @param images - 새로 업로드할 이미지 파일 배열 (NEW 타입만)
 * @param imageMetadata - 이미지 메타데이터 (EXISTING + NEW 타입 포함)
 */
export async function updateProfile(
  profileData: BackendProfileRequest,
  images: File[],
  imageMetadata: ImageUpdateMetadata[]
): Promise<void> {
  // Step 1: Presigned URLs 발급
  const { presignedUrls } = await submitProfileRequest(profileData, imageMetadata)

  // Step 2: S3 업로드 (새 이미지만)
  if (presignedUrls.length > 0 && images.length > 0) {
    await uploadImagesToS3(images, presignedUrls)
  }

  // Step 3: 업로드 완료 처리
  await completeImageUploads()
}

// ====================================================================
// 조회 API
// ====================================================================

/**
 * 내 프로필 전체 정보 조회 API
 * GET /api/v1/users/profile
 * 프로필 수정 시 기존 데이터 로드용
 */
export async function getMyProfile(): Promise<UserProfileResponse> {
  const response = await api.get<UserProfileResponse>('/api/v1/users/profile')
  return response.data
}

/**
 * 닉네임 중복 확인 API
 * GET /api/v1/users/nicknames/{nickname}/availability
 * @param nickname - 중복 확인할 닉네임
 * @param config - axios 설정 (signal로 요청 취소 가능)
 */
export async function checkNicknameAvailability(
  nickname: string,
  config?: { signal?: AbortSignal }
): Promise<{ available: boolean }> {
  const response = await api.get<{ available: boolean }>(
    `/api/v1/users/nicknames/${encodeURIComponent(nickname)}/availability`,
    config
  )
  return response.data
}
