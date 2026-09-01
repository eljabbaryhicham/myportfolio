// Robust autoplay for <video> elements.
//
// This helper:
//   1. sets the unmuted + playsinline PROPERTIES (not just attributes),
//   2. calls play() right away,
//   3. retries on loadedmetadata/canplay/loadeddata and then on a short
//      interval, because some browsers block the first attempt until the
//      source is buffered.
//
// NOTE: playback is FORCE-UNMUTED. Browsers (especially iOS Safari and
// Android Chrome) block unmuted autoplay — a user gesture is required — so
// on mobile the initial play() is rejected and the video will NOT autoplay
// until the visitor interacts. Desktop may autoplay with sound if the
// browser's autoplay policy allows it.

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
  // Force-unmute: playback always attempts with sound. Note that browsers
  // block unmuted autoplay on mobile (a user gesture is required), so on
  // mobile the initial play() is rejected and the video will NOT autoplay at
  // all until the visitor interacts. Desktop may autoplay with sound if the
  // browser's autoplay policy allows it.
  video.muted = false;
  video.removeAttribute('muted');
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  let stopped = false;
  let attempts = 0;
  let started = false;
  // Set to true once the user explicitly pauses AFTER playback has started.
  // While true, the auto-retry interval must not call play() again, otherwise
  // the user's pause is undone ~400ms later by the next tick. Cleared when the
  // user presses play again so re-resume still works.
  let userPaused = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  // Fire onPlaying exactly once, as soon as playback is actually running. Both
  // the 'playing' event and the paused-detection paths converge here so the
  // callback isn't dropped when play() resolves before the event queues.
  // NOTE: we deliberately do NOT cleanup here. Tearing down the listeners/interval
  // at this point strips the 'pause' handler that guards against auto-resuming,
  // and races with the interval being assigned right after the initial playAttempt
  // (clearInterval would miss it). The retry interval below instead cleans up once
  // a started video is paused, so a user pause is never undone.
  const markStarted = () => {
    if (started || stopped) return;
    started = true;
    onPlaying?.();
  };

  const playAttempt = () => {
    if (stopped || userPaused) return;
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
    video.removeEventListener('pause', pausedHandler);
    video.removeEventListener('play', userPlayHandler);
    video.removeEventListener('loadedmetadata', playAttempt);
    video.removeEventListener('canplay', playAttempt);
    video.removeEventListener('loadeddata', playAttempt);
  };

  const playingHandler = () => markStarted();
  // Only treat a pause as a user pause if playback had already started —
  // players (Clappr, Plyr) emit a transient pause during source load/switch
  // that must not abort the auto-retry. The interval handles the actual stop.
  const pausedHandler = () => {
    if (started) userPaused = true;
  };
  // When the user presses play again, clear the flag so a future source reload
  // (or unmount) doesn't get auto-retried if the component re-runs forceAutoplay.
  const userPlayHandler = () => { userPaused = false; };

  video.addEventListener('playing', playingHandler);
  video.addEventListener('pause', pausedHandler);
  video.addEventListener('play', userPlayHandler);
  video.addEventListener('loadedmetadata', playAttempt);
  video.addEventListener('canplay', playAttempt);
  video.addEventListener('loadeddata', playAttempt);
  playAttempt();
  interval = setInterval(() => {
    if (stopped) return;
    if (video.paused === false) {
      // Already playing — nothing more to retry, but keep listeners so a later
      // user pause is respected.
      markStarted();
      return;
    }
    // Playback started (autoplay established) and the user has since paused it,
    // or the user paused during retries, or we've maxed out: stop forever.
    // Never call play() again — a user pause must not be auto-resumed.
    if (started || userPaused || attempts >= maxAttempts) {
      cleanup();
      return;
    }
    playAttempt();
  }, 400);

  return () => {
    stopped = true;
    cleanup();
  };
}
