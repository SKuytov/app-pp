import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Store error details in state
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log to external service in production
    if (import.meta.env.VITE_APP_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = async (error, errorInfo) => {
    try {
      // In production, send to error tracking service (Sentry, LogRocket, etc.)
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId || 'anonymous',
        errorId: this.state.errorId
      };

      // For now, we'll log to console. In production, replace with actual service
      console.log('Error logged:', errorData);
      
      // Example: await fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorData) });
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        alert('Error details copied to clipboard');
      })
      .catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(errorDetails, null, 2);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Error details copied to clipboard');
      });
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 text-white">
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Oops! Something went wrong
                  </h1>
                  <p className="text-slate-400 mt-1">
                    We're sorry for the inconvenience. The application encountered an unexpected error.
                  </p>
                </div>
              </div>

              {/* Error ID */}
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-300">
                  <span className="font-medium">Error ID:</span> 
                  <code className="ml-2 text-blue-400">{this.state.errorId}</code>
                </p>
              </div>

              {/* Development Error Details */}
              {isDevelopment && this.state.error && (
                <div className="mb-6">
                  <details className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                    <summary className="cursor-pointer text-red-400 font-medium mb-2">
                      🐛 Development Error Details (Click to expand)
                    </summary>
                    <div className="space-y-3 mt-3">
                      <div>
                        <h4 className="text-sm font-medium text-red-300">Error Message:</h4>
                        <pre className="text-xs text-red-200 mt-1 whitespace-pre-wrap">
                          {this.state.error.message}
                        </pre>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-red-300">Stack Trace:</h4>
                        <pre className="text-xs text-red-200 mt-1 whitespace-pre-wrap overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </div>
                      {this.state.errorInfo?.componentStack && (
                        <div>
                          <h4 className="text-sm font-medium text-red-300">Component Stack:</h4>
                          <pre className="text-xs text-red-200 mt-1 whitespace-pre-wrap overflow-auto max-h-32">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Page
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>

                <Button 
                  onClick={this.copyErrorDetails}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Bug className="h-4 w-4 mr-2" />
                  Copy Error Details
                </Button>
              </div>

              {/* Support Information */}
              <div className="mt-8 pt-6 border-t border-slate-700">
                <p className="text-sm text-slate-400">
                  If this problem persists, please contact support with the error ID above.
                </p>
                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                  <span>App Version: {import.meta.env.VITE_APP_VERSION}</span>
                  <span>•</span>
                  <span>Environment: {import.meta.env.VITE_APP_ENV}</span>
                  <span>•</span>
                  <span>Time: {new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error reporting from function components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    // In function components, we can't use componentDidCatch,
    // so we'll throw the error to be caught by the nearest ErrorBoundary
    console.error('Error caught by useErrorHandler:', error);
    throw error;
  }, []);

  return handleError;
};

export default ErrorBoundary;