import { useState } from 'react'
import regionsData from '@/shared/data/regions.json'
import { SelectModal } from '@/shared/components/ui/SelectModal'

interface RegionSelectorProps {
  value: string  // "경기도 용인시 수지구" 형식
  onChange: (region: string) => void
  required?: boolean
  label?: string
  placeholder?: string
}

export function RegionSelector({
  value,
  onChange,
  label = '거주지',
  placeholder = '선택하세요'
}: RegionSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSido, setSelectedSido] = useState<string>('')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const sidos = Object.keys(regionsData)

  const handleSidoClick = (sido: string) => {
    // 1. 전환 시작 (pointer-events 차단)
    setIsTransitioning(true)

    // 2. 150ms 지연 후 화면 전환 (실수 터치 방지)
    setTimeout(() => {
      setSelectedSido(sido)

      // 3. 추가 150ms 후 클릭 활성화 (애니메이션 완료 대기)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 150)
    }, 150)
  }

  const handleSigunguClick = (sido: string, sigungu: string) => {
    onChange(`${sido} ${sigungu}`)
    setIsModalOpen(false)
    setSelectedSido('')
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSido('')
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
        <span className="text-sm text-gray-500 font-bold block mb-0.5">{label}</span>
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </span>
      </button>

      {/* 모달 */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={selectedSido ? `${selectedSido} 선택` : `${label} 선택`}
      >
        {!selectedSido ? (
          // 시/도 선택 화면
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {sidos.map((sido) => (
              <button
                type="button"
                key={sido}
                onClick={() => handleSidoClick(sido)}
                className="px-4 sm:px-5 md:px-6 py-3 sm:py-4 md:py-5 bg-white hover:bg-gray-50 rounded-xl font-bold text-sm sm:text-base md:text-lg text-gray-800 transition-all shadow-sm hover:shadow-md border-2 border-gray-200 word-break-keep-all"
              >
                {sido}
              </button>
            ))}
          </div>
        ) : (
          // 시/군/구 선택 화면 (애니메이션 + 실수 터치 방지)
          <div
            className="animate-fade-in"
            style={{ pointerEvents: isTransitioning ? 'none' : 'auto' }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedSido('')
                setIsTransitioning(false)
              }}
              className="mb-4 sm:mb-5 px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-100 rounded-lg transition-all word-break-keep-all"
            >
              <span className="text-base sm:text-lg">←</span> 뒤로가기
            </button>
            <div className="grid grid-cols-2 gap-2">
              {regionsData[selectedSido as keyof typeof regionsData].map((sigungu) => (
                <button
                  type="button"
                  key={sigungu}
                  onClick={() => handleSigunguClick(selectedSido, sigungu)}
                  className="px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 bg-white hover:bg-coral-pink hover:text-white border-2 border-gray-200 hover:border-coral-pink rounded-xl text-center font-bold text-xs sm:text-sm md:text-base transition-all word-break-keep-all"
                >
                  {sigungu}
                </button>
              ))}
            </div>
          </div>
        )}
      </SelectModal>
    </>
  )
}
