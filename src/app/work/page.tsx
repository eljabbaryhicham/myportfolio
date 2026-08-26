
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
import { useCollection, useFirestore, useMemoFirebase, useUser, setDocumentNonBlocking, addDocumentNonBlocking, useDoc, useFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpDown, faXmark, faExpand, faPalette, faFilm, faArrowLeft, faArrowRight, faPencilAlt, faArrowDown, faSyncAlt, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';
import { useIsExtraWide } from '@/hooks/use-is-extra-wide';
import { useIsMobile } from '@/hooks/use-mobile';
import { PortfolioItemFormSheet } from '@/features/admin/components/PortfolioItemForm';
import MediaAdmin from '@/features/admin/components/MediaAdmin';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import { useSearchParams, usePathname } from 'next/navigation';
import type { AppUser } from '@/firebase/auth/use-user';
import dynamic from 'next/dynamic';
const CdnClapprPlayer = dynamic(() => import('@/components/CdnClapprPlayer'), { ssr: false });
import { useTranslation } from '@/lib/i18n/useTranslation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { HomePageSettings } from '@/lib/types';

const MemoizedImage = memo(Image);
// Lazy: keeps hls.js + plyr CSS out of the /work route chunk until a video
// dialog actually opens. ContactForm (zod + react-hook-form + lottie) likewise.
const MemoizedPlyrPlayer = memo(lazy(() => import('@/components/PlyrPlayer')));
const MemoizedCdnClapprPlayer = memo(CdnClapprPlayer);
const LazyContactForm = lazy(() => import('@/features/contact/components/ContactForm'));

// Markdown's raw-HTML parser follows real HTML rules where `<video ... />`
// is an UNCLOSED tag (self-closing only exists for void elements like <img>).
// Every subsequent video then nests inside the first one and only a single
// player renders. Rewrite the self-closing form to explicit open+close tags
// so embedded videos stay siblings.
const normalizeSelfClosingMedia = (md: string) =>
  md.replace(/<(video|audio)\b([^>]*?)\/>/gi, '<$1$2></$1>');

// Detects embedded media (raw HTML tags or Markdown images) inside project
// details — used to badge the "Show details" button.
const DETAILS_MEDIA_RE = /<\s*(video|audio|img|source)\b|!\[[^\]]*\]\([^)]+\)/i;
const hasDetailsMedia = (details?: string) => !!details && DETAILS_MEDIA_RE.test(details);

// Renders project-details markdown; embedded <video> tags play through the
// same player chosen for the work page (workPagePlayer setting). Memoized so
// dialog mouse-move re-renders never reset playback.
const ProjectDetailsContent = memo(function ProjectDetailsContent({
  details,
  playerType,
  onImageFullscreen,
  mediaWidth,
}: {
  details: string;
  playerType?: 'plyr' | 'clappr';
  onImageFullscreen?: (url: string) => void;
  mediaWidth?: number;
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
          {filename && (
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
      let frameWidth = widthPercent;
      const w = typeof width === 'string' ? width.trim() : '';
      if (/^\d+(\.\d+)?$/.test(w)) frameWidth = `${w}%`;
      else if (/^\d+(\.\d+)?(px|%)$/.test(w)) frameWidth = w;
      return (
        <div className="my-4 mx-auto rounded-lg border border-border/50 bg-muted/30 p-[2%]" style={{ maxWidth: widthPercent }}>
          {filename && (
            <p className="mb-2 text-center text-xs text-muted-foreground truncate">{filename}</p>
          )}
          <div
            className="details-video-frame relative aspect-video overflow-hidden rounded-md bg-black [&>*]:absolute [&>*]:inset-0"
          >
            <Suspense fallback={<Preloader />}>
              {playerType === 'plyr' ? (
                <MemoizedPlyrPlayer source={videoSrc} poster={poster} autoPlay={false} />
              ) : (
                <MemoizedCdnClapprPlayer source={videoSrc} poster={poster} autoPlay={false} />
              )}
            </Suspense>
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
        <div className="my-3 flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50 group/file" style={{ maxWidth: widthPercent, margin: '0.75rem auto' }}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FontAwesomeIcon icon={faArrowDown} className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{filename}</p>
            <p className="text-xs text-muted-foreground">File attachment</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(href, '_blank', 'noopener,noreferrer');
            }}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors no-underline cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowDown} className="h-3 w-3" />
            Download
          </button>
        </div>
      );
    },
  }), [playerType, onImageFullscreen, widthPercent]);

  return (
    <ReactMarkdown
      remarkPlugins={[[remarkGfm, { breaks: true }]]}
      rehypePlugins={[rehypeRaw, [rehypeSanitize, detailsSanitizeSchema]]}
      components={components}
    >
      {normalizedDetails}
    </ReactMarkdown>
  );
});

// GitHub-style sanitize schema doesn't know media tags — extend it so admins
// can embed <video>/<audio>/<source> in project details. Raw HTML passes
// through rehype-raw first, then gets sanitized with this schema.
const detailsSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'video', 'audio', 'source', 'a'],
  attributes: {
    ...defaultSchema.attributes,
    video: [...(defaultSchema.attributes?.video || []), 'src', 'controls', 'autoplay', 'loop', 'muted', 'playsinline', 'poster', 'preload', 'width', 'height', 'title', 'data-*'],
    audio: ['src', 'controls', 'loop', 'muted', 'preload'],
    source: ['src', 'type'],
    a: [...(defaultSchema.attributes?.a || []), 'href', 'download', 'target', 'rel', 'title', 'data-*'],
  },
};


const MemoizedPortfolioMedia = memo(({
  item,
  onFullscreenClick,
  watermark,
  playerType,
  autoPlay,
  plyrRef,
}: {
  item: PortfolioItem;
  onFullscreenClick: (url: string) => void;
  watermark?: string;
  playerType?: 'plyr' | 'clappr';
  autoPlay: boolean;
  plyrRef: React.Ref<any>;
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  // Images own their preloader here — same principle as the video players:
  // hide it only when the bitmap is actually loaded and painted.
  const [isImageLoading, setIsImageLoading] = useState(true);

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

    return (
      <div ref={containerRef} className="relative aspect-video bg-black flex items-center justify-center w-full overflow-hidden">
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
                  source={item.sourceUrl} 
                  poster={videoPoster}
                  autoPlay={autoPlay}
                  thumbnailVttUrl={item.thumbnailVttUrl}
              />
          ) : (
              <MemoizedCdnClapprPlayer
                  key={item.id}
                  source={item.sourceUrl} 
                  poster={videoPoster}
                  watermark={watermark}
                  autoPlay={autoPlay}
              />
          )
        )}
      </div>
    );
  }
  
  return (
      <div ref={containerRef} className="relative aspect-video bg-black flex justify-center items-center group/media w-full">
        {isImageLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center">
            <Preloader />
          </div>
        )}
        <MemoizedImage
          src={item.sourceUrl || item.thumbnailUrl}
          alt={item.title}
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
  const { t } = useTranslation();
  const [isLoaded, setIsLoaded] = useState(false);
  // Hover preview (desktop only): mount a muted looping <video> / full image
  // over the thumbnail while hovered; unmounting on leave frees the decoder.
  const [isHovering, setIsHovering] = useState(false);

  // Dedicated hover-preview media if provided, else the main media URL.
  // Lets admins give HLS-only projects a lightweight mp4/webm preview.
  const previewSource = item.previewUrl || item.sourceUrl;

  const canHover = () =>
    typeof window !== 'undefined' && !window.matchMedia('(hover: none)').matches;

  const handleMouseEnter = () => { if (canHover()) setIsHovering(true); };
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
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-md transition-all duration-300 md:hover:scale-[1.02] aspect-square',
          'bg-black/20'
        )}
        onClick={onClick}
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
          alt={item.title}
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
            src={previewSource}
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
            alt={item.title}
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
                {item.title}
              </h3>
              <p className="text-white/80 text-xs md:text-sm line-clamp-2">
                {item.description}
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

const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

export default function WorkPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  // Auth-settle only: Firestore rules need the auth token, not the user
  // profile doc, so don't wait for useUser()'s extra profile read.
  const { isUserLoading: isAuthSettling } = useFirebase();
  const { toast } = useToast();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);

  // NOTE: no server-side orderBy — Firestore silently excludes documents that
  // are missing the 'order' field, which made the page show "no projects"
  // even when projects existed. We sort client-side instead.
  // Also wait for auth to settle before subscribing, otherwise a cold session
  // (refresh → navigate from home) can hit security rules before the token
  // is restored and fail the first read.
  const projectsQuery = useMemoFirebase(
    () => (firestore && !isAuthSettling ? collection(firestore, 'projects') : null),
    [firestore, isAuthSettling]
  );
  const {
    data: portfolioItems,
    isLoading: isPortfolioLoading,
  } = useCollection<PortfolioItem>(projectsQuery);

  const contactDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'contact', 'details') : null),
    [firestore]
  );
  const { data: contactInfo } = useDoc(contactDocRef);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<HomePageSettings>(settingsDocRef);

  const selectedSlug = searchParams.get('id');

  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<PortfolioItem | null>(null);
  const [isFormSheetOpen, setIsFormSheetOpen] = useState(false);
  
  const [visibleItemsCount, setVisibleItemsCount] = useState<number | null>(null);
  const [itemsPerLoad, setItemsPerLoad] = useState<number>(12);

  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isDescriptionLong, setIsDescriptionLong] = useState(false);
  const isExtraWide = useIsExtraWide();
  const [isCloseButtonVisible, setIsCloseButtonVisible] = useState(false);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);
  const plyrRef = useRef<any>(null);
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void } | null>(null);
  const [dialogActiveTab, setDialogActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const [dialogActiveLibrary, setDialogActiveLibrary] = useState<'primary' | 'extented'>('primary');
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  // Swipe-to-navigate is started MANUALLY from designated areas only
  // (title/description + media content). This keeps the prev/next buttons
  // outside the drag gesture entirely, so taps can never be hijacked.
  const dragControls = useDragControls();
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');

  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
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
    if (isMobile) {
        const mobileInitialLoad = 8;
        setItemsPerLoad(mobileInitialLoad);
        setVisibleItemsCount(prev => prev === null ? mobileInitialLoad - 1 : prev);
        return;
    }

    if (gridRef.current) {
        const itemMinWidth = 300; // Corresponds to `minmax(300px, 1fr)`
        const gridGap = 16; // Corresponds to `gap-4`

        const gridWidth = gridRef.current.offsetWidth;
        const columnCount = Math.max(1, Math.floor((gridWidth + gridGap) / (itemMinWidth + gridGap)));
        
        const itemHeightWithGap = (gridWidth / columnCount);
        
        const gridHeight = window.innerHeight * 0.8;
        const rowCount = Math.max(1, Math.floor(gridHeight / itemHeightWithGap));
        
        const calculatedCount = columnCount * rowCount;
        setItemsPerLoad(calculatedCount);
        setVisibleItemsCount(prev => prev === null ? calculatedCount - 1 : prev);
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
    const player = plyrRef.current?.plyr;
    if (player) {
        if (isDialogOpen) {
            player.pause();
        }
    }
  }, [isDialogOpen]);


  const showMoreItems = () => {
    setVisibleItemsCount(prev => (prev || 0) + itemsPerLoad);
  };

  // Effect to set selected item based on URL (deep links + back/forward).
  // Skips when the selection already matches — otherwise every prev/next
  // click re-fired handleItemClick after the URL landed, wiping `direction`
  // mid-transition and leaving AnimatePresence an empty shell on slow devices.
  useEffect(() => {
    if (!selectedSlug || !portfolioItems) return;
    const item = portfolioItems.find(p => slugify(p.title) === selectedSlug);
    if (item && item.id !== selectedItem?.id) {
      handleItemClick(item);
    } else if (!item) {
      setSelectedItem(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug, portfolioItems]);
  
  const updateUrl = useCallback((slug: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('id', slug);
    } else {
      params.delete('id');
    }
    // Shallow URL update: keep the project link shareable WITHOUT triggering
    // an App Router navigation — router.push caused a full route transition
    // per click that blanked the details dialog on slow/mobile connections.
    const url = `${pathname}?${params.toString()}`;
    window.history.replaceState(window.history.state, '', url);
  }, [pathname, searchParams]);

  const handleItemClick = useCallback((item: PortfolioItem) => {
    setDirection(null);
    setSelectedItem(item);
    updateUrl(slugify(item.title));
  }, [updateUrl]);
  
  const minOrder = useMemo(() => {
    if (!portfolioItems || portfolioItems.length === 0) return 0;
    return Math.min(...portfolioItems.map(i => i.order || 0));
  }, [portfolioItems]);

  const handleMainDialogOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedItem(null);
      updateUrl(null);
    }
  };

  useEffect(() => {
    if (selectedItem) {
      const LONG_DESCRIPTION_THRESHOLD = 150;
      setIsDescriptionLong(
        (selectedItem.description?.length || 0) > LONG_DESCRIPTION_THRESHOLD
      );
    } else {
      setIsDescriptionLong(false);
    }
  }, [selectedItem]);

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

  const handleDialogMouseMove = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    setIsCloseButtonVisible(true);
    inactivityTimer.current = setTimeout(() => {
      setIsCloseButtonVisible(false);
    }, 1000);
  };

  const handleDialogMouseEnter = () => {
    setIsCloseButtonVisible(true);
  };

  const handleDialogMouseLeave = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    setIsCloseButtonVisible(false);
  };

  const handleEditItem = (item: PortfolioItem) => {
    setSelectedItemForEdit(item);
    setIsFormSheetOpen(true);
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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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

  const isLoading =
    isPortfolioLoading || portfolioItems === null || (isProjectListEmpty && !emptyResultConfirmed);

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
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };
  
  const gridStyle = isMobile 
    ? { gridTemplateColumns: 'repeat(2, 1fr)' } 
    : { gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' };

  const logoUrl = homeSettings?.homePageLogoUrl || contactInfo?.logoUrl;
  const workPagePlayer = homeSettings?.workPagePlayer || 'clappr';

  return (
    <>
      <div className="h-full w-full flex flex-col">
        <div className="p-4 md:p-8 pb-4 flex-shrink-0">
          <div className="container mx-auto px-0">
            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-headline tracking-tight">{homeSettings?.workHeading || t('work.heading')}</h1>
              <p className="mt-2 max-w-2xl mx-auto text-base md:text-lg text-foreground/70">
                {homeSettings?.workSubtitle || t('work.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <Button variant={filter === 'all' ? 'destructive' : 'outline'} onClick={() => setFilter('all')}>
                {t('work.filter.all')}
              </Button>
              <Button variant={filter === 'image' ? 'destructive' : 'outline'} onClick={() => setFilter('image')}>
                <FontAwesomeIcon icon={faPalette} className="mr-2 h-4 w-4" />
                {t('work.filter.graphics')}
              </Button>
              <Button variant={filter === 'video' ? 'destructive' : 'outline'} onClick={() => setFilter('video')}>
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
                    {isLoading ? (
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
              "w-[90vw] max-w-7xl",
              isExtraWide || isDescriptionLong ? "h-[90dvh]" : "max-h-[90dvh]"
            )}
            onMouseMove={handleDialogMouseMove}
            onMouseEnter={handleDialogMouseEnter}
            onMouseLeave={handleDialogMouseLeave}
          >
            <motion.div
                onDragEnd={handleDragEnd}
                drag={isMobile ? "x" : false}
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
                        <div className="text-center" onPointerDown={(e) => { if (isMobile) dragControls.start(e); }}>
                          <DialogTitle className="text-base md:text-2xl font-headline">
                            {selectedItem.title}
                          </DialogTitle>
                          <DialogDescription className="text-sm md:text-base text-center text-foreground/70 mt-2 md:mt-4 whitespace-pre-wrap max-w-2xl mx-auto">
                              {selectedItem.description}
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
                      
                      <ScrollArea className="flex-1 min-h-0">
                        <div className="relative flex flex-col justify-center h-full" onPointerDown={(e) => { if (isMobile) dragControls.start(e); }}>
                          <div className="w-full">
                            {isClient && (
                              <Suspense fallback={null}>
                                <MemoizedPortfolioMedia
                                  item={selectedItem}
                                  onFullscreenClick={setFullscreenImageUrl}
                                  watermark={logoUrl}
                                  playerType={workPagePlayer}
                                  autoPlay={!isDialogOpen}
                                  plyrRef={plyrRef}
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
                                  {hasDetailsMedia(selectedItem.details) && (
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
                    </div>
                  </motion.div>
              )}
            </AnimatePresence>
            </motion.div>
            <DialogClose className={cn(
                "absolute right-4 top-4 z-30 h-10 w-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:hover:opacity-100",
                isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
            )}>
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              <span className="sr-only">{t('work.details.close')}</span>
            </DialogClose>
          </DialogContent>
      </Dialog>
      
      {/* Nested Dialog for Details */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="w-[80vw] h-[80dvh] md:h-[90dvh] glass-effect p-0 flex flex-col group"
          onMouseMove={handleDialogMouseMove}
          onMouseEnter={handleDialogMouseEnter}
          onMouseLeave={handleDialogMouseLeave}
        >
            {selectedItem && (
                <>
                <DialogHeader className="p-4 md:p-6 pb-0">
                    <DialogTitle className="font-headline">{t('work.details.title').replace('{title}', selectedItem.title)}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1">
                    <div className="project-details prose dark:prose-invert max-w-none space-y-4 text-sm text-foreground/80 p-4 md:p-6">
                        <ProjectDetailsContent details={selectedItem.details || ''} playerType={workPagePlayer} onImageFullscreen={setFullscreenImageUrl} mediaWidth={homeSettings?.mediaWidth} />
                    </div>
                </ScrollArea>
                 <DialogClose className={cn(
                    "absolute top-4 right-4 z-[101] h-10 w-10 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center md:hover:!opacity-100 ring-offset-background transition-opacity focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
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
        <DialogContent className="w-[80vw] max-w-xl glass-effect">
            <DialogHeader>
              <DialogTitle className="font-headline">{t('work.details.contactTitle')}</DialogTitle>
              <DialogDescription>
                {t('work.details.contactDescription').replace('{title}', selectedItem?.title || '')}
              </DialogDescription>
            </DialogHeader>
            <Suspense fallback={<div className="h-64" />}>
              <LazyContactForm
                  onSuccess={() => setIsContactFormOpen(false)}
                  defaultMessage={selectedItem ? t('work.details.contactDefaultMessage').replace('{title}', selectedItem.title) : ''}
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
              isMobile ? "opacity-70" : (isCloseButtonVisible ? "opacity-70" : "opacity-0")
          )}>
              <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
              <span className="sr-only">{t('work.details.close')}</span>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {!!user && (
        <>
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
          />
          <MediaAdmin 
            isDialog={true}
            isOpen={isLibraryOpen}
            onOpenChange={(isOpen) => {
                setIsLibraryOpen(isOpen);
                if (!isOpen) {
                    setLibrarySelectionConfig(null);
                }
            }}
            onMediaSelect={(url, type, filename) => {
              if (librarySelectionConfig?.onSelect) {
                librarySelectionConfig.onSelect(url, type, filename);
              }
            }}
            isSelectionMode={!!librarySelectionConfig}
            onSelectionComplete={() => {
              setIsLibraryOpen(false);
              setLibrarySelectionConfig(null);
            }}
            activeTab={dialogActiveTab}
            setActiveTab={setDialogActiveTab}
            activeLibrary={dialogActiveLibrary}
            setActiveLibrary={setDialogActiveLibrary}
            newlyUploadedId={null}
          />
        </>
      )}
    </>
  );
}
