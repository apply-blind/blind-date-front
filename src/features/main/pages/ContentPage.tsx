import { Crown, Camera, BarChart3, Mic, Heart, Ban, UsersRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface ContentMenuItemWithIcon {
  id: string
  title: string
  description: string
  icon: LucideIcon
  isFree?: boolean
}

export function ContentPage() {
  const contentMenuItems: ContentMenuItemWithIcon[] = [
    {
      id: 'vvip-evaluation',
      title: 'VVIP 평가받기',
      description: '현재 활동하는 최상위 회원으로부터 내 프로필을 피드백 받습니다',
      icon: Crown,
      isFree: false
    },
    {
      id: 'best-photo',
      title: '내 인생샷을 골라줘',
      description: '이성 회원이 더 좋아하는 프사를 찾아 보세요.',
      icon: Camera,
      isFree: true
    },
    {
      id: 'popularity-test',
      title: '내 인기도 측정',
      description: '30명의 이성회원에게 내 인기도를 측정받습니다.',
      icon: BarChart3,
      isFree: true
    },
    {
      id: 'voice-message',
      title: '너의 목소리가 들려',
      description: '음성 메시지로 서로의 목소리를 확인할 수 있습니다.',
      icon: Mic,
      isFree: false
    },
    {
      id: 'mbti-matching',
      title: 'MBTI 매칭',
      description: '회원님의 MBTI 유형과 잘 맞는 이성을 추천해드립니다.',
      icon: UsersRound,
      isFree: false
    },
    {
      id: 'couple-board',
      title: '커플 게시판',
      description: '블라인드를 통해 만나게 된 커플들의 달달한 인터뷰!',
      icon: Heart,
      isFree: false
    },
    {
      id: 'bad-members',
      title: '불량회원',
      description: '블라인드의 이용을 방해하는 악성 이용자들을 박제합니다.',
      icon: Ban,
      isFree: false
    }
  ]

  const handleMenuClick = (itemId: string) => {
    if (import.meta.env.DEV) {
      console.log(`콘텐츠 메뉴 클릭: ${itemId}`)
    }
    // TODO: 각 메뉴별 페이지로 이동 또는 모달 오픈
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-5 py-4 sm:py-6">
      <div className="space-y-3 sm:space-y-4">
        {contentMenuItems.map((item) => (
          <ContentMenuCard
            key={item.id}
            item={item}
            onClick={() => handleMenuClick(item.id)}
          />
        ))}
      </div>
    </div>
  )
}

// 콘텐츠 메뉴 카드 컴포넌트
interface ContentMenuCardProps {
  item: ContentMenuItemWithIcon
  onClick: () => void
}

function ContentMenuCard({ item, onClick }: ContentMenuCardProps) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 hover:shadow-card transition-all duration-200 flex items-start justify-between group shadow-lg min-h-[100px] sm:min-h-[120px]"
    >
      {/* 좌측: 아이콘 */}
      <div className="flex-shrink-0 mr-3 sm:mr-4 mt-1">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-coral-pink/10 flex items-center justify-center group-hover:bg-coral-pink/20 transition-colors">
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-coral-pink" strokeWidth={2.5} />
        </div>
      </div>

      {/* 중앙: 텍스트 정보 */}
      <div className="flex-1 text-left">
        <div className="flex items-start gap-2 mb-1.5 sm:mb-2">
          <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight text-wrap-balance word-break-keep-all">
            {item.title}
          </h3>
          {item.isFree && (
            <span className="px-1.5 sm:px-2 py-0.5 bg-coral-pink text-white text-[9px] sm:text-[10px] font-bold rounded flex-shrink-0 mt-0.5">
              무료
            </span>
          )}
        </div>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed text-wrap-pretty word-break-keep-all">
          {item.description}
        </p>
      </div>
    </button>
  )
}
