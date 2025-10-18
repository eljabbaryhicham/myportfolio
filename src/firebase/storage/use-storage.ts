
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  listAll,
  deleteObject,
  getMetadata,
  type StorageReference,
  type UploadTask,
} from 'firebase/storage';
import { useStorage as useFirebaseStorage } from '@/firebase/provider';
import { v4 as uuidv4 } from 'uuid';

// Hook to list files in a storage path
export function useStorageList(pathRef: StorageReference | null) {
  const [files, setFiles] = useState<{ url: string; name: string, type: 'image' | 'video' | 'other' }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const getFileType = (contentType: string | undefined): 'image' | 'video' | 'other' => {
    if (contentType?.startsWith('image/')) return 'image';
    if (contentType?.startsWith('video/')) return 'video';
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
      setFiles(filesData.reverse()); // Show newest files first
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

// Hook for uploading a file
export function useStorageUpload() {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const storage = useFirebaseStorage();

  const upload = useCallback((file: File, pathRef: StorageReference) => {
    return new Promise<string>((resolve, reject) => {
      if (!storage) {
        const err = "Firebase Storage is not available";
        setError(err);
        reject(new Error(err));
        return;
      }
      
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExtension}`;
      const fileRef = ref(pathRef, uniqueFileName);

      setIsLoading(true);
      setError(null);
      setProgress(0);

      const uploadTask: UploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(progress);
        },
        (error) => {
          setIsLoading(false);
          setError(error.message);
          console.error("Upload Error:", error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setProgress(100);
            setIsLoading(false);
            resolve(downloadURL);
          } catch(e) {
            const err = e as Error;
            setIsLoading(false);
            setError(err.message);
            reject(e);
          }
        }
      );
    });
  }, [storage]);
  
  return { upload, progress, isLoading, error };
}


// Hook to delete a file
export function useStorageDelete() {
    const [isLoading, setIsLoading] = useState(false);

    const deleteFile = useCallback(async (fileRef: StorageReference) => {
        setIsLoading(true);
        try {
            await deleteObject(fileRef);
            setIsLoading(false);
        } catch (e) {
            setIsLoading(false);
            console.error("Delete Error:", e);
            throw e; // re-throw to be caught by caller
        }
    }, []);

    return { deleteFile, isLoading };
}
