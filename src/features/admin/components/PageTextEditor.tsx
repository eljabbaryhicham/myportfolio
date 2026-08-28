
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { doc } from 'firebase/firestore';
import { Form } from '@/components/ui/form';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { ensureMultilingualString } from '@/lib/i18n/multilingual';
import { MultilingualInput } from './MultilingualInput';
import { useMergedAutosave } from '@/hooks/useMergedAutosave';

interface PageTextField {
  /** Field name stored on homepage/settings */
  name: string;
  /** i18n label key */
  labelKey: string;
}

interface PageTextEditorProps {
  titleKey: string;
  fields: PageTextField[];
}

const textSchema = z.record(z.string(), z.object({ en: z.string(), fr: z.string() }).optional());
type TextFormValues = z.infer<typeof textSchema>;

/**
 * Small admin card that edits a set of text overrides on homepage/settings.
 * Used per admin tab to customize each public page's headings/button labels;
 * empty values fall back to the built-in translations on the public page.
 */
export default function PageTextEditor({ titleKey, fields }: PageTextEditorProps) {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const settingsDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
    [firestore]
  );
  const { data: homeSettings } = useDoc<Record<string, any>>(settingsDocRef);

  const form = useForm<TextFormValues>({
    resolver: zodResolver(textSchema),
    defaultValues: Object.fromEntries(fields.map(f => [f.name, { en: '', fr: '' }])),
  });

  useEffect(() => {
    if (homeSettings) {
      form.reset(Object.fromEntries(fields.map(f => [f.name, ensureMultilingualString(homeSettings[f.name])])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeSettings]);

  useMergedAutosave({
    ref: settingsDocRef,
    watch: form.watch,
    beforeWrite: (changes) => {
      const merged: Record<string, any> = {};
      for (const [key, value] of Object.entries(changes)) {
        merged[key] = value ?? { en: '', fr: '' };
      }
      return merged;
    },
  });

  return (
    <Collapsible defaultOpen={false} className="p-4 rounded-lg border glass-effect">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-left group">
        <h3 className="font-headline text-lg">{t(titleKey)}</h3>
        <FontAwesomeIcon
          icon={faChevronDown}
          className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 pt-4">
        <Form {...form}>
          <fieldset className="space-y-4">
            {fields.map((f) => (
              <MultilingualInput
                key={f.name}
                name={f.name}
                label={t(f.labelKey)}
              />
            ))}
          </fieldset>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}
