import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronLeft } from 'lucide-react'
import { searchPosts } from '../api/board.api'
import { SearchResultCard } from '../components/SearchResultCard'
import type { PostSearchResponse } from '../types/board.types'

/**
 * 게시글 검색 페이지
 *
 * 2025 UX Best Practices:
 * - 돋보기 아이콘 왼쪽 배치
 * - 검색 버튼 클릭 방식 (버튼 + Enter 지원)
 * - 키보드 네비게이션 (Enter, Escape)
 * - Empty state with CTA
 * - ARIA labels
 * - Safe Area 대응
 */
export function SearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [searchResult, setSearchResult] = useState<PostSearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 검색 실행
  const handleSearch = async () => {
    const trimmedQuery = query.trim()

    // 빈 검색어 방지
    if (!trimmedQuery) {
      inputRef.current?.focus()
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const result = await searchPosts(trimmedQuery, undefined, 0, 20)
      setSearchResult(result)

      if (import.meta.env.DEV) {
        console.log('🔍 [SearchPage] 검색 완료:', {
          query: trimmedQuery,
          resultCount: result.totalElements
        })
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ [SearchPage] 검색 실패:', error)
      }
      alert('검색 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // Enter 키로 검색
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setQuery('')
      setSearchResult(null)
      setHasSearched(false)
      inputRef.current?.blur()
    }
  }

  // 게시글 클릭
  const handlePostClick = (publicId: string) => {
    navigate(`/board/${publicId}`)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-white via-pink-50/30 to-white pb-20"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)'
      }}
    >
      {/* 헤더: 뒤로가기 + 제목 */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-w-[44px] min-h-[44px] -ml-2 flex items-center justify-center
                       hover:bg-gray-100 rounded-full transition-colors active:scale-95"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">검색</h1>
        </div>
      </header>

      {/* 검색창 */}
      <div className="px-4 py-4 bg-white border-b border-gray-100">
        <div
          role="search"
          className="flex items-center gap-2"
        >
          {/* 검색 입력 필드 */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="search"
              role="searchbox"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="검색어를 입력하세요"
              aria-label="게시글 검색"
              className="w-full pl-12 pr-4 py-3 rounded-full bg-gray-100 border-none
                         focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none
                         transition-all duration-200"
            />
          </div>

          {/* 검색 버튼 */}
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600
                       text-white font-medium shadow-button
                       active:scale-95 transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                       min-w-[80px] min-h-[44px]"
            aria-label="검색 실행"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      <div className="px-4 py-4">
        {/* 검색 결과 카운트 */}
        {hasSearched && searchResult && (
          <div className="mb-4 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {searchResult.totalElements}건
            </span>
            의 검색 결과
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
              <span className="text-sm">검색 중...</span>
            </div>
          </div>
        )}

        {/* 검색 결과 리스트 */}
        {!loading && hasSearched && searchResult && searchResult.posts.length > 0 && (
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {searchResult.posts.map((post) => (
              <SearchResultCard
                key={post.publicId}
                post={post}
                onClick={() => handlePostClick(post.publicId)}
              />
            ))}
          </div>
        )}

        {/* Empty State (검색 결과 없음) */}
        {!loading && hasSearched && searchResult && searchResult.posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* 아이콘 */}
            <div className="w-20 h-20 mb-6 opacity-30">
              <Search className="w-full h-full text-gray-400" />
            </div>

            {/* Headline */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              검색 결과가 없습니다
            </h3>

            {/* Explanation */}
            <p className="text-gray-600 text-center mb-6">
              "<span className="font-medium">{query}</span>"에 대한 게시글을 찾을 수 없습니다.
              <br />
              다른 검색어로 시도해보세요.
            </p>

            {/* CTA 버튼 */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setSearchResult(null)
                  setHasSearched(false)
                  inputRef.current?.focus()
                }}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600
                           text-white font-medium shadow-button
                           active:scale-95 transition-all duration-150"
              >
                새로운 검색
              </button>

              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-medium
                           active:scale-95 transition-all duration-150"
              >
                돌아가기
              </button>
            </div>
          </div>
        )}

        {/* 초기 상태 (검색 전) */}
        {!hasSearched && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-16 h-16 mb-4 opacity-20">
              <Search className="w-full h-full text-gray-400" />
            </div>
            <p className="text-gray-500">
              검색어를 입력하고 검색 버튼을 눌러주세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
