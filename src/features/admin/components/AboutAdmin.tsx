
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { isSuperAdmin as isSuperAdminCheck, hasMediaAccess } from '@/lib/constants';
import PageTextEditor from '@/features/admin/components/PageTextEditor';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useUser, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { revalidateHome } from '@/lib/revalidate-home';
import Preloader from '@/components/preloader';
import { ScrollArea } from '@/components/ui/scroll-area';
import MediaLibrary from './MediaLibrary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImages, faPencilAlt, faPlusCircle, faArrowUp, faArrowDown, faTrash } from '@fortawesome/free-solid-svg-icons';
import ClientAdmin from './ClientAdmin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { AppUser } from '@/firebase/auth/use-user';
import { Slider } from '@/components/ui/slider';
import { ensureMultilingualString } from '@/lib/i18n/multilingual';
import { MultilingualInput } from './MultilingualInput';
import { Separator } from '@/components/ui/separator';
import type { AboutPageContent, AboutService } from '@/lib/about-content';
import { builtinIconMap, cloneDefaultServices, type BuiltinIconName } from '@/lib/about-default-services';

const serviceSchema = z.object({
  iconUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  iconName: z.string().optional().or(z.literal('')),
  title: z.object({ en: z.string(), fr: z.string() }),
  description: z.object({ en: z.string(), fr: z.string() }),
});

const formSchema = z.object({
  title: z.object({ en: z.string(), fr: z.string() }),
  content: z.object({ en: z.string(), fr: z.string() }),
  imageUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  logoUrl: z.string().url({ message: 'Please enter a valid URL.' }).optional().or(z.literal('')),
  logoScale: z.number().min(0.5).max(5).optional(),
  services: z.array(serviceSchema),
});

type AboutFormValues = z.infer<typeof formSchema>;

/** Form field paths that can receive an image URL from the media library. */
type ImageField = 'imageUrl' | 'logoUrl' | `services.${number}.iconUrl`;

const emptyService = (): AboutFormValues['services'][number] => ({
  iconUrl: '',
  iconName: '',
  title: { en: '', fr: '' },
  description: { en: '', fr: '' },
});

/** Shape a stored AboutService into the form's service fields. */
const toFormService = (s: AboutService): AboutFormValues['services'][number] => ({
  iconUrl: s.iconUrl ?? '',
  iconName: s.iconName ?? '',
  title: { en: s.title?.en ?? '', fr: s.title?.fr ?? '' },
  description: { en: s.description?.en ?? '', fr: s.description?.fr ?? '' },
});

const toFormServices = (list: AboutService[]): AboutFormValues['services'] => list.map(toFormService);

/** Small icon preview shown on each card header (image, or built-in icon). */
function ServiceIconPreview({ iconUrl, iconName }: { iconUrl?: string; iconName?: string }) {
  if (iconUrl && /^https?:\/\//i.test(iconUrl)) {
    // Preview only — arbitrary admin-supplied hosts; keep a plain img here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt="" className="h-6 w-6 object-contain" />;
  }
  const Icon = iconName ? builtinIconMap[iconName as BuiltinIconName] : undefined;
  if (Icon) return <Icon className="h-6 w-6 text-primary" />;
  return null;
}

function ServiceCardEditor({
  index,
  total,
  canEdit,
  canManageMedia,
  onChooseImage,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  total: number;
  canEdit: boolean;
  canManageMedia: boolean;
  onChooseImage: (field: ImageField) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const { control } = useFormContext();
  // Live values so the header preview reflects the current icon as you type.
  const card = useWatch({ control, name: `services.${index}` });

  return (
    <div className="rounded-lg border border-white/10 bg-black/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ServiceIconPreview iconUrl={card?.iconUrl} iconName={card?.iconName} />
          <span className="font-medium">{t('aboutAdmin.services.card').replace('{index}', String(index + 1))}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={onMoveUp} disabled={!canEdit || index === 0} title={t('aboutAdmin.services.moveUp')} aria-label={t('aboutAdmin.services.moveUp')}>
            <FontAwesomeIcon icon={faArrowUp} />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={onMoveDown} disabled={!canEdit || index === total - 1} title={t('aboutAdmin.services.moveDown')} aria-label={t('aboutAdmin.services.moveDown')}>
            <FontAwesomeIcon icon={faArrowDown} />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={onRemove} disabled={!canEdit} title={t('aboutAdmin.services.remove')} aria-label={t('aboutAdmin.services.remove')}>
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        </div>
      </div>
      <FormField
        control={control}
        name={`services.${index}.iconUrl`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('aboutAdmin.services.iconUrl')}</FormLabel>
            <div className="flex items-center gap-2">
              <FormControl>
                <Input placeholder={t('aboutAdmin.services.iconUrlPlaceholder')} {...field} />
              </FormControl>
              <Button type="button" variant="outline" size="icon" onClick={() => onChooseImage(`services.${index}.iconUrl`)} disabled={!canManageMedia}>
                <FontAwesomeIcon icon={faImages} />
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      <MultilingualInput
        name={`services.${index}.title`}
        label={t('aboutAdmin.services.cardTitle')}
        placeholder={t('aboutAdmin.services.cardTitlePlaceholder')}
        disabled={!canEdit}
      />
      <MultilingualInput
        name={`services.${index}.description`}
        label={t('aboutAdmin.services.cardDescription')}
        placeholder={t('aboutAdmin.services.cardDescriptionPlaceholder')}
        type="textarea"
        disabled={!canEdit}
      />
    </div>
  );
}

export default function AboutAdmin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  
  const typedUser = user as AppUser | null;
  const isSuperAdmin = isSuperAdminCheck(typedUser);
  const canEditAbout = isSuperAdmin || (typedUser?.permissions?.canEditAbout ?? true);
  const canManageMedia = hasMediaAccess(typedUser);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void; field: ImageField } | null>(null);
  const [libraryTab, setLibraryTab] = useState<'images' | 'videos' | 'files'>('images');
  const [libraryCollection, setLibraryCollection] = useState<'primary' | 'extented'>('primary');

  const aboutContentRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'about', 'content') : null),
    [firestore]
  );
  const { data: aboutContent, isLoading } = useDoc<AboutPageContent>(aboutContentRef);

  const form = useForm<AboutFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: { en: '', fr: '' },
      content: { en: '', fr: '' },
      imageUrl: '',
      logoUrl: '',
      logoScale: 1,
      services: toFormServices(cloneDefaultServices()),
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService, move: moveService } = useFieldArray({
    control: form.control,
    name: 'services',
  });

  useEffect(() => {
    if (aboutContent) {
      form.reset({
        title: ensureMultilingualString(aboutContent.title),
        content: ensureMultilingualString(aboutContent.content),
        imageUrl: aboutContent.imageUrl || '',
        logoUrl: aboutContent.logoUrl || '',
        logoScale: aboutContent.logoScale || 1,
        services: Array.isArray(aboutContent.services)
          ? aboutContent.services.map((s) => toFormService(s))
          : toFormServices(cloneDefaultServices()),
      });
    }
  }, [aboutContent, form]);

  useEffect(() => {
    if (!canEditAbout) {
      form.reset(undefined, { keepValues: true, keepDirty: false });
    }
  }, [canEditAbout, form]);

  const onSubmit = (values: AboutFormValues) => {
    if (!aboutContentRef || !canEditAbout) return;
    const dataToSave = {
      ...values,
      logoUrl: values.logoUrl || '', // Ensure logoUrl is not undefined
      logoScale: values.logoScale || 1,
      services: values.services.map((s) => ({
        iconUrl: s.iconUrl || '',
        iconName: s.iconName || '',
        title: ensureMultilingualString(s.title),
        description: ensureMultilingualString(s.description),
      })),
    };
    setDocumentNonBlocking(aboutContentRef, dataToSave, { merge: true });
    revalidateHome(auth);
    toast({
      title: t('aboutAdmin.toast.saved.title'),
      description: t('aboutAdmin.toast.saved.description'),
    });
    setIsFormOpen(false); // Close dialog on submit
  };

  const handleChooseImage = (field: ImageField) => {
    if (!canEditAbout || !canManageMedia) return;
    setLibrarySelectionConfig({
      onSelect: (url, type) => {
        if (type === 'image') {
          form.setValue(field, url, { shouldValidate: true });
        } else {
          toast({ variant: 'destructive', title: t('aboutAdmin.toast.invalidFileType.title'), description: t('aboutAdmin.toast.invalidFileType.description') });
        }
        setIsLibraryOpen(false);
      },
      field: field,
    });
    setIsLibraryOpen(true);
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full gap-8 min-h-0">
        <PageTextEditor
          titleKey="pageContent.aboutTitle"
          fields={[
            { name: 'aboutHeading', labelKey: 'pageContent.aboutHeadingLabel' },
            { name: 'aboutSubtitle', labelKey: 'pageContent.subheadingLabel' },
          ]}
        />
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <div className="flex flex-col min-h-0">
              <div className="mb-6 flex-shrink-0 flex items-start justify-between">
                  <div className="text-left">
                      <h2 className="text-xl font-headline">{t('aboutAdmin.title')}</h2>
                      <p className="text-muted-foreground">{t('aboutAdmin.description')}</p>
                  </div>
                  <DialogTrigger asChild>
                      <Button variant="outline" size="sm" disabled={!canEditAbout}>
                          <FontAwesomeIcon icon={faPencilAlt} className="mr-2 h-4 w-4" />
                          {t('aboutAdmin.editPageContent')}
                      </Button>
                  </DialogTrigger>
              </div>
              <ClientAdmin />
          </div>
          <DialogContent className="w-[80vw] h-[90vh] flex flex-col glass-effect p-0 rounded-lg">
              <DialogHeader className="p-6 pb-0">
                <DialogTitle className="font-headline">{t('aboutAdmin.editDialogTitle')}</DialogTitle>
                <DialogDescription>
                  {t('aboutAdmin.editDialogDescription')}
                  {!canEditAbout && <span className="text-destructive font-bold block mt-2"> {t('aboutAdmin.readonly')}</span>}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    {isLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <Preloader />
                      </div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                          <fieldset disabled={!canEditAbout} className="group">
                            <FormField
                              control={form.control}
                              name="logoUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('aboutAdmin.logoUrl')}</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input placeholder={t('aboutAdmin.logoUrlPlaceholder')} {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleChooseImage('logoUrl')} disabled={!canManageMedia}>
                                      <FontAwesomeIcon icon={faImages} />
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                             <FormField
                              control={form.control}
                              name="logoScale"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('aboutAdmin.logoScale').replace('{percent}', String(Math.round((field.value || 1) * 100)))}</FormLabel>
                                  <FormControl>
                                    <Slider
                                      value={[field.value || 1]}
                                      onValueChange={(value) => field.onChange(value[0])}
                                      min={0.5}
                                      max={5}
                                      step={0.05}
                                    />
                                  </FormControl>
                                   <FormDescription>
                                    {t('aboutAdmin.logoScaleDescription')}
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <MultilingualInput
                              name="title"
                              label={t('aboutAdmin.heading')}
                              placeholder={t('aboutAdmin.headingPlaceholder')}
                              disabled={!canEditAbout}
                            />
                            <MultilingualInput
                              name="content"
                              label={t('aboutAdmin.paragraph')}
                              placeholder={t('aboutAdmin.paragraphPlaceholder')}
                              type="textarea"
                              disabled={!canEditAbout}
                            />
                            <FormField
                              control={form.control}
                              name="imageUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t('aboutAdmin.imageUrl')}</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input placeholder={t('aboutAdmin.imageUrlPlaceholder')} {...field} />
                                    </FormControl>
                                    <Button type="button" variant="outline" size="icon" onClick={() => handleChooseImage('imageUrl')} disabled={!canManageMedia}>
                                      <FontAwesomeIcon icon={faImages} />
                                    </Button>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Separator className="bg-white/10 my-8" />

                            <div className="space-y-4">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-lg font-headline">{t('aboutAdmin.services.title')}</h3>
                                  <p className="text-sm text-muted-foreground">{t('aboutAdmin.services.description')}</p>
                                </div>
                                <Button type="button" size="sm" onClick={() => appendService(emptyService())} disabled={!canEditAbout}>
                                  <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                                  {t('aboutAdmin.services.add')}
                                </Button>
                              </div>

                              {serviceFields.map((serviceField, index) => (
                                <ServiceCardEditor
                                  key={serviceField.id}
                                  index={index}
                                  total={serviceFields.length}
                                  canEdit={canEditAbout}
                                  canManageMedia={canManageMedia}
                                  onChooseImage={(field) => handleChooseImage(field)}
                                  onMoveUp={() => moveService(index, index - 1)}
                                  onMoveDown={() => moveService(index, index + 1)}
                                  onRemove={() => removeService(index)}
                                />
                              ))}
                            </div>

                            <div className="flex justify-end pt-4 gap-4">
                              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>{t('aboutAdmin.cancel')}</Button>
                              <Button type="submit" disabled={!canEditAbout}>{t('aboutAdmin.save')}</Button>
                            </div>
                          </fieldset>
                        </form>
                      </Form>
                    )}
                  </div>
                </ScrollArea>
              </div>
          </DialogContent>
        </Dialog>
      </div>
      {canManageMedia && (
      <MediaLibrary
        provider="cloudinary"
        isDialog={true}
        isOpen={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
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
        activeTab={libraryTab}
        setActiveTab={setLibraryTab}
        activeLibrary={libraryCollection}
        setActiveLibrary={setLibraryCollection}
        newlyUploadedId={null}
      />
      )}
    </>
  );
}
