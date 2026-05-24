import AuthWrapper from '@/components/pages/auth/AuthWrapper';
import { ReactNode } from 'react';

type AuthWrapperProps = {
  children: ReactNode;
};

export default function InfluencerLayout({ children }: AuthWrapperProps) {
  return <AuthWrapper>{children}</AuthWrapper>;
}
