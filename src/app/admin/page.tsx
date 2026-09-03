
'use client';

export const dynamic = 'force-dynamic';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import type { AppUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import dynamicImport from 'next/dynamic';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';
const ProjectAdmin = dynamicImport(() => import('@/features/admin/components/ProjectAdmin'), { ssr: false, loading: () => <Preloader /> });
const ContactAdmin = dynamicImport(() => import('@/features/admin/components/ContactAdmin'), { ssr: false, loading: () => <Preloader /> });
const MediaAdmin = dynamicImport(() => import('@/features/admin/components/MediaLibrary'), { ssr: false, loading: () => <Preloader /> });
const AppwriteMediaLibrary = dynamicImport(() => import('@/features/admin/components/UnifiedMediaLibrary'), { ssr: false, loading: () => <Preloader /> });
const GumletLibrary = dynamicImport(() => import('@/features/admin/components/UnifiedMediaLibrary'), { ssr: false, loading: () => <Preloader /> });
const HomeAdmin = dynamicImport(() => import('@/features/admin/components/HomeAdmin'), { ssr: false, loading: () => <Preloader /> });
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { createMultilingualString } from '@/lib/i18n/multilingual';
const PortfolioItemFormSheet = dynamicImport(() => import('@/features/admin/components/PortfolioItemForm').then(m => m.PortfolioItemFormSheet), { ssr: false, loading: () => <Preloader /> });
import { addDocumentNonBlocking, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { DEFAULT_DETAILS_TEMPLATE } from '@/features/admin/components/PortfolioItemForm';
import { useFirestore, useUser } from '@/firebase';
const AdminManagement = dynamicImport(() => import('@/features/admin/components/AdminManagement'), { ssr: false, loading: () => <Preloader /> });
const AboutAdmin = dynamicImport(() => import('@/features/admin/components/AboutAdmin'), { ssr: false, loading: () => <Preloader /> });
const UnifiedMediaPicker = dynamicImport(() => import('@/features/admin/components/UnifiedMediaPicker'), { ssr: false, loading: () => <Preloader /> });
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useUploadProgress } from '@/components/upload-progress-context';
import { isSuperAdmin as isSuperAdminCheck, hasMediaAccess } from '@/lib/constants';


function AdminPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
    
  const { user, isUserLoading } = useUser();
  const { t } = useTranslation();

  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isPortfolioSheetOpen, setIsPortfolioSheetOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void } | null>(null);
  const [libraryForceProvider, setLibraryForceProvider] = useState<'cloudinary' | 'vercel' | 'appwrite' | 'gumlet_video' | 'gumlet_image' | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('home');
  const [fromMediaLibrary, setFromMediaLibrary] = useState(false);
  const [innerMediaTab, setInnerMediaTab] = useState<'cloudinary' | 'vercel' | 'appwrite' | 'gumlet' | 'imagekit'>('cloudinary');
  
  const [newlyUploadedId, setNewlyUploadedId] = useState<string | null>(null);
  const [isVercelLibraryOpen, setIsVercelLibraryOpen] = useState(false);
  const [vercelActiveTab, setVercelActiveTab] = useState<'images' | 'videos' | 'files'>('images');
  const { setActiveMediaTab, completedUpload, consumeCompletedUpload } = useUploadProgress();

  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const safeTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(() => {
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      fn();
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const typedUser = user as AppUser | null;
  const isSuperAdmin = isSuperAdminCheck(typedUser);
  
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);
  
  // Media management is restricted to superadmin/admins (mirrors rules isAdmin()).
  // Self-registered 'user' accounts get NO media tab, pickers, or listeners.
  const canManageMedia = hasMediaAccess(typedUser);
  
  useEffect(() => {
    // Read query params from notification navigation (e.g. /admin?tab=media&innerTab=vercel&mediaTab=videos)
    // and switch to the correct admin + provider tab.
    try {
      const qs = new URLSearchParams(window.location.search);
      const tabParam = qs.get('tab');
      const innerTabParam = qs.get('innerTab');
      const validInnerTabs: Array<'cloudinary' | 'vercel' | 'appwrite' | 'gumlet' | 'imagekit'> = ['cloudinary', 'vercel', 'appwrite', 'gumlet', 'imagekit'];
      if (tabParam === 'media' && innerTabParam && validInnerTabs.includes(innerTabParam as any)) {
        setActiveTab('media');
        setInnerMediaTab(innerTabParam as any);
        // Finished navigation (docId present): open the library + highlight the
        // file. Progress navigation has no docId -> just switch the provider tab.
        const docIdParam = qs.get('docId');
        const mediaTabParam = qs.get('mediaTab') as 'images' | 'videos' | 'files' | null;
        const mediaProvider = qs.get('mediaProvider') as 'cloudinary' | 'vercel' | 'appwrite' | 'gumlet_video' | 'gumlet_image' | 'imagekit' | null;
        if (docIdParam && mediaTabParam && ['images', 'videos', 'files'].includes(mediaTabParam)) {
          if (mediaProvider === 'appwrite' || mediaProvider === 'gumlet_video' || mediaProvider === 'gumlet_image' || mediaProvider === 'imagekit') {
            safeTimeout(() => {
              window.dispatchEvent(new CustomEvent('media-managed-highlight', {
                detail: {
                  provider: mediaProvider,
                  docId: docIdParam,
                  tab: mediaTabParam,
                },
              }));
            }, 150);
          } else {
            window.dispatchEvent(new CustomEvent('media-library-maximize', {
              detail: {
                provider: innerTabParam === 'cloudinary' ? 'cloudinary' : 'vercel_blob',
                tab: mediaTabParam,
                docId: docIdParam,
                library: qs.get('library') || undefined,
              },
            }));
          }
        }
        // Clean the URL so a page refresh doesn't keep forcing the media tab.
        window.history.replaceState(null, '', '/admin');
        return;
      }
    } catch {}

    // localStorage backward compatibility
    const savedTab = localStorage.getItem('adminActiveTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    const savedInnerTab = localStorage.getItem('adminInnerMediaTab');
    if (savedInnerTab && (savedInnerTab === 'cloudinary' || savedInnerTab === 'vercel' || savedInnerTab === 'appwrite' || savedInnerTab === 'gumlet')) {
      setInnerMediaTab(savedInnerTab);
      localStorage.removeItem('adminInnerMediaTab');
    }
  }, [safeTimeout]);

  // Switch to the correct Media + provider tab WITHOUT a page reload when the
  // upload notification's "open in library" is clicked while already on /admin
  // (a reload would abort any in-flight upload). Forwards the sub-tab to the
  // media library so it opens on the matching images/videos/files view.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { provider?: 'vercel' | 'cloudinary' | 'appwrite' | 'gumlet_video' | 'gumlet_image' | 'imagekit'; mode?: string; tab?: string; docId?: string; library?: string } | undefined;
      if (!detail) return;
      setActiveTab('media');
      if (detail.provider === 'appwrite') {
        setInnerMediaTab('appwrite');
      } else if (detail.provider === 'gumlet_video' || detail.provider === 'gumlet_image') {
        setInnerMediaTab('gumlet');
      } else if (detail.provider === 'imagekit') {
        setInnerMediaTab('imagekit');
      } else {
        setInnerMediaTab(detail.provider === 'cloudinary' ? 'cloudinary' : 'vercel');
      }
      // Finished mode only: open the media library and highlight the file.
      // Progress mode: just switch to the provider tab.
      if (detail.mode === 'finished' && detail.docId) {
        if (detail.provider === 'appwrite' || detail.provider === 'gumlet_video' || detail.provider === 'gumlet_image' || detail.provider === 'imagekit') {
          safeTimeout(() => {
            window.dispatchEvent(new CustomEvent('media-managed-highlight', {
              detail: { provider: detail.provider, docId: detail.docId, tab: detail.tab || 'images' },
            }));
          }, 150);
        } else {
          const provider = detail.provider === 'cloudinary' ? 'cloudinary' : 'vercel_blob';
          window.dispatchEvent(new CustomEvent('media-library-maximize', {
            detail: {
              provider,
              tab: detail.tab || 'images',
              docId: detail.docId,
              library: detail.library,
            },
          }));
        }
      }
    };
    window.addEventListener('admin-goto-media', handler);
    return () => window.removeEventListener('admin-goto-media', handler);
  }, [safeTimeout]);
  
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'media') {
      setActiveMediaTab(innerMediaTab);
    } else {
      setActiveMediaTab(null);
    }
  }, [activeTab, innerMediaTab, setActiveMediaTab]);
  
  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    if (!user) {
      router.push('/login');
      return;
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!completedUpload) return;
    // Uploads from inside the unified media picker stay inside the picker —
    // don't yank the user out of their current form by switching tabs. The
    // picker surfaces the new file via its own Firestore listener and
    // highlight effect.
    if (completedUpload.source === 'media-picker') {
      consumeCompletedUpload();
      return;
    }
    const { docId, resourceType, libraryId, provider } = completedUpload;
    setNewlyUploadedId(docId);
    if (activeTab !== 'media') {
      setActiveTab('media');
    }
    // Switch inner media tab to match the provider that just completed
    if (provider === 'appwrite') {
      setInnerMediaTab('appwrite');
    } else if (provider === 'gumlet_video' || provider === 'gumlet_image') {
      setInnerMediaTab('gumlet');
    } else if (provider === 'imagekit') {
      setInnerMediaTab('imagekit');
    } else if (libraryId === 'vercel_blob') {
      setInnerMediaTab('vercel');
    } else {
      setInnerMediaTab('cloudinary');
    }
    // Managed providers (Appwrite/Gumlet) open their library and best-effort
    // highlight the uploaded file via a dedicated event. Defer the event so the
    // just-switched tab's media library has mounted and registered its listener
    // (it unmounts when inactive, so a synchronous dispatch would be lost).
    if (provider === 'appwrite' || provider === 'gumlet_video' || provider === 'gumlet_image' || provider === 'imagekit') {
      safeTimeout(() => {
        window.dispatchEvent(new CustomEvent('media-managed-highlight', {
          detail: {
            provider,
            docId,
            tab: resourceType === 'video' ? 'videos' : resourceType === 'raw' ? 'files' : 'images',
          },
        }));
      }, 150);
    }
    // Cloudinary/Vercel: components handle their own popups
    safeTimeout(() => setNewlyUploadedId(null), 3000);
  }, [completedUpload, activeTab, setActiveTab, consumeCompletedUpload, safeTimeout]);


  const handleLogout = async (isUnauthorized = false) => {
    if (!auth) return;
    try {
      await signOut(auth);
      if (isUnauthorized) {
          toast({
              variant: "destructive",
              title: t('admin.toast.accessDenied.title'),
              description: t('admin.toast.accessDenied.description'),
          });
      } else {
          toast({
              title: t('admin.toast.signedOut.title'),
              description: t('admin.toast.signedOut.description'),
          });
      }
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('admin.toast.error.title'),
        description: t('admin.toast.error.description'),
      });
    }
  };

  const [migrationRunning, setMigrationRunning] = useState(false);
  const handleRunMigration = async () => {
    if (!isSuperAdmin || migrationRunning) return;
    try {
      setMigrationRunning(true);
      toast({
        title: t('admin.migrationRunning'),
      });
      const token = await auth?.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      const res = await fetch('/api/admin/migrate-multilingual', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || res.statusText);
      }
      if (result.success) {
        toast({
          title: t('admin.migrationDone'),
          description: result.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('admin.migrationFailed'),
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('admin.migrationFailed'),
        description: error.message,
      });
    } finally {
      setMigrationRunning(false);
    }
  };

  const handlePortfolioFormSubmit = async (values: PortfolioItem) => {
    if (!firestore || !canEditProjects) return;

    if (values.id) {
      // Existing item
      const dataToSave = { ...values, order: values.order ?? 0 };
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
       toast({
        title: t('admin.toast.changesSaved.title'),
        description: t('admin.toast.changesSaved.description'),
      });
    } else {
      // New item — query Firestore for min order
      const q = query(collection(firestore, 'projects'), orderBy('order', 'asc'), limit(1));
      const snap = await getDocs(q);
      const minOrder = snap.empty ? 0 : (snap.docs[0].data().order ?? 0);
      const dataToSave = { ...values, order: minOrder - 1 };
      addDocumentNonBlocking(collection(firestore, 'projects'), dataToSave);
       toast({
        title: t('admin.toast.itemAdded.title'),
        description: t('admin.toast.itemAdded.description'),
      });
    }

    if (fromMediaLibrary) {
        setActiveTab('projects');
        setFromMediaLibrary(false);
    }
    setIsPortfolioSheetOpen(false);
  };
  
  const handleOpenPortfolioFormWithMedia = (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
    const title = filename.split('.').slice(0, -1).join('.'); // Remove file extension
    setSelectedPortfolioItem({
      id: '',
      title: createMultilingualString(title || 'New Project'),
      description: createMultilingualString(''),
      type: type === 'raw' ? 'image' : type,
      thumbnailUrl: type === 'video' ? '' : url, // For videos, thumbnail might be different
      sourceUrl: url,
      thumbnailHint: '',
      details: createMultilingualString(DEFAULT_DETAILS_TEMPLATE),
    } as PortfolioItem);
    setFromMediaLibrary(true);
    setIsLibraryOpen(false); // Close library
    setIsPortfolioSheetOpen(true); // Open form
  };

  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void) => {
    if (!canManageMedia) {
      toast({
        variant: 'destructive',
        title: t('admin.toast.accessDenied.title'),
        description: t('admin.toast.accessDenied.description'),
      });
      return;
    }
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };
  
  const handleDeletePortfolioItem = (id: string) => {
    if (!firestore || !canEditProjects || !id) return;
    deleteDocumentNonBlocking(doc(firestore, 'projects', id));
    toast({ title: t('projectAdmin.toast.deleted.title'), description: t('projectAdmin.toast.deleted.description') });
    setIsPortfolioSheetOpen(false);
    setSelectedPortfolioItem(null);
    if (fromMediaLibrary) setFromMediaLibrary(false);
  };

  const handlePortfolioSheetOpenChange = (isOpen: boolean) => {
    setIsPortfolioSheetOpen(isOpen);
    if (!isOpen) {
      // If form is closed, always clear the selection config
      setLibrarySelectionConfig(null);
      if (fromMediaLibrary) {
          // If form was opened from media library, reopen it on cancel
          setIsLibraryOpen(true);
          setFromMediaLibrary(false); // Reset the flag
      }
    }
  };

  const handleUploadComplete = async (docId: string, resourceType: string, libraryId?: string) => {
    if (!docId) return;
    setNewlyUploadedId(docId);
    safeTimeout(() => setNewlyUploadedId(null), 2500);
  };

  // Dedicated handler for Vercel Blob - identical semantics to handleUploadComplete above,
  // but targets the Vercel library dialog instead of Cloudinary's.
  const handleVercelUploadComplete = (docId: string, resourceType: string) => {
    if (!docId) return;
    setNewlyUploadedId(docId);
    if (activeTab !== 'media') setActiveTab('media');
    setInnerMediaTab('vercel');
    setVercelActiveTab(resourceType === 'video' ? 'videos' : resourceType === 'raw' ? 'files' : 'images');
    setIsVercelLibraryOpen(true);
    safeTimeout(() => setNewlyUploadedId(null), 3000);
  };

  // Non-media accounts must never surface the Media tab, even if a stale
  // 'media' value (localStorage / notification query params) slips in.
  const effectiveActiveTab = !canManageMedia && activeTab === 'media' ? 'home' : activeTab;

  if (isUserLoading || !user) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-transparent">
            <Preloader />
        </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full items-center justify-center min-h-full p-4">
        <div className="container mx-auto px-0 flex flex-col h-full min-h-0 w-full">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-center">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-headline tracking-tight">{t('admin.heading')}</h1>
              <p className="mt-2 text-md md:text-lg text-foreground/70 break-all">
                {t('admin.welcome').replace('{user}', typedUser?.username || typedUser?.email?.split('@')[0] || '')}
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              {isSuperAdmin && (
                <Button onClick={handleRunMigration} variant="secondary" disabled={migrationRunning}>
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2 h-4 w-4" />
                  {migrationRunning ? t('admin.migrationRunning') : t('admin.runMigration')}
                </Button>
              )}
              <Button onClick={() => handleLogout(false)} variant="secondary">
                <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 h-4 w-4" />
                {t('admin.signOut')}
              </Button>
            </div>
          </div>

          <Separator className="bg-white/10" />

          <Tabs value={effectiveActiveTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 mt-8">
            <div className="w-full flex flex-wrap justify-center items-center gap-4 md:gap-0">
              <TabsList className="flex-wrap h-auto justify-center">
                <TabsTrigger value="home" className="glass-effect data-[state=active]:bg-destructive">{t('admin.tabs.home')}</TabsTrigger>
                <TabsTrigger value="projects" className="glass-effect data-[state=active]:bg-destructive">{t('admin.tabs.projects')}</TabsTrigger>
                <TabsTrigger value="about" className="glass-effect data-[state=active]:bg-destructive">{t('admin.tabs.about')}</TabsTrigger>
                <TabsTrigger value="contact" className="glass-effect data-[state=active]:bg-destructive">{t('admin.tabs.contact')}</TabsTrigger>
              </TabsList>
              <div className="md:ml-auto">
                <TabsList className="flex-wrap h-auto justify-center">
                  {canManageMedia && <TabsTrigger value="media" className="glass-effect text-white data-[state=active]:bg-destructive data-[state=active]:animate-glow px-4 py-2">{t('admin.tabs.media')}</TabsTrigger>}
                  {isSuperAdmin && <TabsTrigger value="admins" className="glass-effect text-white data-[state=active]:bg-destructive data-[state=active]:animate-glow px-4 py-2">{t('admin.tabs.admins')}</TabsTrigger>}
                </TabsList>
              </div>
            </div>
              <Separator className="bg-white/10 mt-4" />
              <TabsContent value="home" className="flex-1 overflow-auto mt-4">
                  <HomeAdmin />
              </TabsContent>
              <TabsContent value="projects" className="flex-1 overflow-auto mt-4">
                  <ProjectAdmin 
                    setSelectedItem={setSelectedPortfolioItem}
                    setIsSheetOpen={setIsPortfolioSheetOpen}
                  />
              </TabsContent>
              <TabsContent value="about" className="flex-1 overflow-auto mt-4">
                  <AboutAdmin />
              </TabsContent>
              <TabsContent value="contact" className="flex-1 overflow-auto mt-4">
                  <ContactAdmin />
              </TabsContent>
              {canManageMedia && (
                <TabsContent value="media" className="flex-1 overflow-auto mt-4">
                  <Tabs value={innerMediaTab} onValueChange={(v) => setInnerMediaTab(v as 'cloudinary' | 'vercel' | 'appwrite' | 'gumlet' | 'imagekit')} className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="cloudinary" className="glass-effect data-[state=active]:bg-destructive">Cloudinary</TabsTrigger>
                      <TabsTrigger value="vercel" className="glass-effect data-[state=active]:bg-destructive">Vercel Blob</TabsTrigger>
                      <TabsTrigger value="appwrite" className="glass-effect data-[state=active]:bg-destructive">Appwrite</TabsTrigger>
                      <TabsTrigger value="gumlet" className="glass-effect data-[state=active]:bg-destructive">Gumlet</TabsTrigger>
                      <TabsTrigger value="imagekit" className="glass-effect data-[state=active]:bg-destructive">ImageKit</TabsTrigger>
                    </TabsList>
                    <TabsContent value="cloudinary">
                      <MediaAdmin provider="cloudinary" onUploadComplete={handleUploadComplete} onMediaSelect={handleOpenPortfolioFormWithMedia} />
                    </TabsContent>
                    <TabsContent value="vercel">
                      <MediaAdmin provider="vercel_blob" onUploadComplete={handleVercelUploadComplete} />
                    </TabsContent>
                    <TabsContent value="appwrite">
                      <AppwriteMediaLibrary provider="appwrite" onMediaSelect={handleOpenPortfolioFormWithMedia} />
                    </TabsContent>
                    <TabsContent value="gumlet">
                      <GumletLibrary provider="gumlet_video" onMediaSelect={handleOpenPortfolioFormWithMedia} />
                    </TabsContent>
                    <TabsContent value="imagekit">
                      <AppwriteMediaLibrary provider="imagekit" onMediaSelect={handleOpenPortfolioFormWithMedia} />
                    </TabsContent>
                  </Tabs>
              </TabsContent>
               )}
               {isSuperAdmin && (
                <TabsContent value="admins" className="flex-1 overflow-auto mt-4">
                  <AdminManagement />
                </TabsContent>
              )}
          </Tabs>
        </div>
      </div>
      <PortfolioItemFormSheet 
        isOpen={isPortfolioSheetOpen}
        setIsOpen={handlePortfolioSheetOpenChange}
        item={selectedPortfolioItem}
        onSubmit={(values) => handlePortfolioFormSubmit(values)}
        onChooseFromLibrary={handleOpenLibraryForSelection}
        canEdit={canEditProjects}
        canChooseFromLibrary={canManageMedia}
        onDelete={handleDeletePortfolioItem}
      />
      {canManageMedia && (
        <UnifiedMediaPicker
          isOpen={isLibraryOpen}
          onOpenChange={(isOpen) => {
              setIsLibraryOpen(isOpen);
              if (!isOpen) {
                setLibrarySelectionConfig(null);
                setLibraryForceProvider(undefined);
              }
          }}
          onMediaSelect={(url, type, filename) => {
              const handler = librarySelectionConfig ? librarySelectionConfig.onSelect : handleOpenPortfolioFormWithMedia;
              handler(url, type, filename);
              if (librarySelectionConfig) {
                setIsLibraryOpen(false);
                setLibrarySelectionConfig(null);
                setLibraryForceProvider(undefined);
              }
          }}
          forceProvider={libraryForceProvider}
        />
      )}
    </>
  );
}

export default AdminPage;

    

    
