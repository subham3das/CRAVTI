import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Admin Panel Uncaught Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center mb-4">
            <FiAlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-[#0F172A]">Something went wrong</h2>
          <p className="text-xs text-slate-500 max-w-md mt-1 mb-6">
            An unexpected error occurred in this view. The error has been logged defensively.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
          >
            <FiRefreshCw className="w-4 h-4" />
            <span>Reload Page</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

