/**
 * sessionStorage 유틸리티
 *
 * ⚠️ 보안 경고:
 * - Base64 인코딩은 암호화가 아닌 단순 난독화입니다
 * - 브라우저 개발자 도구에서 누구나 디코딩 가능합니다
 * - 민감한 정보(비밀번호, 결제정보 등)는 저장하지 마세요
 * - 현재 저장 데이터: 프로필 임시 작성 내용 (이름, 직장, 학교 등)
 * - 목적: 페이지 새로고침 시 작성 내용 유지 (UX 개선)
 *
 * 🔒 보안 개선 방안 (향후 고려):
 * - Web Crypto API를 사용한 AES-GCM 암호화
 * - 서버 세션 스토리지로 마이그레이션
 */

const PROFILE_KEY = 'blind_profile_draft'
const INTRO_KEY = 'blind_intro_draft'
const NICKNAME_CHECK_KEY = 'blind_nickname_check'

/**
 * Base64 인코딩 (난독화용 - 보안 아님!)
 * @param data - JSON 직렬화 가능한 데이터
 * @returns Base64 인코딩된 문자열
 */
function encode(data: unknown): string {
  return btoa(encodeURIComponent(JSON.stringify(data)))
}

/**
 * Base64 디코딩
 * @param encoded - Base64 인코딩된 문자열
 * @returns 디코딩된 데이터 또는 null (실패 시)
 */
function decode<T>(encoded: string): T | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)))
  } catch {
    return null
  }
}

// 프로필 데이터 저장
export function saveProfileDraft(data: unknown): void {
  try {
    const encoded = encode(data)
    sessionStorage.setItem(PROFILE_KEY, encoded)
    if (import.meta.env.DEV) {
      console.log('✅ Profile saved to sessionStorage:', data)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Failed to save profile draft:', error)
    }
  }
}

// 프로필 데이터 로드
export function loadProfileDraft<T>(): T | null {
  try {
    const encoded = sessionStorage.getItem(PROFILE_KEY)
    const result = encoded ? decode<T>(encoded) : null
    if (import.meta.env.DEV) {
      console.log('📂 Profile loaded from sessionStorage:', result)
    }
    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Failed to load profile draft:', error)
    }
    return null
  }
}

// 프로필 데이터 삭제
export function clearProfileDraft(): void {
  sessionStorage.removeItem(PROFILE_KEY)
}

// 자기소개 데이터 저장
export function saveIntroDraft(data: string): void {
  try {
    sessionStorage.setItem(INTRO_KEY, encode(data))
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to save intro draft:', error)
    }
  }
}

// 자기소개 데이터 로드
export function loadIntroDraft(): string | null {
  try {
    const encoded = sessionStorage.getItem(INTRO_KEY)
    return encoded ? decode<string>(encoded) : null
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to load intro draft:', error)
    }
    return null
  }
}

// 자기소개 데이터 삭제
export function clearIntroDraft(): void {
  sessionStorage.removeItem(INTRO_KEY)
}

// 닉네임 중복확인 상태 저장
export function saveNicknameCheckStatus(nickname: string, status: 'available' | 'unavailable'): void {
  try {
    const data = { nickname, status }
    sessionStorage.setItem(NICKNAME_CHECK_KEY, encode(data))
    if (import.meta.env.DEV) {
      console.log('✅ Nickname check status saved:', data)
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Failed to save nickname check status:', error)
    }
  }
}

// 닉네임 중복확인 상태 로드
export function loadNicknameCheckStatus(): { nickname: string; status: 'available' | 'unavailable' } | null {
  try {
    const encoded = sessionStorage.getItem(NICKNAME_CHECK_KEY)
    const result = encoded ? decode<{ nickname: string; status: 'available' | 'unavailable' }>(encoded) : null
    if (import.meta.env.DEV) {
      console.log('📂 Nickname check status loaded:', result)
    }
    return result
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ Failed to load nickname check status:', error)
    }
    return null
  }
}

// 닉네임 중복확인 상태 삭제
export function clearNicknameCheckStatus(): void {
  sessionStorage.removeItem(NICKNAME_CHECK_KEY)
}

// 모든 임시 데이터 삭제
export function clearAllDrafts(): void {
  clearProfileDraft()
  clearIntroDraft()
  clearNicknameCheckStatus()
}
