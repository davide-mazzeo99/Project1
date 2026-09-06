import { Delete } from 'lucide-react'

interface NumericKeypadProps {
  onDigit: (digit: string) => void
  onDecimal: () => void
  onBackspace: () => void
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'] as const

export function NumericKeypad({ onDigit, onDecimal, onBackspace }: NumericKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map((key) => {
        if (key === 'del') {
          return (
            <button
              key={key}
              type="button"
              onClick={onBackspace}
              aria-label="Cancella"
              className="tap-target flex h-14 items-center justify-center rounded-xl bg-gray-100 text-gray-700 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:active:bg-gray-700"
            >
              <Delete className="h-5 w-5" />
            </button>
          )
        }
        if (key === ',') {
          return (
            <button
              key={key}
              type="button"
              onClick={onDecimal}
              className="tap-target h-14 rounded-xl bg-gray-100 text-xl font-semibold text-gray-700 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:active:bg-gray-700"
            >
              ,
            </button>
          )
        }
        return (
          <button
            key={key}
            type="button"
            onClick={() => onDigit(key)}
            className="tap-target h-14 rounded-xl bg-gray-100 text-xl font-semibold text-gray-900 active:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:active:bg-gray-700"
          >
            {key}
          </button>
        )
      })}
    </div>
  )
}
