import { SignIn, SignUp } from '@clerk/react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Brand } from '../modules/core/components/Brand';

export function AuthPage() {
  return (
    <div className="auth">
      <header className="auth-top">
        <Brand />
      </header>
      <main className="auth-c">
        <Routes>
          <Route path="sign-in/*" element={<SignIn routing="path" path="/auth/sign-in" />} />
          <Route path="sign-up/*" element={<SignUp routing="path" path="/auth/sign-up" />} />
          <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
        </Routes>
      </main>
    </div>
  );
}
