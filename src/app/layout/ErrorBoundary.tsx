import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Quokkal crashed', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-8 text-center gap-4">
        <div className="text-5xl">😵‍💫</div>
        <h1 className="text-xl font-extrabold">Well, that's embarrassing.</h1>
        <p className="text-bark-700 text-sm max-w-xs">
          Quokkal hit a snag. Your data is safe on this device. Reload to keep going.
        </p>
        <pre className="text-xs text-left bg-sand-200 rounded-xl p-3 max-w-full overflow-x-auto">
          {this.state.error.message}
        </pre>
        <button className="btn-primary" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
