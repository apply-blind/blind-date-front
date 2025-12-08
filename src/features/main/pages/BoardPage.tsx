import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PenSquare } from 'lucide-react'
import { useInView } from 'react-intersection-observer'
import type { BoardCategory } from '../types/main.types'
import { HotPostCard } from '@/features/board/components/HotPostCard'
import { PostCard } from '@/features/board/components/PostCard'
import type { PostListItem, PostCategory } from '@/features/board/types/board.types'
import { getPostsByCategory, getHotPosts } from '@/features/board/api/board.api'
import { useNotification } from '@/features/notification/context/NotificationContext'
import { getMyProfile } from '@/features/profile/api/profileApi'

export function BoardPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL 쿼리 파라미터에서 카테고리 읽기 (기본값: 'free')
  const activeCategory = (searchParams.get('category') as BoardCategory) || 'free'
  const [userGender, setUserGender] = useState<'MALE' | 'FEMALE' | null>(null)

  // 사용자 성별 정보 조회
  useEffect(() => {
    const fetchUserGender = async () => {
      try {
        const profile = await getMyProfile()
        setUserGender(profile.gender)
      } catch (error) {
        console.error('프로필 조회 실패:', error)
      }
    }
    fetchUserGender()
  }, [])

  // 성별에 따라 동적으로 카테고리 생성
  const categories: Array<{ id: BoardCategory; label: string }> = [
    { id: 'free', label: '자유 수다' },
    { id: 'self-intro', label: '셀소' },
    { id: 'popular', label: '인기글' },
    { id: 'meetup', label: '벙개' },
    userGender === 'FEMALE'
      ? { id: 'ladies', label: '레이디 라운지' }
      : { id: 'gentlemen', label: '젠틀맨 라운지' }
  ]

  return (
    <div className="max-w-screen-xl mx-auto">
      {/* 카테고리 탭 - 고정 (TopNavigation 바로 아래 배치) */}
      <div className="fixed top-[calc(env(safe-area-inset-top)+5rem)] sm:top-[calc(env(safe-area-inset-top)+5rem)] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-5 py-2 sm:py-2.5">
          <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide scroll-smooth scroll-fade-right">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  // 기존 쿼리 파라미터 유지하면서 category만 업데이트
                  const newParams = new URLSearchParams(searchParams)
                  newParams.set('category', category.id)
                  setSearchParams(newParams)
                }}
                className={`px-5 sm:px-6 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap flex-shrink-0 min-h-[44px] ${
                  activeCategory === category.id
                    ? 'pill-tab-active text-white'
                    : 'pill-tab text-gray-800'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 게시글 목록 (TopNavigation + Category Tabs 바로 아래) */}
      <div className="pt-[65px]">
        <BoardList category={activeCategory} />
      </div>

      {/* 글쓰기 버튼 (하단 고정, Safe Area 고려) */}
      <button
        type="button"
        onClick={() => {
          const currentCategoryLabel = categories.find(c => c.id === activeCategory)?.label || '자유 수다'
          navigate('/board/create', {
            state: {
              category: activeCategory,
              categoryLabel: currentCategoryLabel
            }
          })
        }}
        className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] sm:bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-coral-pink text-white rounded-2xl shadow-lg hover:bg-coral-pink/90 hover:shadow-xl transition-all duration-200 flex items-center justify-center z-30 active:scale-95"
        aria-label="글쓰기"
      >
        <PenSquare className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />
      </button>
    </div>
  )
}

// 카테고리 매핑 (UI → Backend)
const categoryMap: Record<BoardCategory, PostCategory> = {
  'free': 'FREE_TALK',
  'self-intro': 'SELF_INTRO',
  'popular': 'FREE_TALK', // 인기글은 카테고리 없이 별도 API 사용
  'meetup': 'MEETUP',
  'gentlemen': 'GENTLEMEN',  // 남성 전용
  'ladies': 'LADIES'          // 여성 전용
}

// 게시글 목록 컴포넌트
interface BoardListProps {
  category: BoardCategory
}

function BoardList({ category }: BoardListProps) {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<PostListItem[]>([])
  const [hotPost, setHotPost] = useState<PostListItem | null>(null)
  const [page, setPage] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const hasCalledApi = useRef<string | undefined>(undefined)  // ⭐ React Strict Mode 대응 (cacheKey 저장)

  // ⭐ Intersection Observer로 무한 스크롤 구현 (2025 Best Practice)
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '400px', // 뷰포트 400px 전에 미리 로드
  })

  // ⭐ NotificationContext로부터 알림 수신
  const { latestNotification } = useNotification()

  // ⭐ 알림 수신 시 자동 갱신 (category dependency 제거)
  useEffect(() => {
    if (latestNotification?.type === 'POST_CREATED') {
      if (import.meta.env.DEV) {
        console.log('[BoardPage] 새 게시글 알림 수신:', latestNotification)
      }
      const currentCategory = categoryMap[category]

      // 현재 보고 있는 카테고리의 게시글이면 목록 갱신
      if (category === 'popular' || currentCategory === latestNotification.category) {
        setRefreshTrigger(prev => prev + 1)
      }
    } else if (latestNotification?.type === 'POST_DELETED') {
      // ⭐ 게시글 삭제 알림: 실시간 status 변경 (순서 유지 - 2025 Best Practice)
      if (import.meta.env.DEV) {
        console.log('[BoardPage] 게시글 삭제 알림 수신:', latestNotification)
      }
      const notification = latestNotification as { postPublicId: string; category: string }
      const currentCategory = categoryMap[category]

      // 현재 보고 있는 카테고리의 게시글이면 status만 변경 (Soft Delete)
      if (category === 'popular' || currentCategory === notification.category) {
        // ✅ filter() 대신 map()으로 순서 유지
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.publicId === notification.postPublicId
              ? { ...post, status: 'DELETED' as const }
              : post
          )
        )

        // 인기글도 마스킹 처리 (제거하지 않음)
        if (hotPost && hotPost.publicId === notification.postPublicId) {
          setHotPost({ ...hotPost, status: 'DELETED' as const })
        }
      }
    } else if (latestNotification?.type === 'COMMENT_ADDED') {
      // ⭐ 댓글 추가 알림: 실시간 댓글 수 증가
      if (import.meta.env.DEV) {
        console.log('[BoardPage] 댓글 추가 알림 수신:', latestNotification)
      }
      const notification = latestNotification as { postPublicId: string }

      // 일반 게시글 목록에서 해당 게시글의 commentCount 증가
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.publicId === notification.postPublicId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      )

      // 인기글도 업데이트
      if (hotPost && hotPost.publicId === notification.postPublicId) {
        setHotPost({ ...hotPost, commentCount: hotPost.commentCount + 1 })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestNotification])  // ✅ category 제거 (읽기만 함)

  // 게시글 목록 조회 함수 (무한 스크롤 지원)
  const fetchPosts = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsFetchingNextPage(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      if (category === 'popular') {
        // 인기글 탭
        const response = await getHotPosts(pageNum, 20)

        if (append) {
          setPosts(prev => [...prev, ...response.content])
        } else {
          setPosts(response.content)
        }
        setHotPost(null)

        // 페이지 정보 업데이트
        setPage(pageNum)
        setHasNextPage(!response.last)
      } else {
        // 일반 카테고리
        const postCategory = categoryMap[category]
        const response = await getPostsByCategory(postCategory, pageNum, 20)

        // 인기글 중 첫 번째만 HotPostCard로 표시 (첫 페이지만)
        if (!append && pageNum === 0) {
          const hotPosts = response.content.filter(p => p.isHot)
          const firstHotPost = hotPosts[0] ?? null
          const otherHotPosts = hotPosts.slice(1)
          const normalPosts = response.content.filter(p => !p.isHot)

          setHotPost(firstHotPost)
          setPosts([...normalPosts, ...otherHotPosts])
        } else {
          // 추가 페이지는 전부 일반 목록에 추가
          if (append) {
            setPosts(prev => [...prev, ...response.content])
          } else {
            setPosts(response.content)
          }
        }

        // 페이지 정보 업데이트
        setPage(pageNum)
        setHasNextPage(!response.last)
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('게시글 목록 조회 실패:', err)
      }
      setError('게시글을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
      setIsFetchingNextPage(false)
    }
  }

  // 초기 로딩 & refreshTrigger 변경 시 (React Strict Mode 대응)
  useEffect(() => {
    const cacheKey = `${category}-${refreshTrigger}`

    // ✅ React Strict Mode 중복 호출 방지
    if (hasCalledApi.current === cacheKey) {
      if (import.meta.env.DEV) {
        console.log('[BoardList] 이미 API 호출됨 - 스킵', { cacheKey })
      }
      return
    }

    hasCalledApi.current = cacheKey

    // 초기화 후 첫 페이지 로드
    setPage(0)
    setHasNextPage(true)
    fetchPosts(0, false)
  }, [category, refreshTrigger])

  // ⭐ 무한 스크롤: 스크롤 감지 시 다음 페이지 로드
  useEffect(() => {
    if (inView && hasNextPage && !isLoading && !isFetchingNextPage) {
      fetchPosts(page + 1, true)
    }
  }, [inView, hasNextPage, isLoading, isFetchingNextPage, page])

  const handlePostClick = (postPublicId: string) => {
    navigate(`/board/${postPublicId}`)
  }

  const getCategoryName = () => {
    switch (category) {
      case 'free':
        return '자유 수다'
      case 'self-intro':
        return '셀소'
      case 'popular':
        return '인기글'
      case 'meetup':
        return '벙개'
      case 'gentlemen':
        return '젠틀맨 라운지'
      case 'ladies':
        return '레이디 라운지'
      default:
        return ''
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 sm:px-5 py-10 text-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 sm:px-5 py-10 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (posts.length === 0 && !hotPost) {
    return (
      <div className="px-4 sm:px-5 space-y-3 sm:space-y-4 pb-safe">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 shadow-card text-center word-break-keep-all">
          <p className="text-gray-800 font-semibold text-sm sm:text-base mb-2 text-wrap-balance leading-relaxed">
            {getCategoryName()}에 첫 번째 글을 작성해보세요
          </p>
          <p className="text-xs sm:text-sm text-gray-600 text-wrap-pretty leading-relaxed">
            다른 회원들과 자유롭게 소통할 수 있습니다
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      {/* 인기글 (있을 경우) */}
      {hotPost && <HotPostCard post={hotPost} onClick={() => handlePostClick(hotPost.publicId)} />}

      {/* 일반 게시글 리스트 */}
      {posts.map(post => (
        <PostCard key={post.publicId} post={post} onClick={() => handlePostClick(post.publicId)} />
      ))}

      {/* ⭐ 무한 스크롤 트리거 (Intersection Observer) */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-coral-pink" />
              <span className="text-sm">로딩 중...</span>
            </div>
          )}
        </div>
      )}

      {/* 모든 게시글 로드 완료 */}
      {!hasNextPage && posts.length > 0 && (
        <div className="py-8 text-center text-gray-400 text-sm">
          모든 게시글을 확인했습니다
        </div>
      )}
    </div>
  )
}
