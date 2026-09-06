import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'

interface ToastMessage {
  id: number
  text: string
}

interface ToastContextValue {
  showToast: (text: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([])

  const showToast = useCallback((text: string) => {
    const id = Date.now() + Math.random()
    setMessages((prev) => [...prev, { id, text }])
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id))
    }, 2200)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className="pointer-events-auto flex items-center gap-2 rounded-full bg-gray-900/95 px-4 py-2.5 text-sm font-medium text-white shadow-lg dark:bg-gray-100 dark:text-gray-900"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600" />
              {m.text}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast deve essere usato dentro ToastProvider')
  return ctx
}
