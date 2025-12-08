import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth'

function RejectedPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleEditProfile = () => {
    navigate('/profile/create')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center space-y-6">
          {/* 거절 아이콘 */}
          <div className="flex justify-center">
            <img
              src="/src/assets/images/sad_face.png"
              alt="반려된 프로필"
              className="w-24 h-24 object-contain"
            />
          </div>

          {/* 제목 */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-800">
              승인이 거절되었습니다
            </h1>
          </div>

          {/* 운영자 메시지 */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-left space-y-3">
            <h3 className="font-bold text-red-800 flex items-center gap-2 text-wrap-balance word-break-keep-all">
              <span>📝</span>
              운영자 메시지
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed text-wrap-pretty word-break-keep-all">
              {user?.rejectionReason ||
                '정성이 담긴 본인이 어떤 사람인지 (장점, 취미 등) 설명하는 자기소개 작성하셔야 승인 가능합니다.'}
            </p>
          </div>

          {/* 안내 */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-gray-700 font-semibold text-wrap-balance word-break-keep-all">
              💡 프로필을 수정하여 다시 심사를 받으실 수 있습니다
            </p>
            <p className="text-xs text-gray-600 text-wrap-pretty word-break-keep-all">
              진솔하고 구체적인 자기소개와 프로필 정보를 작성해 주세요.
            </p>
          </div>

          {/* 버튼 */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleEditProfile}
              className="w-full py-4 text-lg font-semibold rounded-full bg-honey-gold hover:bg-yellow-400 text-gray-900 shadow-lg hover:shadow-xl transition-all"
            >
              프로필 수정하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RejectedPage
