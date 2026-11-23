import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/auth';

export const metadata = { title: 'Masuk · catetkos' };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return <LoginForm />;
}
