import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Storage } from '../../lib/storage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      Storage.resetToDefaults();
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F8F5] flex items-center justify-center p-6 text-[#202923]">
          <div className="max-w-md w-full bg-white rounded-xl border border-[#E1E7E0] p-6 shadow-md text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#FDF2F0] text-[#C65C48] flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#202923]">RuralClass Classroom Assistant</h2>
            <p className="text-xs text-[#68746B] leading-relaxed">
              A temporary render error occurred. Click below to restore clean demo data and launch the dashboard.
            </p>
            {this.state.error && (
              <div className="p-3 bg-[#FAFBF9] rounded border border-[#E1E7E0] text-[11px] font-mono text-[#C65C48] text-left truncate">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#245B4A] hover:bg-[#194738] rounded-lg shadow-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Demo Classroom & Reload</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
