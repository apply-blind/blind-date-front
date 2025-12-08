/**
 * 대댓글 목록 컴포넌트
 * - 대댓글들을 들여쓰기로 표시
 * - 삭제/좋아요 기능 포함
 */

import { useState } from 'react'
import axios from 'axios'
import { UserRound, MoreVertical, Heart } from 'lucide-react'
import { deleteComment, toggleCommentLike } from '../api/comment.api'
import type { Reply } from '../types/comment.types'
import { formatTime } from '../pages/PostDetailPage'

interface ReplyListProps {
  replies: Reply[]
  parentCommentId: string  // 최상위 댓글 ID (대댓글에 답글 달 때도 depth 1 유지)
  parentGender: 'MALE' | 'FEMALE'  // 부모 댓글 성별 (향후 사용 가능)
  onDeleteSuccess: () => void
  onLikeToggle: (replyPublicId: string, newIsLiked: boolean, newLikeCount: number) => void
  onStartReply: (parentCommentId: string, targetNickname: string) => void
  highlightedCommentId?: string | null // 하이라이트할 댓글 ID (알림에서 이동 시)
}

export default function ReplyList({ replies, parentCommentId, onDeleteSuccess, onLikeToggle, onStartReply, highlightedCommentId }: ReplyListProps) {
  return (
    <div className="pt-3 border-t border-gray-100 space-y-3 pl-6 relative">
      {replies.map((reply) => (
        <ReplyItem
          key={reply.publicId}
          reply={reply}
          parentCommentId={parentCommentId}
          onDeleteSuccess={onDeleteSuccess}
          onLikeToggle={onLikeToggle}
          onStartReply={onStartReply}
          isHighlighted={highlightedCommentId === reply.publicId}
        />
      ))}
    </div>
  )
}

interface ReplyItemProps {
  reply: Reply
  parentCommentId: string  // 최상위 댓글 ID (대댓글에 답글 달 때도 depth 1 유지)
  onDeleteSuccess: () => void
  onLikeToggle: (replyPublicId: string, newIsLiked: boolean, newLikeCount: number) => void
  onStartReply: (parentCommentId: string, targetNickname: string) => void
  isHighlighted?: boolean // 하이라이트 여부 (알림에서 이동 시)
}

function ReplyItem({ reply, parentCommentId, onDeleteSuccess, onLikeToggle, onStartReply, isHighlighted = false }: ReplyItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [showMenuToast, setShowMenuToast] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  // 더보기 메뉴 클릭
  const handleMoreClick = () => {
    setShowMenuToast(true)
  }

  // 삭제하기 클릭
  const handleDeleteClick = () => {
    setShowMenuToast(false)
    setShowDeleteConfirm(true)
  }

  // 신고/차단 기능 (개발 예정)
  const handleComingSoonFeature = () => {
    setShowMenuToast(false)
    setShowComingSoon(true)
  }

  // 대댓글 달기 버튼 클릭 (최상위 댓글 ID 사용 → depth 1 유지)
  const handleReplyClick = () => {
    onStartReply(parentCommentId, reply.anonymousNickname)
  }

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteComment(reply.publicId)
      setShowDeleteSuccess(true)
      // 2초 후 성공 토스트 닫고 목록 새로고침
      setTimeout(() => {
        setShowDeleteSuccess(false)
        onDeleteSuccess()
      }, 2000)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || '답글 삭제에 실패했습니다'
        setDeleteError(errorMessage)
      } else {
        setDeleteError('답글 삭제에 실패했습니다')
        if (import.meta.env.DEV) {
          console.error('Error:', err)
        }
      }
    } finally {
      setIsDeleting(false)
    }
  }

  // 좋아요 토글 핸들러
  const handleLike = async () => {
    if (isLiking) return

    setIsLiking(true)

    try {
      const response = await toggleCommentLike(reply.publicId)
      onLikeToggle(reply.publicId, response.isLiked, response.likeCount)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('좋아요 토글 실패:', err)
      }
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div
      id={`comment-${reply.publicId}`}
      className={`rounded-xl px-2 py-3 space-y-2 relative ${
        isHighlighted ? 'animate-highlight-fade' : 'bg-gray-50'
      }`}
    >
      {/* 스레드 연결선 (곡선 "ㄴ" 모양) - 성별 아이콘 중심 기준 */}
      <div
        className="absolute -left-6 top-[10px] w-6 h-6 border-l-2 border-b-2 border-gray-400 rounded-bl-xl"
        aria-hidden="true"
      />

      {/* 작성자 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 성별 아이콘 */}
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              reply.authorGender === 'MALE'
                ? 'bg-gradient-to-br from-green-50 to-green-100'
                : 'bg-gradient-to-br from-pink-50 to-pink-100'
            }`}
          >
            <UserRound
              className={`w-4 h-4 ${
                reply.authorGender === 'MALE' ? 'text-green-600' : 'text-pink-600'
              }`}
              strokeWidth={2.5}
            />
          </div>

          {/* 닉네임 + 배지 + 시간 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-gray-800">{reply.anonymousNickname}</span>

            {/* 내가 쓴 댓글 배지 */}
            {reply.isAuthor && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                내가 쓴 댓글
              </span>
            )}

            {/* 작성 시간 */}
            <span className="text-xs text-gray-400">{formatTime(reply.createdAt)}</span>
          </div>
        </div>

        {/* 더보기 버튼 (모든 답글에 표시) */}
        <button
          onClick={handleMoreClick}
          disabled={isDeleting}
          className="p-1.5 text-gray-700 rounded-lg transition-all duration-200 hover:bg-gray-100 active:scale-95 disabled:opacity-50"
          aria-label="더보기"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* 답글 내용 (삭제 시 회색 이탤릭) */}
      <p className={`text-sm whitespace-pre-wrap break-words ml-[3px] ${reply.status === 'DELETED' ? 'text-gray-400 italic' : 'text-gray-700'}`}>
        {(() => {
          // 멘션 분리 - Discord 스타일 Delimiter (<@닉네임>)로 구분
          const mentionMatch = reply.content.match(/^<@([^>]+)>\s*(.+)$/s)

          // ✅ Fallback: ZWSP 또는 기존 데이터 호환성
          const mentionMatchLegacy = !mentionMatch
            ? reply.content.match(/^(@.+?)\u200B\s*(.+)$/s) || reply.content.match(/^(@\S+)\s+(.+)$/s)
            : null

          const mention = mentionMatch?.[1] ? `@${mentionMatch[1]}` : mentionMatchLegacy?.[1]
          const actualContent = mentionMatch?.[2] || mentionMatchLegacy?.[2] || reply.content

          return mention ? (
            // 멘션이 있을 때
            <>
              <span className="inline bg-blue-50/50 text-blue-700 font-semibold px-1.5 rounded-md mr-1">
                {mention}
              </span>
              {actualContent}
            </>
          ) : (
            // 멘션이 없을 때
            reply.content
          )
        })()}
      </p>

      {/* 삭제 에러 메시지 */}
      {deleteError && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {deleteError}
        </div>
      )}

      {/* 액션 버튼들 - 반응형 레이아웃 (모든 버튼 항상 표시) */}
      <div className="flex items-center gap-1.5 sm:gap-2 pt-2 text-xs ml-[10px]">
        {/* 대댓글 달기 - 항상 표시 */}
        <button
          onClick={handleReplyClick}
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
          aria-label="대댓글 달기"
        >
          <span className="hidden sm:inline">대댓글 달기</span>
          <span className="sm:hidden">대댓글</span>
        </button>

        {/* 자신의 답글이 아닐 때만 프교 신청, 신고하기 표시 (모든 화면 크기) */}
        {!reply.isAuthor && (
          <>
            <span className="text-gray-300">|</span>

            {/* 프교 신청 - 항상 표시 (모바일에서 축약) */}
            <button
              onClick={handleComingSoonFeature}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
              aria-label="프교 신청"
            >
              <span className="hidden sm:inline">프교 신청</span>
              <span className="sm:hidden">프교 신청</span>
            </button>

            <span className="text-gray-300">|</span>

            {/* 신고하기 - 항상 표시 (모바일에서 축약) */}
            <button
              onClick={handleComingSoonFeature}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
              aria-label="신고하기"
            >
              <span className="hidden sm:inline">신고하기</span>
              <span className="sm:hidden">신고</span>
            </button>
          </>
        )}

        <span className="text-gray-300">|</span>

        {/* 좋아요 버튼 - 항상 표시 */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1 font-medium transition-colors whitespace-nowrap ${
            reply.isLikedByCurrentUser
              ? 'text-red-500'
              : 'text-gray-600 hover:text-red-500'
          }`}
          aria-label={`좋아요 ${reply.likeCount}개`}
        >
          <Heart
            className="w-3.5 h-3.5"
            fill={reply.isLikedByCurrentUser ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
          <span>{reply.likeCount}</span>
        </button>
      </div>

      {/* 메뉴 토스트 */}
      {showMenuToast && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => setShowMenuToast(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-safe shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <p className="text-lg font-bold text-gray-900 mb-4">메뉴</p>
              {reply.isAuthor ? (
                // 내가 작성한 답글
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-full transition-all duration-200 hover:bg-red-100 active:scale-95"
                >
                  삭제하기
                </button>
              ) : (
                // 다른 사람의 답글
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleComingSoonFeature}
                    className="w-full px-6 py-3 bg-gray-50 text-gray-900 font-semibold rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95 border-b border-gray-200"
                  >
                    신고하기
                  </button>
                  <button
                    type="button"
                    onClick={handleComingSoonFeature}
                    className="w-full px-6 py-3 bg-gray-50 text-gray-900 font-semibold rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95 border-b border-gray-200"
                  >
                    답글 차단
                  </button>
                  <button
                    type="button"
                    onClick={handleComingSoonFeature}
                    className="w-full px-6 py-3 bg-gray-50 text-gray-900 font-semibold rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95"
                  >
                    답글 작성자 차단
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 토스트 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-safe shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-left">
              <p className="text-lg font-bold text-gray-900 mb-2">알림</p>
              <p className="text-base font-semibold text-gray-900">답글을 삭제하시겠습니까?</p>
            </div>
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
                onClick={handleDeleteConfirm}
                className="flex-1 px-6 py-3 bg-coral-pink text-white font-semibold rounded-full transition-all duration-200 hover:bg-coral-pink/90 active:scale-95 shadow-button"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 성공 토스트 */}
      {showDeleteSuccess && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => setShowDeleteSuccess(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-safe shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-left">
              <p className="text-lg font-bold text-gray-900 mb-2">알림</p>
              <p className="text-base font-semibold text-gray-900">답글을 삭제하였습니다.</p>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setShowDeleteSuccess(false)}
                className="w-full px-6 py-3 bg-coral-pink text-white font-semibold rounded-full transition-all duration-200 hover:bg-coral-pink/90 active:scale-95 shadow-button"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개발 예정 토스트 */}
      {showComingSoon && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center animate-fade-in"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md pb-safe shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-left">
              <p className="text-lg font-bold text-gray-900 mb-2">알림</p>
              <p className="text-base font-semibold text-gray-900">개발 예정입니다.</p>
            </div>
            <div className="px-4 pb-4">
              <button
                type="button"
                onClick={() => setShowComingSoon(false)}
                className="w-full px-6 py-3 bg-coral-pink text-white font-semibold rounded-full transition-all duration-200 hover:bg-coral-pink/90 active:scale-95 shadow-button"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
