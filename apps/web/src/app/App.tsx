import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../modules/auth/components/AuthProvider';
import { ErrorBoundary } from '../modules/core/components/ErrorBoundary';
import { ToastHost } from '../modules/core/components/Toast';
import { AppRoutes } from './router';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
      <ToastHost />
    </ErrorBoundary>
  );
}
