import { useState } from 'react'
import { SelectModal } from '@/shared/components/ui/SelectModal'

interface SimpleSelectorProps {
  label: string
  value: string | number
  options: Array<{ value: string | number; label: string }>
  onChange: (value: string | number) => void
  required?: boolean
  placeholder?: string
}

export function SimpleSelector({
  label,
  value,
  options,
  onChange,
  placeholder = '선택하세요'
}: SimpleSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSelect = (selectedValue: string | number) => {
    onChange(selectedValue)
    setIsModalOpen(false)
  }

  const displayValue = options.find((opt) => opt.value === value)?.label || placeholder

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
          {displayValue}
        </span>
      </button>

      {/* 모달 */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`${label} 선택`}
      >
        {options.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-sm sm:text-base word-break-keep-all">
              {placeholder || '선택 가능한 옵션이 없습니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`px-3 sm:px-4 md:px-5 py-3 sm:py-3.5 md:py-4 rounded-xl text-center font-bold text-sm sm:text-base transition-all border-2 word-break-keep-all ${
                  value === option.value
                    ? 'bg-coral-pink text-white border-coral-pink'
                    : 'bg-white text-gray-800 border-gray-200 hover:border-coral-pink hover:bg-gray-50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </SelectModal>
    </>
  )
}
