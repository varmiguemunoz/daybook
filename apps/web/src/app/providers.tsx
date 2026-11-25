import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import { ApiError, setTokenSource } from '../modules/core/services/api-client';
import { useSessionRecovery } from '../modules/auth/hooks/use-session-recovery';

const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function Providers({ children }: { children: ReactNode }) {
  const recover = useSessionRecovery();
  const { getToken } = useAuth();
  setTokenSource(getToken);
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: recover }),
        mutationCache: new MutationCache({ onError: recover }),
        defaultOptions: { queries: { retry: shouldRetry } },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
