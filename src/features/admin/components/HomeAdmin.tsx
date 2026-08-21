
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
import type { AppUser } from '@/firebase/auth/use-user';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import MediaAdmin from './MediaAdmin';
import { faImages } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced as T & { cancel: () => void };
}

interface HomePageSettings {
    homePageBackgroundType?: 'video' | 'image';
    homePageBackgroundMediaId?: string;
    websiteBackgroundType?: 'video' | 'image';
    websiteBackgroundMediaId?: string;
    isHomePageVideoEnabled?: boolean;
    isWebsiteVideoEnabled?: boolean;
    workPagePlayer?: 'plyr' | 'clappr';
    isTestPageEnabled?: boolean;
    homePageLogoUrl?: string;
    isHomePageLogoVisible?: boolean;
    homePageLogoScale?: number;
    homePageLogoColor?: string;
    themeColor?: string;
    heroVideoUrl?: string;
    preloaderType?: 'default' | 'lottie' | 'gif' | 'webm';
    preloaderUrl?: string;
    preloaderSize?: number;
    cursorLottieUrl?: string;
    tickLottieUrl?: string;
    homePageTitle?: string;
    homePageSubtitle?: string;
    homePageTitleColor?: string;
    menubarLogoSize?: number;
    menubarLogoUrl?: string;
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
  websiteBackgroundType: z.enum(['video', 'image']).optional(),
  websiteBackgroundMediaId: z.string().optional(),
  isHomePageVideoEnabled: z.boolean().optional(),
  isWebsiteVideoEnabled: z.boolean().optional(),
  heroVideoUrl: z.string().optional(),
  preloaderType: z.enum(['default', 'lottie', 'gif', 'webm']).optional(),
  preloaderUrl: z.string().optional(),
  preloaderSize: z.number().min(5).max(100).optional(),
  cursorLottieUrl: z.string().optional(),
  tickLottieUrl: z.string().optional(),
  homePageTitle: z.string().optional(),
  homePageSubtitle: z.string().optional(),
  homePageTitleColor: z.string().optional(),
  menubarLogoSize: z.number().min(24).max(80).optional(),
  menubarLogoUrl: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface MediaAsset {
    id: string;
    url: string;
    filename: string;
    resource_type: 'image' | 'video' | 'raw';
    title?: string;
}

export default function HomeAdmin() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isMounted, setIsMounted] = useState(false);

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
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
  const [libraryField, setLibraryField] = useState<'homePageLogoUrl' | 'menubarLogoUrl' | 'heroVideoUrl' | 'preloaderUrl' | 'cursorLottieUrl' | 'tickLottieUrl' | null>(null);
  const [libraryTab, setLibraryTab] = useState<'images' | 'videos' | 'files'>('images');
  const [libraryCollection, setLibraryCollection] = useState<'primary' | 'extented'>('primary');

  const videoItems = portfolioItems?.filter(item => item.type === 'video') || [];
  const imageAssets = mediaAssets?.filter(asset => asset.resource_type === 'image') || [];

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      homePageBackgroundType: 'video',
      homePageBackgroundMediaId: '',
      websiteBackgroundType: 'video',
      websiteBackgroundMediaId: '',
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
      preloaderSize: 25,
      cursorLottieUrl: '',
      tickLottieUrl: '',
      homePageTitle: '',
      homePageSubtitle: '',
      homePageTitleColor: '',
      menubarLogoSize: 48,
      menubarLogoUrl: '',
    },
  });

  const { watch, control, setValue } = form;

  useEffect(() => {
    setIsMounted(true);
    if (homeSettings) {
      form.reset({
        homePageBackgroundType: homeSettings.homePageBackgroundType || 'video',
        homePageBackgroundMediaId: homeSettings.homePageBackgroundMediaId || '',
        websiteBackgroundType: homeSettings.websiteBackgroundType || 'video',
        websiteBackgroundMediaId: homeSettings.websiteBackgroundMediaId || '',
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
        preloaderSize: homeSettings.preloaderSize || 25,
        cursorLottieUrl: homeSettings.cursorLottieUrl || '',
        tickLottieUrl: homeSettings.tickLottieUrl || '',
        homePageTitle: homeSettings.homePageTitle || '',
        homePageSubtitle: homeSettings.homePageSubtitle || '',
        homePageTitleColor: homeSettings.homePageTitleColor || '',
        menubarLogoSize: homeSettings.menubarLogoSize || 48,
        menubarLogoUrl: homeSettings.menubarLogoUrl || '',
      });
    }
  }, [homeSettings, form]);

  useEffect(() => {
    if (!canEditHome || !isMounted) return;

    const debouncedSave = debounce((fieldName: string, value: any) => {
        if (settingsDocRef) {
            const dataToSave = { [fieldName]: value };
            setDocumentNonBlocking(settingsDocRef, dataToSave, { merge: true });
            if (fieldName === 'themeColor' && value) {
                try {
                    const hex = value.replace('#', '');
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
        }
    }, 500);

    const subscription = watch((value, { name, type }) => {
      if (name) {
        const fieldName = name as keyof SettingsFormValues;
        debouncedSave(fieldName, value[fieldName]);
      }
    });

    return () => {
        subscription.unsubscribe();
        debouncedSave.cancel();
    };
  }, [watch, settingsDocRef, canEditHome, toast, isMounted]);

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
        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
            <ScrollArea className="h-full">
                <div className="p-6">
                    <Form {...form}>
                        <div className="space-y-8 max-w-2xl mx-auto">
                            <fieldset disabled={!canEditHome} className="group space-y-8">
                                
                                {/* Homepage Background Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
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
                                    <FormField
                                        control={control}
                                        name="homePageTitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.homePageTitle') || 'Homepage Title'}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('homeAdmin.homePageTitlePlaceholder') || 'Leave empty for default title'} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={control}
                                        name="homePageSubtitle"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('homeAdmin.homePageSubtitle') || 'Homepage Subtitle'}</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={t('homeAdmin.homePageSubtitlePlaceholder') || 'Leave empty for default subtitle'} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
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
                                    
                                    <Separator />
                                    
                                    <h3 className="font-headline text-lg pt-4">{t('homeAdmin.homepageBackground')}</h3>
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
                                        name="homePageBackgroundMediaId"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('homeAdmin.backgroundMedia')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('homeAdmin.backgroundMediaPlaceholder').replace('{type}', watch('homePageBackgroundType') || 'video')} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {(watch('homePageBackgroundType') === 'video' ? videoItems : imageAssets).map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.title || item.filename}
                                                    </SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
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
                                </div>

                                <Separator />

                                {/* Website Background Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
                                     <h3 className="font-headline text-lg">{t('homeAdmin.otherPagesBackground')}</h3>
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
                                        name="websiteBackgroundMediaId"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('homeAdmin.websiteBackgroundMedia')}</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('homeAdmin.websiteBackgroundMediaPlaceholder').replace('{type}', watch('websiteBackgroundType') || 'video')} />
                                                </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                {(watch('websiteBackgroundType') === 'video' ? videoItems : imageAssets).map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.title || item.filename}
                                                    </SelectItem>
                                                ))}
                                                </SelectContent>
                                            </Select>
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
                                <Separator />

                                {/* Player Settings */}
                                <div className="space-y-4 p-4 rounded-lg border glass-effect">
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
                                </div>
                            </fieldset>
                        </div>
                    </Form>
                </div>
            </ScrollArea>
        </div>
        <MediaAdmin
            isDialog={true}
            isOpen={isLibraryOpen}
            onOpenChange={setIsLibraryOpen}
            onMediaSelect={(url, type) => {
                if (libraryField) {
                    setValue(libraryField as any, url);
                }
                setIsLibraryOpen(false);
                setLibraryField(null);
            }}
            isSelectionMode={!!libraryField}
            onSelectionComplete={() => {
                setIsLibraryOpen(false);
                setLibraryField(null);
            }}
            activeTab={libraryTab}
            setActiveTab={setLibraryTab}
            activeLibrary={libraryCollection}
            setActiveLibrary={setLibraryCollection}
            newlyUploadedId={null}
        />
    </div>
  );
}
