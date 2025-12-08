import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, FileUp, X } from 'lucide-react'
import { createPost } from '../api/board.api'
import type { PostCategory } from '../types/board.types'
import type { BoardCategory } from '@/features/main/types/main.types'

// BoardCategory를 PostCategory로 매핑
const categoryMap: Record<BoardCategory, PostCategory> = {
  'free': 'FREE_TALK',
  'self-intro': 'SELF_INTRO',
  'popular': 'FREE_TALK', // 인기글은 자유 수다로
  'meetup': 'MEETUP',
  'gentlemen': 'GENTLEMEN',  // 남성 전용
  'ladies': 'LADIES'          // 여성 전용
}

export function PostCreatePage() {
  const navigate = useNavigate()
  const location = useLocation()

  // BoardPage에서 전달받은 category와 categoryLabel
  const state = location.state as { category: BoardCategory; categoryLabel: string } | undefined
  const boardCategory = state?.category || 'free'

  // ⭐ '인기글'은 '자유 수다'로 표시
  const categoryLabel = boardCategory === 'popular' ? '자유 수다' : (state?.categoryLabel || '자유 수다')

  // BoardCategory를 PostCategory로 변환
  const postCategory = categoryMap[boardCategory]

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 파일 크기 검증 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('이미지는 최대 5MB까지 업로드 가능합니다.')
        return
      }

      // MIME 타입 검증
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('JPG, PNG, WebP 형식만 업로드 가능합니다.')
        return
      }

      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setPreviewUrl('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      alert('제목을 입력하세요.')
      return
    }

    if (!content.trim()) {
      alert('내용을 입력하세요.')
      return
    }

    setIsSubmitting(true)
    try {
      await createPost(postCategory, title.trim(), content.trim(), selectedImage || undefined)
      alert('게시글이 작성되었습니다!')
      navigate(-1) // 이전 페이지로 이동
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('게시글 작성 실패:', error)
      }
      alert('게시글 작성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-screen-xl mx-auto px-5 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">
            {categoryLabel} 글쓰기
          </h1>
        </div>
      </header>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="pt-20 pb-24 px-5">
        <div className="max-w-screen-xl mx-auto space-y-6">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-2">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-base"
              maxLength={100}
            />
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-sm font-semibold text-gray-900 mb-2">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요."
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none text-base"
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              {content.length} / 2000
            </p>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              파일을 선택하세요.
            </label>

            {/* 이미지 미리보기 */}
            {previewUrl && (
              <div className="relative mb-3 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={previewUrl}
                  alt="미리보기"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* 업로드 버튼 */}
            {!previewUrl && (
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary-500 hover:bg-primary-50/50 transition-all"
              >
                <FileUp className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">클릭하여 이미지 업로드</span>
                <span className="text-xs text-gray-500 mt-1">JPG, PNG (최대 5MB)</span>
              </label>
            )}

            <input
              type="file"
              id="image-upload"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
        </div>
      </form>

      {/* 하단 작성 버튼 (엄지 도달 가능) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 p-4">
        <div className="max-w-screen-xl mx-auto">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 bg-primary-500 text-white font-semibold rounded-xl hover:bg-primary-600 active:scale-[0.98] transition-all shadow-button disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '작성 중...' : '작성하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
