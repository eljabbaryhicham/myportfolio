import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Decide whether the app should use the mobile layout. A device is treated as
// mobile when the viewport is narrow OR it has a coarse (touch) primary
// pointer OR a mobile user-agent. The pointer/UA checks make Android phones and
// tablets reliably use the mobile layout even if the reported viewport width is
// at/above the CSS breakpoint (which previously left Android looking like the
// desktop menubar).
function detectMobile(): boolean {
  if (typeof window === "undefined") return false;
  let coarse = false;
  try {
    coarse = window.matchMedia("(pointer: coarse)").matches;
  } catch { /* ignore */ }
  const narrow = window.innerWidth < MOBILE_BREAKPOINT;
  const mobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return narrow || coarse || mobileUA;
}

export function useIsMobile() {
  // Initialize synchronously so the correct layout renders on the very first
  // paint. Prevents the desktop branch from flashing before swapping (e.g.
  // the nav bar appearing at the top then jumping into place on refresh).
  const [isMobile, setIsMobile] = React.useState<boolean>(() => detectMobile());

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const onChange = () => setIsMobile(detectMobile());
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const coarseMql = window.matchMedia("(pointer: coarse)");
    mql.addEventListener("change", onChange);
    coarseMql.addEventListener("change", onChange);
    setIsMobile(detectMobile());
    return () => {
      mql.removeEventListener("change", onChange);
      coarseMql.removeEventListener("change", onChange);
    };
  }, [])

  return isMobile
}
