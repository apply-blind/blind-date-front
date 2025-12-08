// ==================== API 응답 타입 ====================
// 참고: 프로필 관련 타입은 @/features/profile/types/profile.types.ts에 정의되어 있습니다

/**
 * RFC 9457 (Problem Details for HTTP APIs) 표준 에러 응답
 */
export interface ApiError {
  type: string                          // 에러 타입 URI (기본값: "about:blank")
  title: string                         // HTTP 상태 코드 이름 (예: "Bad Request")
  status: number                        // HTTP 상태 코드 (예: 400)
  detail: string                        // 에러 상세 메시지 (한글)
  instance: string                      // 요청한 URI
  code: string                          // 에러 코드 (예: "nickname001")
  timestamp: string                     // 에러 발생 시각
  invalidFields?: Record<string, string> // Validation 실패 시 필드별 에러 메시지
}

// ==================== 환경 변수 타입 ====================
// ✅ 2025 Best Practice: Vite의 ImportMetaEnv를 확장 (Module Augmentation)
// 이 선언은 import.meta.env에 커스텀 환경 변수를 추가하여 자동완성과 타입 체크를 제공합니다
declare global {
  interface ImportMetaEnv {
    readonly VITE_KAKAO_CLIENT_ID: string
    readonly VITE_KAKAO_REDIRECT_URI: string
    readonly VITE_API_BASE_URL: string
  }
}
