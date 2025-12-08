import { Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function ReviewPendingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          {/* 시계 아이콘 */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-coral-pink to-honey-gold rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">
              인증 처리 중입니다
            </h1>
          </div>

          {/* 설명 */}
          <div className="space-y-3 text-gray-700 leading-relaxed word-break-keep-all">
            <p className="text-wrap-pretty">
              회원가입과 프로필 심사가 진행 중입니다.
            </p>
            <p className="text-wrap-pretty">
              검토에는 짧게는 몇 분에서 길게는 <span className="font-bold text-coral-pink">48시간</span> 정도 소요될 수 있습니다.
            </p>
            <p className="text-wrap-pretty">
              검토가 완료되면 <span className="font-bold">심사결과</span>와 <span className="font-bold">알림 페이지</span>를 통해 결과를 안내해 드리겠습니다.
            </p>
          </div>

          {/* 안내 박스 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-800 font-bold">
              💡 안내사항
            </p>
            <ul className="text-sm text-gray-700 text-left space-y-1 word-break-keep-all">
              <li>• 심사 중에는 프로필 수정이 불가합니다</li>
              <li>• 이 창을 닫으셔도 심사는 계속 진행됩니다</li>
              <li>• 심사 완료 시 자동으로 알림이 전송됩니다</li>
            </ul>
          </div>

          {/* 메인으로 돌아가기 버튼 */}
          <button
            type="button"
            onClick={() => {
              // TODO: 로그아웃 로직
              navigate('/', { replace: true })
            }}
            className="w-full py-3 text-gray-600 hover:text-gray-800 font-medium transition-all"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ReviewPendingPage
