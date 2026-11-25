import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthProvider';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary';
import { ToastHost } from '../shared/ui/Toast';
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
