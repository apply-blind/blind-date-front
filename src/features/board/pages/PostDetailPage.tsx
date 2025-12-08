import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Eye, Heart, MessageCircle, UserRound, ChevronLeft, MoreVertical } from 'lucide-react'
import { getPostDetail, togglePostLike, deletePost } from '../api/board.api'
import type { PostDetail } from '../types/board.types'
import axios from 'axios'
import alertIcon from '@/assets/images/alert.png'
import CommentForm from '../components/CommentForm'
import CommentList from '../components/CommentList'
import { useNotification } from '@/features/notification/context/NotificationContext'
import type { CommentAddedNotification, CommentDeletedNotification } from '@/features/notification/types'

/**
 * 시간을 "HH:MM" 형식으로 변환
 */
export function formatTime(createdAt: string): string {
  const date = new Date(createdAt)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 게시글 상세 페이지
 * 2025 디자인 트렌드: rounded-3xl, shadow-card, coral-pink
 */
export function PostDetailPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMenu, setShowMenu] = useState(false)  // 더보기 메뉴 표시 여부
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)  // 삭제 확인 토스트
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)  // 삭제 성공 토스트
  const [showRefreshError, setShowRefreshError] = useState(false)  // SSE 실시간 갱신 실패 토스트
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0)  // 댓글 목록 새로고침 트리거
  const hasCalledApi = useRef(false)  // React Strict Mode 대응
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)  // Debounce 타이머 (Race Condition 방지)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)  // 하이라이트할 댓글 ID

  // ⭐ 실시간 댓글 알림 수신 (SSE 브로드캐스트)
  const { latestNotification } = useNotification()

  // 답글 상태 관리
  const [replyState, setReplyState] = useState<{
    isReplying: boolean
    parentCommentId: string | null
    targetNickname: string | null
  }>({
    isReplying: false,
    parentCommentId: null,
    targetNickname: null
  })

  // 답글 트리거 (멱등성 보장용)
  const [replyTrigger, setReplyTrigger] = useState(0)

  // 게시글 조회
  useEffect(() => {
    if (!publicId) {
      setError('잘못된 접근입니다.')
      setLoading(false)
      return
    }

    // ⭐ React Strict Mode 중복 호출 방지
    if (hasCalledApi.current) {
      if (import.meta.env.DEV) {
        console.log('[PostDetailPage] 이미 API 호출됨 - 스킵')
      }
      return
    }

    hasCalledApi.current = true

    const fetchPost = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await getPostDetail(publicId)
        setPost(data)
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status
          const message = err.response?.data?.message || err.message

          if (status === 404) {
            setError('존재하지 않는 게시글입니다.')
          } else if (status === 403) {
            setError('삭제된 게시글입니다.')
          } else {
            setError(`게시글을 불러올 수 없습니다: ${message}`)
          }
        } else {
          setError('알 수 없는 오류가 발생했습니다.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPost()

    // ⭐ cleanup 함수: publicId 변경 시 플래그 리셋 (React Strict Mode 대응)
    // React 공식 권장: useEffect는 idempotent해야 하며, cleanup으로 부작용 정리
    return () => {
      hasCalledApi.current = false
    }
  }, [publicId])

  // ⭐ URL 해시로 댓글 스크롤 및 하이라이트 (알림에서 이동 시)
  // Phase 1: CommentList에서 자동 로드 후 스크롤 실행
  useEffect(() => {
    // 게시글 로딩 완료 및 댓글 렌더링 대기 후 처리
    if (!post || loading) return

    const hash = location.hash // 예: #comment-uuid
    if (!hash.startsWith('#comment-')) return

    const commentId = hash.replace('#comment-', '')

    // 댓글 요소를 찾을 때까지 재시도 (최대 5초, 100ms 간격)
    // CommentList의 자동 로드를 기다리기 위해 더 긴 대기 시간
    let attempts = 0
    const maxAttempts = 50 // 5초 / 100ms

    const findAndScroll = () => {
      const element = document.getElementById(`comment-${commentId}`)

      if (element) {
        if (import.meta.env.DEV) {
          console.log('[PostDetailPage] 댓글 발견 (시도:', attempts + 1, ')')
        }

        // ✅ 접근성: 부드러운 스크롤 (prefers-reduced-motion 지원)
        element.scrollIntoView({
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
          block: 'center'
        })

        // ✅ 접근성: 키보드 포커스 이동
        element.setAttribute('tabindex', '0')
        element.focus()

        // 하이라이트 효과
        setHighlightedCommentId(commentId)

        // ✅ 접근성: 스크린 리더 안내
        const announcement = document.createElement('div')
        announcement.setAttribute('role', 'status')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = '선택한 댓글로 이동했습니다'
        document.body.appendChild(announcement)
        setTimeout(() => announcement.remove(), 1000)

        // 6초 후 하이라이트 제거
        setTimeout(() => {
          setHighlightedCommentId(null)
        }, 6000)

        // URL 해시 제거 (뒤로 가기 시 혼란 방지)
        window.history.replaceState(null, '', location.pathname + location.search)

        return true
      } else {
        attempts++
        if (attempts < maxAttempts) {
          setTimeout(findAndScroll, 100) // 100ms 후 재시도
        } else {
          if (import.meta.env.DEV) {
            console.warn('[PostDetailPage] 댓글 찾기 실패 (최대 시도 횟수 초과):', commentId)
          }
        }
        return false
      }
    }

    // 즉시 첫 시도
    findAndScroll()
  }, [post, loading, location.hash, location.pathname, location.search])

  // ⭐ 실시간 댓글 알림 수신 (COMMENT_ADDED, COMMENT_DELETED 브로드캐스트)
  useEffect(() => {
    if (!latestNotification || !publicId) return

    // 1. 댓글 추가 알림
    if (latestNotification.type === 'COMMENT_ADDED') {
      const notification = latestNotification as CommentAddedNotification

      // 현재 보고 있는 게시글의 댓글이면 목록 갱신
      if (notification.postPublicId === publicId) {
        if (import.meta.env.DEV) {
          console.log('[PostDetailPage] COMMENT_ADDED 알림 수신 - 댓글 목록 갱신:', {
            postPublicId: notification.postPublicId,
            commentPublicId: notification.commentPublicId,
            nickname: notification.anonymousNickname
          })
        }

        // ⭐ Debounce 처리 (300ms 동안 여러 알림 수신 시 마지막 것만 처리)
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }

        debounceTimer.current = setTimeout(() => {
          // 댓글 목록 새로고침
          setCommentRefreshTrigger((prev) => prev + 1)

          // 게시글 정보도 갱신 (commentCount 업데이트)
          getPostDetail(publicId).then((data) => {
            setPost(data)
          }).catch((err) => {
            if (import.meta.env.DEV) {
              console.error('[PostDetailPage] 게시글 정보 갱신 실패:', err)
            }

            // ⭐ 사용자에게 에러 피드백 (Toast 표시)
            setShowRefreshError(true)
            // 3초 후 자동 숨김
            setTimeout(() => {
              setShowRefreshError(false)
            }, 3000)
          })
        }, 300)
      }
    }

    // 2. 댓글 삭제 알림
    if (latestNotification.type === 'COMMENT_DELETED') {
      const notification = latestNotification as CommentDeletedNotification

      // 현재 보고 있는 게시글의 댓글이면 목록 갱신
      if (notification.postPublicId === publicId) {
        if (import.meta.env.DEV) {
          console.log('[PostDetailPage] COMMENT_DELETED 알림 수신 - 댓글 목록 갱신:', {
            postPublicId: notification.postPublicId,
            commentPublicId: notification.commentPublicId
          })
        }

        // ⭐ Debounce 처리 (300ms 동안 여러 알림 수신 시 마지막 것만 처리)
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current)
        }

        debounceTimer.current = setTimeout(() => {
          // 댓글 목록 새로고침 (삭제된 댓글 마스킹 표시)
          setCommentRefreshTrigger((prev) => prev + 1)

          // 게시글 정보도 갱신 (commentCount 감소)
          getPostDetail(publicId).then((data) => {
            setPost(data)
          }).catch((err) => {
            if (import.meta.env.DEV) {
              console.error('[PostDetailPage] 게시글 정보 갱신 실패:', err)
            }

            // ⭐ 사용자에게 에러 피드백 (Toast 표시)
            setShowRefreshError(true)
            // 3초 후 자동 숨김
            setTimeout(() => {
              setShowRefreshError(false)
            }, 3000)
          })
        }, 300)
      }
    }

    // Cleanup: 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [latestNotification, publicId])

  // 공감 토글
  const handleLikeToggle = async () => {
    if (!publicId || !post || isLiking) return

    try {
      setIsLiking(true)
      const result = await togglePostLike(publicId)

      // 낙관적 업데이트
      setPost({
        ...post,
        isLikedByCurrentUser: result.isLiked,
        likeCount: result.likeCount
      })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.message
        alert(`공감 처리 실패: ${message}`)
      }
    } finally {
      setIsLiking(false)
    }
  }

  // 더보기 버튼 클릭 핸들러
  const handleMoreClick = () => {
    if (!post) return

    // 내가 쓴 글이면 삭제 확인 토스트 표시
    if (post.isAuthor) {
      setShowDeleteConfirm(true)
    } else {
      // 남의 글이면 메뉴 표시
      setShowMenu(true)
    }
  }

  // 게시글 삭제
  const handleDelete = async () => {
    if (!publicId || isDeleting) return

    try {
      setIsDeleting(true)
      setShowDeleteConfirm(false)  // 확인 토스트 닫기
      await deletePost(publicId)
      setIsDeleting(false)
      setShowDeleteSuccess(true)  // 성공 토스트 표시
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message || err.message
        alert(`삭제 실패: ${message}`)
      }
      setIsDeleting(false)
    }
  }

  // 삭제 성공 확인 후 뒤로 이동
  const handleDeleteSuccessConfirm = () => {
    setShowDeleteSuccess(false)
    navigate(-1)  // ✅ replace 옵션 제거: 히스토리 스택 유지
  }

  // 메뉴 닫기
  const handleCloseMenu = () => {
    setShowMenu(false)
  }

  // 프로필 교환 신청
  const handleProfileExchange = () => {
    alert('프로필 교환 신청 기능은 준비 중입니다.')
    setShowMenu(false)
  }

  // 신고하기
  const handleReport = () => {
    alert('신고 기능은 준비 중입니다.')
    setShowMenu(false)
  }

  // 게시글 차단
  const handleBlockPost = () => {
    if (confirm('이 게시글을 차단하시겠습니까?\n차단된 게시글은 더 이상 표시되지 않습니다.')) {
      alert('게시글 차단 기능은 준비 중입니다.')
      setShowMenu(false)
    }
  }

  // 작성자 차단
  const handleBlockAuthor = () => {
    if (confirm('이 작성자를 차단하시겠습니까?\n차단된 작성자의 모든 게시글이 숨겨집니다.')) {
      alert('작성자 차단 기능은 준비 중입니다.')
      setShowMenu(false)
    }
  }

  // 뒤로 가기
  const handleBack = () => {
    navigate(-1)
  }

  // 답글 시작
  const handleStartReply = (parentCommentId: string, targetNickname: string) => {
    setReplyState({
      isReplying: true,
      parentCommentId,
      targetNickname
    })
    setReplyTrigger((prev) => prev + 1)  // 멱등성 보장 (매번 리마운트)
  }

  // 답글 취소
  const handleCancelReply = () => {
    setReplyState({
      isReplying: false,
      parentCommentId: null,
      targetNickname: null
    })
  }

  // 댓글 작성 성공 시 콜백
  const handleCommentSuccess = () => {
    // 댓글 목록 새로고침
    setCommentRefreshTrigger((prev) => prev + 1)

    // 답글 상태 초기화
    handleCancelReply()

    // 게시글 상세 정보도 다시 조회 (commentCount 업데이트)
    if (publicId) {
      getPostDetail(publicId).then((data) => {
        setPost(data)
      }).catch((err) => {
        if (import.meta.env.DEV) {
          console.error('게시글 정보 갱신 실패:', err)
        }
      })
    }
  }

  // 카테고리 한글명
  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      FREE_TALK: '자유 수다',
      SELF_INTRO: '셀소',
      MEETUP: '벙개',
      GENTLEMAN: '젠틀맨 라운지'
    }
    return names[category] || category
  }

  // 삭제된 게시글 여부 확인
  const isDeletedPost = (post: PostDetail | null): boolean => {
    if (!post) return false
    return post.status === 'DELETED'
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6">
            <svg className="w-full h-full text-coral-pink animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
            </svg>
          </div>
          <p className="text-gray-500">게시글을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !post) {
    return (
      <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-500 mb-6">{error || '게시글을 찾을 수 없습니다.'}</p>
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-3 bg-coral-pink hover:bg-coral-pink/90 text-white font-semibold rounded-full transition-all duration-200 active:scale-95 shadow-button"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen-dynamic bg-gradient-to-b from-white via-pink-50/30 to-white pb-24">
      {/* 상단 네비게이션 */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md pt-safe z-40 border-b border-gray-100">
        <div className="flex items-center justify-between h-20 px-4 sm:px-5 max-w-screen-xl mx-auto">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-1 hover:bg-coral-pink/5 rounded-xl px-2 py-1.5 transition-all duration-300 active:bg-coral-pink/20 active:scale-95 focus:outline-none"
            aria-label="뒤로 가기"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" strokeWidth={2} />
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">상세보기</h1>
          </button>

          {/* 더보기 메뉴 버튼 (삭제된 게시글이 아닐 때만 표시) */}
          {!isDeletedPost(post) && (
            <button
              type="button"
              onClick={handleMoreClick}
              disabled={isDeleting}
              className="p-2 text-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-100 active:scale-95"
              aria-label="더보기"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* 메인 컨텐츠: 하나의 통합 카드 */}
      <div className="pt-20 px-4 sm:px-5 pb-24 max-w-screen-xl mx-auto">
        <div className="mt-4 mb-20 bg-white rounded-3xl shadow-card overflow-hidden">
          {/* 게시글 섹션 */}
          <div className="p-5 sm:p-6">
            {/* 사용자 정보 영역 (삭제 여부와 관계없이 항상 표시) */}
            <div className="flex items-start gap-3 mb-4">
              {/* 성별 아이콘 */}
              <div className={`flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                post.authorGender === 'MALE'
                  ? 'bg-gradient-to-br from-green-50 to-green-100'
                  : 'bg-gradient-to-br from-pink-50 to-pink-100'
              }`}>
                <UserRound className={`w-7 h-7 sm:w-8 sm:h-8 ${
                  post.authorGender === 'MALE' ? 'text-green-600' : 'text-pink-600'
                }`} strokeWidth={2.5} />
              </div>

              {/* 닉네임 & 메타 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-semibold text-gray-900">
                    {post.anonymousNickname}
                  </span>
                  {post.isHot && (
                    <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      🔥
                    </span>
                  )}
                </div>

                {/* 시간, 조회수, 공감수, 댓글수 */}
                <div className="flex items-center gap-2 sm:gap-3 text-sm text-gray-600">
                  <span className="tabular-nums">{formatTime(post.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="tabular-nums">{post.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="tabular-nums">{post.likeCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="tabular-nums">{post.commentCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 카테고리 (삭제 여부와 관계없이 항상 표시) */}
            <div className="mb-4">
              <span className="inline-flex items-center px-3 py-1 bg-coral-pink/10 text-coral-pink text-sm font-medium rounded-full">
                {getCategoryName(post.category)}
              </span>
            </div>

            {/* 제목 (삭제된 게시글이면 회색으로 표시) */}
            <h2 className={`text-xl sm:text-2xl font-bold mb-4 word-break-keep-all ${
              isDeletedPost(post) ? 'text-gray-400 italic' : 'text-gray-900'
            }`}>
              {post.title}
            </h2>

            {/* 본문 (삭제된 게시글이 아닐 때만 표시) */}
            {!isDeletedPost(post) && (
              <>
                <div className="prose prose-gray max-w-none mb-4">
                  <p className="text-base leading-relaxed text-gray-800 whitespace-pre-wrap word-break-keep-all">
                    {post.content}
                  </p>
                </div>

                {/* 이미지 */}
                {post.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={post.imageUrl}
                      alt="게시글 이미지"
                      className="w-full rounded-2xl shadow-sm"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* 공감 버튼 영역 (삭제된 게시글이 아닐 때만 표시) */}
          {!isDeletedPost(post) && (
            <div className="px-5 sm:px-6 py-4 flex justify-center">
              <button
                type="button"
                onClick={handleLikeToggle}
                disabled={isLiking}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold rounded-full transition-all duration-200 active:scale-95 shadow-sm ${
                  post.isLikedByCurrentUser
                    ? 'bg-coral-pink text-white hover:bg-coral-pink/90'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform ${isLiking ? 'animate-pulse' : ''}`}
                  fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'}
                  strokeWidth={2}
                />
                <span className="text-sm">공감 {post.likeCount.toLocaleString()}</span>
              </button>
            </div>
          )}

          {/* 댓글 섹션 (삭제 여부와 관계없이 항상 표시) */}
          <div className="border-t-8 border-gray-100">
            <div className="p-5 sm:p-6 space-y-6">
              {/* 댓글 목록 */}
              {publicId && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-coral-pink" />
                    댓글
                  </h3>
                  <CommentList
                    postPublicId={publicId}
                    postAuthorNickname={post.anonymousNickname}
                    refreshTrigger={commentRefreshTrigger}
                    onStartReply={handleStartReply}
                    highlightedCommentId={highlightedCommentId}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 댓글 작성 폼 (하단 고정, 삭제된 게시글이 아닐 때만 표시) */}
      {!isDeletedPost(post) && publicId && (
        <CommentForm
          postPublicId={publicId}
          onSuccess={handleCommentSuccess}
          replyState={replyState}
          onCancelReply={handleCancelReply}
          replyTrigger={replyTrigger}
        />
      )}

      {/* 삭제 확인 토스트 (작성자 본인일 때) */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-safe shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 메시지 */}
            <div className="p-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="inline-block animate-bell-ring-safe">
                  <img
                    src={alertIcon}
                    alt="알림"
                    className="w-5 h-5"
                  />
                </div>
                <p className="text-lg font-bold text-gray-900">알림</p>
              </div>
              <p className="text-base font-semibold text-gray-900">게시글을 삭제하시겠습니까?</p>
            </div>

            {/* 버튼 그룹 */}
            <div className="px-4 pb-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-full transition-all duration-200 hover:bg-gray-200 active:scale-95"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-coral-pink text-white font-semibold rounded-full transition-all duration-200 hover:bg-coral-pink/90 active:scale-95 shadow-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 성공 토스트 */}
      {showDeleteSuccess && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in"
          onClick={handleDeleteSuccessConfirm}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-safe shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 메시지 */}
            <div className="p-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <div className="inline-block animate-bell-ring-safe">
                  <img
                    src={alertIcon}
                    alt="알림"
                    className="w-5 h-5"
                  />
                </div>
                <p className="text-lg font-bold text-gray-900">알림</p>
              </div>
              <p className="text-base font-semibold text-gray-900">게시글을 삭제하였습니다.</p>
            </div>

            {/* 확인 버튼 */}
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={handleDeleteSuccessConfirm}
                className="w-full px-6 py-3 bg-coral-pink text-white font-semibold rounded-full transition-all duration-200 hover:bg-coral-pink/90 active:scale-95 shadow-button"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ SSE 실시간 갱신 실패 에러 토스트 */}
      {showRefreshError && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slide-down"
          onClick={() => setShowRefreshError(false)}
        >
          <div className="bg-red-50 border-2 border-red-500 rounded-2xl px-6 py-4 shadow-2xl max-w-md">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">댓글 정보 갱신 실패</p>
                <p className="text-xs text-red-700 mt-1">네트워크 연결을 확인해주세요</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 더보기 메뉴 모달 (남의 글일 때만 표시) */}
      {showMenu && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={handleCloseMenu}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 메뉴 헤더 */}
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">메뉴</h3>
            </div>

            {/* 메뉴 리스트 */}
            <div className="p-2">
              <button
                type="button"
                onClick={handleProfileExchange}
                className="w-full px-5 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <span className="font-medium">프로필 교환 신청</span>
              </button>

              <button
                type="button"
                onClick={handleReport}
                className="w-full px-5 py-4 text-left text-gray-900 hover:bg-gray-50 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <span className="font-medium">신고하기</span>
              </button>

              <button
                type="button"
                onClick={handleBlockPost}
                className="w-full px-5 py-4 text-left text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <span className="font-medium">게시글 차단</span>
              </button>

              <button
                type="button"
                onClick={handleBlockAuthor}
                className="w-full px-5 py-4 text-left text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 active:scale-95"
              >
                <span className="font-medium">작성자 차단</span>
              </button>
            </div>

            {/* 취소 버튼 */}
            <div className="p-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseMenu}
                className="w-full px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-full transition-all duration-200 hover:bg-gray-200 active:scale-95"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
