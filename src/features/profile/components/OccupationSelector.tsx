import { useState } from 'react'
import occupationsData from '@/shared/data/occupations.json'
import { SelectModal } from '@/shared/components/ui/SelectModal'

interface OccupationSelectorProps {
  value: string  // "일반/대기업직원" 형식
  onChange: (occupation: string) => void
  required?: boolean
}

export function OccupationSelector({
  value,
  onChange
}: OccupationSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const categories = Object.keys(occupationsData)

  const handleCategoryClick = (category: string) => {
    // 실수 터치 방지 (RegionSelector와 동일)
    setIsTransitioning(true)

    setTimeout(() => {
      setSelectedCategory(category)

      setTimeout(() => {
        setIsTransitioning(false)
      }, 150)
    }, 150)
  }

  const handleJobClick = (category: string, job: string) => {
    onChange(`${category}/${job}`)
    setIsModalOpen(false)
    setSelectedCategory('')
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedCategory('')
    setIsTransitioning(false)
  }

  return (
    <>
      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={`w-full px-4 py-3.5 border-2 rounded-xl text-left transition-all font-medium ${
          value
            ? 'border-gray-900 text-gray-900'
            : 'border-gray-300 text-gray-400 hover:border-gray-400'
        }`}
      >
        <span className="text-sm text-gray-500 font-bold block mb-0.5">직업</span>
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || '직업을 선택해주세요.'}
        </span>
      </button>

      {/* 모달 */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedCategory ? `${selectedCategory} 선택` : '직업 선택'}
      >
        {!selectedCategory ? (
          // 대분류 선택 화면
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                type="button"
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 bg-white hover:bg-gray-50 rounded-xl font-bold text-sm sm:text-base md:text-lg text-gray-800 transition-all shadow-sm hover:shadow-md border-2 border-gray-200 word-break-keep-all"
              >
                {category}
              </button>
            ))}
          </div>
        ) : (
          // 소분류 선택 화면 (실수 터치 방지)
          <div
            className="animate-fade-in"
            style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('')
                setIsTransitioning(false)
              }}
              className="mb-4 sm:mb-5 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-100 rounded-lg transition-all word-break-keep-all"
            >
              <span className="text-base sm:text-lg">←</span> 뒤로가기
            </button>
            <div className="grid grid-cols-1 gap-2">
              {occupationsData[selectedCategory as keyof typeof occupationsData].map((job) => (
                <button
                  type="button"
                  key={job}
                  onClick={() => handleJobClick(selectedCategory, job)}
                  className="px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 bg-white hover:bg-coral-pink hover:text-white border-2 border-gray-200 hover:border-coral-pink rounded-xl text-center font-bold transition-all text-sm sm:text-base word-break-keep-all"
                >
                  {job}
                </button>
              ))}
            </div>
          </div>
        )}
      </SelectModal>
    </>
  )
}
