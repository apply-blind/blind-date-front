import { Eye, Heart, MessageCircle, Clock, UserRound, Image as ImageIcon } from 'lucide-react'
import type { PostListItem } from '../types/board.types'
import hotIcon from '@/assets/images/hot.png'

interface HotPostCardProps {
  post: PostListItem
  onClick: () => void
}

/**
 * 시간을 "HH:MM" 형식으로 변환
 */
function formatTime(createdAt: string): string {
  const date = new Date(createdAt)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 숫자를 K 표기법으로 변환 (1,234 → 1.2K)
 */
function formatCount(count: number): string {
  if (count < 1000) return count.toString()
  return `${(count / 1000).toFixed(1)}K`
}

export function HotPostCard({ post, onClick }: HotPostCardProps) {
  const getGenderBgColor = () => {
    return post.authorGender === 'MALE'
      ? 'bg-gradient-to-br from-green-50 to-green-100'
      : 'bg-gradient-to-br from-pink-50 to-pink-100'
  }

  const getGenderIconColor = () => {
    return post.authorGender === 'MALE' ? 'text-green-600' : 'text-pink-600'
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-primary-50 hover:bg-primary-100 p-5 transition-all duration-200 border-b border-gray-200 word-break-keep-all text-left"
    >
      <div className="flex items-center gap-3">
        {/* HOT 아이콘 */}
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
          <img src={hotIcon} alt="HOT" className="w-12 h-12" />
        </div>

        {/* 성별 아이콘 */}
        <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getGenderBgColor()}`}>
          <UserRound className={`w-7 h-7 sm:w-8 sm:h-8 ${getGenderIconColor()}`} strokeWidth={2.5} />
        </div>

        {/* 컨텐츠 영역: flex-col + gap으로 일관된 spacing */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* 인기글 라벨 */}
          <span className="text-fluid-xs font-semibold text-primary-500">
            인기글
          </span>

          {/* 제목 */}
          <h3 className="text-fluid-base font-semibold text-gray-900 truncate">
            {post.title}
          </h3>

          {/* 통계: 조회수, 좋아요, 댓글, 시간 */}
          <div className="flex items-center gap-2 sm:gap-3 text-fluid-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatCount(post.viewCount)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatCount(post.likeCount)}</span>
            </div>

            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatCount(post.commentCount)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 썸네일 이미지 (이미지가 있을 때만 표시) */}
        {post.hasImage && (
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
        )}
      </div>
    </button>
  )
}
