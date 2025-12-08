/**
 * Logger 유틸리티
 * - 개발 환경에서만 console 출력
 * - 프로덕션 환경에서는 Sentry 등으로 에러 전송 (향후 구현)
 */

/**
 * 개발 환경 로그
 * @param args - console.log에 전달할 인자
 */
export function log(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.log(...args)
  }
}

/**
 * 에러 로그
 * @param args - console.error에 전달할 인자
 */
export function error(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.error(...args)
  } else {
    // ⭐ TODO: 프로덕션 환경에서는 Sentry로 전송
    // Sentry.captureException(args[0])
  }
}

/**
 * 경고 로그
 * @param args - console.warn에 전달할 인자
 */
export function warn(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.warn(...args)
  }
}

/**
 * 디버그 로그 (상세 정보 포함)
 * @param args - console.debug에 전달할 인자
 */
export function debug(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    console.debug(...args)
  }
}

/**
 * 그룹 로그 시작
 * @param label - 그룹 레이블
 */
export function group(label: string): void {
  if (import.meta.env.DEV) {
    console.group(label)
  }
}

/**
 * 그룹 로그 종료
 */
export function groupEnd(): void {
  if (import.meta.env.DEV) {
    console.groupEnd()
  }
}

export const logger = {
  log,
  error,
  warn,
  debug,
  group,
  groupEnd
}
