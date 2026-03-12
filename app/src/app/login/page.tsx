import { redirect } from 'next/navigation';
import { isAuthDisabledForTesting } from '@/lib/auth';
import LoginForm from './login-form';

export default function LoginPage() {
  if (isAuthDisabledForTesting()) {
    redirect('/admin');
  }

  return <LoginForm />;
}
