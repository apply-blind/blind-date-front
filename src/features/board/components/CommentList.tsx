/**
 * 댓글 목록 컨테이너 컴포넌트
 * - 페이징 처리
 * - 무한 스크롤 대신 "더보기" 버튼 방식
 * - 로딩/에러 상태 관리
 */

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { getComments } from '../api/comment.api'
import type { Comment } from '../types/comment.types'
import CommentItem from './CommentItem'

interface CommentListProps {
  postPublicId: string
  postAuthorNickname?: string // 게시글 작성자 닉네임 (글쓴이 뱃지 표시용)
  refreshTrigger?: number // 댓글 작성 시 새로고침용
  onStartReply: (parentCommentId: string, targetNickname: string) => void // 답글 시작 핸들러
  highlightedCommentId?: string | null // 하이라이트할 댓글 ID (알림에서 이동 시)
}

const PAGE_SIZE = 20

export default function CommentList({ postPublicId, postAuthorNickname, refreshTrigger = 0, onStartReply, highlightedCommentId }: CommentListProps) {
  const location = useLocation()
  const [comments, setComments] = useState<Comment[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasAutoLoaded = useRef(false)  // ⭐ 자동 로드 중복 방지
  const scrollPositionRef = useRef(0)  // ⭐ 스크롤 위치 저장 (SSE 댓글 삭제 알림 시 복원용)

  // 댓글 목록 조회
  const fetchComments = async (pageNum: number, append: boolean = false) => {
    try {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      const response = await getComments(postPublicId, pageNum, PAGE_SIZE)

      if (append) {
        setComments((prev) => [...prev, ...response.content])
      } else {
        setComments(response.content)
      }

      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
      setPage(pageNum)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || '댓글 목록을 불러오는데 실패했습니다'
        setError(errorMessage)
      } else {
        setError('댓글 목록을 불러오는데 실패했습니다')
        if (import.meta.env.DEV) {
          console.error('Error:', err)
        }
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // 초기 로딩 & refreshTrigger 변경 시 새로고침
  useEffect(() => {
    // ⭐ 댓글 목록 갱신 전 현재 스크롤 위치 저장
    scrollPositionRef.current = window.scrollY

    fetchComments(0, false)
    hasAutoLoaded.current = false  // 새로고침 시 자동 로드 플래그 리셋
  }, [postPublicId, refreshTrigger])

  // ⭐ 댓글 목록 갱신 후 스크롤 위치 복원 (SSE 실시간 알림 대응)
  // React 18+ 공식 권장: useEffect cleanup 패턴
  useEffect(() => {
    // 초기 로딩 중이거나 댓글이 없으면 스킵
    if (isLoading || comments.length === 0) return

    // ⭐ 스크롤 위치 복원 (requestAnimationFrame으로 DOM 렌더링 완료 대기)
    // 이유: SSE COMMENT_DELETED 알림 수신 → refreshTrigger 증가 → 댓글 목록 refetch → 스크롤 위치 유지
    const restoreScroll = () => {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPositionRef.current)
      })
    }

    restoreScroll()
  }, [comments, isLoading])

  // ⭐ URL 해시로 특정 댓글 찾기 (딥링크 지원)
  // Phase 1: 자동 페이지 로드 방식 (최대 10회 = 200개까지)
  useEffect(() => {
    // 이미 자동 로드했거나 로딩 중이면 스킵
    if (hasAutoLoaded.current || isLoading || isLoadingMore) return

    const hash = location.hash.replace('#comment-', '')
    if (!hash) return

    const loadUntilFound = async () => {
      hasAutoLoaded.current = true
      let attempts = 0
      const maxAttempts = 10  // 최대 10페이지 (200개 댓글)

      while (attempts < maxAttempts) {
        // DOM에서 타겟 댓글 찾기
        const target = document.getElementById(`comment-${hash}`)
        if (target) {
          // 찾았으면 종료
          if (import.meta.env.DEV) {
            console.log(`[CommentList] 댓글 찾음 (${attempts + 1}회 시도)`)
          }
          break
        }

        // 더 로드할 페이지가 있는지 확인
        if (page + 1 < totalPages) {
          if (import.meta.env.DEV) {
            console.log(`[CommentList] 댓글 로딩 중... (${attempts + 1}/${maxAttempts})`)
          }
          await fetchComments(page + 1, true)
          attempts++
          // 다음 로드 대기 (DOM 렌더링 시간)
          await new Promise(resolve => setTimeout(resolve, 100))
        } else {
          // 더 이상 로드할 페이지 없음
          if (import.meta.env.DEV) {
            console.warn('[CommentList] 댓글을 찾을 수 없습니다 (모든 페이지 로드 완료)')
          }
          alert('댓글을 찾을 수 없습니다. 삭제되었거나 권한이 없습니다.')
          break
        }
      }

      if (attempts >= maxAttempts) {
        if (import.meta.env.DEV) {
          console.warn(`[CommentList] 댓글 찾기 실패 (최대 ${maxAttempts}회 시도)`)
        }
        alert('댓글이 너무 많아 찾을 수 없습니다. 직접 스크롤해주세요.')
      }
    }

    // 초기 로딩 완료 후 실행
    if (!isLoading && comments.length > 0) {
      loadUntilFound()
    }
  }, [location.hash, isLoading, comments.length, page, totalPages])

  // 댓글 삭제 성공 시 콜백
  const handleDeleteSuccess = () => {
    // 현재 페이지까지의 데이터 다시 로드
    fetchComments(0, false)
  }

  // 좋아요 토글 성공 시 콜백
  const handleLikeToggle = (commentPublicId: string, newIsLiked: boolean, newLikeCount: number) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.publicId === commentPublicId
          ? { ...comment, isLikedByCurrentUser: newIsLiked, likeCount: newLikeCount }
          : comment
      )
    )
  }

  // 대댓글 좋아요 토글 성공 시 콜백
  const handleReplyLikeToggle = (
    commentPublicId: string,
    replyPublicId: string,
    newIsLiked: boolean,
    newLikeCount: number
  ) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.publicId === commentPublicId
          ? {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.publicId === replyPublicId
                  ? { ...reply, isLikedByCurrentUser: newIsLiked, likeCount: newLikeCount }
                  : reply
              ),
            }
          : comment
      )
    )
  }

  // 더보기 버튼 핸들러
  const handleLoadMore = () => {
    fetchComments(page + 1, true)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-pink" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-center">
        {error}
      </div>
    )
  }

  if (comments.length === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        아직 댓글이 없습니다. 첫 댓글을 작성해보세요!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 댓글 개수 */}
      <div className="text-sm font-medium text-gray-600">
        댓글 {totalElements.toLocaleString()}개
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment.publicId}
            comment={comment}
            postAuthorNickname={postAuthorNickname}
            onDeleteSuccess={handleDeleteSuccess}
            onLikeToggle={handleLikeToggle}
            onReplyLikeToggle={handleReplyLikeToggle}
            onStartReply={onStartReply}
            isHighlighted={highlightedCommentId === comment.publicId}
            highlightedCommentId={highlightedCommentId}
          />
        ))}
      </div>

      {/* 더보기 버튼 */}
      {page + 1 < totalPages && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className={`px-8 py-3 rounded-full font-medium transition-all ${
              isLoadingMore
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95'
            }`}
          >
            {isLoadingMore ? '로딩 중...' : '댓글 더보기'}
          </button>
        </div>
      )}
    </div>
  )
}
