import type { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/react';
import { useNavigate } from 'react-router-dom';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={publishableKey as string}
      routerPush={to => navigate(to)}
      routerReplace={to => navigate(to, { replace: true })}
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      afterSignOutUrl="/auth/sign-in"
      taskUrls={{ 'choose-organization': '/' }}
    >
      {children}
    </ClerkProvider>
  );
}
