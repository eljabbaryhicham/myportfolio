'use client';

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type FirebaseStorage,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { initializeFirebase } from '@/firebase';

/**
 * Uploads a file to Firebase Storage with progress tracking.
 * This function initializes its own Firebase instance to guarantee a valid connection.
 * @param file The file to upload.
 * @param onProgress A callback function to report upload progress (0-100).
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = (
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Initialize Firebase services directly to ensure a valid storage instance.
    const { storage } = initializeFirebase();

    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `uploads/${uniqueFileName}`);

    const metadata = {
      contentType: file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Could not get download URL:', error);
          reject(error);
        }
      }
    );
  });
};
