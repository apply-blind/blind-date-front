import React from 'react'

interface SelectModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  hideFooter?: boolean
}

export function SelectModal({ isOpen, onClose, title, children, hideFooter = false }: SelectModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80dvh] overflow-hidden flex flex-col animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-cream">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white"
          >
            ✕
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-safe">
          {children}
        </div>

        {/* 푸터 */}
        {!hideFooter && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold text-gray-700 transition-all"
            >
              취소
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
