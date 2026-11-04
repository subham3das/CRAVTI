import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-lg w-full p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto mb-5 shadow-xs">
              <FiAlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              An unexpected error occurred while rendering this page. Your data is safe. Try refreshing the page.
            </p>

            {this.state.error?.message && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left">
                <p className="text-xs font-mono text-rose-700 break-words font-semibold">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#16A34A] hover:bg-[#15803d] shadow-sm transition-all"
              >
                <FiRefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
              >
                <FiHome className="w-4 h-4" />
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

