import { Component, type ErrorInfo, type ReactNode } from 'react';
import { EmptyState } from './EmptyState';

interface Props {
  children: ReactNode;
}

interface State {
  failed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error', error, info);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <div role="alert">
        <EmptyState
          icon="triangle-alert"
          title="This view could not load"
          text="Try again. If it keeps failing, reload the app."
          action={
            <button className="btn btn-secondary" type="button" onClick={() => this.setState({ failed: false })}>
              Try again
            </button>
          }
        />
      </div>
    );
  }
}
