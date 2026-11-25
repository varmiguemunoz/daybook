import { ClerkProvider } from '@clerk/clerk-react';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import { CommandPalette } from '../shared/ui/CommandPalette';
import { ToastHost } from '../shared/ui/Toast';
import { Providers } from './providers';
import { AppRouter } from './router';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export function App() {
  const inner = (
    <ErrorBoundary>
      <Providers>
        <AppRouter />
        <CommandPalette />
        <ToastHost />
      </Providers>
    </ErrorBoundary>
  );

  if (!publishableKey) return inner;

  return <ClerkProvider publishableKey={publishableKey}>{inner}</ClerkProvider>;
}
