/**
 * 댓글 작성 폼 컴포넌트 (2025 Mobile Best Practice)
 * - 하단 고정 (Sticky Bottom)
 * - Lexical 기반 원자적 멘션 블록 (YouTube 스타일)
 * - 백스페이스 2번으로 멘션 전체 삭제
 * - Safe Area 지원
 * - Backdrop blur 효과
 */

import { useState } from 'react'
import axios from 'axios'
import { Send } from 'lucide-react'
import { createComment, createReply } from '../api/comment.api'
import type { CommentCreateRequest, ReplyCreateRequest } from '../types/comment.types'
import MentionEditor from './MentionEditor'

interface ReplyState {
  isReplying: boolean
  parentCommentId: string | null
  targetNickname: string | null
}

interface CommentFormProps {
  postPublicId: string
  onSuccess?: () => void
  replyState: ReplyState
  onCancelReply: () => void
  replyTrigger: number  // 멱등성 보장용
}

const MAX_CONTENT_LENGTH = 1000

export default function CommentForm({ postPublicId, onSuccess, replyState, onCancelReply, replyTrigger }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 답글 취소 핸들러 (content도 함께 초기화)
  const handleCancelReply = () => {
    setContent('')
    onCancelReply()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 클라이언트 검증
    if (!content.trim()) return

    if (content.length > MAX_CONTENT_LENGTH) {
      alert(`댓글은 최대 ${MAX_CONTENT_LENGTH}자까지 입력 가능합니다`)
      return
    }

    setIsSubmitting(true)

    try {
      const finalContent = content.trim()

      if (replyState.isReplying && replyState.parentCommentId) {
        // 대댓글 작성
        const request: ReplyCreateRequest = { content: finalContent }
        await createReply(replyState.parentCommentId, request)
      } else {
        // 일반 댓글 작성
        const request: CommentCreateRequest = { content: finalContent }
        await createComment(postPublicId, request)
      }

      // 성공 시 초기화
      setContent('')

      // 부모 컴포넌트에 성공 알림 (댓글 목록 새로고침 + 답글 상태 초기화)
      onSuccess?.()
    } catch (err: unknown) {
      // RFC 9457 에러 처리
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || '댓글 작성에 실패했습니다'
        alert(errorMessage)
      } else {
        alert('댓글 작성에 실패했습니다')
        if (import.meta.env.DEV) {
          console.error('Error:', err)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOverLimit = content.length > MAX_CONTENT_LENGTH

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 pb-safe">
      <form onSubmit={handleSubmit} className="max-w-screen-xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Lexical Mention Editor - key를 사용하여 답글 상태 변경 시 재마운트 */}
          <MentionEditor
            key={replyState.isReplying ? `reply-${replyState.parentCommentId}-${replyState.targetNickname}-${replyTrigger}` : 'comment'}
            placeholder={
              replyState.isReplying
                ? '답글을 입력하세요...'
                : '댓글을 입력하세요...'
            }
            onTextChange={setContent}
            disabled={isSubmitting}
            initialMention={
              replyState.isReplying && replyState.targetNickname
                ? { nickname: replyState.targetNickname }
                : null
            }
            onClearMention={handleCancelReply}
          />

          {/* 전송 버튼 (종이비행기 아이콘만) - 중앙 정렬 */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || isOverLimit}
            className="flex-shrink-0 p-3 transition-all active:scale-95"
            aria-label="댓글 전송"
          >
            <Send
              className={`w-6 h-6 transition-colors ${
                isSubmitting || !content.trim() || isOverLimit
                  ? 'text-gray-300'
                  : 'text-coral-pink'
              }`}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </form>
    </div>
  )
}
