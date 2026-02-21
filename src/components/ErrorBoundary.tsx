// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });

        // You could send error to a logging service here
        // e.g., Sentry, LogRocket, etc.
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="fixed inset-0 bg-white  flex items-center justify-center p-6 z-50">
                    <div className="max-w-md w-full text-center space-y-6">
                        {/* Icon */}
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-red-100  rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-gray-800 ">
                                Ups! Coś poszło nie tak
                            </h1>
                            <p className="text-gray-500  font-medium">
                                Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wrócić do ekranu głównego.
                            </p>
                        </div>

                        {/* Error details (collapsed by default in production) */}
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left bg-gray-100  rounded-xl p-4">
                                <summary className="font-bold text-sm text-gray-600  cursor-pointer">
                                    Szczegóły błędu (tylko w trybie dev)
                                </summary>
                                <pre className="mt-2 text-xs text-red-600  overflow-auto max-h-40">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={this.handleRetry}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                                Spróbuj ponownie
                            </button>
                            <button
                                onClick={this.handleGoHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100  text-gray-700  font-bold rounded-xl hover:bg-gray-200  transition-colors border border-gray-200 "
                            >
                                <Home className="w-5 h-5" />
                                Strona główna
                            </button>
                        </div>

                        {/* Version info */}
                        <p className="text-xs text-gray-400">
                            BioMistrz v1.2.6 • Jeśli problem się powtarza, skontaktuj się z nami.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
