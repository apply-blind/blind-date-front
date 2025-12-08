import { useState, useRef, useEffect } from 'react'
import { SelectModal } from '@/shared/components/ui/SelectModal'

interface HeightSelectorProps {
  value: number
  onChange: (height: number) => void
  required?: boolean
}

export function HeightSelector({
  value,
  onChange
}: HeightSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempValue, setTempValue] = useState(value)
  const scrollRef = useRef<HTMLDivElement>(null)

  const heights = Array.from({ length: 91 }, (_, i) => 140 + i) // 140~230cm
  const ITEM_HEIGHT = 50 // 각 아이템 높이

  const handleOpenModal = () => {
    setTempValue(value > 0 ? value : 140)
    setIsModalOpen(true)
  }

  const handleConfirm = () => {
    onChange(tempValue)
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  // 모달 열릴 때 스크롤 위치 설정
  useEffect(() => {
    if (isModalOpen && scrollRef.current) {
      const index = heights.indexOf(tempValue)
      if (index !== -1) {
        setTimeout(() => {
          scrollRef.current?.scrollTo({
            top: index * ITEM_HEIGHT,
            behavior: 'auto'
          })
        }, 100)
      }
    }
  }, [isModalOpen])

  // 스크롤 이벤트로 중앙 값 선택
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollTop = scrollRef.current.scrollTop
      const index = Math.round(scrollTop / ITEM_HEIGHT)
      const selectedHeight = heights[index]
      if (selectedHeight) {
        setTempValue(selectedHeight)
      }
    }
  }

  // 항목 클릭 시 해당 위치로 스크롤
  const handleItemClick = (height: number) => {
    const index = heights.indexOf(height)
    if (index !== -1 && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: 'smooth'
      })
      setTempValue(height)
    }
  }

  return (
    <>
      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={handleOpenModal}
        className={`w-full px-4 py-3.5 border-2 rounded-xl text-left transition-all font-medium ${
          value
            ? 'border-gray-900 text-gray-900'
            : 'border-gray-300 text-gray-400 hover:border-gray-400'
        }`}
      >
        <span className="text-sm text-gray-500 font-bold block mb-0.5">키</span>
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value ? `${value}cm` : '선택하세요'}
        </span>
      </button>

      {/* 모달 */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="키 선택"
        hideFooter={true}
      >
        <div className="space-y-3 sm:space-y-4">
          {/* 휠 피커 */}
          <div className="relative">
            {/* 중앙 선택 영역 표시 */}
            <div className="absolute left-0 right-0 top-[88px] sm:top-[100px] h-[44px] sm:h-[50px] border-y-2 border-coral-pink pointer-events-none z-10" />

            {/* 스크롤 컨테이너 */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="h-[220px] sm:h-[250px] overflow-y-scroll snap-y snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                .height-picker::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {/* 상단 패딩 (모바일 88px, 데스크탑 100px) */}
              <div className="h-[88px] sm:h-[100px]" />

              {/* 키 목록 */}
              {heights.map((height) => (
                <div
                  key={height}
                  onClick={() => handleItemClick(height)}
                  className="snap-center flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                  style={{ height: `${ITEM_HEIGHT}px` }}
                >
                  <span
                    className={`font-bold transition-all ${
                      tempValue === height
                        ? 'text-xl sm:text-2xl text-coral-pink'
                        : 'text-base sm:text-lg text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {height}cm
                  </span>
                </div>
              ))}

              {/* 하단 패딩 */}
              <div className="h-[88px] sm:h-[100px]" />
            </div>
          </div>

          {/* 취소/확인 버튼 */}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-300 active:bg-gray-400 active:scale-95 transition-all min-h-touch"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 sm:py-3 bg-coral-pink text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-coral-pink/90 active:brightness-90 active:scale-95 transition-all min-h-touch"
            >
              확인
            </button>
          </div>
        </div>
      </SelectModal>
    </>
  )
}
