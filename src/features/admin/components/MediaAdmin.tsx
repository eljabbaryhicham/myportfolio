'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStorageList, useStorageUpload, useStorageDelete } from '@/firebase/storage/use-storage';
import { useStorage } from '@/firebase';
import { ref } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudUploadAlt, faCopy, faTrash, faFilm, faFileImage } from '@fortawesome/free-solid-svg-icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import Preloader from '@/components/preloader';

const MediaFileCard = ({
  file,
  onDelete,
  onCopy,
}: {
  file: { url: string; name: string, type: 'image' | 'video' | 'other' };
  onDelete: (name: string) => void;
  onCopy: (url: string) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(file.name);
  };
  
  return (
    <div className="relative group aspect-square border rounded-lg overflow-hidden glass-effect p-1">
       <div className="relative w-full h-full rounded-md overflow-hidden">
        {file.type === 'image' ? (
          <Image src={file.url} alt={file.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <FontAwesomeIcon icon={faFilm} className="h-12 w-12 text-white/50" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
        <p className="text-white text-xs break-all">{file.name}</p>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="secondary" onClick={() => onCopy(file.url)}>
            <FontAwesomeIcon icon={faCopy} />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <FontAwesomeIcon icon={faTrash} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the file <span className="font-bold">{file.name}</span>. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};


export default function MediaAdmin() {
  const storage = useStorage();
  const { toast } = useToast();
  const filesRef = ref(storage, 'uploads');
  
  const { files, isLoading: isLoadingFiles, refetch: refetchFiles } = useStorageList(filesRef);
  const { upload } = useStorageUpload();
  const { deleteFile, isLoading: isDeleting } = useStorageDelete();

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!storage) {
        toast({ variant: 'destructive', title: 'Error', description: 'Storage not available' });
        return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);

    for (const file of acceptedFiles) {
        try {
            await upload(file, filesRef, {
                onProgress: (progress) => setUploadProgress(progress),
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
        }
    }
    
    setIsUploading(false);
    setUploadProgress(null);
    refetchFiles();
    toast({ title: 'Upload complete', description: `${acceptedFiles.length} file(s) uploaded.` });

  }, [upload, filesRef, storage, toast, refetchFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm'],
    }
  });
  
  const handleDelete = async (name: string) => {
    const fileRef = ref(filesRef, name);
    try {
        await deleteFile(fileRef);
        toast({ title: "File deleted", description: `${name} has been removed.`});
        refetchFiles();
    } catch (e) {
        toast({ variant: 'destructive', title: "Delete failed", description: `Could not delete ${name}.`});
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "File URL copied to clipboard."});
  }

  return (
    <div className="flex-1 flex flex-col h-full gap-6">
      <div className="flex-1 border rounded-lg overflow-hidden glass-effect flex flex-col">
        <div className="p-6 border-b">
           <h2 className="text-xl font-bold">Media Library</h2>
           <p className="text-muted-foreground">
             Upload, view, and manage your media assets.
           </p>
        </div>

        <div className="p-6">
            <div
                {...getRootProps()}
                className={cn(
                'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="h-10 w-10" />
                    {isDragActive ? (
                        <p>Drop the files here ...</p>
                    ) : (
                        <p>Drag & drop files here, or click to select</p>
                    )}
                    <p className="text-xs">(Images and Videos)</p>
                </div>
            </div>
            {isUploading && uploadProgress !== null && (
                <div className="mt-4">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-center mt-2 text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
            )}
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-6 pt-0">
            {isLoadingFiles ? (
                 <div className="flex justify-center items-center h-full min-h-[200px]">
                    <Preloader />
                </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {files.map(file => (
                  <MediaFileCard key={file.name} file={file} onDelete={handleDelete} onCopy={handleCopy} />
                ))}
              </div>
            )}
            {!isLoadingFiles && files.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <FontAwesomeIcon icon={faFileImage} className="h-12 w-12 mb-4" />
                    <p>No files uploaded yet.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
