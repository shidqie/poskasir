import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
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
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 text-center shadow-xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Terjadi Kendala Memuat Halaman
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Aplikasi mengalami kendala sementara saat merender tampilan. Silakan muat ulang halaman untuk menyegarkan sistem.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left overflow-auto max-h-28">
                <p className="text-[11px] font-mono text-rose-700 font-semibold break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                icon={Home}
                onClick={this.handleGoHome}
                className="py-2.5 text-xs font-bold rounded-xl"
              >
                Ke Beranda
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={RefreshCw}
                onClick={this.handleReload}
                className="py-2.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md shadow-red-600/20"
              >
                Muat Ulang
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
