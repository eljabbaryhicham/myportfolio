// Robust autoplay for <video> elements, especially on mobile.
//
// Mobile browsers (iOS Safari, Android Chrome) only allow autoplay when the
// video is BOTH muted AND playsinline, and they reject a `.play()` call made
// before the source is ready (the promise resolves/rejects with
// NotAllowedError). Relying on the HTML `autoplay` attribute or a single
// immediate `.play()` is unreliable. This helper:
//   1. sets the muted + playsinline PROPERTIES (not just attributes),
//   2. calls play() right away,
//   3. retries on loadedmetadata/canplay/loadeddata and then on a short
//      interval, because mobile blocks the first attempt until the source
//      is buffered.
//
// To get SOUND on mobile, callers pass an onPlaying callback: playback must
// begin muted (autoplay policy), and once it's actually running the caller
// un-mutes through its player's own API (the raw <video>.muted is overridden
// by player mute state, e.g. Clappr/plyr).

export function forceAutoplay(
  video: HTMLVideoElement | null | undefined,
  {
    onPlaying,
    maxAttempts = 6,
    forceMuted,
  }: { onPlaying?: () => void; maxAttempts?: number; forceMuted?: boolean } = {}
): () => void {
  if (!video) return () => {};

  // Mobile browsers only autoplay a muted video; desktop allows sound. Mute on
  // touch/mobile devices (or when explicitly requested). Decorative autoplay
  // videos (background, hero, card previews) are muted in their JSX regardless.
  let isMobile = forceMuted;
  if (isMobile === undefined && typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    const hasTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
    isMobile = hasTouch || /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  }

  if (isMobile) {
    video.muted = true;
    video.setAttribute('muted', '');
  }
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  let stopped = false;
  let attempts = 0;
  let started = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  // Fire onPlaying exactly once, as soon as playback is actually running. Both
  // the 'playing' event and the paused-detection paths converge here so the
  // callback isn't dropped when play() resolves before the event queues.
  const markStarted = () => {
    if (started || stopped) return;
    started = true;
    onPlaying?.();
    cleanup();
  };

  const playAttempt = () => {
    if (stopped) return;
    attempts += 1;
    try {
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {}).catch(() => {});
      }
      if (!video.paused) markStarted();
    } catch {
      // sync throw (metadata not ready yet) — keep retrying
    }
  };

  const cleanup = () => {
    if (interval) clearInterval(interval);
    interval = null;
    video.removeEventListener('playing', playingHandler);
    video.removeEventListener('loadedmetadata', playAttempt);
    video.removeEventListener('canplay', playAttempt);
    video.removeEventListener('loadeddata', playAttempt);
  };

  const playingHandler = () => markStarted();

  video.addEventListener('playing', playingHandler);
  video.addEventListener('loadedmetadata', playAttempt);
  video.addEventListener('canplay', playAttempt);
  video.addEventListener('loadeddata', playAttempt);
  playAttempt();
  interval = setInterval(() => {
    if (stopped) return;
    if (attempts >= maxAttempts || video.paused === false) {
      if (video.paused === false) markStarted();
      else cleanup();
      return;
    }
    playAttempt();
  }, 400);

  return () => {
    stopped = true;
    cleanup();
  };
}
