'use client';

import { useEffect, useRef } from 'react';
import type { UseFormWatch } from 'react-hook-form';
import type { DocumentReference } from 'firebase/firestore';
import { debounce } from '@/lib/utils';
import { setDocumentNonBlocking } from '@/firebase';

interface UseMergedAutosaveOptions {
  /** Hook is inert until all of these are truthy (canEdit && isMounted && docRef). */
  enabled?: boolean;
  /** Firestore doc to merge pending changes into. */
  ref: DocumentReference | null;
  /** The react-hook-form `watch` from the owning useForm(), to subscribe to changes. */
  watch: UseFormWatch<any>;
  /** Debounce window in ms. Default 500. */
  delay?: number;
  /**
   * Transform/batch hook applied to the accumulated pending changes before the
   * merge write. Return the object that should actually reach Firestore.
   */
  beforeWrite?: (changes: Record<string, any>) => Record<string, any>;
  /** Side-effect invoked after a successful write (e.g. derive theme HSL). */
  afterWrite?: (written: Record<string, any>) => void;
  /** Called each time a write actually fires (e.g. to show a toast). */
  onSaved?: () => void;
}

/**
 * Shared "autosave with merged batch" hook.
 *
 * Every edit on any field is accumulated into one pending map and written as a
 * single `merge` setDocument. A single shared debounce timer also coalesces
 * rapid edits — so picking a background image and switching its type within the
 * same window does NOT drop the earlier URL write.
 *
 * Both parent forms and dialog-based editors were re-implementing this loop
 * with subtle inconsistencies (some only saved the last-changed field; HomeAdmin
 * used a plain object instead of a stable useRef). This is the single canonical
 * implementation all of them now use. On unmount (or when `enabled` flips off)
 * any in-flight debounce is cancelled — no write fires after cleanup.
 */
export function useMergedAutosave({
  enabled = true,
  ref,
  watch,
  delay = 500,
  beforeWrite,
  afterWrite,
  onSaved,
}: UseMergedAutosaveOptions) {
  const pendingRef = useRef<Record<string, any>>({});
  const beforeWriteRef = useRef(beforeWrite);
  const afterWriteRef = useRef(afterWrite);
  const onSavedRef = useRef(onSaved);

  useEffect(() => {
    beforeWriteRef.current = beforeWrite;
    afterWriteRef.current = afterWrite;
    onSavedRef.current = onSaved;
  }, [beforeWrite, afterWrite, onSaved]);

  useEffect(() => {
    if (!enabled || !ref) return;

    const docRef = ref;
    const debouncedSave = debounce(() => {
      if (Object.keys(pendingRef.current).length === 0) return;
      const raw = pendingRef.current;
      pendingRef.current = {};
      const written = beforeWriteRef.current?.(raw) ?? raw;
      if (!written || Object.keys(written).length === 0) return;
      setDocumentNonBlocking(docRef, written, { merge: true });
      afterWriteRef.current?.(written);
      onSavedRef.current?.();
    }, delay);

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
  }, [enabled, ref, watch, delay]);
}
