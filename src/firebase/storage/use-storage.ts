'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  listAll,
  deleteObject,
  getDownloadURL,
  getMetadata,
  type StorageReference,
} from 'firebase/storage';

// Hook to list files in a storage path
export function useStorageList(pathRef: StorageReference | null) {
  const [files, setFiles] = useState<{ url: string; name: string, type: 'image' | 'video' | 'other' }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getFileType = (contentType: string | undefined): 'image' | 'video' | 'other' => {
    if (!contentType) return 'other';
    if (contentType.startsWith('image/')) return 'image';
    if (contentType.startsWith('video/')) return 'video';
    return 'other';
  };

  const fetchFiles = useCallback(async () => {
    if (!pathRef) {
      setFiles([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await listAll(pathRef);
      const filePromises = res.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          url,
          name: itemRef.name,
          type: getFileType(metadata.contentType),
        };
      });
      const filesData = await Promise.all(filePromises);
      setFiles(filesData); // Correctly set the state
      setError(null);
    } catch (e) {
      setError(e as Error);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [pathRef]);


  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);
  
  return { files, isLoading, error, refetch: fetchFiles };
}

// Hook to delete a file
export function useStorageDelete() {
    const [isLoading, setIsLoading] = useState(false);

    const deleteFile = async (fileRef: StorageReference) => {
        setIsLoading(true);
        try {
            await deleteObject(fileRef);
            setIsLoading(false);
        } catch (e) {
            setIsLoading(false);
            console.error("Delete Error:", e);
            throw e; // re-throw to be caught by caller
        }
    };

    return { deleteFile, isLoading };
}
