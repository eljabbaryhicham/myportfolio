
'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { useState, memo, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { usePortfolioItems } from '@/components/portfolio/portfolio-items-provider';
import { collection, doc } from 'firebase/firestore';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useHomePageSettings } from '@/components/settings/home-page-settings-provider';
import { useContactInfo } from '@/components/settings/contact-info-provider';
import { UploadProgressProvider } from '@/components/upload-progress-context';
import { usePageReveal } from '@/lib/use-page-reveal';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpDown, faXmark, faExpand, faCompress, faPalette, faFilm, faArrowLeft, faArrowRight, faPencilAlt, faArrowDown, faSyncAlt, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';
import { useIsExtraWide } from '@/hooks/use-is-extra-wide';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHasMounted } from '@/hooks/use-has-mounted';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import type { AppUser } from '@/firebase/auth/use-user';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getLocalizedString } from '@/lib/i18n/multilingual';
import { isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';
import { cleanVideoUrl, webmVideoUrl } from '@/lib/video';
import { getWatermarkPositionStyle, hasDetailsMedia, normalizeSelfClosingMedia, slugify } from '@/features/portfolio/components/work-helpers';
import { useWorkUrlSync } from '@/features/portfolio/components/useWorkUrlSync';

let playersPreloaded = false;
function preloadPlayers() {
  if (playersPreloaded) return;
  playersPreloaded = true;
  import('@/components/CdnClapprPlayer');
  import('@/components/PlyrPlayer');
  import('hls.js').catch(() => {});
}

// Admin-only editors/media-picker: code-split out of the public route chunk so
// visitors to /work don't download them. Rendered only when an admin is signed in.
const PortfolioItemFormSheet = dynamic(() => import('@/features/admin/components/PortfolioItemForm').then((m) => m.PortfolioItemFormSheet), { ssr: false });
const UnifiedMediaPicker = dynamic(() => import('@/features/admin/components/UnifiedMediaPicker'), { ssr: false });
const LazyContactForm = lazy(() => import('@/features/contact/components/ContactForm'));
// Markdown renderer (react-markdown + remark + rehype + parse5 + micromark):
// code-split out of the /work first-load bundle. Only loads when a project's
// details dialog is opened.
const MarkdownRenderer = dynamic(() => import('@/components/work/markdown-renderer'), { ssr: false });

// Neither player is needed to render the gallery. Keeping them behind a lazy
// boundary prevents the /work navigation from downloading Clappr/Plyr until a
// visitor opens a project's video. `preloadPlayers` above still warms these
// chunks on intentional hover.
const LazyPlyrPlayer = lazy(() => import('@/components/PlyrPlayer'));
const LazyCdnClapprPlayer = lazy(() => import('@/components/CdnClapprPlayer'));
const MemoizedPlyrPlayer = memo(LazyPlyrPlayer);
const MemoizedCdnClapprPlayer = memo(LazyCdnClapprPlayer);

const MemoizedImage = memo(Image);

// Android: defer heavy Clappr/Plyr init past the dialog's enter
// animation. iOS/desktop keep the original immediate behaviour.
function LazyDetailsVideo({
  videoSrc,
  poster,
  playerType,
  watermark,
  watermarkSize,
  watermarkOpacity,
  watermarkPosition,
}: {
  videoSrc: string;
  poster?: string;
  playerType?: 'plyr' | 'clappr';
  watermark?: string;
  watermarkSize?: number;
  watermarkOpacity?: number;
  watermarkPosition?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [inView, setInView] = useState(false);
  const [activated, setActivated] = useState(false);
  // Latch: once the video has actually started playing, never show the
  // preloader again — even if buffering/loadstart re-triggers a loading
  // state in the player. Hide as soon as playback starts, not when the
  // buffer is full.
  const [hasPlayed, setHasPlayed] = useState(false);
  const isAndroid = useMemo(() => typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent), []);
  const [ready, setReady] = useState(false);
  const shouldLoad = inView || activated;
  useEffect(() => {
    if (!shouldLoad) return;
    // The player's imperative handle exposes isLoading = !hasPlayed. It
    // flips to false the moment playback starts and never flips back
    // (loadstart after first play no longer re-shows the preloader).
    const check = () => {
      const data = playerRef.current;
      if (data && typeof data === 'object' && 'isLoading' in data && data.isLoading === false) {
        setHasPlayed(true);
      }
    };
    check();
    const interval = setInterval(check, 200);
    return () => clearInterval(interval);
  }, [shouldLoad]);
  useEffect(() => {
    if (!isAndroid) { setReady(true); return; }
    const t = setTimeout(() => setReady(true), 420);
    return () => clearTimeout(t);
  }, [isAndroid]);
  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    if (!el) return;
    if (activated) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: '240px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [activated, ready]);
  if (!shouldLoad) {
    return (
      <div
        ref={ref}
        className="absolute inset-0 flex flex-col items-center justify-center bg-black cursor-pointer select-none touch-manipulation"
        role="button"
        tabIndex={0}
        aria-label="Play video"
        onClick={() => setActivated(true)}
        onTouchEnd={(e) => { e.preventDefault(); setActivated(true); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActivated(true); } }}
      >
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" loading="lazy" decoding="async" />
        ) : null}
        <div className="relative z-10 flex flex-col items-center gap-2 text-white/90 pointer-events-none">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 border border-white/20 shadow-lg">
            <FontAwesomeIcon icon={faFilm} className="h-6 w-6" />
          </span>
          <span className="text-xs tracking-wide text-white/70">Tap to play</span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative w-full h-full">
      {!hasPlayed && (
        // pointer-events-none so clicks reach the underlying player's play
        // button when autoPlay is off; the spinner still shows on top.
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 pointer-events-none">
          <Preloader />
        </div>
      )}
      <Suspense fallback={null}>
        {playerType === 'plyr' ? (
          <MemoizedPlyrPlayer ref={playerRef} source={cleanVideoUrl(videoSrc) || videoSrc} poster={poster} autoPlay={false} />
        ) : (
          <MemoizedCdnClapprPlayer ref={playerRef} source={cleanVideoUrl(videoSrc) || videoSrc} poster={poster} autoPlay={false} />
        )}
      </Suspense>
      {watermark && hasPlayed && (
        <div className="absolute pointer-events-none z-20" style={{ ...getWatermarkPositionStyle(watermarkPosition || 'bottom-right'), width: `${watermarkSize ?? 12}%`, minWidth: '50px', maxWidth: '250px', textAlign: 'center', opacity: (watermarkOpacity ?? 70) / 100 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- watermark URLs are admin-configured and may use arbitrary hosts. */}
          <img src={watermark} alt="watermark" style={{ maxWidth: '100%' }} loading="lazy" />
        </div>
      )}
    </div>
  );
}

// Renders project-details markdown; embedded <video> tags play through the
// same player chosen for the work page (workPagePlayer setting). Memoized so
// dialog mouse-move re-renders never reset playback.
const ProjectDetailsContent = memo(function ProjectDetailsContent({
  details,
  playerType,
  onImageFullscreen,
  mediaWidth,
  showMediaTitles = true,
  watermark,
  watermarkSize,
  watermarkOpacity,
  watermarkPosition,
}: {
  details: string;
  playerType?: 'plyr' | 'clappr';
  onImageFullscreen?: (url: string) => void;
  mediaWidth?: number;
  showMediaTitles?: boolean;
  watermark?: string;
  watermarkSize?: number;
  watermarkOpacity?: number;
  watermarkPosition?: string;
}) {
  const normalizedDetails = useMemo(() => normalizeSelfClosingMedia(details), [details]);
  const widthPercent = mediaWidth && mediaWidth < 100 ? `${mediaWidth}%` : '100%';

  const components = useMemo(() => ({
    img: (props: any) => {
      const { src, alt } = props;
      if (!src) return null;
      const filename = alt && alt !== 'media' ? alt : null;
      return (
        <div className="my-4 mx-auto rounded-lg border border-border/50 bg-muted/30 p-[2%]" style={{ maxWidth: widthPercent }}>
          {showMediaTitles && filename && (
            <p className="mb-2 text-center text-xs text-muted-foreground truncate">{filename}</p>
          )}
          <span className="relative inline-block group/img max-w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={alt || ''} className="block max-w-full h-auto rounded-md mx-auto" />
            {onImageFullscreen && (
              <button
                type="button"
                aria-label="Fullscreen"
                onClick={() => onImageFullscreen(src)}
                className="absolute top-2 right-2 h-8 w-8 rounded-md bg-black/60 text-white opacity-70 md:opacity-0 md:group-hover/img:opacity-100 transition-opacity flex items-center justify-center hover:bg-black/80"
              >
                <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
              </button>
            )}
          </span>
        </div>
      );
    },
    video: (props: any) => {
      const { src, poster, children, width, ...rest } = props;
      let videoSrc: string | undefined = src;
      if (!videoSrc && children) {
        const kids = Array.isArray(children) ? children : [children];
        const sourceChild = kids.find(
          (c: any) => c?.props?.src && typeof c.type === 'string' && c.type === 'source'
        );
        if (sourceChild) videoSrc = sourceChild.props.src;
      }
      if (!videoSrc) return <video {...rest}>{children}</video>;
      const filename = rest['title'] || null;
      return (
        <div className="my-4 mx-auto rounded-lg border border-border/50 bg-muted/30 p-[2%]" style={{ maxWidth: widthPercent }}>
          {showMediaTitles && filename && (
            <p className="mb-2 text-center text-xs text-muted-foreground truncate">{filename}</p>
          )}
          <div
            className="details-video-frame relative aspect-video overflow-hidden rounded-md bg-black [&>*]:absolute [&>*]:inset-0"
          >
            <LazyDetailsVideo videoSrc={videoSrc} poster={poster} playerType={playerType} watermark={watermark} watermarkSize={watermarkSize} watermarkOpacity={watermarkOpacity} watermarkPosition={watermarkPosition} />
          </div>
        </div>
      );
    },
    a: (props: any) => {
      const { href, download, children, ...rest } = props;
      const filename = rest['title'] || (typeof children === 'string' ? children : '') || 'Download';
      if (!download || !href) {
        if (href?.startsWith('/') && !href?.startsWith('//')) {
          return <Link href={href} {...rest}>{children}</Link>;
        }
        return <a href={href} {...rest}>{children}</a>;
      }
      return (
        <div
          className="group/file my-3 flex max-w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-card/40 p-3 shadow-sm transition-all duration-200 hover:border-border hover:bg-card/70 hover:shadow-md box-border sm:gap-3.5 sm:p-3.5"
          style={{ maxWidth: widthPercent === '100%' ? '100%' : `min(${widthPercent}, 100%)`, width: '100%', marginLeft: 'auto', marginRight: 'auto' }}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition-colors group-hover/file:bg-primary/15 group-hover/file:ring-primary/25">
            <FontAwesomeIcon icon={faArrowDown} className="h-4 w-4 transition-transform duration-200 group-hover/file:-translate-y-0.5" />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate break-all text-sm font-medium leading-tight text-foreground">{filename}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">File attachment</p>
          </div>
          <a
            href={href}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground shadow-sm transition-all duration-200 hover:bg-destructive/90 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faArrowDown} className="h-3 w-3 text-destructive-foreground" />
            Download
          </a>
        </div>
      );
    },
  }), [playerType, onImageFullscreen, widthPercent, showMediaTitles, watermark, watermarkOpacity, watermarkPosition, watermarkSize]);

  return (
    <Suspense fallback={null}>
      <MarkdownRenderer details={normalizedDetails} components={components} />
    </Suspense>
  );
});


const MemoizedPortfolioMedia = memo(({
  item,
  onFullscreenClick,
  watermark,
  watermarkSize,
  watermarkOpacity,
  watermarkPosition,
  playerType,
  autoPlay,
  plyrRef,
  clapprRef,
  maximized = false,
}: {
  item: PortfolioItem;
  onFullscreenClick: (url: string) => void;
  watermark?: string;
  watermarkSize?: number;
  watermarkOpacity?: number;
  watermarkPosition?: string;
  playerType?: 'plyr' | 'clappr';
  autoPlay: boolean;
  plyrRef: React.Ref<any>;
  clapprRef?: React.Ref<any>;
  maximized?: boolean;
}) => {
  const { t, lang } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  // Images own their preloader here — same principle as the video players:
  // hide it only when the bitmap is actually loaded and painted.
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(item.type === 'video');

  useEffect(() => {
    if (item.type === 'video') return;

    const root = containerRef.current;
    const img = root?.querySelector('img');
    let safety: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (safety) clearTimeout(safety);
      setIsImageLoading(false);
    };

    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        finish();
        return;
      }
      const done = () => requestAnimationFrame(finish);
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true }); // never hang on broken src
    }
    // Absolute fallback so the popup can't stay covered forever.
    safety = setTimeout(finish, 8000);
    return () => { if (safety) clearTimeout(safety); };
  }, [item.id, item.type, item.sourceUrl, item.thumbnailUrl]);

  useEffect(() => {
    if (item.type !== 'video') {
      setIsVideoLoading(false);
      return;
    }
    setIsVideoLoading(true);
    const check = () => {
      const p = (plyrRef as any)?.current;
      const c = (clapprRef as any)?.current;
      const pv = p && typeof p.isLoading === 'boolean' ? p.isLoading : null;
      const cv = c && typeof c.isLoading === 'boolean' ? c.isLoading : null;
      if (pv !== null || cv !== null) {
        const loading = (pv ?? cv ?? true) as boolean;
        setIsVideoLoading(loading);
        return !loading;
      }
      return false;
    };
    if (check()) return;
    const id = setInterval(() => { if (check()) clearInterval(id); }, 200);
    const safety = setTimeout(() => setIsVideoLoading(false), 8000);
    return () => { clearInterval(id); clearTimeout(safety); };
  }, [item.id, item.type, playerType, autoPlay, clapprRef, plyrRef]);

  if (item.type === 'video') {
    const isVimeo = item.sourceUrl?.includes('vimeo.com');
    const isYoutube = item.sourceUrl?.includes('youtube.com') || item.sourceUrl?.includes('youtu.be');

    // Poster delivered WITH the video: Cloudinary auto-generates <id>.jpg next
    // to every video derivative, so derive it from the source instead of using
    // the card thumbnail. Embeds (YouTube/Vimeo) keep their own poster logic.
    let videoPoster: string | undefined;
    if (isVimeo || isYoutube) {
      videoPoster = item.useVideoFrameAsPoster ? undefined : item.thumbnailUrl;
    } else {
      const derived = item.sourceUrl
        ? item.sourceUrl.replace(/\.(mp4|webm|mov|m3u8)(\?.*)?$/i, '.jpg$2')
        : '';
      videoPoster = derived || item.thumbnailUrl;
    }

    // Clean Cloudinary URLs (strip duplicated transforms, force .mp4) so the
    // <video> element decodes deterministically on mobile — embeds untouched.
    const playableSource = (isVimeo || isYoutube)
      ? item.sourceUrl
      : cleanVideoUrl(item.sourceUrl);

    return (
      <div ref={containerRef} className={cn("relative bg-black flex items-center justify-center overflow-hidden", maximized ? "w-full h-full min-h-[200px] [&>*]:absolute [&>*]:inset-0" : "aspect-video w-full")}>
        {item.sourceUrl && (
          (isVimeo || isYoutube) ? (
            <MemoizedPlyrPlayer
                ref={plyrRef}
                key={item.id}
                source={item.sourceUrl}
                poster={videoPoster}
                autoPlay={autoPlay}
                thumbnailVttUrl={item.thumbnailVttUrl}
            />
          ) : playerType === 'plyr' ? (
              <MemoizedPlyrPlayer
                  ref={plyrRef}
                  key={item.id}
                  source={playableSource || item.sourceUrl}
                  poster={videoPoster}
                  autoPlay={autoPlay}
                  thumbnailVttUrl={item.thumbnailVttUrl}
              />
          ) : (
              <MemoizedCdnClapprPlayer
                  ref={clapprRef as any}
                  key={item.id}
                  source={playableSource || item.sourceUrl}
                  poster={videoPoster}
                  autoPlay={autoPlay}
              />
          )
        )}
        {watermark && !isVideoLoading && (
          <div className="absolute pointer-events-none z-20" style={{ ...getWatermarkPositionStyle(watermarkPosition || 'bottom-right'), width: `${watermarkSize ?? 12}%`, minWidth: '50px', maxWidth: '250px', textAlign: 'center', opacity: (watermarkOpacity ?? 70) / 100 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- watermark URLs are admin-configured and may use arbitrary hosts. */}
            <img src={watermark} alt="watermark" style={{ maxWidth: '100%' }} loading="lazy" />
          </div>
        )}
      </div>
    );
  }
  
  return (
      <div ref={containerRef} className={cn("relative bg-black flex justify-center items-center w-full", maximized ? "h-full min-h-[200px] [&>*]:absolute [&>*]:inset-0 group/media" : "aspect-video group/media")}>
        {isImageLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <Preloader />
          </div>
        )}
        <MemoizedImage
          src={item.sourceUrl || item.thumbnailUrl}
          alt={getLocalizedString(item.title, lang)}
          fill
          className={cn("object-contain", isImageLoading ? 'opacity-0' : 'opacity-100')}
        />
        <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-9 w-9 md:h-10 md:w-10 text-white bg-black/60 opacity-70 md:opacity-0 md:group-hover/media:opacity-100 transition-opacity hover:bg-black/80"
            onClick={() => onFullscreenClick(item.sourceUrl || item.thumbnailUrl)}
          >
            <FontAwesomeIcon icon={faExpand} className="h-4 w-4 md:h-5 md:w-5" />
            <span className="sr-only">{t('work.details.fullscreen')}</span>
        </Button>
      </div>
    );
});
MemoizedPortfolioMedia.displayName = 'MemoizedPortfolioMedia';


const PortfolioGridItem = ({ item, onClick, onEditClick, isAdmin, isSuperAdmin, onSwitchPlayer, isPriority }: { item: PortfolioItem, onClick: () => void, onEditClick: () => void, isAdmin: boolean, isSuperAdmin: boolean, onSwitchPlayer: () => void, isPriority?: boolean }) => {
  const { t, lang } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  // Hover preview (desktop only): mount a muted looping <video> / full image
  // over the thumbnail while hovered; unmounting on leave frees the decoder.
  const [isHovering, setIsHovering] = useState(false);

  // Dedicated hover-preview media if provided, else the main media URL.
  // Lets admins give HLS-only projects a lightweight mp4/webm preview.
  const previewSource = item.previewUrl || item.sourceUrl;

  const hoverSource = item.previewUrl ? previewSource : webmVideoUrl(previewSource);

  const canHover = () =>
    typeof window !== 'undefined' && !window.matchMedia('(hover: none)').matches;

  const handleMouseEnter = () => { if (canHover()) { setIsHovering(true); preloadPlayers(); } };
  const handleMouseLeave = () => { setIsHovering(false); };

  // Native <video> preview only for progressively-streamable sources —
  // HLS (.m3u8) needs hls.js outside Safari, so keep the thumbnail there.
  const showVideoPreview =
    isHovering && item.type === 'video' &&
    !!previewSource && !previewSource.includes('.m3u8');

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the main onClick from firing
    onEditClick();
  };

  const handleSwitchPlayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSwitchPlayer();
  };

  return (
    <div className="p-[2px] rounded-lg glass-effect">
      <div
        role="button"
        tabIndex={0}
        aria-label={`Open ${item.title}`}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 md:hover:scale-[1.02] aspect-square focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'bg-black/20'
        )}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Preloader />
          </div>
        )}
        <Image
          src={item.thumbnailUrl}
          alt={getLocalizedString(item.title, lang)}
          fill
          priority={!!isPriority}
          fetchPriority={isPriority ? "high" : "auto"}
          className={cn(
            "object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100 md:group-hover:scale-105" : "opacity-0"
          )}
          data-ai-hint={item.thumbnailHint}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onLoad={() => setIsLoaded(true)}
        />
        {showVideoPreview && (
          <video
            src={hoverSource}
            poster={item.thumbnailUrl}
            className="absolute inset-0 w-full h-full object-cover animate-in fade-in duration-500"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          />
        )}
        {isHovering && item.type === 'image' && previewSource && previewSource !== item.thumbnailUrl && (
          <MemoizedImage
            src={previewSource}
            alt={getLocalizedString(item.title, lang)}
            fill
            className="object-cover animate-in fade-in duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        )}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-2 md:p-4",
          !isLoaded && "opacity-100 bg-none" // Show overlay content while loading
        )}>
          {isLoaded ? (
            <>
              <h3 className="font-bold text-white text-base md:text-lg">
                {getLocalizedString(item.title, lang)}
              </h3>
              <p className="text-white/80 text-xs md:text-sm line-clamp-2">
                {getLocalizedString(item.description, lang)}
              </p>
            </>
          ) : (
             <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"/>
          )}
        </div>
        {item.type === 'video' && isLoaded && (
          <div className="absolute top-4 right-4 w-[20%] h-[20%] flex items-center justify-center rounded-full glass-effect transition-colors">
            <FontAwesomeIcon icon={faFilm} className="h-1/2 w-1/2 text-white/80" />
          </div>
        )}
        {item.type === 'image' && isLoaded && (
            <div className="absolute top-4 right-4 w-[20%] h-[20%] flex items-center justify-center rounded-full glass-effect transition-colors">
                <FontAwesomeIcon icon={faPalette} className="h-1/2 w-1/2 text-white/80" />
            </div>
        )}
        {(isAdmin || (isSuperAdmin && item.type === 'video')) && isLoaded && (
          <div className="absolute top-4 left-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            {isAdmin && (
              <Button
                variant="default"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEditClick}
              >
                <FontAwesomeIcon icon={faPencilAlt} className="h-4 w-4" />
                <span className="sr-only">{t('work.details.editProject')}</span>
              </Button>
            )}
            {isSuperAdmin && item.type === 'video' && (
              <Button
                variant="destructive"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSwitchPlayerClick}
                title={t('work.details.switchPlayer')}
              >
                <FontAwesomeIcon icon={faSyncAlt} className="h-4 w-4" />
                <span className="sr-only">{t('work.details.switchPlayer')}</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default function WorkPage() {
  return (
    <Suspense fallback={<WorkPageLoading />}>
      <WorkPageContent />
    </Suspense>
  );
}

function WorkPageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <Preloader />
    </div>
  );
}

function WorkPageContent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { selectedSlug, updateUrl } = useWorkUrlSync();
  const { t, lang } = useTranslation();

  const typedUser = user as AppUser | null;
  const isSuperAdmin = isSuperAdminCheck(typedUser);
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);

  // Projects are publicly readable — no auth needed. Sourced from the shared
  // provider (server-seeded for first paint + live subscription after hydration).
  const {
    items: portfolioItems,
    isLoading: isPortfolioLoading,
    error: portfolioError,
  } = usePortfolioItems();

  const contactInfo = useContactInfo().contactInfo;

  // homepage/settings is sourced from the shared provider (server-seeded + live).
  const { settings: homeSettings } = useHomePageSettings();
  // Inline page-reveal gate: while the page is still loading AND a custom
  // preloader is configured, keep the gallery area behind the preloader.
  const { ready: revealReady, hasPreloader } = usePageReveal();
  // Local settingsDocRef kept for superadmin write operations (player toggle, etc).
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );

  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<PortfolioItem | null>(null);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  
  const [visibleItemsCount, setVisibleItemsCount] = useState<number | null>(null);
  const [itemsPerLoad, setItemsPerLoad] = useState<number>(12);
  const [gridColumnCount, setGridColumnCount] = useState<number | null>(null);

  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);
  const isExtraWide = useIsExtraWide();
  const [isCloseButtonVisible, setIsCloseButtonVisible] = useState(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const hasMounted = useHasMounted();
  const gridRef = useRef<HTMLDivElement>(null);
  const plyrRef = useRef<any>(null);
  const clapprRef = useRef<any>(null);
  const mainMediaRef = useRef<HTMLDivElement>(null);
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void } | null>(null);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  // Swipe-to-navigate is started MANUALLY from designated areas only
  // (title/description + media content). This keeps the prev/next buttons
  // outside the drag gesture entirely, so taps can never be hijacked.
  const dragControls = useDragControls();
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [isProjectMaximized, setIsProjectMaximized] = useState(false);
  const isDialogOpen = isDetailsModalOpen || isContactFormOpen;

  const allItems = useMemo(() => {
    const visible = (portfolioItems || []).filter(item => item.isVisible !== false);
    return [...visible].sort(
      (a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER)
    );
  }, [portfolioItems]);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    return allItems.filter(item => item.type === filter);
  }, [allItems, filter]);
  
  const calculateAndSetItems = useCallback(() => {
    const calcColumnCount = (width: number) => Math.max(2, Math.floor((width + 16) / (300 + 16)));

    if (isMobile) {
        setGridColumnCount(
          typeof window !== 'undefined' ? calcColumnCount(window.innerWidth) : null
        );
        const mobileInitialLoad = 8;
        setItemsPerLoad(mobileInitialLoad);
        setVisibleItemsCount(prev => prev === null ? mobileInitialLoad - 1 : prev);
        return;
    }

    if (gridRef.current) {
        const gridWidth = gridRef.current.offsetWidth;
        const columnCount = calcColumnCount(gridWidth);
        setGridColumnCount(columnCount);

        const itemHeightWithGap = (gridWidth / columnCount);
        
        const gridHeight = window.innerHeight * 0.8;
        const rowCount = Math.max(1, Math.floor(gridHeight / itemHeightWithGap));
        
        const calculatedCount = columnCount * rowCount;
        setItemsPerLoad(calculatedCount);
        setVisibleItemsCount(prev => prev === null ? calculatedCount - 1 : prev);
        return;
    }

    // Desktop fallback: gridRef may not be attached yet on the first pass
    // (e.g. when the page is gated by a post-mount loading state). Pick a
    // reasonable default based on viewport so projects still appear, and let
    // the resize listener recompute once the ref is in place.
    if (typeof window !== 'undefined') {
      const fallbackGap = 16;
      const fallbackColumnCount = calcColumnCount(window.innerWidth);
      setGridColumnCount(fallbackColumnCount);
      const fallbackRowCount = Math.max(
        1,
        Math.floor((window.innerHeight * 0.8) / ((window.innerWidth / fallbackColumnCount) + fallbackGap))
      );
      const fallbackCount = fallbackColumnCount * fallbackRowCount;
      setItemsPerLoad(fallbackCount);
      setVisibleItemsCount(prev => prev === null ? fallbackCount - 1 : prev);
    }
  }, [isMobile]);

  useEffect(() => {
    // Only run this on the client
    setIsClient(true);
    calculateAndSetItems();

    window.addEventListener('resize', calculateAndSetItems);
    
    return () => {
      window.removeEventListener('resize', calculateAndSetItems);
    };
  }, [calculateAndSetItems]);

  // When filters change, reset the visible count
  useEffect(() => {
    setVisibleItemsCount(prev => (prev === null ? null : itemsPerLoad -1));
  }, [filter, itemsPerLoad]);

  useEffect(() => {
    const plyrPlayer = plyrRef.current?.plyr || plyrRef.current;
    if (plyrPlayer) {
        try { if (isDialogOpen && plyrPlayer.pause) plyrPlayer.pause(); } catch {}
        try { if (isDialogOpen && plyrPlayer.plyr?.pause) plyrPlayer.plyr.pause(); } catch {}
    }
    const clapprPlayer = clapprRef.current;
    if (clapprPlayer) {
        try { 
          if (isDialogOpen) {
            if (typeof clapprPlayer.pause === 'function') clapprPlayer.pause();
            else if (clapprPlayer.playerRef?.current?.pause) clapprPlayer.playerRef.current.pause();
            else if (typeof clapprPlayer.isPlaying === 'function' && clapprPlayer.isPlaying()) clapprPlayer.pause();
          }
        } catch {}
    }
    // Bulletproof: while ANY work dialog (details/contact) is open, keep THE MAIN
    // POPUP video paused. A player re-initializes/autoplays when a nested dialog
    // mounts, so a one-shot pause isn't enough — we also intercept any `play` on
    // that video and immediately re-pause. Scoped to mainMediaRef only so videos
    // inside the details modal (click-to-play) keep their intended behavior.
    if (isDialogOpen && typeof document !== 'undefined') {
      const pauseMainVideo = () => {
        const root = mainMediaRef.current;
        if (!root) return;
        root.querySelectorAll('video').forEach((v) => {
          try { if (typeof v.pause === 'function') v.pause(); } catch {}
        });
      };
      pauseMainVideo();
      // 'play' doesn't bubble, but a capturing listener on document still fires
      // for any descendant — intercept the main popup's video and re-pause.
      const onPlayCapture = (e: Event) => {
        const t = e.target as HTMLVideoElement | null;
        if (t && t.tagName === 'VIDEO' && mainMediaRef.current?.contains(t) === true && !t.paused) {
          try { t.pause(); } catch {}
        }
      };
      document.addEventListener('play', onPlayCapture, true);
      return () => {
        document.removeEventListener('play', onPlayCapture, true);
      };
    }
  }, [isDialogOpen]);

  // Android only: background decoder competes with details decoders.
  // iOS must stay exactly as before.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && !/Android/i.test(navigator.userAgent)) return;
    if (typeof document === 'undefined') return;
    const bgWrap = document.querySelector('div.-z-10') as HTMLElement | null;
    const bgVideo = bgWrap?.querySelector('video') as HTMLVideoElement | null;
    const anyOpen = !!selectedItem || isDetailsModalOpen || isContactFormOpen || !!fullscreenImageUrl;
    if (anyOpen) {
      if (bgVideo && !bgVideo.paused) {
        bgVideo.pause();
        (bgWrap as any)._pausedByDialog = true;
      }
      if (bgWrap) bgWrap.style.visibility = 'hidden';
      document.documentElement.classList.add('work-dialog-open');
    } else {
      if (bgWrap) bgWrap.style.visibility = '';
      document.documentElement.classList.remove('work-dialog-open');
      if (bgWrap && (bgWrap as any)._pausedByDialog) {
        delete (bgWrap as any)._pausedByDialog;
        bgVideo?.play().catch(() => {});
      }
    }
    return () => {
      if (bgWrap) bgWrap.style.visibility = '';
      document.documentElement.classList.remove('work-dialog-open');
    };
  }, [selectedItem, isDetailsModalOpen, isContactFormOpen, fullscreenImageUrl]);


  const showMoreItems = () => {
    setVisibleItemsCount(prev => (prev || 0) + itemsPerLoad);
  };

  // Effect to set selected item based on URL (deep links + back/forward).
  // Skips when the selection already matches — otherwise every prev/next
  // click re-fired handleItemClick after the URL landed, wiping `direction`
  // mid-transition and leaving AnimatePresence an empty shell on slow devices.
  useEffect(() => {
    if (!selectedSlug || !portfolioItems) return;
    const item = portfolioItems.find(p => slugify(getLocalizedString(p.title, lang)) === selectedSlug);
    if (item && item.id !== selectedItem?.id) {
      handleItemClick(item);
    } else if (!item) {
      setSelectedItem(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug, portfolioItems]);
  
  const handleItemClick = useCallback((item: PortfolioItem) => {
    setDirection(null);
    setSelectedItem(item);
    updateUrl(slugify(getLocalizedString(item.title, lang)));
  }, [updateUrl, lang]);
  
  const minOrder = useMemo(() => {
    if (!portfolioItems || portfolioItems.length === 0) return 0;
    return Math.min(...portfolioItems.map(i => i.order || 0));
  }, [portfolioItems]);

  const handleMainDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
      setIsProjectMaximized(false);
      updateUrl(null);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      const LONG_DESCRIPTION_THRESHOLD = 150;
      setIsDescriptionLong(
        (getLocalizedString(selectedItem.description, lang).length || 0) > LONG_DESCRIPTION_THRESHOLD
      );
    } else {
      setIsDescriptionLong(false);
    }
  }, [selectedItem, lang]);

  const handleNextProject = useCallback(() => {
    if (!selectedItem || !filteredItems) return;
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    const nextItem = filteredItems[nextIndex];
    handleItemClick(nextItem);
    setDirection('next');
  }, [selectedItem, filteredItems, handleItemClick]);

  const handlePreviousProject = useCallback(() => {
    if (!selectedItem || !filteredItems) return;
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    const prevItem = filteredItems[prevIndex];
    handleItemClick(prevItem);
    setDirection('prev');
  }, [selectedItem, filteredItems, handleItemClick]);

  const handleDialogMouseMove = useCallback(() => {
    if (isMobile) return;
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    setIsCloseButtonVisible(true);
    inactivityTimer.current = setTimeout(() => {
      setIsCloseButtonVisible(false);
    }, 1000);
  }, [isMobile]);

  const handleDialogMouseEnter = useCallback(() => {
    if (isMobile) return;
    setIsCloseButtonVisible(true);
  }, [isMobile]);

  const handleDialogMouseLeave = useCallback(() => {
    if (isMobile) return;
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    setIsCloseButtonVisible(false);
  }, [isMobile]);

  const handleEditItem = (item: PortfolioItem) => {
    setSelectedItemForEdit(item);
    setIsFormSheetOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (!firestore || !canEditProjects || !id) return;
    deleteDocumentNonBlocking(doc(firestore, 'projects', id));
    toast({ title: t('projectAdmin.toast.deleted.title'), description: t('projectAdmin.toast.deleted.description') });
    setIsFormSheetOpen(false);
    setSelectedItemForEdit(null);
    if (selectedItem?.id === id) { setSelectedItem(null); updateUrl(null); }
  };

  const handlePortfolioFormSubmit = (values: PortfolioItem) => {
    if (!firestore) return;
    if(!canEditProjects) {
        toast({
            variant: 'destructive',
            title: t('work.toast.permissionDenied.title'),
            description: t('work.toast.permissionDenied.description'),
        });
        return;
    }

    if (values.id) {
      const dataToSave = { ...values, order: values.order ?? 0 };
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
      toast({
        title: t('work.toast.changesSaved.title'),
        description: t('work.toast.changesSaved.description'),
      });
    } else {
      const dataToSave = { ...values, order: minOrder - 1 };
      addDocumentNonBlocking(collection(firestore, 'projects'), dataToSave);
      toast({
        title: t('work.toast.itemAdded.title'),
        description: t('work.toast.itemAdded.description'),
      });
    }
    setIsFormSheetOpen(false);
  };

  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void) => {
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!isMobile) return;
    const swipeThreshold = 50;
    const swipeVelocityThreshold = 300;

    if (info.offset.x > swipeThreshold && info.velocity.x > swipeVelocityThreshold) {
      handlePreviousProject();
    } else if (info.offset.x < -swipeThreshold && info.velocity.x < -swipeVelocityThreshold) {
      handleNextProject();
    }
  };

  const handleSwitchPlayer = () => {
    if (!settingsDocRef || !isSuperAdmin) return;
    const cycle: Record<string, string> = { plyr: 'clappr', clappr: 'plyr' };
    const newPlayer = cycle[homeSettings?.workPagePlayer || 'clappr'] || 'plyr';
    setDocumentNonBlocking(settingsDocRef, { workPagePlayer: newPlayer }, { merge: true });
    const names: Record<string, string> = { plyr: 'Plyr', clappr: 'Clappr' };
    toast({
      title: t('work.toast.playerSwitched.title'),
      description: t('work.toast.playerSwitched.description').replace('{player}', names[newPlayer] || newPlayer),
    });
  };
  
  const effectiveItemsCount = visibleItemsCount || 0;
  const itemsToShow = useMemo(() => {
      if (visibleItemsCount === null) return [];
      return filteredItems.slice(0, effectiveItemsCount);
  }, [filteredItems, effectiveItemsCount, visibleItemsCount]);

  const showMoreButtonNeeded = visibleItemsCount !== null && filteredItems.length > effectiveItemsCount;

  // Preloader while fetching (also while auth settles / on fetch errors —
  // a toast already reports blocked reads). A confirmed-empty result must
  // survive a short grace period before we trust it: Firestore can deliver
  // a transient empty snapshot on a cold session right before the real docs.
  // Filter-specific empties (e.g. no videos) are shown immediately.
  const [emptyResultConfirmed, setEmptyResultConfirmed] = useState(false);
  const isProjectListEmpty =
    !isPortfolioLoading && portfolioItems !== null && allItems.length === 0;

  useEffect(() => {
    if (!isProjectListEmpty) {
      setEmptyResultConfirmed(false);
      return;
    }
    const timer = setTimeout(() => setEmptyResultConfirmed(true), 2000);
    return () => clearTimeout(timer);
  }, [isProjectListEmpty]);

  // A failed read is distinguishable from still-loading: the hook reports an
  // error and no data. Surfaces a message instead of an endless preloader.
  const hasFailed = portfolioError !== null && portfolioItems === null;

  const isLoading =
    !hasFailed &&
    (isPortfolioLoading || portfolioItems === null || (isProjectListEmpty && !emptyResultConfirmed));

  // Gallery-area gate: show the inline preloader while data loads OR while the
  // page is still revealing (when a custom preloader is configured).
  const showGalleryPreloader = isLoading || (hasPreloader && !revealReady);

  const variants = {
    enter: (direction: 'next' | 'prev' | null) => ({
      x: direction === 'next' ? '100%' : direction === 'prev' ? '-100%' : '0%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: '0%',
      opacity: 1,
      scale: 1,
    },
    exit: (direction: 'next' | 'prev' | null) => ({
      x: direction === 'prev' ? '100%' : direction === 'next' ? '-100%' : '0%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };
  
  const gridStyle = gridColumnCount
    ? { gridTemplateColumns: `repeat(${gridColumnCount}, minmax(0, 1fr))` }
    : { gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' };

  const workPagePlayer = homeSettings?.workPagePlayer || 'clappr';
  const watermarkLogoUrl = homeSettings?.watermarkLogoUrl || homeSettings?.homePageLogoUrl || contactInfo?.logoUrl || '';
  const watermarkSize = homeSettings?.watermarkSize ?? 12;
  const watermarkOpacity = homeSettings?.watermarkOpacity ?? 70;
  const watermarkPosition = homeSettings?.watermarkPosition || 'bottom-right';

  return (
    <>
      <div className="h-full w-full flex flex-col">
        <div className="p-4 md:p-8 pb-4 flex-shrink-0">
          <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-headline tracking-tight">{getLocalizedString(homeSettings?.workHeading, lang) || t('work.heading')}</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                {getLocalizedString(homeSettings?.workSubtitle, lang) || t('work.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Button aria-pressed={filter === 'all'} variant={filter === 'all' ? 'destructive' : 'outline'} onClick={() => setFilter('all')}>
                {t('work.filter.all')}
              </Button>
              <Button aria-pressed={filter === 'image'} variant={filter === 'image' ? 'destructive' : 'outline'} onClick={() => setFilter('image')}>
                <FontAwesomeIcon icon={faPalette} className="mr-2 h-4 w-4" />
                {t('work.filter.graphics')}
              </Button>
              <Button aria-pressed={filter === 'video'} variant={filter === 'video' ? 'destructive' : 'outline'} onClick={() => setFilter('video')}>
                <FontAwesomeIcon icon={faFilm} className="mr-2 h-4 w-4" />
                {t('work.filter.animation')}
              </Button>
            </div>
          </div>
        </div>
        <Separator className="bg-white/10 flex-shrink-0" />

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-8 pt-4 flex items-center justify-center min-h-full">
            <div className="container mx-auto px-0 min-h-full flex items-center justify-center">
              <AnimatePresence>
                <motion.div
                    key={filter}
                    ref={gridRef}
                    className="grid gap-4 w-full"
                    style={gridStyle}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {hasFailed ? (
                      <div className="col-span-full h-full min-h-[50vh] flex flex-col items-center justify-center text-center gap-3">
                        <div className="text-foreground/40 text-lg">{t('common.error.title')}</div>
                        <p className="text-foreground/30 text-sm max-w-md">{t('common.error.description')}</p>
                      </div>
                    ) : showGalleryPreloader ? (
                      <div className="col-span-full h-full min-h-[50vh] flex items-center justify-center">
                        <Preloader />
                      </div>
                    ) : filteredItems.length === 0 ? (
                      <div className="col-span-full h-full min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
                        <div className="text-foreground/40 text-lg">{t('work.empty.title')}</div>
                        <p className="text-foreground/30 text-sm max-w-md">
                          {filter === 'all'
                            ? t('work.empty.description')
                            : filter === 'video'
                              ? t('work.empty.filteredVideo')
                              : t('work.empty.filteredImage')}
                        </p>
                      </div>
                    ) : (
                      <>
                        {itemsToShow.map((item, idx) => (
                          <motion.div key={item.id} variants={itemVariants}>
                            <PortfolioGridItem 
                              item={item}
                              onClick={() => handleItemClick(item)}
                              onEditClick={() => handleEditItem(item)}
                              isAdmin={!!user}
                              isSuperAdmin={isSuperAdmin}
                              onSwitchPlayer={handleSwitchPlayer}
                              isPriority={idx < 3}
                            />
                          </motion.div>
                        ))}
                        {showMoreButtonNeeded && (
                          <motion.div
                            variants={itemVariants}
                            className="p-[2px] rounded-lg glass-effect"
                          >
                            <div
                              className="group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 md:hover:scale-[1.02] aspect-square bg-black/20"
                              onClick={showMoreItems}
                            >
                              <div className="w-full h-full rounded-md flex flex-col items-center justify-center text-center p-4 transition-colors duration-300 md:group-hover:bg-black/40">
                                <FontAwesomeIcon icon={faArrowDown} className="h-10 w-10 text-white/70 mb-4 transition-transform duration-300 md:group-hover:translate-y-1" />
                                <h3 className="font-bold text-white text-lg">{t('work.showMore')}</h3>
                                <p className="text-white/60 text-sm">
                                  {t('work.showMore.count').replace('{count}', String(filteredItems.length - itemsToShow.length))}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
            </div>
          </div>
        </ScrollArea>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={handleMainDialogOpenChange}>
          <DialogContent
            className={cn(
              "glass-effect p-0 flex flex-col group overflow-hidden",
              isProjectMaximized
                ? "w-[95vw] h-[95dvh] max-w-none"
                : cn(
                    "w-[90vw] max-w-7xl",
                    isExtraWide || isDescriptionLong ? "h-[90dvh]" : "max-h-[90dvh]"
                  )
            )}
            onMouseMove={handleDialogMouseMove}
            onMouseEnter={handleDialogMouseEnter}
            onMouseLeave={handleDialogMouseLeave}
          >
            <motion.div
                onDragEnd={handleDragEnd}
                drag={hasMounted && isMobile ? "x" : false}
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                className="flex-1 flex flex-col min-h-0 h-full w-full"
            >
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              {selectedItem && (
                  <motion.div
                    className='h-full w-full flex flex-col'
                    key={selectedItem.id}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                  >
                    <div className="flex flex-col flex-1 min-h-0 h-full">
                      <DialogHeader className="p-4 md:p-6 flex-shrink-0 relative">
                        <div className="text-center" onPointerDown={(e) => { if (hasMounted && isMobile) dragControls.start(e); }}>
                          <DialogTitle className="text-base md:text-2xl font-headline px-[20%]">
                            {getLocalizedString(selectedItem.title, lang)}
                          </DialogTitle>
                          <DialogDescription className="text-sm md:text-base text-center text-foreground/70 mt-2 md:mt-4 whitespace-pre-wrap max-w-2xl mx-auto">
                              {getLocalizedString(selectedItem.description, lang)}
                          </DialogDescription>
                        </div>
                      
                        <div className="mt-4 flex justify-between px-8 md:px-0 md:block">
                          <Button
                              variant="outline"
                              size="icon"
                              onClick={handlePreviousProject}
                              disabled={filteredItems.length <= 1}
                              className="z-30 md:absolute md:left-16 md:top-1/2 md:-translate-y-1/2 h-10 w-10 md:h-10 md:w-10"
                          >
                              <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4 md:h-5 md:w-5" />
                              <span className="sr-only">{t('work.details.previous')}</span>
                          </Button>
                          <Button
                              variant="outline"
                              size="icon"
                              onClick={handleNextProject}
                              disabled={filteredItems.length <= 1}
                              className="z-30 md:absolute md:right-16 md:top-1/2 md:-translate-y-1/2 h-10 w-10 md:h-10 md:w-10"
                          >
                              <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 md:h-5 md:w-5" />
                              <span className="sr-only">{t('work.details.next')}</span>
                          </Button>
                        </div>
                      </DialogHeader>
                      
                      <Separator className="bg-white/10 my-0" />
                      
                      {isProjectMaximized ? (
                        <div className="flex-1 min-h-0 flex flex-col">
                          <div className="flex-1 min-h-0" ref={mainMediaRef}>
                            {isClient && (
                              <Suspense fallback={null}>
                                <MemoizedPortfolioMedia
                                   item={selectedItem}
                                   onFullscreenClick={setFullscreenImageUrl}
                                   watermark={watermarkLogoUrl}
                                   watermarkSize={watermarkSize}
                                   watermarkOpacity={watermarkOpacity}
                                   watermarkPosition={watermarkPosition}
                                   playerType={workPagePlayer}
                                   autoPlay={!isDialogOpen}
                                   maximized={isProjectMaximized}
                                   plyrRef={plyrRef}
                                   clapprRef={clapprRef}
                                 />
                              </Suspense>
                            )}
                          </div>
                          <div className="p-4 md:p-6 text-center flex flex-wrap justify-center gap-4 flex-shrink-0">
                            {selectedItem.details && (
                                <div className="relative">
                                  <Button
                                    variant="default"
                                    onClick={() => setDetailsModalOpen(true)}
                                  >
                                    <FontAwesomeIcon icon={faUpDown} className="mr-2" />
                                    {t('work.details.showDetails')}
                                  </Button>
                                  {hasDetailsMedia(getLocalizedString(selectedItem.details, lang)) && (
                                    <span
                                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shadow-md"
                                      title={t('work.details.mediaBadge')}
                                    >
                                      <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3" />
                                    </span>
                                  )}
                                </div>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => setIsContactFormOpen(true)}
                              className="h-auto py-2 px-4 leading-tight text-center"
                            >
                              {t('work.details.askAbout')}
                            </Button>
                          </div>
                        </div>
                      ) : (
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="relative flex flex-col justify-center h-full" onPointerDown={(e) => { if (hasMounted && isMobile) dragControls.start(e); }}>
                          <div className="w-full" ref={mainMediaRef}>
                            {isClient && (
                              <Suspense fallback={null}>
                                <MemoizedPortfolioMedia
                                   item={selectedItem}
                                   onFullscreenClick={setFullscreenImageUrl}
                                   watermark={watermarkLogoUrl}
                                   watermarkSize={watermarkSize}
                                   watermarkOpacity={watermarkOpacity}
                                   watermarkPosition={watermarkPosition}
                                   playerType={workPagePlayer}
                                   autoPlay={!isDialogOpen}
                                   plyrRef={plyrRef}
                                   clapprRef={clapprRef}
                                 />
                              </Suspense>
                            )}
                          </div>
                          <div className="p-4 md:p-6 text-center flex flex-wrap justify-center gap-4 flex-shrink-0">
                            {selectedItem.details && (
                                <div className="relative">
                                  <Button
                                    variant="default"
                                    onClick={() => setDetailsModalOpen(true)}
                                  >
                                    <FontAwesomeIcon icon={faUpDown} className="mr-2" />
                                    {t('work.details.showDetails')}
                                  </Button>
                                  {hasDetailsMedia(getLocalizedString(selectedItem.details, lang)) && (
                                    <span
                                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground shadow-md"
                                      title={t('work.details.mediaBadge')}
                                    >
                                      <FontAwesomeIcon icon={faCircleExclamation} className="h-3 w-3" />
                                    </span>
                                  )}
                                </div>
                            )}
                            <Button
                              variant="secondary"
                              onClick={() => setIsContactFormOpen(true)}
                              className="h-auto py-2 px-4 leading-tight text-center"
                            >
                              {t('work.details.askAbout')}
                            </Button>
                          </div>
                        </div>
                      </ScrollArea>
                      )}
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
            <DialogClose className={cn(
                "absolute right-4 top-4 z-30 h-10 w-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hover:opacity-100",
                hasMounted && isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0 focus:opacity-100 focus-visible:opacity-100")
            )}>
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">{t('work.details.close')}</span>
            </DialogClose>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsProjectMaximized(prev => !prev)}
              className={cn(
                "absolute right-4 top-[3.5rem] z-30 h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white hover:text-white border-0 flex items-center justify-center ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                hasMounted && isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0 focus:opacity-100 focus-visible:opacity-100")
              )}
              title={isProjectMaximized ? t('work.details.restore') : t('work.details.maximize')}
            >
              <FontAwesomeIcon icon={isProjectMaximized ? faCompress : faExpand} className="h-4 w-4" />
              <span className="sr-only">{isProjectMaximized ? t('work.details.restore') : t('work.details.maximize')}</span>
            </Button>
          </DialogContent>
      </Dialog>
      
      {/* Nested Dialog for Details */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent id="work-details-dialog" className="w-[80vw] max-w-[95vw] min-w-0 overflow-hidden h-[80dvh] md:h-[90dvh] glass-effect p-0 flex flex-col group"
          onMouseMove={handleDialogMouseMove}
          onMouseEnter={handleDialogMouseEnter}
          onMouseLeave={handleDialogMouseLeave}
        >
            {selectedItem && (
                <>
                <DialogHeader className="p-4 md:p-6 pb-0 min-w-0">
                    <DialogTitle className="font-headline text-base sm:text-lg md:text-xl break-words leading-tight hyphens-auto">{t('work.details.title').replace('{title}', getLocalizedString(selectedItem.title, lang))}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 min-w-0 [&>div>div]:!block [&>div>div]:min-w-0 [&>div>div]:w-full">
                    <div className="project-details prose prose-sm sm:prose-base dark:prose-invert max-w-full w-full min-w-0 overflow-hidden break-words space-y-4 text-xs sm:text-sm text-foreground/80 p-3 sm:p-4 md:p-6 box-border prose-p:my-2 prose-p:leading-relaxed prose-headings:break-words prose-h1:text-lg sm:prose-h1:text-xl prose-h2:text-base sm:prose-h2:text-lg prose-h3:text-sm sm:prose-h3:text-base prose-li:text-xs sm:prose-li:text-sm prose-a:break-all">
                        <ProjectDetailsContent details={getLocalizedString(selectedItem.details, lang)} playerType={workPagePlayer} onImageFullscreen={setFullscreenImageUrl} mediaWidth={homeSettings?.mediaWidth} showMediaTitles={homeSettings?.showMediaTitles ?? true} watermark={watermarkLogoUrl} watermarkSize={watermarkSize} watermarkOpacity={watermarkOpacity} watermarkPosition={watermarkPosition} />
                    </div>
                </ScrollArea>
                 <DialogClose className={cn(
                    "absolute top-4 right-4 z-[101] h-10 w-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center md:hover:!opacity-100 ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    hasMounted && isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0 focus:opacity-100 focus-visible:opacity-100")
                  )}>
                    <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                    <span className="sr-only">{t('work.details.close')}</span>
                </DialogClose>
                </>
            )}
        </DialogContent>
      </Dialog>
      
      {/* Contact Form Dialog */}
      <Dialog open={isContactFormOpen} onOpenChange={setIsContactFormOpen}>
        <DialogContent id="work-contact-dialog" className="w-[80vw] max-w-xl glass-effect">
            <DialogHeader>
              <DialogTitle className="font-headline">{t('work.details.contactTitle')}</DialogTitle>
              <DialogDescription>
                {t('work.details.contactDescription').replace('{title}', selectedItem ? getLocalizedString(selectedItem.title, lang) : '')}
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<div className="h-64" />}>
              <LazyContactForm
                  onSuccess={() => setIsContactFormOpen(false)}
                  defaultMessage={selectedItem ? t('work.details.contactDefaultMessage').replace('{title}', getLocalizedString(selectedItem.title, lang)) : ''}
              />
            </Suspense>
            <DialogClose className={cn(
                "absolute right-4 top-4 h-10 w-10",
                "flex items-center justify-center rounded-full transition-opacity",
                "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:pointer-events-none"
            )}>
                <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
                <span className="sr-only">{t('work.details.close')}</span>
            </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImageUrl} onOpenChange={(open) => !open && setFullscreenImageUrl(null)}>
        <DialogContent className="w-[80vw] h-[90dvh] glass-effect p-0 flex flex-col items-center justify-center bg-black/80 border-0 group"
          onMouseMove={handleDialogMouseMove}
          onMouseEnter={handleDialogMouseEnter}
          onMouseLeave={handleDialogMouseLeave}
        >
          <DialogTitle className="sr-only">{t('work.details.fullscreenImage')}</DialogTitle>
          {fullscreenImageUrl && (
            <div className="relative w-full h-full">
              <MemoizedImage
                src={fullscreenImageUrl}
                alt={t('work.details.fullscreenImage')}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}
          <DialogClose className={cn(
              "absolute top-4 right-4 z-[101] h-10 w-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center md:hover:!opacity-100 ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              hasMounted && isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
          )}>
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
              <span className="sr-only">{t('work.details.close')}</span>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {!!user && (
        <UploadProgressProvider>
          <PortfolioItemFormSheet 
            isOpen={isFormSheetOpen}
            setIsOpen={(isOpen) => {
                setIsFormSheetOpen(isOpen);
                if (!isOpen) {
                    setLibrarySelectionConfig(null);
                }
            }}
            item={selectedItemForEdit}
            onSubmit={handlePortfolioFormSubmit}
            onChooseFromLibrary={handleOpenLibraryForSelection}
            canEdit={canEditProjects}
            onDelete={handleDeleteItem}
          />
          <UnifiedMediaPicker
            isOpen={isLibraryOpen}
            onOpenChange={(isOpen) => {
                setIsLibraryOpen(isOpen);
                if (!isOpen) setLibrarySelectionConfig(null);
            }}
            onMediaSelect={(url, type, filename) => {
              if (librarySelectionConfig?.onSelect) {
                librarySelectionConfig.onSelect(url, type, filename);
                setIsLibraryOpen(false);
                setLibrarySelectionConfig(null);
              }
            }}
          />
        </UploadProgressProvider>
      )}
    </>
  );
}
