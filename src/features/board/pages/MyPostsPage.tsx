import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { getMyPosts } from '../api/board.api'
import { PostCard } from '../components/PostCard'
import type { PostListItem } from '../types/board.types'

/**
 * 내가 작성한 게시글 목록 페이지
 * - 최신순 정렬만 (isPinned 무시)
 * - 시간 순서대로 작성 히스토리 확인
 * - 최대 100개 조회
 * - React Strict Mode 대응
 */
export function MyPostsPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasCalledApi = useRef(false) // ⭐ React Strict Mode 중복 호출 방지

  useEffect(() => {
    // ✅ React Strict Mode 중복 호출 방지
    if (hasCalledApi.current) {
      if (import.meta.env.DEV) {
        console.log('[MyPostsPage] 이미 API 호출됨 - 스킵')
      }
      return
    }

    hasCalledApi.current = true

    const fetchMyPosts = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getMyPosts(0, 100) // 최대 100개
        // ✅ 최신순만 (isPinned 무시) - 서버에서 createdAt DESC로 정렬됨
        setPosts(response.content)
      } catch (err) {
        console.error('내 게시글 조회 실패:', err)
        setError('게시글을 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchMyPosts()
  }, [])

  const handlePostClick = (publicId: string) => {
    navigate(`/board/${publicId}`)
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white flex items-center justify-center px-6">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white pb-24">
      {/* 상단 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md pt-safe z-40 border-b border-gray-100">
        <div className="flex items-center h-20 px-4 sm:px-5 max-w-screen-xl mx-auto">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:bg-coral-pink/5 rounded-xl px-2 py-1.5 transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
            aria-label="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">내가 쓴 글</span>
          </button>
        </div>
      </header>

      {/* 게시글 목록 */}
      <div className="pt-20 max-w-screen-xl mx-auto">
        {error ? (
          <div className="px-4 sm:px-5 py-10 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="px-4 sm:px-5 space-y-3 sm:space-y-4 pb-safe">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-card text-center word-break-keep-all mt-10">
              <p className="text-gray-800 font-semibold text-sm sm:text-base mb-2 text-wrap-balance leading-relaxed">
                작성한 게시글이 없습니다
              </p>
              <p className="text-xs sm:text-sm text-gray-600 text-wrap-pretty leading-relaxed">
                익명게시판에서 자유롭게 소통해보세요
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white">
            {posts.map(post => (
              <PostCard key={post.publicId} post={post} onClick={() => handlePostClick(post.publicId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyPostsPage
