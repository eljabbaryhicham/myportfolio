'use client';

import { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
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
}: MultilingualFieldProps) {
  const { lang } = useTranslation();
  const currentLocale = lang as SupportedLocale;
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>(currentLocale);
  const { control } = useFormContext();

  useEffect(() => {
    setActiveLocale(currentLocale);
  }, [currentLocale]);

  const value = useWatch({ control, name, defaultValue: { en: '', fr: '' } as MultilingualString });

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
}: {
  name: string;
  type: 'text' | 'textarea' | 'email' | 'url';
  placeholder?: string;
  disabled?: boolean;
  defaultValue: string;
}) {
  const { register } = useFormContext();
  // `register` directly binds the textarea/input to RHF at the full path
  // (e.g. 'homePageTitle.en'). Both locales are always registered with RHF
  // — no nested Controllers — so form state is correct regardless of which
  // tab is mounted.
  const registered = register(name);
  if (type === 'textarea') {
    return (
      <Textarea
        {...registered}
        rows={4}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-[80px]"
      />
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