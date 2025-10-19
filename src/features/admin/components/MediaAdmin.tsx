
'use client';

// IMPORTANT: To use this component, you need a Cloudinary account.
// 1. Your Cloudinary credentials have been added to the `.env` file.
// 2. Go to your Cloudinary Settings > Upload page.
// 3. Find or create an "Upload Preset". Make sure its "Signing Mode" is set to "Unsigned".
// 4. Copy the name of that preset.
// 5. Paste the name into the `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` value in your `.env` file.
// 6. Restart your development server for the changes to take effect.


import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
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
import { useCollection, useFirestore, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Type for the media stored in Firestore
interface MediaAsset {
    id: string;
    url: string;
    public_id: string;
    resource_type: 'image' | 'video' | 'raw';
    created_at: string;
    filename: string;
}


const MediaFileCard = ({
  file,
  onDelete,
  onCopy,
}: {
  file: MediaAsset;
  onDelete: (publicId: string, id: string, resourceType: string) => void;
  onCopy: (url: string) => void;
}) => {
  
  const handleDelete = () => {
    onDelete(file.public_id, file.id, file.resource_type);
  };

  const fileName = file.filename || file.public_id.split('/').pop() || 'Untitled';
  
  return (
    <div className="flex flex-col gap-2">
      <div className="relative group aspect-square border rounded-lg overflow-hidden glass-effect p-1">
        <div className="relative w-full h-full rounded-md overflow-hidden">
          {file.resource_type === 'image' ? (
            <Image src={file.url} alt={file.public_id} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-black flex items-center justify-center">
              <video src={file.url} muted loop playsInline className="w-full h-full object-cover" onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()}></video>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
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
                    This will permanently delete the file from your Cloudinary storage. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
      <p className="text-xs text-center text-muted-foreground truncate" title={fileName}>{fileName}</p>
    </div>
  );
};

export default function MediaAdmin() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // Fetch media assets from Firestore
  const mediaCollectionRef = useMemoFirebase(() => firestore ? query(collection(firestore, 'media'), orderBy('created_at', 'desc')) : null, [firestore]);
  const { data: mediaAssets, isLoading: isLoadingMedia } = useCollection<MediaAsset>(mediaCollectionRef);

  const { imageAssets, videoAssets } = useMemo(() => {
    const images: MediaAsset[] = [];
    const videos: MediaAsset[] = [];
    mediaAssets?.forEach(asset => {
        if (asset.resource_type === 'image') {
            images.push(asset);
        } else if (asset.resource_type === 'video') {
            videos.push(asset);
        }
    });
    return { imageAssets: images, videoAssets: videos };
  }, [mediaAssets]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset || uploadPreset === 'your_upload_preset') {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Cloudinary credentials are not fully configured in the .env file.',
      });
      return;
    }

    setIsUploading(true);

    for (const file of acceptedFiles) {
      setUploadingFileName(file.name);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          
          if(firestore) {
            // Save metadata to Firestore
            addDocumentNonBlocking(collection(firestore, 'media'), {
                public_id: response.public_id,
                url: response.secure_url,
                resource_type: response.resource_type,
                created_at: response.created_at,
                filename: file.name, // Save the original filename
            });
          }

          toast({
            title: 'Upload successful',
            description: `${file.name} has been uploaded.`,
          });
        } else {
          const error = JSON.parse(xhr.responseText).error;
          toast({
            variant: 'destructive',
            title: `Upload Failed for ${file.name}`,
            description: error.message || 'An unknown error occurred.',
          });
        }
      };
      
      xhr.onerror = () => {
         toast({
            variant: 'destructive',
            title: `Upload Failed for ${file.name}`,
            description: 'A network error occurred during upload.',
          });
      }

      xhr.send(formData);

      await new Promise(resolve => {
        xhr.onloadend = resolve;
      });
    }

    setIsUploading(false);
    setUploadingFileName('');
    setUploadProgress(0);

  }, [toast, firestore]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
      'video/*': ['.mp4', '.mov', '.webm'],
    }
  });
  
  const handleDelete = async (publicId: string, docId: string, resourceType: string) => {
    if (!firestore) return;
    
    try {
        await deleteDocumentNonBlocking(doc(firestore, 'media', docId));
        toast({ title: "File Removed", description: `The reference to the file has been removed from your library.`});
    } catch(e: any) {
        toast({ variant: 'destructive', title: "Deletion Failed", description: `Could not remove file reference: ${e.message}`});
    }
  };

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "File URL copied to clipboard."});
  }

  const renderLibrary = (assets: MediaAsset[], type: 'image' | 'video') => {
    if (isLoadingMedia) {
        return (
            <div className="flex justify-center items-center h-full min-h-[200px]">
               <Preloader />
           </div>
       );
    }

    if (!assets || assets.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <FontAwesomeIcon icon={type === 'image' ? faFileImage : faFilm} className="h-12 w-12 mb-4" />
                <p>No {type}s uploaded yet.</p>
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {assets.map(file => (
                <MediaFileCard key={file.id} file={file} onDelete={handleDelete} onCopy={handleCopy} />
            ))}
        </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full gap-6">
      <div className="flex-1 border rounded-lg overflow-hidden glass-effect flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Media Library (Cloudinary)</h2>
          <p className="text-muted-foreground mt-1">Upload and manage your images and videos.</p>
          
          <div {...getRootProps()} className={cn('mt-4 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors', isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50', isUploading && 'cursor-not-allowed opacity-50')}>
              <input {...getInputProps()} disabled={isUploading} />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <FontAwesomeIcon icon={faCloudUploadAlt} className="h-8 w-8" />
                  {isUploading ? (<p className="text-sm">Uploading...</p>) : isDragActive ? (<p className="text-sm">Drop files here...</p>) : (<p className="text-sm">Drag & drop files, or click to select</p>)}
              </div>
          </div>
          {isUploading && (
              <div className="mt-4">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center mt-2 text-muted-foreground">
                    Uploading: {uploadingFileName} ({Math.round(uploadProgress)}%)
                  </p>
              </div>
          )}
        </div>
        <Tabs defaultValue="images" className="flex-1 flex flex-col min-h-0">
            <TabsList className="px-6 w-full justify-start rounded-none border-b">
                <TabsTrigger value="images">Image Library</TabsTrigger>
                <TabsTrigger value="videos">Video Library</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <TabsContent value="images" className="p-6 m-0">
                {renderLibrary(imageAssets, 'image')}
              </TabsContent>
              <TabsContent value="videos" className="p-6 m-0">
                {renderLibrary(videoAssets, 'video')}
              </TabsContent>
            </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}
