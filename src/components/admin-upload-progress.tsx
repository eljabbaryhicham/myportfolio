'use client';

import { UploadProgressProvider } from '@/components/upload-progress-context';
import UploadProgressNotification from '@/components/upload-progress-notification';

// Scopes the admin-only upload progress context + toast to the /admin subtree
// (instead of every page via AppShell), keeping the global client bundle
// smaller for public pages where uploads never happen.
export default function AdminUploadProgress({ children }: { children: React.ReactNode }) {
  return (
    <UploadProgressProvider>
      {children}
      <UploadProgressNotification />
    </UploadProgressProvider>
  );
}
