
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect, useState } from 'react';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SUPERADMIN_EMAIL } from '@/lib/constants';
import type { AppUser } from '@/firebase/auth/use-user';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { DEFAULT_EMAIL_TEMPLATE_HTML, DEFAULT_AUTOREPLY_TEMPLATE_HTML } from '@/lib/default-email-template';
import UnifiedMediaPicker from './UnifiedMediaPicker';
import { MultilingualInput } from './MultilingualInput';
import { ensureMultilingualString } from '@/lib/i18n/multilingual';
import { faImages, faEye, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { debounce } from '@/lib/utils';
import type { HomePageSettings } from '@/lib/types';
import { useMediaProvider } from '@/hooks/use-media-provider';

function renderEmailPreview(template?: string): string {
  return (template?.trim() ? template : DEFAULT_EMAIL_TEMPLATE_HTML)
    .replace(/\{\{name\}\}/g, 'Jane Doe')
    .replace(/\{\{email\}\}/g, 'jane@example.com')
    .replace(/\{\{message\}\}/g, 'Hello!\n\nThis is a sample message so you can preview how your email template looks.');
}

const settingsSchema = z.object({
  workPagePlayer: z.enum(['plyr', 'clappr']).optional(),
  isTestPageEnabled: z.boolean().optional(),
  homePageLogoUrl: z.string().optional(),
  isHomePageLogoVisible: z.boolean().optional(),
                                        homePageLogoScale: z.number().min(0.1).max(5).optional(),
  homePageLogoColor: z.string().optional(),
  themeColor: z.string().optional(),
  homePageBackgroundType: z.enum(['video', 'image']).optional(),
  homePageBackgroundMediaId: z.string().optional(),
  homePageBackgroundUrl: z.string().optional(),
  websiteBackgroundType: z.enum(['video', 'image']).optional(),
  websiteBackgroundMediaId: z.string().optional(),
  websiteBackgroundUrl: z.string().optional(),
  isHomePageVideoEnabled: z.boolean().optional(),
  isWebsiteVideoEnabled: z.boolean().optional(),
  heroVideoUrl: z.string().optional(),
  preloaderType: z.enum(['default', 'lottie', 'gif', 'webm']).optional(),
  preloaderUrl: z.string().optional(),
  preloaderSize: z.number().min(5).max(100).optional(),
  cursorLottieUrl: z.string().optional(),
  tickLottieUrl: z.string().optional(),
  homePageTitle: z.object({ en: z.string().optional(), fr: z.string().optional() }).optional(),
  homePageSubtitle: z.object({ en: z.string().optional(), fr: z.string().optional() }).optional(),
  homePageTitleColor: z.string().optional(),
  menubarLogoSize: z.number().min(24).max(80).optional(),
  menubarLogoUrl: z.string().optional(),
  emailTemplateHtml: z.string().optional(),
  autoReplyTemplateHtml: z.string().optional(),
  isArrowAnimationEnabled: z.boolean().optional(),
  arrowLottieUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  glassOpacity: z.number().min(0).max(100).optional(),
  mediaWidth: z.number().min(10).max(100).optional(),
  showMediaTitles: z.boolean().optional(),
  glassColor: z.string().optional(),
  navButtonSize: z.number().min(28).max(64).optional(),
  watermarkLogoUrl: z.string().optional(),
  watermarkSize: z.number().min(5).max(30).optional(),
  watermarkOpacity: z.number().min(0).max(100).optional(),
  watermarkPosition: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface MediaAsset {
    id: string;
    url: string;
    filename: string;
    resource_type: 'image' | 'video' | 'raw';
    title?: string;
}

/**
 * Admin-only UI preference for which media provider the picker defaults to.
 * Persisted in localStorage (not Firestore) — it's a UI hint, not content.
 */
function ProviderRadioField({ label, description }: { label: string; description: string }) {
    const [provider, setProvider] = useMediaProvider();
    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
                <RadioGroup
                    onValueChange={(v) => setProvider(v as 'cloudinary' | 'vercel_blob')}
                    value={provider}
                    className="flex items-center space-x-4"
                >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="cloudinary" /></FormControl>
                        <FormLabel className="font-normal">Cloudinary</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="vercel_blob" /></FormControl>
                        <FormLabel className="font-normal">Vercel Blob</FormLabel>
                    </FormItem>
                </RadioGroup>
            </FormControl>
            <FormDescription>{description}</FormDescription>
        </FormItem>
    );
}

export default function HomeAdmin() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === SUPERADMIN_EMAIL;
  const canEditHome = isSuperAdmin || (typedUser?.permissions?.canEditHome ?? true);

  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);

  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: portfolioItems, isLoading: isLoadingProjects } = useCollection<PortfolioItem>(projectsCollection);
  
  const mediaCollection = useMemoFirebase(() => firestore ? collection(firestore, 'media') : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollection);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryField, setLibraryField] = useState<'homePageLogoUrl' | 'menubarLogoUrl' | 'heroVideoUrl' | 'preloaderUrl' | 'cursorLottieUrl' | 'tickLottieUrl' | 'arrowLottieUrl' | 'faviconUrl' | 'homePageBackgroundUrl' | 'websiteBackgroundUrl' | 'watermarkLogoUrl' | null>(null);
  const [libraryTab, setLibraryTab] = useState<'images' | 'videos' | 'files'>('images');
  const [libraryCollection, setLibraryCollection] = useState<'primary' | 'extented'>('primary');
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [emailPreviewField, setEmailPreviewField] = useState<'emailTemplateHtml' | 'autoReplyTemplateHtml'>('emailTemplateHtml');
  const [homeTab, setHomeTab] = useState<'appearance' | 'backgrounds' | 'navigation' | 'player' | 'preloader' | 'email'>('appearance');

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      homePageBackgroundType: 'video',
      homePageBackgroundMediaId: '',
      homePageBackgroundUrl: '',
      websiteBackgroundType: 'video',
      websiteBackgroundMediaId: '',
      websiteBackgroundUrl: '',
      isHomePageVideoEnabled: true,
      isWebsiteVideoEnabled: true,
      workPagePlayer: 'clappr',
      isTestPageEnabled: false,
      homePageLogoUrl: '',
      isHomePageLogoVisible: true,
      homePageLogoScale: 1,
      homePageLogoColor: '',
      themeColor: '#d81e38',
      heroVideoUrl: '',
      preloaderType: 'default',
      preloaderUrl: '',
      preloaderSize: 15,
      cursorLottieUrl: '',
      tickLottieUrl: '',
      homePageTitle: { en: '', fr: '' },
      homePageSubtitle: { en: '', fr: '' },
      homePageTitleColor: '',
      menubarLogoSize: 48,
      menubarLogoUrl: '',
      emailTemplateHtml: '',
      autoReplyTemplateHtml: '',
      isArrowAnimationEnabled: true,
      arrowLottieUrl: '',
      faviconUrl: '',
      glassOpacity: 25,
      mediaWidth: 100,
      showMediaTitles: true,
      glassColor: '#000000',
      navButtonSize: 40,
      watermarkLogoUrl: '',
      watermarkSize: 12,
      watermarkOpacity: 70,
      watermarkPosition: 'bottom-right' as const,
    },
  });

  const { watch, control, setValue } = form;

  useEffect(() => {
    setIsMounted(true);
    if (homeSettings) {
      form.reset({
        homePageBackgroundType: homeSettings.homePageBackgroundType || 'video',
        homePageBackgroundMediaId: homeSettings.homePageBackgroundMediaId || '',
        homePageBackgroundUrl: homeSettings.homePageBackgroundUrl || '',
        websiteBackgroundType: homeSettings.websiteBackgroundType || 'video',
        websiteBackgroundMediaId: homeSettings.websiteBackgroundMediaId || '',
        websiteBackgroundUrl: homeSettings.websiteBackgroundUrl || '',
        isHomePageVideoEnabled: homeSettings.isHomePageVideoEnabled ?? true,
        isWebsiteVideoEnabled: homeSettings.isWebsiteVideoEnabled ?? true,
        workPagePlayer: homeSettings.workPagePlayer || 'clappr',
        isTestPageEnabled: homeSettings.isTestPageEnabled ?? false,
        homePageLogoUrl: homeSettings.homePageLogoUrl || '',
        isHomePageLogoVisible: homeSettings.isHomePageLogoVisible ?? true,
        homePageLogoScale: homeSettings.homePageLogoScale || 1,
        homePageLogoColor: homeSettings.homePageLogoColor || '',
        themeColor: homeSettings.themeColor || '#d81e38',
        heroVideoUrl: homeSettings.heroVideoUrl || '',
        preloaderType: homeSettings.preloaderType || 'default',
        preloaderUrl: homeSettings.preloaderUrl || '',
        preloaderSize: homeSettings.preloaderSize || 15,
        cursorLottieUrl: homeSettings.cursorLottieUrl || '',
        tickLottieUrl: homeSettings.tickLottieUrl || '',
        homePageTitle: ensureMultilingualString(homeSettings.homePageTitle),
        homePageSubtitle: ensureMultilingualString(homeSettings.homePageSubtitle),
        homePageTitleColor: homeSettings.homePageTitleColor || '',
        menubarLogoSize: homeSettings.menubarLogoSize || 48,
        menubarLogoUrl: homeSettings.menubarLogoUrl || '',
        emailTemplateHtml: homeSettings.emailTemplateHtml || '',
        autoReplyTemplateHtml: homeSettings.autoReplyTemplateHtml || '',
        isArrowAnimationEnabled: homeSettings.isArrowAnimationEnabled ?? true,
        arrowLottieUrl: homeSettings.arrowLottieUrl || '',
        faviconUrl: homeSettings.faviconUrl || '',
        glassOpacity: homeSettings.glassOpacity ?? 25,
        mediaWidth: homeSettings.mediaWidth ?? 100,
        showMediaTitles: homeSettings.showMediaTitles ?? true,
        glassColor: homeSettings.glassColor || '#000000',
        navButtonSize: homeSettings.navButtonSize || 40,
        watermarkLogoUrl: homeSettings.watermarkLogoUrl || '',
        watermarkSize: homeSettings.watermarkSize ?? 12,
        watermarkOpacity: homeSettings.watermarkOpacity ?? 70,
        watermarkPosition: homeSettings.watermarkPosition || 'bottom-right',
      });
    }
  }, [homeSettings, form]);

  useEffect(() => {
    if (!canEditHome || !isMounted) return;

    // Batch ALL pending field changes into one merged write. A single shared
    // debounce timer that saves only the last-changed field silently DROPPED
    // earlier edits (e.g. pick a background image then switch type <500ms
    // later → the URL write was lost).
    const pendingRef: { current: Record<string, any> } = { current: {} };

    const debouncedSave = debounce(() => {
        if (!settingsDocRef || Object.keys(pendingRef.current).length === 0) return;
        const changes = pendingRef.current;
        pendingRef.current = {};
        setDocumentNonBlocking(settingsDocRef, changes, { merge: true });
        const themeColor = changes.themeColor;
        if (themeColor) {
            try {
                const hex = themeColor.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;
                const max = Math.max(r, g, b), min = Math.min(r, g, b);
                let h = 0, s = 0, l = (max + min) / 2;
                if (max !== min) {
                    const d = max - min;
                    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                    switch (max) {
                        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                        case g: h = ((b - r) / d + 2) / 6; break;
                        case b: h = ((r - g) / d + 4) / 6; break;
                    }
                }
                const hsl = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
                localStorage.setItem('belofted_theme_hsl', hsl);
            } catch {}
        }
        toast({
            title: t('homeAdmin.toast.saved.title'),
            description: t('homeAdmin.toast.saved.description'),
        });
    }, 500);

    const subscription = watch((value, { name }) => {
      if (name) {
        const topLevel = name.split('.')[0];
        pendingRef.current[topLevel] = (value as Record<string, any>)[topLevel];
        debouncedSave();
      }
    });

    return () => {
        subscription.unsubscribe();
        debouncedSave.cancel();
    };
  }, [watch, settingsDocRef, canEditHome, toast, isMounted, t]);

  const isLoading = isLoadingSettings || isLoadingProjects || isLoadingMedia;

  if (isLoading && !isMounted) {
    return (
      <div className="flex justify-center items-center h-full">
        <Preloader />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
        <div className="mb-6">
            <h2 className="text-xl font-headline">{t('homeAdmin.title')}</h2>
            <p className="text-muted-foreground">
                {t('homeAdmin.description')}
            </p>
        </div>
        <Tabs value={homeTab} onValueChange={(v) => setHomeTab(v as any)} className="flex-1 flex flex-col min-h-0">
            <TabsList className="flex flex-wrap mb-4">
                                    <TabsTrigger value="appearance" className="px-3 py-1.5 text-sm glass-effect data-[state=active]:bg-destructive">{t('homeAdmin.tab.appearance') || 'Appearance'}</TabsTrigger>
                                    <TabsTrigger value="backgrounds" className="px-3 py-1.5 text-sm glass-effect data-[state=active]:bg-destructive">{t('homeAdmin.tab.backgrounds') || 'Backgrounds'}</TabsTrigger>
                                    <TabsTrigger value="player" className="px-3 py-1.5 text-sm glass-effect data-[state=active]:bg-destructive">{t('homeAdmin.tab.player') || 'Player & Global'}</TabsTrigger>
                                    <TabsTrigger value="preloader" className="px-3 py-1.5 text-sm glass-effect data-[state=active]:bg-destructive">{t('homeAdmin.tab.preloader') || 'Preloader'}</TabsTrigger>
                                    <TabsTrigger value="email" className="px-3 py-1.5 text-sm glass-effect data-[state=active]:bg-destructive">{t('homeAdmin.tab.email') || 'Email'}</TabsTrigger>
                                </TabsList>
                                <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
                                    <ScrollArea className="h-full">
                                        <div className="p-6">
                                            <Form {...form}>
                                                <fieldset disabled={!canEditHome} className="group">
                                                    <div className="space-y-8 max-w-2xl mx-auto">
                                <TabsContent value="appearance" className="m-0 space-y-4">
{/* Homepage Appearance */}
                                 <div className="space-y-4">
                                    <h3 className="font-headline text-lg">{t('homeAdmin.homepageHeading')}</h3>
                                    
                                    <FormField
                                        control={control}
                                        name="homePageLogoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.homepageLogoUrl')}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input placeholder={t('homeAdmin.homepageLogoUrlPlaceholder')} {...field} className="flex-1" />
                                                    </FormControl>
                                                    <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('homePageLogoUrl'); setIsLibraryOpen(true); }}>
                                                        <FontAwesomeIcon icon={faImages} />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="menubarLogoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.menubarLogoUrl')}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input placeholder={t('homeAdmin.menubarLogoUrlPlaceholder')} {...field} className="flex-1" />
                                                    </FormControl>
                                                    <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('menubarLogoUrl'); setIsLibraryOpen(true); }}>
                                                        <FontAwesomeIcon icon={faImages} />
                                                    </Button>
                                                </div>
                                                <FormDescription>{t('homeAdmin.menubarLogoUrlDescription')}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="heroVideoUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.heroVideoUrl')}</FormLabel>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input placeholder={t('homeAdmin.heroVideoUrlPlaceholder')} {...field} className="flex-1" />
                                                    </FormControl>
                                                    <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('heroVideoUrl'); setLibraryTab('videos'); setIsLibraryOpen(true); }}>
                                                        <FontAwesomeIcon icon={faImages} />
                                                    </Button>
                                                </div>
                                                <FormDescription>{t('homeAdmin.heroVideoUrlDescription')}</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <MultilingualInput
                                        name="homePageTitle"
                                        label={t('homeAdmin.homePageTitle') || 'Homepage Title'}
                                        placeholder={t('homeAdmin.homePageTitlePlaceholder') || 'Leave empty for default title'}
                                    />
                                    <MultilingualInput
                                        name="homePageSubtitle"
                                        label={t('homeAdmin.homePageSubtitle') || 'Homepage Subtitle'}
                                        placeholder={t('homeAdmin.homePageSubtitlePlaceholder') || 'Leave empty for default subtitle'}
                                    />
                                    <FormField
                                        control={control}
                                        name="homePageTitleColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.homePageTitleColor') || 'Title Color'}</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Input type="color" {...field} value={field.value || '#ffffff'} className="p-1 h-10 w-14 cursor-pointer" />
                                                    </FormControl>
                                                    <Input type="text" {...field} placeholder="#ffffff" />
                                                </div>
                                                <FormDescription>
                                                    {t('homeAdmin.homePageTitleColorDescription') || 'Leave empty for default color'}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="isHomePageLogoVisible"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>{t('homeAdmin.showLogo')}</FormLabel>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="homePageLogoScale"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.logoScale') || 'Logo Size'} — {Math.round((field.value || 1) * 100)}%</FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        value={[field.value || 1]}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                        min={0.1}
                                                        max={3}
                                                        step={0.05}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t('homeAdmin.logoScaleDescription') || 'Adjust the homepage logo size'}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="homePageLogoColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.logoColor') || 'Logo Color'}</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Input type="color" {...field} value={field.value || '#ffffff'} className="p-1 h-10 w-14 cursor-pointer" />
                                                    </FormControl>
                                                    <Input type="text" {...field} placeholder="#ffffff" />
                                                </div>
                                                <FormDescription>
                                                    {t('homeAdmin.logoColorDescription') || 'Leave empty or white for original logo color'}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="menubarLogoSize"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.menubarLogoSize') || 'Navbar Logo Size'} — {field.value || 48}px</FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        value={[field.value || 48]}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                        min={24}
                                                        max={80}
                                                        step={1}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t('homeAdmin.menubarLogoSizeDescription') || 'Adjust the size of the logo in the navigation bar'}
                                                </FormDescription>
                                                 <FormMessage />
                                             </FormItem>
                                         )}
                                     />

                                    <FormField
                                        control={control}
                                        name="navButtonSize"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.navButtonSize') || 'Menu Button Size'} — {field.value || 40}px</FormLabel>
                                                <FormControl>
                                                    <Slider
                                                        value={[field.value || 40]}
                                                        onValueChange={(value) => field.onChange(value[0])}
                                                        min={28}
                                                        max={64}
                                                        step={1}
                                                    />
                                                </FormControl>
                                                <FormDescription>
                                                    {t('homeAdmin.navButtonSizeDescription') || 'Adjust the size of the navigation menu buttons'}
                                                </FormDescription>
                                                 <FormMessage />
                                             </FormItem>
                                         )}
                                     />

                                    <ProviderRadioField
                                        label={t('homeAdmin.provider') || 'Media Provider'}
                                        description={t('homeAdmin.providerDescription') || 'Choose which library the media picker opens by default'}
                                    />

                                    <FormField
                                        control={control}
                                        name="faviconUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.faviconUrl')}</FormLabel>
                                                <FormDescription>{t('homeAdmin.faviconUrlDescription')}</FormDescription>
                                                <div className="flex items-center gap-2">
                                                    <FormControl>
                                                        <Input placeholder={t('homeAdmin.faviconUrlPlaceholder')} {...field} className="flex-1" />
                                                    </FormControl>
                                                    <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('faviconUrl'); setLibraryTab('images'); setIsLibraryOpen(true); }}>
                                                        <FontAwesomeIcon icon={faImages} />
                                                    </Button>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="showMediaTitles"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Show Media Titles</FormLabel>
                                                    <FormDescription>
                                                        Show filename titles above images and videos in project descriptions.
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value ?? true}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                </TabsContent>
                                <TabsContent value="backgrounds" className="m-0 space-y-4">
{/* Backgrounds */}
                                 <div className="space-y-4">
                                    <h3 className="font-headline text-lg">{t('homeAdmin.backgroundsHeading')}</h3>

                                     {/* Homepage background */}
                                     <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">{t('homeAdmin.homepageBackground')}</h4>
                                     <FormField
                                      control={control}
                                      name="homePageBackgroundType"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>{t('homeAdmin.backgroundType')}</FormLabel>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={(value) => {
                                                  field.onChange(value);
                                                  setValue('homePageBackgroundMediaId', ''); // Reset selection on type change
                                              }}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="video" /></FormControl>
                                                <FormLabel className="font-normal">{t('homeAdmin.video')}</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="image" /></FormControl>
                                                <FormLabel className="font-normal">{t('homeAdmin.image')}</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                        control={control}
                                        name="homePageBackgroundUrl"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('homeAdmin.backgroundMedia')}</FormLabel>
                                            <FormDescription>{t('homeAdmin.backgroundMediaHelp')}</FormDescription>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input placeholder={t('homeAdmin.backgroundMediaPlaceholder')} {...field} className="flex-1" />
                                                </FormControl>
                                                <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('homePageBackgroundUrl'); setLibraryTab(watch('homePageBackgroundType') === 'image' ? 'images' : 'videos'); setIsLibraryOpen(true); }}>
                                                    <FontAwesomeIcon icon={faImages} />
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {watch('homePageBackgroundType') === 'video' && (
                                        <FormField
                                            control={control}
                                            name="isHomePageVideoEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>{t('homeAdmin.enableHomepageVideo')}</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <Separator />

                                    {/* Other pages background */}
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('homeAdmin.otherPagesBackground')}</h4>
                                    <FormField
                                      control={control}
                                      name="websiteBackgroundType"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>{t('homeAdmin.websiteBackgroundType')}</FormLabel>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={(value) => {
                                                  field.onChange(value);
                                                  setValue('websiteBackgroundMediaId', ''); // Reset selection on type change
                                              }}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="video" /></FormControl>
                                                <FormLabel className="font-normal">{t('homeAdmin.websiteVideo')}</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="image" /></FormControl>
                                                <FormLabel className="font-normal">{t('homeAdmin.websiteImage')}</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />

                                    <FormField
                                        control={control}
                                        name="websiteBackgroundUrl"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('homeAdmin.websiteBackgroundMedia')}</FormLabel>
                                            <FormDescription>{t('homeAdmin.backgroundMediaHelp')}</FormDescription>
                                            <div className="flex items-center gap-2">
                                                <FormControl>
                                                    <Input placeholder={t('homeAdmin.websiteBackgroundMediaPlaceholder')} {...field} className="flex-1" />
                                                </FormControl>
                                                <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('websiteBackgroundUrl'); setLibraryTab(watch('websiteBackgroundType') === 'image' ? 'images' : 'videos'); setIsLibraryOpen(true); }}>
                                                    <FontAwesomeIcon icon={faImages} />
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {watch('websiteBackgroundType') === 'video' && (
                                        <FormField
                                            control={control}
                                            name="isWebsiteVideoEnabled"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>{t('homeAdmin.enableWebsiteVideo')}</FormLabel>
                                                    </div>
                                                    <FormControl>
                                                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                 </div>
</TabsContent>
                                 <TabsContent value="player" className="m-0 space-y-4">
                                 {/* Player & Global Settings */}
                                 <div className="space-y-4">
                                     <h3 className="font-headline text-lg">{t('homeAdmin.globalSettings')}</h3>

                                     <FormField
                                        control={control}
                                        name="themeColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.themeColor')}</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Input type="color" {...field} className="p-1 h-10 w-14 cursor-pointer" />
                                                    </FormControl>
                                                    <Input type="text" {...field} placeholder={t('homeAdmin.themeColorPlaceholder')} />
                                                </div>
                                                <FormDescription>
                                                    {t('homeAdmin.themeColorDescription')}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                     />

                                     <FormField
                                        control={control}
                                        name="glassOpacity"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Glass Opacity (%)</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-3">
                                                        <Slider
                                                            className="flex-1"
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            value={[field.value ?? 25]}
                                                            onValueChange={(v) => field.onChange(v[0])}
                                                        />
                                                        <span className="w-12 text-center text-sm font-mono">{field.value ?? 25}%</span>
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Controls the opacity of the dark background layer on glass panels (0% = invisible, 100% = fully black).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="glassColor"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Glass Color</FormLabel>
                                                <div className="flex items-center gap-4">
                                                    <FormControl>
                                                        <Input type="color" {...field} value={field.value || '#000000'} className="p-1 h-10 w-14 cursor-pointer" />
                                                    </FormControl>
                                                    <Input type="text" {...field} value={field.value || '#000000'} placeholder="#000000" />
                                                </div>
                                                <FormDescription>
                                                    Base color for glass panels (combined with opacity above). Default black (#000000).
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={control}
                                        name="mediaWidth"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Embedded Media Width (%)</FormLabel>
                                                <FormControl>
                                                    <div className="flex items-center gap-3">
                                                        <Slider
                                                            className="flex-1"
                                                            min={5}
                                                            max={100}
                                                            step={5}
                                                            value={[field.value ?? 100]}
                                                            onValueChange={(v) => field.onChange(v[0])}
                                                        />
                                                        <span className="w-12 text-center text-sm font-mono">{field.value ?? 100}%</span>
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    Controls the width of images, videos, and file download cards inside project details.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />
                                    
                                    <FormField
                                      control={control}
                                      name="workPagePlayer"
                                      render={({ field }) => (
                                        <FormItem className="space-y-3">
                                          <FormLabel>{t('homeAdmin.workPagePlayer')}</FormLabel>
                                           <FormDescription>
                                            {t('homeAdmin.workPagePlayerDescription')}
                                          </FormDescription>
                                          <FormControl>
                                            <RadioGroup
                                              onValueChange={field.onChange}
                                              value={field.value}
                                              className="flex items-center space-x-4"
                                            >
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="plyr" /></FormControl>
                                                <FormLabel className="font-normal">{t('homeAdmin.player.plyr')}</FormLabel>
                                              </FormItem>
                                              <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl><RadioGroupItem value="clappr" /></FormControl>
                                                <FormLabel className="font-normal">{t('homeAdmin.player.clappr')}</FormLabel>
                                              </FormItem>
                                            </RadioGroup>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
<Separator />
                                     <div className="space-y-4">
                                        <h4 className="font-medium text-sm">Video Watermark</h4>
                                        <FormField
                                            control={control}
                                            name="watermarkLogoUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Watermark Logo</FormLabel>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input placeholder="https://example.com/watermark.png or pick from library" {...field} className="flex-1" />
                                                        </FormControl>
                                                        <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('watermarkLogoUrl'); setLibraryTab('images'); setIsLibraryOpen(true); }}>
                                                            <FontAwesomeIcon icon={faImages} />
                                                        </Button>
                                                    </div>
                                                    <FormDescription>Logo shown on all videos (Plyr & Clappr unified). Leave empty to hide.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="watermarkSize"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Watermark Size — {field.value ?? 12}%</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-3">
                                                            <Slider
                                                                className="flex-1"
                                                                min={5}
                                                                max={30}
                                                                step={1}
                                                                value={[field.value ?? 12]}
                                                                onValueChange={(v) => field.onChange(v[0])}
                                                            />
                                                            <span className="w-12 text-center text-sm font-mono">{field.value ?? 12}%</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>Width as % of video (12% = default, 5% small, 30% large).</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="watermarkOpacity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Watermark Opacity — {field.value ?? 70}%</FormLabel>
                                                    <FormControl>
                                                        <div className="flex items-center gap-3">
                                                            <Slider
                                                                className="flex-1"
                                                                min={10}
                                                                max={100}
                                                                step={5}
                                                                value={[field.value ?? 70]}
                                                                onValueChange={(v) => field.onChange(v[0])}
                                                            />
                                                            <span className="w-12 text-center text-sm font-mono">{field.value ?? 70}%</span>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={control}
                                            name="watermarkPosition"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Watermark Position</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || 'bottom-right'}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select position" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="top-left">Top Left</SelectItem>
                                                            <SelectItem value="top-right">Top Right</SelectItem>
                                                            <SelectItem value="bottom-left">Bottom Left</SelectItem>
                                                            <SelectItem value="bottom-right">Bottom Right</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Separator />
                                     <FormField
                                        control={control}
                                        name="isTestPageEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>{t('homeAdmin.enableTestPage')}</FormLabel>
                                                     <FormDescription>
                                                        {t('homeAdmin.enableTestPageDescription')}
                                                    </FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />
                                </div>
</TabsContent>
                                 <TabsContent value="preloader" className="m-0 space-y-4">
                                 {/* Preloader & Animations */}
                                 <div className="space-y-4">
                                <h3 className="font-headline text-lg">{t('homeAdmin.preloaderTabHeading') || 'Preloader & Animations'}</h3>
                                    <FormField
                                        control={control}
                                        name="preloaderType"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>{t('homeAdmin.preloaderType') || 'Preloader Type'}</FormLabel>
                                                <FormDescription>
                                                    {t('homeAdmin.preloaderTypeDescription') || 'Choose the loading animation shown across your website'}
                                                </FormDescription>
                                                <FormControl>
                                                    <RadioGroup
                                                        onValueChange={field.onChange}
                                                        value={field.value}
                                                        className="flex flex-wrap items-center gap-4"
                                                    >
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="default" /></FormControl>
                                                            <FormLabel className="font-normal">Default Lottie</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="lottie" /></FormControl>
                                                            <FormLabel className="font-normal">Custom Lottie URL</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="gif" /></FormControl>
                                                            <FormLabel className="font-normal">GIF</FormLabel>
                                                        </FormItem>
                                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                                            <FormControl><RadioGroupItem value="webm" /></FormControl>
                                                            <FormLabel className="font-normal">WebM Video</FormLabel>
                                                        </FormItem>
                                                    </RadioGroup>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {watch('preloaderType') === 'default' && (
                                        <FormField
                                            control={control}
                                            name="preloaderUrl"
                                            render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Custom Default Lottie (optional)</FormLabel>
                                                        <FormDescription>
                                                            Upload a Lottie JSON to replace the built-in default. Leave empty to keep the original.
                                                        </FormDescription>
                                                        <div className="flex items-center gap-2">
                                                            <FormControl>
                                                                <Input placeholder="Leave empty for built-in default" {...field} className="flex-1" />
                                                            </FormControl>
                                                            <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('preloaderUrl'); setLibraryTab('files'); setIsLibraryOpen(true); }}>
                                                                <FontAwesomeIcon icon={faImages} />
                                                            </Button>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                            )}
                                        />
                                    )}

                                    {watch('preloaderType') !== 'default' && (
                                        <FormField
                                            control={control}
                                            name="preloaderUrl"
                                            render={({ field }) => {
                                                const preloaderType = watch('preloaderType');
                                                return (
                                                    <FormItem>
                                                        <FormLabel>
                                                            {preloaderType === 'lottie' ? 'Lottie JSON URL' : preloaderType === 'gif' ? 'GIF URL' : 'WebM Video URL'}
                                                        </FormLabel>
                                                        <div className="flex items-center gap-2">
                                                            <FormControl>
                                                                <Input placeholder={
                                                                    preloaderType === 'lottie' ? 'https://example.com/animation.json' :
                                                                    preloaderType === 'gif' ? 'https://example.com/loader.gif' :
                                                                    'https://example.com/loader.webm'
                                                                } {...field} className="flex-1" />
                                                            </FormControl>
                                                            <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('preloaderUrl'); setLibraryTab(preloaderType === 'webm' ? 'videos' : preloaderType === 'gif' ? 'images' : 'files'); setIsLibraryOpen(true); }}>
                                                                <FontAwesomeIcon icon={faImages} />
                                                            </Button>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    )}

                                    <FormField
                                        control={control}
                                        name="preloaderSize"
                                        render={({ field }) => (
                                            <FormItem className="space-y-3">
                                                <FormLabel>{t('homeAdmin.preloaderSize') || 'Preloader Size'}</FormLabel>
                                                <FormDescription>
                                                    {t('homeAdmin.preloaderSizeDescription') || `Size of the loading animation (${field.value || 25}% of screen)`}
                                                </FormDescription>
                                                <div className="flex items-center gap-3">
                                                    <FormControl>
                                                        <Slider
                                                            min={5}
                                                            max={100}
                                                            step={5}
                                                            value={[field.value || 25]}
                                                            onValueChange={(vals) => field.onChange(vals[0])}
                                                        />
                                                    </FormControl>
                                                    <span className="text-sm text-muted-foreground w-12 text-right">{field.value || 25}%</span>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={control}
                                        name="cursorLottieUrl"
                                        render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('homeAdmin.cursorLottieUrl') || 'Pointer Cursor Animation'}</FormLabel>
                                                    <FormDescription>
                                                        {t('homeAdmin.cursorLottieUrlDescription') || 'Custom Lottie JSON or GIF for the pointer cursor on buttons. Leave empty for default.'}
                                                    </FormDescription>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input placeholder="Leave empty for default cursor" {...field} className="flex-1" />
                                                        </FormControl>
                                                        <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('cursorLottieUrl'); setLibraryTab('files'); setIsLibraryOpen(true); }}>
                                                            <FontAwesomeIcon icon={faImages} />
                                                        </Button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="tickLottieUrl"
                                        render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('homeAdmin.tickLottieUrl') || 'Button Hover Animation'}</FormLabel>
                                                    <FormDescription>
                                                        {t('homeAdmin.tickLottieUrlDescription') || 'Custom Lottie JSON or GIF shown when hovering over the button. Leave empty for default.'}
                                                    </FormDescription>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input placeholder="Leave empty for default hover animation" {...field} className="flex-1" />
                                                        </FormControl>
                                                        <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('tickLottieUrl'); setLibraryTab('files'); setIsLibraryOpen(true); }}>
                                                            <FontAwesomeIcon icon={faImages} />
                                                        </Button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                        )}
                                    />

                                    <Separator />

                                    <FormField
                                        control={control}
                                        name="isArrowAnimationEnabled"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>{t('homeAdmin.arrowAnimation')}</FormLabel>
                                                    <FormDescription>{t('homeAdmin.arrowAnimationDescription')}</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="arrowLottieUrl"
                                        render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('homeAdmin.arrowLottieUrl')}</FormLabel>
                                                    <FormDescription>
                                                        {t('homeAdmin.arrowLottieUrlDescription')}
                                                    </FormDescription>
                                                    <div className="flex items-center gap-2">
                                                        <FormControl>
                                                            <Input placeholder={t('homeAdmin.arrowLottieUrlPlaceholder')} {...field} className="flex-1" />
                                                        </FormControl>
                                                        <Button type="button" variant="outline" size="icon" onClick={() => { setLibraryField('arrowLottieUrl'); setLibraryTab('files'); setIsLibraryOpen(true); }}>
                                                            <FontAwesomeIcon icon={faImages} />
                                                        </Button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                        )}
                                    />
                                 </div>
</TabsContent>
                                 <TabsContent value="email" className="m-0 space-y-4">
                                 {/* Email Templates */}
                                 <div className="space-y-4">
                                    <h3 className="font-headline text-lg">{t('homeAdmin.emailTemplatesHeading')}</h3>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('homeAdmin.emailTemplate.heading')}</h4>
                                    <FormField
                                        control={control}
                                        name="emailTemplateHtml"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.emailTemplate.label')}</FormLabel>
                                                <FormDescription>{t('homeAdmin.emailTemplate.description')}</FormDescription>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    {['{{name}}', '{{email}}', '{{message}}'].map(ph => (
                                                        <code key={ph} className="px-2 py-0.5 rounded bg-muted font-mono">{ph}</code>
                                                    ))}
                                                    <span>{t('homeAdmin.emailTemplate.placeholdersHint')}</span>
                                                </div>
                                                <FormControl>
                                                    <Textarea rows={12} className="font-mono text-xs" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => { setEmailPreviewField('emailTemplateHtml'); setIsEmailPreviewOpen(true); }}>
                                            <FontAwesomeIcon icon={faEye} className="mr-2" />{t('homeAdmin.emailTemplate.preview')}
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setValue('emailTemplateHtml', DEFAULT_EMAIL_TEMPLATE_HTML)}>
                                            <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />{t('homeAdmin.emailTemplate.resetDefault')}
                                        </Button>
                                    </div>

                                    <Separator />

                                    {/* Customer Auto-Reply */}
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('homeAdmin.autoReplyTemplate.heading')}</h4>
                                    <FormField
                                        control={control}
                                        name="autoReplyTemplateHtml"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.autoReplyTemplate.label')}</FormLabel>
                                                <FormDescription>{t('homeAdmin.autoReplyTemplate.description')}</FormDescription>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    {['{{name}}', '{{email}}', '{{message}}'].map(ph => (
                                                        <code key={ph} className="px-2 py-0.5 rounded bg-muted font-mono">{ph}</code>
                                                    ))}
                                                    <span>{t('homeAdmin.emailTemplate.placeholdersHint')}</span>
                                                </div>
                                                <FormControl>
                                                    <Textarea rows={12} className="font-mono text-xs" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={() => { setEmailPreviewField('autoReplyTemplateHtml'); setIsEmailPreviewOpen(true); }}>
                                            <FontAwesomeIcon icon={faEye} className="mr-2" />{t('homeAdmin.emailTemplate.preview')}
                                        </Button>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setValue('autoReplyTemplateHtml', DEFAULT_AUTOREPLY_TEMPLATE_HTML)}>
                                            <FontAwesomeIcon icon={faRotateLeft} className="mr-2" />{t('homeAdmin.emailTemplate.resetDefault')}
                                        </Button>
                                    </div>
                                </div>
                                </TabsContent>
                                    </div>
                                </fieldset>
                            </Form>
                        </div>
                    </ScrollArea>
                </div>
                </Tabs>
        <UnifiedMediaPicker
          isOpen={isLibraryOpen}
          onOpenChange={setIsLibraryOpen}
          onMediaSelect={(url, type) => {
              if (libraryField) {
                  setValue(libraryField as any, url);
              }
              setIsLibraryOpen(false);
              setLibraryField(null);
          }}
        />
        <Dialog open={isEmailPreviewOpen} onOpenChange={setIsEmailPreviewOpen}>
            <DialogContent className="w-[90vw] max-w-3xl glass-effect">
                <DialogHeader>
                    <DialogTitle>{t('homeAdmin.emailTemplate.previewTitle')}</DialogTitle>
                    <DialogDescription>{t('homeAdmin.emailTemplate.previewDescription')}</DialogDescription>
                </DialogHeader>
                <iframe
                    title="email-template-preview"
                    className="w-full h-[60vh] rounded-md border bg-white"
                    srcDoc={renderEmailPreview(form.getValues(emailPreviewField))}
                />
            </DialogContent>
        </Dialog>
    </div>
  );
}
