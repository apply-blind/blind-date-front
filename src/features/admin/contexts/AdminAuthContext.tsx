import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
// import api from '@/shared/api/axios'  // TODO: 향후 GET /api/v1/admin/users/me 구현 시 사용

interface AdminUser {
  username: string
  role: 'ADMIN'
}

interface AdminAuthContextType {
  adminUser: AdminUser | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null)

interface AdminAuthProviderProps {
  children: ReactNode
}

/**
 * 관리자 인증 Context Provider
 * - 일반 사용자 AuthProvider와 완전히 분리
 * - GET /api/v1/admin/users/me 호출 (향후 구현 시)
 */
export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdminUser = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: 백엔드에 GET /api/v1/admin/users/me API 추가 필요
      // 현재는 토큰만 확인하고 관리자로 간주
      // const response = await api.get<AdminUser>('/api/v1/admin/users/me')
      // setAdminUser(response.data)

      // 임시: 관리자 로그인 성공 시 adminUser를 설정하도록 함
      setLoading(false)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[AdminAuth] 관리자 정보 조회 실패:', err)
      }
      setAdminUser(null)
      setError('관리자 인증에 실패했습니다.')
      setLoading(false)
    }
  }

  const refetch = async () => {
    await fetchAdminUser()
  }

  useEffect(() => {
    // 관리자 페이지에서는 자동으로 사용자 정보를 가져오지 않음
    // 로그인 후 수동으로 refetch() 호출
    setLoading(false)
  }, [])

  return (
    <AdminAuthContext.Provider value={{ adminUser, loading, error, refetch }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
