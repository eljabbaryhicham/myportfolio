
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faImages, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { MultilingualInput } from './MultilingualInput';
import { ensureMultilingualString } from '@/lib/i18n/multilingual';
import UnifiedMediaPicker from './UnifiedMediaPicker';
import { deriveCloudinarySpriteVtt } from '@/lib/cloudinary-vtt';


// Pre-filled Details content for NEW projects (existing projects untouched).
export const DEFAULT_DETAILS_TEMPLATE = `Title

Project Name : 

Project Type : Motion Design

Realization Time : Few Hours

Video Duration : 30 seconds

Tools Used : Premiere Pro - After Effects - Photoshop

Direction : MelliVision | Driven By Detail`;

const formSchema = z.object({
  title: z.object({
    en: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
    fr: z.string().optional(),
  }),
  description: z.object({
    en: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
    fr: z.string().optional(),
  }),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().url({ message: 'Please enter a valid URL for the grid thumbnail.' }),
  thumbnailVttUrl: z.string().url({ message: 'Please enter a valid VTT URL.' }).optional().or(z.literal('')),
  sourceUrl: z.string().url({ message: 'Please enter a valid URL for the main media.' }).optional().or(z.literal('')),
  previewUrl: z.string().url({ message: 'Please enter a valid URL for the hover preview media.' }).optional().or(z.literal('')),
  details: z.object({
    en: z.string().optional(),
    fr: z.string().optional(),
  }).optional(),
  thumbnailHint: z.string().optional(),
  featured: z.boolean().optional(),
  order: z.number().optional(),
  isVisible: z.boolean().optional(),
  useVideoFrameAsPoster: z.boolean().optional(),
});

type PortfolioItemFormValues = z.infer<typeof formSchema>;

interface PortfolioItemFormProps {
  item: PortfolioItem | null;
  onSubmit: (values: PortfolioItem) => void;
  isOpen: boolean; 
  setIsOpen: (isOpen: boolean) => void;
  onChooseFromLibrary: (onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void) => void;
  canEdit: boolean;
  canChooseFromLibrary: boolean;
  onDelete?: (id: string) => void;
}

export function PortfolioItemFormSheet({isOpen, setIsOpen, item, onSubmit, onChooseFromLibrary, canEdit, canChooseFromLibrary, onDelete}: PortfolioItemFormProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { t } = useTranslation();
    const { toast } = useToast();

    const form = useForm<PortfolioItemFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: { en: '', fr: '' },
        description: { en: '', fr: '' },
        type: 'image',
        thumbnailUrl: '',
        thumbnailVttUrl: '',
        sourceUrl: '',
        thumbnailHint: '',
        featured: false,
        details: { en: DEFAULT_DETAILS_TEMPLATE, fr: DEFAULT_DETAILS_TEMPLATE },
        order: undefined,
          isVisible: true,
          useVideoFrameAsPoster: false,
        }
    });

    // ---- Insert media at cursor (details field only) ----
    // When the user clicks the paperclip on the details MultilingualInput, we
    // capture the (fieldName, locale, cursorPos) so the picker can insert
    // at the right place in the right locale when it returns a URL.
    const [mediaInsertTarget, setMediaInsertTarget] = useState<
      { fieldName: string; locale: 'en' | 'fr'; cursorPos: number } | null
    >(null);
    const [isMediaInsertPickerOpen, setIsMediaInsertPickerOpen] = useState(false);

    const handleDetailsInsertMedia = useCallback(
      (fieldName: string, locale: 'en' | 'fr', cursorPos: number) => {
        if (!canChooseFromLibrary) return;
        setMediaInsertTarget({ fieldName, locale, cursorPos });
        setIsMediaInsertPickerOpen(true);
      },
      [canChooseFromLibrary]
    );

    const handleMediaInserted = useCallback(
      (url: string, type: 'image' | 'video' | 'raw', filename: string) => {
        if (!mediaInsertTarget) return;
        const { fieldName, locale, cursorPos } = mediaInsertTarget;
        const fieldPath = `${fieldName}.${locale}` as const;
        const currentValue = (form.getValues(fieldName as any)?.[locale] as string | undefined) ?? '';
        const safePos = Math.max(0, Math.min(cursorPos, currentValue.length));
        const before = currentValue.slice(0, safePos);
        const after = currentValue.slice(safePos);
        // If we're inserting at end-of-string, add a leading newline so the
        // media sits on its own line.
        const leading = before.length === 0 ? '' : (before.endsWith('\n') ? '' : '\n');
        // If there's content after, add a trailing newline so the next
        // paragraph isn't glued to the media.
        const trailing = after.length === 0 ? '' : (after.startsWith('\n') ? '' : '\n');
        let insertion: string;
        if (type === 'video') {
          insertion = `${leading}<video src="${url}" />${trailing}`;
        } else if (type === 'raw') {
          // Files (PDF, ZIP, etc.) become a clickable download link rendered
          // as the styled card in ProjectDetailsContent. That card only
          // triggers when the markdown parser sees <a download>, so we
          // emit raw HTML instead of a Markdown link. detailsSanitizeSchema
          // already permits href / download / title on <a>.
          const linkText = filename || 'Download file';
          insertion = `${leading}<a href="${url}" download title="${linkText}">${linkText}</a>${trailing}`;
        } else {
          insertion = `${leading}![media](${url})${trailing}`;
        }
        const newValue = before + insertion + after;
        form.setValue(fieldPath as any, newValue, { shouldValidate: true });
        setIsMediaInsertPickerOpen(false);
        setMediaInsertTarget(null);
        // Re-focus the textarea at the new cursor position (after the
        // insertion, so the user can keep typing).
        setTimeout(() => {
          const el = document.querySelector<HTMLTextAreaElement>(
            `textarea[name="${CSS.escape(fieldPath)}"]`
          );
          if (el) {
            el.focus();
            const newPos = safePos + insertion.length;
            el.setSelectionRange(newPos, newPos);
          }
        }, 50);
      },
      [mediaInsertTarget, form]
    );

    const itemType = useWatch({
      control: form.control,
      name: 'type',
    });

    const useVideoFrame = useWatch({
      control: form.control,
      name: 'useVideoFrameAsPoster',
    });

    function deriveVideoThumbnail(url: string): string | null {
      const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`;

      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      if (vimeoMatch) return `https://vumbnail.com/${vimeoMatch[1]}.jpg`;

      const extReplaced = url.replace(/\.(mp4|m3u8|webm)(\?.*)?$/i, '.jpg');
      if (extReplaced !== url) return extReplaced;

      return null;
    }

    const applyVideoFrameThumbnail = (checked: boolean) => {
      if (checked) {
        const currentSource = form.getValues('sourceUrl');
        if (currentSource) {
          const frameUrl = deriveVideoThumbnail(currentSource);
          if (frameUrl) {
            form.setValue('thumbnailUrl', frameUrl, { shouldValidate: true });
          }
        }
      }
    };

    useEffect(() => {
      if (isOpen) {
        const defaultValues = item ? {
            ...item,
            featured: item.featured || false,
            thumbnailHint: item.thumbnailHint || '',
            title: ensureMultilingualString(item.title),
            description: ensureMultilingualString(item.description),
            details: ensureMultilingualString(item.details),
            sourceUrl: item.sourceUrl || '',
            previewUrl: item.previewUrl || '',
            thumbnailVttUrl: item.thumbnailVttUrl || '',
            order: item.order ?? 0,
            isVisible: item.isVisible ?? true,
            useVideoFrameAsPoster: item.useVideoFrameAsPoster || false,
        } : {
            title: { en: '', fr: '' },
            description: { en: '', fr: '' },
            type: 'image' as 'image' | 'video',
            thumbnailUrl: '',
            thumbnailVttUrl: '',
            sourceUrl: '',
            previewUrl: '',
            thumbnailHint: '',
            featured: false,
            details: { en: DEFAULT_DETAILS_TEMPLATE, fr: DEFAULT_DETAILS_TEMPLATE },
            order: undefined, // Let parent component decide the order for new items
            isVisible: true,
            useVideoFrameAsPoster: false,
        };
        form.reset(defaultValues);
      }
    }, [isOpen, item, form]);
    
    useEffect(() => {
        if (!canEdit) {
            Object.keys(form.getValues()).forEach(key => {
                form.control.getFieldState(key as keyof PortfolioItemFormValues).isDirty = false;
            });
        }
    }, [canEdit, form, isOpen]);


    const handleSubmit = (values: PortfolioItemFormValues) => {
        if (!canEdit) return;
        onSubmit({
          id: item?.id || '', // id will be handled by parent
          ...values,
          title: ensureMultilingualString(values.title),
          description: ensureMultilingualString(values.description),
          details: values.details ? ensureMultilingualString(values.details) : undefined,
          thumbnailHint: values.thumbnailHint || '',
          isVisible: values.isVisible ?? true,
          useVideoFrameAsPoster: values.useVideoFrameAsPoster || false,
        });
    };

    const handleChooseThumbnail = () => {
        if (!canChooseFromLibrary) return;
        onChooseFromLibrary((url, type: 'image' | 'video' | 'raw') => {
            if (type !== 'image') {
              toast({ variant: 'destructive', title: t('portfolioForm.toast.invalidThumbnail.title'), description: t('portfolioForm.toast.invalidThumbnail.description')});
              return;
            }
            form.setValue('thumbnailUrl', url, { shouldValidate: true });
        });
    };

    const handleChoosePreview = () => {
        if (!canChooseFromLibrary) return;
        onChooseFromLibrary((url) => {
            form.setValue('previewUrl', url, { shouldValidate: true });
        });
    };

    const handleChooseSource = () => {
        if (!canChooseFromLibrary) return;
        onChooseFromLibrary((url, type, filename) => {
            form.setValue('sourceUrl', url, { shouldValidate: true });
            form.setValue('type', type === 'raw' ? 'image' : type, { shouldValidate: true });
             // If it's a new item, set the title from the filename
            if (!item?.id) {
                const title = filename.split('.').slice(0, -1).join('.');
                form.setValue('title', { en: title, fr: title }, { shouldValidate: true });
            }
            if (form.getValues('useVideoFrameAsPoster')) {
                const frameUrl = deriveVideoThumbnail(url);
                if (frameUrl) {
                    form.setValue('thumbnailUrl', frameUrl, { shouldValidate: true });
                }
            }
        });
    };

    const handleChooseVtt = () => {
        if (!canChooseFromLibrary) return;
        onChooseFromLibrary((url, type) => {
            if (type !== 'raw') {
              toast({ variant: 'destructive', title: t('portfolioForm.toast.invalidThumbnail.title'), description: 'Please select a VTT file.'});
              return;
            }
            form.setValue('thumbnailVttUrl', url, { shouldValidate: true });
        });
    };

    const handleGenerateVttFromSource = () => {
        const source = form.getValues('sourceUrl');
        const vtt = deriveCloudinarySpriteVtt(source);
        if (!vtt) {
            toast({
                variant: 'destructive',
                title: t('portfolioForm.toast.sourceNotSupported.title'),
                description: t('portfolioForm.toast.sourceNotSupported.description'),
            });
            return;
        }
        form.setValue('thumbnailVttUrl', vtt, { shouldValidate: true });
        toast({
            title: t('portfolioForm.toast.generatedThumbnails.title'),
            description: t('portfolioForm.toast.generatedThumbnails.description'),
        });
    };

    return (<>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="w-[80vw] h-[90vh] flex flex-col glass-effect p-0 rounded-lg">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="font-headline">{item ? t('portfolioForm.editTitle') : t('portfolioForm.addTitle')}</DialogTitle>
                    <DialogDescription>
                        {item ? t('portfolioForm.editDescription') : t('portfolioForm.addDescription')}
                        {!canEdit && <span className="text-destructive font-bold block mt-2"> {t('portfolioForm.readonly')}</span>}
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mr-2">
                  <div className="p-6">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
                        <fieldset disabled={!canEdit} className="group space-y-8">
                          <MultilingualInput
                            name="title"
                            label={t('portfolioForm.title')}
                            placeholder={t('portfolioForm.titlePlaceholder')}
                          />
                          <MultilingualInput
                            name="description"
                            label={t('portfolioForm.description')}
                            placeholder={t('portfolioForm.descriptionPlaceholder')}
                            type="textarea"
                          />
                          <MultilingualInput
                            name="details"
                            label={t('portfolioForm.details')}
                            placeholder={t('portfolioForm.detailsPlaceholder')}
                            description={t('portfolioForm.detailsHelp')}
                            type="textarea"
                            onInsertMedia={canChooseFromLibrary ? handleDetailsInsertMedia : undefined}
                          />
                          <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('portfolioForm.type')}</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                  <SelectTrigger>
                                      <SelectValue placeholder={t('portfolioForm.typePlaceholder')} />
                                  </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                  <SelectItem value="image">{t('portfolioForm.typeImage')}</SelectItem>
                                  <SelectItem value="video">{t('portfolioForm.typeVideo')}</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="thumbnailUrl"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('portfolioForm.thumbnailUrl')}</FormLabel>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder={t('portfolioForm.thumbnailUrlPlaceholder')} {...field} disabled={!!useVideoFrame} />
                                  </FormControl>
                                  <Button type="button" variant="outline" size="sm" onClick={handleChooseThumbnail} disabled={!!useVideoFrame || !canChooseFromLibrary}>
                                      <FontAwesomeIcon icon={faImages} />
                                      <span className="ml-2 hidden sm:inline">{t('portfolioForm.library')}</span>
                                  </Button>
                                </div>
                                {useVideoFrame && field.value && (
                                    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary video-frame preview with dynamic dimensions
                                    <img src={field.value} alt="Video frame thumbnail" className="mt-2 h-20 rounded-md object-cover" />
                                )}
                                <FormDescription>{useVideoFrame ? t('portfolioForm.useVideoFrameAsPosterDescription') : t('portfolioForm.thumbnailDescription')}</FormDescription>
                                <FormMessage />
                              </FormItem>
                          )}
                          />
                           {itemType === 'video' && (
                            <>
                              <FormField
                                  control={form.control}
                                  name="useVideoFrameAsPoster"
                                  render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 glass-effect">
                                          <div className="space-y-0.5">
                                              <FormLabel className="text-base">
                                                  {t('portfolioForm.useVideoFrameAsPoster')}
                                              </FormLabel>
                                              <FormDescription>
                                                  {t('portfolioForm.useVideoFrameAsPosterDescription')}
                                              </FormDescription>
                                          </div>
                                          <FormControl>
                                              <Switch
                                                   checked={field.value}
                                                   onCheckedChange={(checked) => {
                                                       field.onChange(checked);
                                                       applyVideoFrameThumbnail(checked);
                                                   }}
                                               />
                                          </FormControl>
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                control={form.control}
                                name="thumbnailVttUrl"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>{t('portfolioForm.thumbnailsVttUrl')}</FormLabel>
                                    <div className="flex gap-2">
                                        <FormControl>
                                            <Input placeholder={t('portfolioForm.thumbnailsVttUrlPlaceholder')} {...field} className="flex-1" />
                                        </FormControl>
                                        <Button type="button" variant="outline" onClick={handleChooseVtt} disabled={!canChooseFromLibrary}>
                                            <FontAwesomeIcon icon={faImages} className="mr-2 h-4 w-4" />
                                            {t('portfolioForm.library')}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleGenerateVttFromSource}>
                                            <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2 h-4 w-4" />
                                            {t('portfolioForm.generateThumbnails')}
                                        </Button>
                                    </div>
                                    <FormDescription>{t('portfolioForm.thumbnailsVttUrlDescription')}</FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </>
                          )}
                          <FormField
                          control={form.control}
                          name="thumbnailHint"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('portfolioForm.thumbnailHint')}</FormLabel>
                              <FormControl>
                                  <Input placeholder={t('portfolioForm.thumbnailHintPlaceholder')} {...field} />
                              </FormControl>
                              <FormDescription>
                                  {t('portfolioForm.thumbnailHintDescription')}
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="sourceUrl"
                          render={({ field }) => (
                              <FormItem>
                                <FormLabel>{t('portfolioForm.sourceMediaUrl')}</FormLabel>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                      <Input placeholder={t('portfolioForm.sourceMediaUrlPlaceholder')} {...field} />
                                  </FormControl>
                                   <Button type="button" variant="outline" size="sm" onClick={handleChooseSource} disabled={!canChooseFromLibrary}>
                                    <FontAwesomeIcon icon={faImages} />
                                    <span className="ml-2 hidden sm:inline">{t('portfolioForm.library')}</span>
                                  </Button>
                                </div>
                                 <FormDescription>{t('portfolioForm.sourceMediaDescription')}</FormDescription>
                                 <FormMessage />
                               </FormItem>
                           )}
                           />
                           <FormField
                           control={form.control}
                           name="previewUrl"
                           render={({ field }) => (
                               <FormItem>
                                 <FormLabel>{t('portfolioForm.previewMediaUrl')}</FormLabel>
                                 <div className="flex items-center gap-2">
                                   <FormControl>
                                       <Input placeholder={t('portfolioForm.previewMediaUrlPlaceholder')} {...field} />
                                   </FormControl>
                                    <Button type="button" variant="outline" size="sm" onClick={handleChoosePreview} disabled={!canChooseFromLibrary}>
                                     <FontAwesomeIcon icon={faImages} />
                                     <span className="ml-2 hidden sm:inline">{t('portfolioForm.library')}</span>
                                   </Button>
                                 </div>
                                 <FormDescription>{t('portfolioForm.previewMediaDescription')}</FormDescription>
                                 <FormMessage />
                               </FormItem>
                           )}
                           />
                           <FormField
                            control={form.control}
                            name="order"
                            render={({ field: { onChange, ...fieldProps } }) => (
                                <FormItem>
                                    <FormLabel>{t('portfolioForm.order')}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...fieldProps}
                                            value={fieldProps.value ?? ''}
                                            onChange={event => {
                                                const value = event.target.value;
                                                onChange(value === '' ? undefined : Number(value));
                                            }}
                                            />
                                    </FormControl>
                                    <FormDescription>
                                        {t('portfolioForm.orderDescription')}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField
                                control={form.control}
                                name="isVisible"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 glass-effect">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base">
                                                {t('portfolioForm.visible')}
                                            </FormLabel>
                                            <FormDescription>
                                                {t('portfolioForm.visibleDescription')}
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                          <div className="flex justify-between items-center pt-4">
                              {item?.id && onDelete ? (
                                <Button type="button" variant="destructive" onClick={() => setShowDeleteConfirm(true)} disabled={!canEdit}>
                                  {t('projectAdmin.delete') || 'Delete'}
                                </Button>
                              ) : <span />}
                              <div className="flex space-x-4">
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t('portfolioForm.cancel')}</Button>
                                <Button type="submit" disabled={!canEdit}>{t('portfolioForm.save')}</Button>
                              </div>
                          </div>
                          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                            <AlertDialogContent className="glass-effect">
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t('projectAdmin.confirmDelete') || 'Delete project?'}</AlertDialogTitle>
                                <AlertDialogDescription>{t('projectAdmin.confirmDeleteDescription') || 'This will permanently delete this project. This cannot be undone.'}</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('portfolioForm.cancel') || 'Cancel'}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => { if (item?.id) onDelete!(item.id); setShowDeleteConfirm(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {t('projectAdmin.delete') || 'Delete'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </fieldset>
                      </form>
                      </Form>
                  </div>
                </ScrollArea>
                <DialogClose className={cn(
                  "absolute right-4 top-4 h-8 w-8",
                  "flex items-center justify-center rounded-full transition-opacity",
                  "bg-destructive text-destructive-foreground opacity-70 hover:opacity-100",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "disabled:pointer-events-none"
                )}>
                    <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                    <span className="sr-only">{t('portfolioForm.close')}</span>
                </DialogClose>
            </DialogContent>
        </Dialog>
        {canChooseFromLibrary && (
        <UnifiedMediaPicker
            isOpen={isMediaInsertPickerOpen}
            onOpenChange={(open) => {
                setIsMediaInsertPickerOpen(open);
                if (!open) setMediaInsertTarget(null);
            }}
            onMediaSelect={handleMediaInserted}
        />
        )}
    </>)
}
