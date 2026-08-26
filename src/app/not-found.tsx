'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse } from '@fortawesome/free-solid-svg-icons';

export default function NotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 p-4 text-center">
      <h1 className="text-7xl font-headline font-bold text-foreground/20">404</h1>
      <p className="text-lg text-foreground/60">This page could not be found.</p>
      <Button asChild variant="default">
        <Link href="/">
          <FontAwesomeIcon icon={faHouse} className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}
