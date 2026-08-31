import Preloader from '@/components/preloader';

/**
 * This boundary lets the shared app shell commit immediately while the Work
 * layout fetches its server-rendered project seed. Without it, navigation
 * waits for that Firestore request before any route feedback is visible.
 */
export default function WorkLoading() {
  return (
    <div
      className="flex min-h-[60vh] flex-1 items-center justify-center"
      aria-busy="true"
      aria-label="Loading work"
    >
      <Preloader />
      <span className="sr-only">Loading work</span>
    </div>
  );
}
