import {
  User,
  Users,
  MessageCircle,
  Settings,
  UserX,
  HelpCircle,
  Info,
  Volume2,
  Crown,
  BadgeCheck,
  Heart,
  Search
} from 'lucide-react'
import heartCashIcon from '@/assets/images/heart_cash.png'
import certificateIcon from '@/assets/images/certificate.png'

export function MyPage() {
  // TODO: 서버에서 사용자 프로필 데이터 가져오기
  const userProfile = {
    profileImage: '', // 빈 문자열 = 기본 이미지
    nickname: '사용자닉네임',
    heartsToday: 0,
    heartsTotal: 100,
    badgesAcquired: 0,
    badgesLocked: 12
  }

  const handleEditProfile = () => {
    if (import.meta.env.DEV) {
      console.log('프로필 편집 클릭')
    }
    // TODO: 프로필 편집 페이지로 이동
  }

  const handleMenuClick = (menuId: string) => {
    if (import.meta.env.DEV) {
      console.log(`메뉴 클릭: ${menuId}`)
    }
    // TODO: 각 메뉴별 페이지로 이동
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-5 py-4 sm:py-6 pb-safe space-y-3 sm:space-y-4">
      {/* 프로필 섹션 */}
      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-card">
        <div className="flex flex-col items-center gap-3 sm:gap-4 mb-5 sm:mb-6">
          {/* 프로필 이미지 (완전 원형) - 가운데 */}
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden flex-shrink-0 ring-3 sm:ring-4 ring-white shadow-lg">
              {userProfile.profileImage ? (
                <img
                  src={userProfile.profileImage}
                  alt="프로필"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={2.5} />
              )}
            </div>
            {/* 프로필 보기 아이콘 */}
            <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-coral-pink rounded-full border-3 sm:border-4 border-white flex items-center justify-center">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* 닉네임 - 가운데 */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 word-break-keep-all">
              {userProfile.nickname}
            </h2>
          </div>

          {/* 프로필 편집 버튼 - 가운데 */}
          <button
            type="button"
            onClick={handleEditProfile}
            className="px-6 sm:px-8 py-2 sm:py-2.5 bg-white text-primary-600 font-semibold rounded-full hover:bg-gray-50 active:scale-95 transition-all text-xs sm:text-sm shadow-md border-2 border-primary-500 word-break-keep-all"
          >
            프로필 편집
          </button>
        </div>

        {/* 하트 & 뱃지 */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* 보유 하트 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
              <span className="font-bold text-gray-900 text-xs sm:text-sm word-break-keep-all">보유 하트</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img src={heartCashIcon} alt="하트" className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userProfile.heartsTotal}
                </span>
              </div>
            </div>
          </div>

          {/* 보유 뱃지 */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-md">
            <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2">
              <span className="font-bold text-gray-900 text-xs sm:text-sm word-break-keep-all">보유 뱃지</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <img src={certificateIcon} alt="뱃지" className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-xl sm:text-2xl font-bold text-gray-900">
                  {userProfile.badgesAcquired}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card overflow-hidden">
        <MenuList onMenuClick={handleMenuClick} />
      </div>
    </div>
  )
}

// 메뉴 리스트 컴포넌트
interface MenuListProps {
  onMenuClick: (menuId: string) => void
}

function MenuList({ onMenuClick }: MenuListProps) {
  const menuItems = [
    { id: 'tier-view', label: '내 인기도 티어보기', icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'badge-request', label: '뱃지 인증 신청', icon: BadgeCheck, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'dating-style-edit', label: '연애스타일 수정', icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'invite-friend', label: '친구 초대하기', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'block-acquaintance', label: '지인 차단하기', icon: UserX, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'notice', label: '공지사항', icon: Volume2, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'why-special', label: '블라인드 데이트가 특별한 이유!', icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'how-to-use', label: '이용방법', icon: HelpCircle, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'customer-service', label: '고객센터', icon: MessageCircle, color: 'text-teal-600', bgColor: 'bg-teal-50' },
    { id: 'settings', label: '설정', icon: Settings, color: 'text-gray-600', bgColor: 'bg-gray-50' }
  ]

  return (
    <div className="divide-y divide-gray-100">
      {menuItems.map((item) => {
        const Icon = item.icon
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onMenuClick(item.id)}
            className="w-full px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-gray-50 active:bg-gray-100 transition-all duration-150 group"
          >
            {/* 아이콘 */}
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${item.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <Icon className={`w-4.5 h-4.5 sm:w-5 sm:h-5 ${item.color}`} strokeWidth={2} />
            </div>

            {/* 라벨 */}
            <span className="flex-1 text-left font-medium text-sm sm:text-base text-gray-900 group-hover:text-primary-600 transition-colors word-break-keep-all leading-relaxed">
              {item.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
