/**
 * 대댓글 작성 폼 컴포넌트
 * - CommentForm과 유사하지만 대댓글 전용 API 호출
 * - 최대 1000자 검증
 * - 작은 크기로 디자인 (대댓글용)
 */

import { useState } from 'react'
import axios from 'axios'
import { createReply } from '../api/comment.api'
import type { ReplyCreateRequest } from '../types/comment.types'

interface ReplyFormProps {
  commentPublicId: string
  onSuccess?: () => void
}

const MAX_CONTENT_LENGTH = 1000

export default function ReplyForm({ commentPublicId, onSuccess }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 클라이언트 검증
    if (!content.trim()) {
      setError('답글 내용을 입력해주세요')
      return
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`답글은 최대 ${MAX_CONTENT_LENGTH}자까지 입력 가능합니다`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const request: ReplyCreateRequest = { content: content.trim() }
      await createReply(commentPublicId, request)

      // 성공 시 textarea 초기화
      setContent('')

      // 부모 컴포넌트에 성공 알림
      onSuccess?.()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.message || err.message || '답글 작성에 실패했습니다'
        setError(errorMessage)
      } else {
        setError('답글 작성에 실패했습니다')
        if (import.meta.env.DEV) {
          console.error('Error:', err)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const remainingChars = MAX_CONTENT_LENGTH - content.length
  const isOverLimit = remainingChars < 0

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="답글을 입력하세요..."
          className={`w-full px-3 py-2 bg-gray-50 border rounded-xl resize-none focus:outline-none focus:ring-2 transition-all text-sm ${
            isOverLimit
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-200 focus:ring-coral-pink/20'
          }`}
          rows={2}
          disabled={isSubmitting}
        />

        {/* 글자 수 표시 */}
        <div
          className={`absolute bottom-1 right-2 text-xs ${
            isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'
          }`}
        >
          {remainingChars}자
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* 제출 버튼 */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim() || isOverLimit}
          className={`px-5 py-1.5 rounded-full font-medium text-white text-sm transition-all ${
            isSubmitting || !content.trim() || isOverLimit
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-coral-pink hover:bg-coral-pink/90 active:scale-95'
          }`}
        >
          {isSubmitting ? '작성 중...' : '답글 작성'}
        </button>
      </div>
    </form>
  )
}
