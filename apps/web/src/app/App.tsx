import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from '../modules/auth/components/AuthProvider';
import { ErrorBoundary } from '../modules/core/components/ErrorBoundary';
import { ToastHost } from '../modules/core/components/Toast';
import { AppRoutes } from './router';

// A data router is what enables useBlocker; the existing route tree stays as descendant <Routes>.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    ),
  },
]);

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastHost />
    </ErrorBoundary>
  );
}
