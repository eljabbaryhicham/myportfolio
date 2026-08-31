import type { Metadata } from 'next';
import AdminUploadProgress from '@/components/admin-upload-progress';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminUploadProgress>{children}</AdminUploadProgress>;
}
