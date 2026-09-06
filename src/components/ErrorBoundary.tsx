import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Errore non gestito', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-6 text-center dark:bg-gray-950">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Qualcosa è andato storto
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {this.state.error.message || 'Errore imprevisto nell\'app.'}
            </p>
          </div>
          <button
            className="tap-target rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white active:bg-brand-700"
            onClick={() => this.setState({ error: null })}
          >
            Riprova
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
