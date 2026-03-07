import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white p-8">
          <div className="animate-fade-in text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Er ging iets mis</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
              {this.state.error?.message || 'Er is een onverwachte fout opgetreden.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary mt-6"
            >
              <RefreshCw className="h-4 w-4" />
              Opnieuw laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
