import { useState, useRef, useEffect } from 'react'
import { SelectModal } from '@/shared/components/ui/SelectModal'

interface BirthDateSelectorProps {
  value: string  // 'YYYY-MM-DD' 형식
  onChange: (date: string) => void
  required?: boolean
}

export function BirthDateSelector({
  value,
  onChange
}: BirthDateSelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 날짜를 년/월/일로 분리
  const [year, month, day] = value ? value.split('-').map(Number) : [2000, 1, 1]

  const [tempYear, setTempYear] = useState(year)
  const [tempMonth, setTempMonth] = useState(month)
  const [tempDay, setTempDay] = useState(day)

  const yearRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)
  const dayRef = useRef<HTMLDivElement>(null)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 80 }, (_, i) => currentYear - 18 - i) // 18세부터 97세까지
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  // 선택된 년/월에 따라 일수 계산
  const getDaysInMonth = (y: number | undefined, m: number | undefined) => {
    if (!y || !m) return 31
    return new Date(y, m, 0).getDate()
  }
  const days = Array.from({ length: getDaysInMonth(tempYear, tempMonth) }, (_, i) => i + 1)

  const ITEM_HEIGHT = 50

  const handleOpenModal = () => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number)
      setTempYear(y)
      setTempMonth(m)
      setTempDay(d)
    } else {
      // 기본값: 만 25세
      const defaultYear = currentYear - 25
      setTempYear(defaultYear)
      setTempMonth(1)
      setTempDay(1)
    }
    setIsModalOpen(true)
  }

  const handleConfirm = () => {
    const formattedDate = `${tempYear}-${String(tempMonth).padStart(2, '0')}-${String(tempDay).padStart(2, '0')}`
    onChange(formattedDate)
    setIsModalOpen(false)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
  }

  // 모달 열릴 때 스크롤 위치 설정
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        if (yearRef.current && tempYear) {
          const yearIndex = years.indexOf(tempYear)
          if (yearIndex !== -1) {
            yearRef.current.scrollTo({ top: yearIndex * ITEM_HEIGHT, behavior: 'auto' })
          }
        }
        if (monthRef.current && tempMonth) {
          monthRef.current.scrollTo({ top: (tempMonth - 1) * ITEM_HEIGHT, behavior: 'auto' })
        }
        if (dayRef.current && tempDay) {
          dayRef.current.scrollTo({ top: (tempDay - 1) * ITEM_HEIGHT, behavior: 'auto' })
        }
      }, 100)
    }
  }, [isModalOpen])

  // 스크롤 핸들러
  const handleYearScroll = () => {
    if (yearRef.current) {
      const scrollTop = yearRef.current.scrollTop
      const index = Math.round(scrollTop / ITEM_HEIGHT)
      const selectedYear = years[index]
      if (selectedYear && tempMonth && tempDay) {
        setTempYear(selectedYear)
        // 월/일 유효성 검사
        const maxDay = getDaysInMonth(selectedYear, tempMonth)
        if (tempDay > maxDay) setTempDay(maxDay)
      }
    }
  }

  const handleMonthScroll = () => {
    if (monthRef.current) {
      const scrollTop = monthRef.current.scrollTop
      const index = Math.round(scrollTop / ITEM_HEIGHT)
      const selectedMonth = months[index]
      if (selectedMonth && tempYear && tempDay) {
        setTempMonth(selectedMonth)
        // 일 유효성 검사
        const maxDay = getDaysInMonth(tempYear, selectedMonth)
        if (tempDay > maxDay) setTempDay(maxDay)
      }
    }
  }

  const handleDayScroll = () => {
    if (dayRef.current) {
      const scrollTop = dayRef.current.scrollTop
      const index = Math.round(scrollTop / ITEM_HEIGHT)
      const selectedDay = days[index]
      if (selectedDay) {
        setTempDay(selectedDay)
      }
    }
  }

  // 항목 클릭 핸들러
  const handleYearClick = (y: number) => {
    const index = years.indexOf(y)
    if (index !== -1 && yearRef.current) {
      yearRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
      setTempYear(y)
    }
  }

  const handleMonthClick = (m: number) => {
    const index = m - 1
    if (monthRef.current) {
      monthRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
      setTempMonth(m)
    }
  }

  const handleDayClick = (d: number) => {
    const index = d - 1
    if (dayRef.current) {
      dayRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' })
      setTempDay(d)
    }
  }

  // 표시용 텍스트
  const displayValue = value
    ? `${year}년 ${month}월 ${day}일`
    : '생년월일을 선택하세요.'

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
        <span className="text-sm text-gray-500 font-bold block mb-0.5">생일</span>
        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
          {displayValue}
        </span>
      </button>

      {/* 모달 */}
      <SelectModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        title="생년월일 선택"
        hideFooter={true}
      >
        <div className="space-y-4">
          {/* 현재 선택된 날짜 표시 */}
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-gray-900">
              {tempYear}년 {tempMonth}월 {tempDay}일
            </p>
          </div>

          {/* 휠 피커 */}
          <div className="grid grid-cols-3 gap-2">
            {/* 년 */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-[100px] h-[50px] border-y-2 border-coral-pink pointer-events-none z-10" />
              <div
                ref={yearRef}
                onScroll={handleYearScroll}
                className="h-[250px] overflow-y-scroll snap-y snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`
                  div::-webkit-scrollbar {
                    display: none;
                  }
                `}</style>
                <div style={{ height: '100px' }} />
                {years.map((y) => (
                  <div
                    key={y}
                    onClick={() => handleYearClick(y)}
                    className="snap-center flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50"
                    style={{ height: `${ITEM_HEIGHT}px` }}
                  >
                    <span
                      className={`font-bold transition-all ${
                        tempYear === y
                          ? 'text-xl text-coral-pink'
                          : 'text-sm text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {y}
                    </span>
                  </div>
                ))}
                <div style={{ height: '100px' }} />
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">년</div>
            </div>

            {/* 월 */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-[100px] h-[50px] border-y-2 border-coral-pink pointer-events-none z-10" />
              <div
                ref={monthRef}
                onScroll={handleMonthScroll}
                className="h-[250px] overflow-y-scroll snap-y snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div style={{ height: '100px' }} />
                {months.map((m) => (
                  <div
                    key={m}
                    onClick={() => handleMonthClick(m)}
                    className="snap-center flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50"
                    style={{ height: `${ITEM_HEIGHT}px` }}
                  >
                    <span
                      className={`font-bold transition-all ${
                        tempMonth === m
                          ? 'text-xl text-coral-pink'
                          : 'text-sm text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {m}
                    </span>
                  </div>
                ))}
                <div style={{ height: '100px' }} />
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">월</div>
            </div>

            {/* 일 */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-[100px] h-[50px] border-y-2 border-coral-pink pointer-events-none z-10" />
              <div
                ref={dayRef}
                onScroll={handleDayScroll}
                className="h-[250px] overflow-y-scroll snap-y snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div style={{ height: '100px' }} />
                {days.map((d) => (
                  <div
                    key={d}
                    onClick={() => handleDayClick(d)}
                    className="snap-center flex items-center justify-center transition-all cursor-pointer hover:bg-gray-50"
                    style={{ height: `${ITEM_HEIGHT}px` }}
                  >
                    <span
                      className={`font-bold transition-all ${
                        tempDay === d
                          ? 'text-xl text-coral-pink'
                          : 'text-sm text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      {d}
                    </span>
                  </div>
                ))}
                <div style={{ height: '100px' }} />
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">일</div>
            </div>
          </div>

          {/* 취소/확인 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-coral-pink text-white font-semibold rounded-xl hover:bg-coral-pink/90 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      </SelectModal>
    </>
  )
}
