import { type ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white pb-safe-b shadow-xl dark:bg-gray-900 sm:max-w-lg sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="tap-target -mr-2 flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 dark:active:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">{children}</div>
        {footer && <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
