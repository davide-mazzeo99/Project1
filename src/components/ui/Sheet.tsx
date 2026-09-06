import { type ReactNode, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

/** Deve corrispondere alla duration della transizione qui sotto, per smontare solo a fine animazione. */
const EXIT_DURATION_MS = 220

export function Sheet({ open, onClose, title, children, footer }: SheetProps) {
  const [rendered, setRendered] = useState(open)
  const [shown, setShown] = useState(false)
  // Molti chiamanti azzerano i propri dati (form, transazione selezionata) non appena `open`
  // diventa false: senza questa cache il contenuto sparirebbe a metà dell'animazione di uscita.
  const lastContent = useRef({ title, children, footer })
  if (open) lastContent.current = { title, children, footer }
  const content = open ? { title, children, footer } : lastContent.current

  useEffect(() => {
    if (open) {
      setRendered(true)
      const raf = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(raf)
    }
    setShown(false)
    const timeout = setTimeout(() => setRendered(false), EXIT_DURATION_MS)
    return () => clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (!rendered) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [rendered])

  if (!rendered) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${shown ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white pb-safe-b shadow-xl transition-transform duration-200 ease-out dark:bg-gray-900 sm:max-w-lg sm:rounded-2xl ${
          shown ? 'translate-y-0 sm:scale-100' : 'translate-y-full sm:translate-y-4 sm:scale-95'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{content.title}</h2>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="tap-target -mr-2 flex items-center justify-center rounded-full text-gray-400 active:bg-gray-100 dark:active:bg-gray-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-3">{content.children}</div>
        {content.footer && <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">{content.footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
