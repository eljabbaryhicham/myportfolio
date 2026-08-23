
'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { doc } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { debounce } from '@/lib/utils';

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

const textSchema = z.record(z.string(), z.string().optional());
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
  const { data: homeSettings } = useDoc<Record<string, string>>(settingsDocRef);

  const form = useForm<TextFormValues>({
    resolver: zodResolver(textSchema),
    defaultValues: Object.fromEntries(fields.map(f => [f.name, ''])),
  });

  useEffect(() => {
    if (homeSettings) {
      form.reset(Object.fromEntries(fields.map(f => [f.name, homeSettings[f.name] || ''])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeSettings]);

  const pendingRef = useRef<Record<string, any>>({});

  useEffect(() => {
    const debouncedSave = debounce(() => {
      if (!settingsDocRef || Object.keys(pendingRef.current).length === 0) return;
      const changes = pendingRef.current;
      pendingRef.current = {};
      setDocumentNonBlocking(settingsDocRef, changes, { merge: true });
    }, 500);

    const subscription = form.watch((value, { name }) => {
      if (name && typeof name === 'string') {
        pendingRef.current[name] = value[name] ?? '';
        debouncedSave();
      }
    });

    return () => {
      subscription.unsubscribe();
      debouncedSave.cancel();
    };
  }, [form, settingsDocRef]);

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
              <FormField
                key={f.name}
                control={form.control}
                name={f.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(f.labelKey)}</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </fieldset>
        </Form>
      </CollapsibleContent>
    </Collapsible>
  );
}
