import { useState } from 'react'
import { SelectModal } from '@/shared/components/ui/SelectModal'

interface PersonalitySelectorProps {
  value: string[]  // 선택된 성격 배열 (최대 3개)
  onChange: (personalities: string[]) => void
}

const PERSONALITIES = [
  '지적인',
  '차분한',
  '재미있는',
  '낙천적인',
  '내향적인',
  '감성적인',
  '상냥한',
  '귀여운',
  '열정적인',
  '듬직한',
  '개성있는',
  '외향적인',
  '센스 있는'
]

export function PersonalitySelector({ value, onChange }: PersonalitySelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [tempValue, setTempValue] = useState<string[]>([])

  const handleOpenModal = () => {
    setTempValue([...value])
    setIsModalOpen(true)
  }

  const handleToggle = (personality: string) => {
    if (tempValue.includes(personality)) {
      // 이미 선택된 경우 제거
      setTempValue(tempValue.filter((p) => p !== personality))
    } else {
      // 선택되지 않은 경우 추가 (최대 3개까지)
      if (tempValue.length < 3) {
        setTempValue([...tempValue, personality])
      }
    }
  }

  const handleConfirm = () => {
    onChange(tempValue)
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setTempValue([])
  }

  const displayValue = value.length > 0 ? value.join(', ') : '예) 듬직한'

  return (
    <>
      {/* 선택 버튼 */}
      <button
        type="button"
        onClick={handleOpenModal}
        className={`w-full px-4 py-3.5 border-2 rounded-xl text-left transition-all font-medium ${
          value.length > 0
            ? 'border-gray-900 text-gray-900'
            : 'border-gray-300 text-gray-400 hover:border-gray-400'
        }`}
      >
        <span className="text-sm text-gray-500 font-bold block mb-0.5">성격</span>
        <span className={value.length > 0 ? 'text-gray-900 text-sm' : 'text-gray-400'}>
          {displayValue}
        </span>
      </button>

      {/* 모달 */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="성격 선택"
        hideFooter={true}
      >
        <div className="space-y-4">
          {/* 선택 안내 */}
          <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
            <p className="text-xs sm:text-sm text-gray-700 word-break-keep-all">
              {tempValue.length > 0 ? (
                <span>
                  <span className="font-bold text-coral-pink">{tempValue.length}개</span> 선택됨 (최대 3개)
                </span>
              ) : (
                <span>최대 3개까지 선택 가능합니다</span>
              )}
            </p>
            {tempValue.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                {tempValue.map((personality) => (
                  <span
                    key={personality}
                    className="px-2 sm:px-3 py-0.5 sm:py-1 bg-coral-pink text-white text-xs sm:text-sm rounded-full word-break-keep-all"
                  >
                    {personality}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 체크박스 그리드 */}
          <div className="grid grid-cols-2 gap-2">
            {PERSONALITIES.map((personality) => {
              const isSelected = tempValue.includes(personality)
              const isDisabled = !isSelected && tempValue.length >= 3

              return (
                <button
                  key={personality}
                  type="button"
                  onClick={() => !isDisabled && handleToggle(personality)}
                  disabled={isDisabled}
                  className={`px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 rounded-xl font-medium transition-all border-2 text-sm sm:text-base word-break-keep-all ${
                    isSelected
                      ? 'bg-coral-pink text-white border-coral-pink'
                      : isDisabled
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-coral-pink hover:bg-gray-50'
                  }`}
                >
                  {personality}
                </button>
              )
            })}
          </div>

          {/* 취소/확인 버튼 */}
          <div className="flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 sm:py-3 bg-gray-200 text-gray-700 font-semibold text-sm sm:text-base rounded-xl hover:bg-gray-300 transition-all word-break-keep-all"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 sm:py-3 bg-coral-pink text-white font-semibold text-sm sm:text-base rounded-xl hover:bg-coral-pink/90 transition-all word-break-keep-all"
            >
              확인
            </button>
          </div>
        </div>
      </SelectModal>
    </>
  )
}
