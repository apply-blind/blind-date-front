import { useAuth } from '@/features/auth'
import { useNavigate } from 'react-router-dom'

function BannedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleContactSupport = () => {
    // TODO: 고객센터 이메일 또는 문의 링크
    window.location.href = 'mailto:support@blind.com'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          {/* 정지 아이콘 */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
              <span className="text-5xl">🚫</span>
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">
              계정이 영구 정지되었습니다
            </h1>
          </div>

          {/* 사유 */}
          <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-5 text-left space-y-3">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-wrap-balance word-break-keep-all">
              <span>⚠️</span>
              정지 사유
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-wrap-pretty word-break-keep-all">
              {user?.rejectionReason ||
                '이용약관 및 운영정책 위반으로 인해 계정이 영구 정지되었습니다.'}
            </p>
          </div>

          {/* 안내 */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-red-800 font-semibold text-wrap-balance word-break-keep-all">
              ⛔ 영구 정지된 계정은 재가입이 불가능합니다
            </p>
            <p className="text-xs text-gray-600 text-wrap-pretty word-break-keep-all">
              정지 처분에 대한 문의는 고객센터로 연락해 주시기 바랍니다.
            </p>
          </div>

          {/* 고객센터 버튼 */}
          <button
            type="button"
            onClick={handleContactSupport}
            className="w-full py-3 text-sm font-medium rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all"
          >
            고객센터 문의하기
          </button>

          {/* 메인으로 돌아가기 */}
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="w-full py-3 text-xs text-gray-500 hover:text-gray-700 transition-all"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}

export default BannedPage
