import { Heart, MessageCircle, Sparkles, User } from 'lucide-react'
import type { BottomTabType } from '../../types/main.types'
import cardListIcon from '@/assets/images/card_list.png'
import fullHeartIcon from '@/assets/images/full_heart.png'

interface BottomNavigationProps {
  currentTab: BottomTabType
  onTabChange: (tab: BottomTabType) => void
}

interface TabConfig {
  id: BottomTabType
  label: string
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>
  iconImage?: string  // PNG 이미지 경로
  activeIconImage?: string  // 활성화 시 PNG 이미지 경로
}

export function BottomNavigation({ currentTab, onTabChange }: BottomNavigationProps) {
  const tabs: TabConfig[] = [
    { id: 'matching', label: '매칭', icon: Heart, activeIconImage: fullHeartIcon },
    { id: 'card-list', label: '카드목록', iconImage: cardListIcon },
    { id: 'board', label: '익명게시판', icon: MessageCircle },
    { id: 'content', label: '콘텐츠', icon: Sparkles },
    { id: 'mypage', label: '마이페이지', icon: User }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-safe z-50 shadow-nav">
      <div className="flex max-w-screen-xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 sm:py-3 min-h-touch-lg transition-all duration-300 relative active:bg-coral-pink/10 active:scale-95 focus:outline-none ${
                isActive
                  ? 'text-coral-pink'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-coral-pink to-pink-400 rounded-full" />
              )}

              {/* 아이콘 렌더링: PNG 이미지 또는 SVG */}
              {isActive && tab.activeIconImage ? (
                <img
                  src={tab.activeIconImage}
                  alt={tab.label}
                  className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 sm:mb-1 transition-all duration-300 scale-110"
                />
              ) : tab.iconImage ? (
                <img
                  src={tab.iconImage}
                  alt={tab.label}
                  className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 sm:mb-1 transition-all duration-300 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                  style={{
                    filter: isActive
                      ? 'invert(47%) sepia(78%) saturate(1500%) hue-rotate(330deg) brightness(100%) contrast(120%)'
                      : 'invert(80%) sepia(0%) saturate(0%) brightness(100%) contrast(120%)'
                  }}
                />
              ) : Icon ? (
                <Icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 mb-0.5 sm:mb-1 transition-transform duration-300 ${
                    isActive ? 'scale-110' : 'scale-100'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              ) : null}

              <span className={`text-[10px] sm:text-xs font-semibold tracking-tight ${
                isActive ? 'font-bold' : 'font-medium'
              }`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
