import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  type FirebaseStorage,
} from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Firebase Storage with progress tracking.
 * @param storage The Firebase Storage instance.
 * @param file The file to upload.
 * @param onProgress A callback function to report upload progress (0-100).
 * @returns A promise that resolves with the download URL of the uploaded file.
 */
export const uploadFile = (
  storage: FirebaseStorage,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a unique filename
    const fileExtension = file.name.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `uploads/${uniqueFileName}`);

    // Pass file metadata (especially contentType) to the upload task
    const metadata = {
      contentType: file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Report progress
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        // Handle successful uploads on complete
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
