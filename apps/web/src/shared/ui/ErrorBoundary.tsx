import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error', error, info);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <section className="error-boundary">
          <h1>Something went wrong</h1>
          <pre>{this.state.error.message}</pre>
        </section>
      );
    }

    return this.props.children;
  }
}
