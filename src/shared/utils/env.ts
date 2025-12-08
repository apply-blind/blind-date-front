/**
 * 환경 변수 검증 유틸리티
 * 애플리케이션 시작 시 필수 환경 변수가 모두 설정되어 있는지 확인합니다.
 */

const requiredEnvVars = [
  'VITE_KAKAO_CLIENT_ID',
  'VITE_KAKAO_REDIRECT_URI'
] as const

export function validateEnv(): void {
  const missingVars: string[] = []

  requiredEnvVars.forEach((varName) => {
    if (!import.meta.env[varName]) {
      missingVars.push(varName)
    }
  })

  if (missingVars.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다:\n${missingVars.join('\n')}\n\n.env 파일을 확인해주세요.`
    )
  }
}
