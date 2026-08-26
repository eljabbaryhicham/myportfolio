
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
import { Textarea } from '@/components/ui/textarea';
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
import { useEffect, useState, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faImages, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from '@/lib/i18n/useTranslation';
import UnifiedMediaPicker from './UnifiedMediaPicker';


// Pre-filled Details content for NEW projects (existing projects untouched).
export const DEFAULT_DETAILS_TEMPLATE = `Title

Project Name : 

Project Type : Motion Design

Realization Time : Few Hours

Video Duration : 30 seconds

Tools Used : Premiere Pro - After Effects - Photoshop

Direction : MelliVision | Driven By Detail`;

const formSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.',
  }),
  type: z.enum(['image', 'video']),
  thumbnailUrl: z.string().url({ message: 'Please enter a valid URL for the grid thumbnail.' }),
  thumbnailVttUrl: z.string().url({ message: 'Please enter a valid VTT URL.' }).optional().or(z.literal('')),
  sourceUrl: z.string().url({ message: 'Please enter a valid URL for the main media.' }).optional().or(z.literal('')),
  previewUrl: z.string().url({ message: 'Please enter a valid URL for the hover preview media.' }).optional().or(z.literal('')),
  details: z.string().optional(),
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
  onDelete?: (id: string) => void;
}

export function PortfolioItemFormSheet({isOpen, setIsOpen, item, onSubmit, onChooseFromLibrary, canEdit, onDelete}: PortfolioItemFormProps) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const { t } = useTranslation();
    const { toast } = useToast();

    const form = useForm<PortfolioItemFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        title: '',
        description: '',
        type: 'image',
        thumbnailUrl: '',
        thumbnailVttUrl: '',
        sourceUrl: '',
        thumbnailHint: '',
        featured: false,
        details: DEFAULT_DETAILS_TEMPLATE,
        order: undefined,
          isVisible: true,
          useVideoFrameAsPoster: false,
        }
    });

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
            details: item.details || '',
            sourceUrl: item.sourceUrl || '',
            previewUrl: item.previewUrl || '',
            thumbnailVttUrl: item.thumbnailVttUrl || '',
            order: item.order ?? 0,
            isVisible: item.isVisible ?? true,
            useVideoFrameAsPoster: item.useVideoFrameAsPoster || false,
        } : {
            title: '',
            description: '',
            type: 'image' as 'image' | 'video',
            thumbnailUrl: '',
            thumbnailVttUrl: '',
            sourceUrl: '',
            previewUrl: '',
            thumbnailHint: '',
            featured: false,
            details: DEFAULT_DETAILS_TEMPLATE,
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
          thumbnailHint: values.thumbnailHint || '',
          isVisible: values.isVisible ?? true,
          useVideoFrameAsPoster: values.useVideoFrameAsPoster || false,
        });
    };

    const handleChooseThumbnail = () => {
        onChooseFromLibrary((url, type: 'image' | 'video' | 'raw') => {
            if (type !== 'image') {
              toast({ variant: 'destructive', title: t('portfolioForm.toast.invalidThumbnail.title'), description: t('portfolioForm.toast.invalidThumbnail.description')});
              return;
            }
            form.setValue('thumbnailUrl', url, { shouldValidate: true });
        });
    };

    const handleChoosePreview = () => {
        onChooseFromLibrary((url) => {
            form.setValue('previewUrl', url, { shouldValidate: true });
        });
    };

    const handleChooseSource = () => {
        onChooseFromLibrary((url, type, filename) => {
            form.setValue('sourceUrl', url, { shouldValidate: true });
            form.setValue('type', type === 'raw' ? 'image' : type, { shouldValidate: true });
             // If it's a new item, set the title from the filename
            if (!item?.id) {
                const title = filename.split('.').slice(0, -1).join('.');
                form.setValue('title', title, { shouldValidate: true });
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
        onChooseFromLibrary((url, type) => {
            if (type !== 'raw') {
              toast({ variant: 'destructive', title: t('portfolioForm.toast.invalidThumbnail.title'), description: 'Please select a VTT file.'});
              return;
            }
            form.setValue('thumbnailVttUrl', url, { shouldValidate: true });
        });
    };

    const [mediaPickerField, setMediaPickerField] = useState<'description' | 'details' | null>(null);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const cursorPosRef = useRef<number>(0);
    const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement }>({});

    const handleInsertMedia = useCallback((fieldName: 'description' | 'details') => {
        const textarea = textareaRefs.current[fieldName];
        cursorPosRef.current = textarea?.selectionStart ?? (form.getValues(fieldName) || '').length;
        setMediaPickerField(fieldName);
        setIsMediaPickerOpen(true);
    }, [form]);

    const handleMediaInserted = useCallback((url: string, type: 'image' | 'video' | 'raw', filename: string) => {
        if (!mediaPickerField) return;
        const currentValue = form.getValues(mediaPickerField) || '';
        const pos = cursorPosRef.current;
        const before = currentValue.slice(0, pos);
        const after = currentValue.slice(pos);
        const suffix = pos < currentValue.length ? '' : '\n';
        let insertion = '';
        if (type === 'video') {
            insertion = `<video src="${url}" controls title="${filename}" />\n`;
        } else if (type === 'raw') {
            insertion = `<a href="${url}" download title="${filename}">Download</a>\n`;
        } else {
            insertion = `![${filename}](${url})\n`;
        }
        const newValue = before + insertion + suffix + after;
        form.setValue(mediaPickerField, newValue, { shouldValidate: true });
        setIsMediaPickerOpen(false);
        setMediaPickerField(null);
        setTimeout(() => {
            const textarea = textareaRefs.current[mediaPickerField];
            if (textarea) {
                const newPos = pos + insertion.length + suffix.length;
                textarea.focus();
                textarea.setSelectionRange(newPos, newPos);
            }
        }, 50);
    }, [mediaPickerField, form]);
    
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
                          <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('portfolioForm.title')}</FormLabel>
                              <FormControl>
                                  <Input placeholder={t('portfolioForm.titlePlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('portfolioForm.description')}</FormLabel>
                              <FormControl>
                                  <div className="relative">
                                      <Textarea
                                        placeholder={t('portfolioForm.descriptionPlaceholder')}
                                        className="pr-10"
                                        {...field}
                                        ref={(el) => { textareaRefs.current.description = el!; field.ref(el); }}
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleInsertMedia('description')}
                                        title="Insert media"
                                      >
                                        <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4" />
                                      </Button>
                                  </div>
                              </FormControl>
                              <FormMessage />
                              </FormItem>
                          )}
                          />
                          <FormField
                          control={form.control}
                          name="details"
                          render={({ field }) => (
                              <FormItem>
                              <FormLabel>{t('portfolioForm.details')}</FormLabel>
                              <FormControl>
                                  <div className="relative">
                                      <Textarea
                                        placeholder={t('portfolioForm.detailsPlaceholder')}
                                        className="min-h-[150px] pr-10"
                                        {...field}
                                        ref={(el) => { textareaRefs.current.details = el!; field.ref(el); }}
                                      />
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                                        onClick={() => handleInsertMedia('details')}
                                        title="Insert media"
                                      >
                                        <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4" />
                                      </Button>
                                  </div>
                              </FormControl>
                              <FormDescription>
                                {t('portfolioForm.detailsHelp')}
                              </FormDescription>
                              <FormMessage />
                              </FormItem>
                          )}
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
                                  <Button type="button" variant="outline" size="sm" onClick={handleChooseThumbnail} disabled={!!useVideoFrame}>
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
                                        <Button type="button" variant="outline" onClick={handleChooseVtt}>
                                            <FontAwesomeIcon icon={faImages} className="mr-2 h-4 w-4" />
                                            {t('portfolioForm.library')}
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
                                   <Button type="button" variant="outline" size="sm" onClick={handleChooseSource}>
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
                                    <Button type="button" variant="outline" size="sm" onClick={handleChoosePreview}>
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
        <UnifiedMediaPicker
            isOpen={isMediaPickerOpen}
            onOpenChange={(open) => {
                setIsMediaPickerOpen(open);
                if (!open) setMediaPickerField(null);
            }}
            onMediaSelect={handleMediaInserted}
        />
    </>)
}
