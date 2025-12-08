import { Clock, FolderOpen } from 'lucide-react'
import type { PostSearchResult } from '../types/board.types'

interface SearchResultCardProps {
  post: PostSearchResult
  onClick: () => void
}

/**
 * 카테고리 한글 표시
 */
function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    FREE_TALK: '자유 수다',
    SELF_INTRO: '셀소',
    MEETUP: '벙개',
    GENTLEMEN: '젠틀맨 라운지',
    LADIES: '레이디 라운지'
  }
  return labels[category] || category
}

/**
 * ISO 8601 시간을 "HH:MM" 또는 "MM/DD" 형식으로 변환
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()

  // 오늘 날짜인지 확인
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } else {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${month}/${day}`
  }
}

/**
 * 검색 결과 카드 컴포넌트
 *
 * PostCard와 달리 검색 결과는 미리보기 중심 UI
 * - 제목
 * - 내용 미리보기 (200자)
 * - 카테고리 + 시간
 */
export function SearchResultCard({ post, onClick }: SearchResultCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full p-4 sm:p-5 transition-all duration-200 border-b border-gray-200
                 text-left bg-white hover:bg-gray-50 active:bg-gray-100 active:scale-[0.995]"
    >
      <div className="flex items-start gap-3">
        {/* 텍스트 영역 */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {/* 제목 */}
          <h3 className="font-semibold text-gray-900 text-base sm:text-lg line-clamp-2 leading-snug">
            {post.title}
          </h3>

          {/* 내용 미리보기 */}
          {post.content && (
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2 leading-relaxed">
              {post.content}
            </p>
          )}

          {/* 메타 정보: 카테고리 + 시간 */}
          <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>{getCategoryLabel(post.category)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="tabular-nums">{formatTime(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 썸네일 이미지 (이미지가 있을 때만 표시) */}
        {post.imageUrl && (
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={post.imageUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </button>
  )
}
