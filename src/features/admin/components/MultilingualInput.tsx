'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
  type MultilingualString,
} from '@/lib/i18n/multilingual';
import { FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  en: 'EN',
  fr: 'FR',
};

const LOCALE_NAMES: Record<SupportedLocale, string> = {
  en: 'English',
  fr: 'Français',
};

interface MultilingualFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  description?: string;
  type?: 'text' | 'textarea' | 'email' | 'url';
  disabled?: boolean;
  className?: string;
  /**
   * When set AND `type === 'textarea'`, renders a paperclip button that
   * calls this callback with the active locale's textarea cursor position
   * (so the parent can insert media at the cursor). The parent is
   * responsible for opening the media picker and calling form.setValue
   * with the resulting insertion. See PortfolioItemFormSheet for usage.
   */
  onInsertMedia?: (fieldName: string, locale: SupportedLocale, cursorPos: number) => void;
}

/**
 * A form field that edits a multilingual string (stored as { en?, fr? } object)
 * in a react-hook-form context. Renders a small EN/FR tab switcher per field.
 *
 * Implementation notes:
 *  - Each locale is a separate `register('${name}.${locale}')` field, NOT a
 *    nested Controller — so RHF correctly owns all keys (avoids the prior
 *    bug where the inner Controller for inactive TabsContent never mounted).
 *  - `useWatch` reads the parent's current object so `form.reset()` updates
 *    both locales and we render the freshest value on every render.
 *  - `activeLocale` follows the global language toggle (§2.5).
 */
export function MultilingualInput({
  name,
  label,
  placeholder,
  description,
  type = 'text',
  disabled = false,
  className = '',
  onInsertMedia,
}: MultilingualFieldProps) {
  const { lang } = useTranslation();
  const currentLocale = lang as SupportedLocale;
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(currentLocale);
  const { control } = useFormContext();

  useEffect(() => {
    setActiveLocale(currentLocale);
  }, [currentLocale]);

  const value = useWatch({ control, name, defaultValue: { en: '', fr: '' } as MultilingualString });

  const showMediaPicker = !!onInsertMedia && type === 'textarea';

  return (
    <FormItem className={cn('space-y-2', className)}>
      {label && <FormLabel>{label}</FormLabel>}
      <Tabs value={activeLocale} onValueChange={(v) => setActiveLocale(v as SupportedLocale)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-background p-1 mb-2">
          {SUPPORTED_LOCALES.map((locale) => (
            <TabsTrigger
              key={locale}
              value={locale}
              title={LOCALE_NAMES[locale]}
              className={cn(
                'text-xs font-medium data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground'
              )}
            >
              {LOCALE_LABELS[locale]}
            </TabsTrigger>
          ))}
        </TabsList>
        {SUPPORTED_LOCALES.map((locale) => (
          <TabsContent key={locale} value={locale} className="pt-0">
            <LocaleField
              name={`${name}.${locale}`}
              type={type}
              placeholder={placeholder}
              disabled={disabled}
              defaultValue={value?.[locale] ?? ''}
              showMediaPicker={showMediaPicker}
              onPickMedia={
                onInsertMedia
                  ? () => {
                      // The active locale's textarea is the one the user is
                      // typing in; capture its cursor position now (the
                      // click itself moves the caret, so we read it before
                      // the picker opens).
                      onInsertMedia(name, locale, getActiveCursor(name, locale));
                    }
                  : undefined
              }
            />
          </TabsContent>
        ))}
      </Tabs>
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}

function LocaleField({
  name,
  type,
  placeholder,
  disabled,
  defaultValue,
  showMediaPicker,
  onPickMedia,
}: {
  name: string;
  type: 'text' | 'textarea' | 'email' | 'url';
  placeholder?: string;
  disabled?: boolean;
  defaultValue: string;
  showMediaPicker?: boolean;
  onPickMedia?: () => void;
}) {
  const { register } = useFormContext();
  // `register` directly binds the textarea/input to RHF at the full path
  // (e.g. 'homePageTitle.en'). Both locales are always registered with RHF
  // — no nested Controllers — so form state is correct regardless of which
  // tab is mounted.
  const registered = register(name);
  if (type === 'textarea') {
    return (
      <div className="relative">
        <Textarea
          {...registered}
          rows={4}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[80px] pr-10"
        />
        {showMediaPicker && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onPickMedia}
            disabled={disabled}
            title="Insert media"
            aria-label="Insert media from library"
          >
            <FontAwesomeIcon icon={faPaperclip} className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
  return (
    <Input
      {...registered}
      type={type}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

/**
 * Reads the cursor position of the RHF-registered textarea/input matching
 * the given form path. We reach into the DOM directly because RHF's
 * `register` returns a `ref` callback that we don't have a handle to here.
 * The form path is `name.locale` (e.g. "details.fr"), so we look up the
 * element by its `name` attribute.
 */
function getActiveCursor(name: string, _locale: SupportedLocale): number {
  if (typeof document === 'undefined') return 0;
  // `name` here is the RHF path (e.g. "details.fr"); the input's `name`
  // attribute matches it.
  const el = document.querySelector<HTMLTextAreaElement | HTMLInputElement>(
    `textarea[name="${CSS.escape(name)}"], input[name="${CSS.escape(name)}"]`
  );
  if (!el) return 0;
  // Prefer selectionStart on textareas; fall back to value.length for inputs.
  if ('selectionStart' in el && el.selectionStart != null) {
    return el.selectionStart;
  }
  return el.value.length;
}