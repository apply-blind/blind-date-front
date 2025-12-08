/**
 * 단일 댓글 컴포넌트
 * - 작성자 삭제 버튼
 * - 좋아요 토글
 * - 대댓글 목록 표시
 * - 대댓글 작성 폼 토글
 */

import { useState } from 'react'
import axios from 'axios'
import { UserRound, MoreVertical, Heart } from 'lucide-react'
import { deleteComment, toggleCommentLike } from '../api/comment.api'
import type { Comment } from '../types/comment.types'
import ReplyList from './ReplyList'
import { formatTime } from '../pages/PostDetailPage'

interface CommentItemProps {
  comment: Comment
  postAuthorNickname?: string  // 게시글 작성자 닉네임 (글쓴이 뱃지 표시용)
  onDeleteSuccess: () => void
  onLikeToggle: (commentPublicId: string, newIsLiked: boolean, newLikeCount: number) => void
  onReplyLikeToggle: (
    commentPublicId: string,
    replyPublicId: string,
    newIsLiked: boolean,
    newLikeCount: number
  ) => void
  onStartReply: (parentCommentId: string, targetNickname: string) => void // 답글 시작 핸들러
  isHighlighted?: boolean // 하이라이트 여부 (알림에서 이동 시)
  highlightedCommentId?: string | null // 하이라이트할 댓글 ID (대댓글 하이라이트용)
}

export default function CommentItem({
  comment,
  postAuthorNickname,
  onDeleteSuccess,
  onLikeToggle,
  onReplyLikeToggle,
  onStartReply,
  isHighlighted = false,
  highlightedCommentId = null,
}: CommentItemProps) {
  // 게시글 작성자 여부
  const isPostAuthor = postAuthorNickname && comment.anonymousNickname === postAuthorNickname

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

  // 삭제 확인
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteComment(comment.publicId)
      setShowDeleteSuccess(true)
      // 2초 후 성공 토스트 닫고 목록 새로고침
      setTimeout(() => {
        setShowDeleteSuccess(false)
        onDeleteSuccess()
      }, 2000)
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || '댓글 삭제에 실패했습니다'
        setDeleteError(errorMessage)
      } else {
        setDeleteError('댓글 삭제에 실패했습니다')
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
      const response = await toggleCommentLike(comment.publicId)
      onLikeToggle(comment.publicId, response.isLiked, response.likeCount)
    } catch (err) {
      // 좋아요 실패 시 무시 (사용자 경험 해치지 않기 위해)
      if (import.meta.env.DEV) {
        console.error('좋아요 토글 실패:', err)
      }
    } finally {
      setIsLiking(false)
    }
  }

  // 대댓글 달기 버튼 클릭
  const handleReplyClick = () => {
    onStartReply(comment.publicId, comment.anonymousNickname)
  }

  return (
    <div
      id={`comment-${comment.publicId}`}
      className={`border border-gray-200 rounded-2xl p-4 space-y-3 ${
        isHighlighted ? 'animate-highlight-fade' : 'bg-white'
      }`}
    >
      {/* 작성자 정보 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 성별 아이콘 */}
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
              comment.authorGender === 'MALE'
                ? 'bg-gradient-to-br from-green-50 to-green-100'
                : 'bg-gradient-to-br from-pink-50 to-pink-100'
            }`}
          >
            <UserRound
              className={`w-6 h-6 ${
                comment.authorGender === 'MALE' ? 'text-green-600' : 'text-pink-600'
              }`}
              strokeWidth={2.5}
            />
          </div>

          {/* 닉네임 + 뱃지 + 시간 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-gray-800">{comment.anonymousNickname}</span>
            {isPostAuthor && (
              <span className="px-2 py-0.5 bg-coral-pink/10 text-coral-pink text-xs font-medium rounded-full">
                글쓴이
              </span>
            )}
            {comment.isAuthor && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-full">
                내가 쓴 댓글
              </span>
            )}
            <span className="text-xs text-gray-400">{formatTime(comment.createdAt)}</span>
          </div>
        </div>

        {/* 더보기 버튼 (모든 댓글에 표시) */}
        <button
          onClick={handleMoreClick}
          disabled={isDeleting}
          className="p-2 text-gray-700 rounded-xl transition-all duration-200 hover:bg-gray-100 active:scale-95 disabled:opacity-50"
          aria-label="더보기"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* 댓글 내용 (삭제 시 회색 이탤릭) */}
      <p className={`whitespace-pre-wrap break-words ${comment.status === 'DELETED' ? 'text-gray-400 italic' : 'text-gray-700'}`}>
        {comment.content}
      </p>

      {/* 삭제 에러 메시지 */}
      {deleteError && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {deleteError}
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex items-center gap-2 pt-2 text-sm">
        {/* 대댓글 달기 */}
        <button
          onClick={handleReplyClick}
          className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
        >
          대댓글 달기
        </button>

        <span className="text-gray-300">|</span>

        {/* 자신의 댓글이 아닐 때만 프교 신청, 신고하기 표시 */}
        {!comment.isAuthor && (
          <>
            {/* 프교 신청 */}
            <button
              onClick={handleComingSoonFeature}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              프교 신청
            </button>

            <span className="text-gray-300">|</span>

            {/* 신고하기 */}
            <button
              onClick={handleComingSoonFeature}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              신고하기
            </button>

            <span className="text-gray-300">|</span>
          </>
        )}

        {/* 좋아요 버튼 */}
        <button
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center gap-1 font-medium transition-colors ${
            comment.isLikedByCurrentUser
              ? 'text-red-500'
              : 'text-gray-600 hover:text-red-500'
          }`}
        >
          <Heart
            className="w-4 h-4"
            fill={comment.isLikedByCurrentUser ? 'currentColor' : 'none'}
            strokeWidth={2}
          />
          <span>{comment.likeCount}</span>
        </button>
      </div>

      {/* 대댓글 목록 */}
      {comment.replies.length > 0 && (
        <div className="relative">
          {/* 대댓글 존재 표시 수직선 */}
          <div
            className="absolute left-0 top-3 bottom-3 w-0.5 bg-gray-400"
            aria-hidden="true"
          />
          <ReplyList
            replies={comment.replies}
            parentCommentId={comment.publicId}
            parentGender={comment.authorGender}
            onDeleteSuccess={onDeleteSuccess}
            onLikeToggle={(replyPublicId, newIsLiked, newLikeCount) =>
              onReplyLikeToggle(comment.publicId, replyPublicId, newIsLiked, newLikeCount)
            }
            onStartReply={onStartReply}
            highlightedCommentId={highlightedCommentId}
          />
        </div>
      )}

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
              {comment.isAuthor ? (
                // 내가 작성한 댓글
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="w-full px-6 py-3 bg-red-50 text-red-600 font-semibold rounded-full transition-all duration-200 hover:bg-red-100 active:scale-95"
                >
                  삭제하기
                </button>
              ) : (
                // 다른 사람의 댓글
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
                    댓글 차단
                  </button>
                  <button
                    type="button"
                    onClick={handleComingSoonFeature}
                    className="w-full px-6 py-3 bg-gray-50 text-gray-900 font-semibold rounded-full transition-all duration-200 hover:bg-gray-100 active:scale-95"
                  >
                    댓글 작성자 차단
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
              <p className="text-base font-semibold text-gray-900">댓글을 삭제하시겠습니까?</p>
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
              <p className="text-base font-semibold text-gray-900">댓글을 삭제하였습니다.</p>
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
