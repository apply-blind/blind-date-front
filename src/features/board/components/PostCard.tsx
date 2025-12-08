import { Eye, Heart, MessageCircle, Clock, UserRound, Image as ImageIcon } from 'lucide-react'
import type { PostListItem } from '../types/board.types'
import hotIcon from '@/assets/images/hot.png'

interface PostCardProps {
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

export function PostCard({ post, onClick }: PostCardProps) {
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
      className={`w-full p-4 sm:p-5 transition-all duration-200 border-b border-gray-200 word-break-keep-all text-left min-h-[88px] active:scale-[0.995] ${
        post.isPinned
          ? 'bg-pink-50/50 hover:bg-pink-50 active:bg-pink-100/50'
          : 'bg-white hover:bg-gray-50 active:bg-gray-100'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        {/* HOT 아이콘 또는 성별 아이콘 */}
        {post.isPinned ? (
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
            <img src={hotIcon} alt="HOT" className="w-12 h-12" />
          </div>
        ) : (
          <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getGenderBgColor()}`}>
            <UserRound className={`w-7 h-7 sm:w-8 sm:h-8 ${getGenderIconColor()}`} strokeWidth={2.5} />
          </div>
        )}

        {/* 컨텐츠 영역: flex-col + gap으로 일관된 spacing */}
        <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
          {/* 인기글 라벨 (고정 게시글일 때만 표시) */}
          {post.isPinned && (
            <span className="text-fluid-xs font-semibold text-primary-500">
              인기글
            </span>
          )}

          {/* 제목 */}
          <h3 className={`font-semibold truncate leading-snug ${
            post.status === 'DELETED' ? 'text-gray-400 italic' : 'text-gray-900'
          } ${
            post.isPinned ? 'text-fluid-lg' : 'text-fluid-base'
          }`}>
            {post.status === 'DELETED' ? '삭제된 게시글입니다' : post.title}
          </h3>

          {/* 통계: 조회수, 좋아요, 댓글, 시간 */}
          <div className="flex items-center gap-2 sm:gap-3 text-fluid-xs text-gray-600">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="tabular-nums">{formatCount(post.viewCount)}</span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="tabular-nums">{formatCount(post.likeCount)}</span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="tabular-nums">{formatCount(post.commentCount)}</span>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="tabular-nums">{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 썸네일 이미지 (이미지가 있을 때만 표시) */}
        {post.hasImage && (
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
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
