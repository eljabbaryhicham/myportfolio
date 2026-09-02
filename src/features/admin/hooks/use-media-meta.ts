'use client';

import { useCallback, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, setDoc, deleteDoc, doc } from 'firebase/firestore';
import {
  mediaMetaDocId,
  type MediaMetaDoc,
  type MediaMetaProvider,
  type MediaMetaTag,
} from '@/lib/media-meta';

/**
 * Reads/writes `media_meta` color tags for providers whose assets do not live
 * in Firestore (Appwrite, Gumlet Video, Gumlet Image). Exposes a lookup map
 * keyed by `provider__providerAssetId` plus a `setTag`/`clearTag` writer.
 */
export function useMediaMeta() {
  const firestore = useFirestore();
  const colRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'media_meta'));
  }, [firestore]);

  const { data: docs } = useCollection<MediaMetaDoc>(colRef as any);

  const tagByKey = useMemo(() => {
    const map = new Map<string, MediaMetaTag>();
    docs?.forEach((meta) => {
      if (meta.tag && meta.providerAssetId) {
        map.set(mediaMetaDocId(meta.provider, meta.providerAssetId), meta.tag);
      }
    });
    return map;
  }, [docs]);

  const getTag = useCallback(
    (provider: MediaMetaProvider, providerAssetId: string): MediaMetaTag | undefined =>
      tagByKey.get(mediaMetaDocId(provider, providerAssetId)),
    [tagByKey]
  );

  const setTag = useCallback(
    async (
      provider: MediaMetaProvider,
      providerAssetId: string,
      tag: MediaMetaTag | null
    ): Promise<{ ok: boolean; error?: string }> => {
      if (!firestore) return { ok: false, error: 'Firestore is not ready.' };
      const ref = doc(collection(firestore, 'media_meta'), mediaMetaDocId(provider, providerAssetId));
      try {
        if (tag === null) {
          await deleteDoc(ref);
        } else {
          await setDoc(ref, { provider, providerAssetId, tag }, { merge: true });
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : 'Failed to update tag.' };
      }
    },
    [firestore]
  );

  return { getTag, setTag };
}
