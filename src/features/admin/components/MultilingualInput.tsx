'use client';

import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  getLocalizedString,
  type MultilingualString,
  type MultilingualStringOptional,
  SUPPORTED_LOCALES,
  type SupportedLocale,
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
  /** Optional external control of media insertion in textarea fields */
  onTextareaRender?: (locale: SupportedLocale) => React.ReactNode;
}

/**
 * A form field that edits a multilingual string (stored as { en, fr } object) in a
 * react-hook-form context. Renders a small EN/FR tab switcher per field.
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

  const fieldValue = (val: unknown): MultilingualString | MultilingualStringOptional | undefined =>
    (typeof val === 'object' && val !== null ? val as MultilingualString : undefined);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const mls = fieldValue(field.value);
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
              {SUPPORTED_LOCALES.map((locale) => {
                const value = getLocalizedString(mls, locale);
                return (
                  <TabsContent key={locale} value={locale} className="pt-0">
                    <Controller
                      name={`${name}.${locale}`}
                      control={control}
                      render={({ field: localeField }) =>
                        type === 'textarea' ? (
                          <Textarea
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => localeField.onChange(e.target.value)}
                            disabled={disabled}
                            className="min-h-[80px]"
                          />
                        ) : (
                          <Input
                            type={type}
                            placeholder={placeholder}
                            value={value}
                            onChange={(e) => localeField.onChange(e.target.value)}
                            disabled={disabled}
                          />
                        )
                      }
                    />
                  </TabsContent>
                );
              })}
            </Tabs>
            {description && <FormDescription>{description}</FormDescription>}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
