
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { useUser } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProjectAdmin from '@/features/admin/components/ProjectAdmin';
import ContactAdmin from '@/features/admin/components/ContactAdmin';
import MediaAdmin from '@/features/admin/components/MediaAdmin';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { Separator } from '@/components/ui/separator';
import Preloader from '@/components/preloader';
import HomeAdmin from '@/features/admin/components/HomeAdmin';
import { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { PortfolioItemFormSheet } from '@/features/admin/components/PortfolioItemForm';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, DocumentReference } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


function AdminPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
    
  const { user, isUserLoading } = useUser();

  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  const [isPortfolioSheetOpen, setIsPortfolioSheetOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void } | null>(null);
  const [activeTab, setActiveTab] = useState('projects');
  const [fromMediaLibrary, setFromMediaLibrary] = useState(false);
  const [newlyUploadedId, setNewlyUploadedId] = useState<string | null>(null);
  const [dialogActiveTab, setDialogActiveTab] = useState<'images' | 'videos'>('images');
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);


  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have successfully signed out.",
      });
      router.push("/login");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "Could not sign out.",
      });
    }
  };

  const handlePortfolioFormSubmit = (values: PortfolioItem, minOrder: number) => {
    if (!firestore) return;

    if (values.id) {
      // Existing item
      const dataToSave = { ...values, order: values.order ?? 0 };
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
       toast({
        title: 'Changes Saved',
        description: 'Your portfolio has been updated.',
      });
    } else {
      // New item, place it at the beginning
      const dataToSave = { ...values, order: minOrder - 1 };
      addDocumentNonBlocking(collection(firestore, 'projects'), dataToSave);
       toast({
        title: 'Item Added',
        description: 'A new item has been added to your portfolio.',
      });
    }

    if (fromMediaLibrary) {
        setActiveTab('projects');
        setFromMediaLibrary(false);
    }
    setIsPortfolioSheetOpen(false);
  };
  
  const handleOpenPortfolioFormWithMedia = (url: string, type: 'image' | 'video', filename: string) => {
    const title = filename.split('.').slice(0, -1).join('.'); // Remove file extension
    setSelectedPortfolioItem({
      id: '',
      title: title || 'New Project',
      description: '',
      type: type,
      thumbnailUrl: type === 'video' ? '' : url, // For videos, thumbnail might be different
      sourceUrl: url,
      thumbnailHint: '',
    });
    setFromMediaLibrary(true);
    setIsLibraryOpen(false); // Close library
    setIsPortfolioSheetOpen(true); // Open form
  };

  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video', filename: string) => void) => {
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };
  
  const handlePortfolioSheetOpenChange = (isOpen: boolean) => {
    setIsPortfolioSheetOpen(isOpen);
    if (!isOpen && fromMediaLibrary) {
        // If form is closed without saving when coming from media library,
        // reopen the media library dialog.
        setIsLibraryOpen(true);
        setFromMediaLibrary(false); // Reset the flag
    }
  };

  const handleUploadComplete = async (docId: string, resourceType: 'image' | 'video') => {
    if (!docId) return;
    setNewlyUploadedId(docId);
    
    // Switch to media tab only if not already on it, to avoid unnecessary re-renders.
    if(activeTab !== 'media') {
      setActiveTab('media');
    }
    
    setDialogActiveTab(resourceType === 'video' ? 'videos' : 'images');
    setIsLibraryOpen(true); // Open the library
    
    // Reset the animation highlight after a delay
    setTimeout(() => setNewlyUploadedId(null), 2000);
  };

  if (isUserLoading || !user) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
            <Preloader />
        </div>
    );
  }

  return (
    <>
      <div className="p-[5%] h-full flex flex-col">
        <div className="container mx-auto px-0 flex flex-col h-full min-h-0">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-center">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Admin Panel</h1>
              <p className="mt-2 text-md md:text-lg text-foreground/70 break-all">
                Welcome, {user.email}!
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              <Button onClick={handleLogout} variant="secondary">
                <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          <Separator className="bg-white/10 mb-8" />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="w-full">
                  <TabsTrigger value="home" className="flex-1">Home</TabsTrigger>
                  <TabsTrigger value="projects" className="flex-1">Projects</TabsTrigger>
                  <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                  <TabsTrigger value="contact" className="flex-1">Contact</TabsTrigger>
              </TabsList>
              <TabsContent value="home" className="flex-1 overflow-auto mt-4">
                  <HomeAdmin />
              </TabsContent>
              <TabsContent value="projects" className="flex-1 overflow-auto mt-4">
                  <ProjectAdmin 
                    setSelectedItem={setSelectedPortfolioItem}
                    setIsSheetOpen={setIsPortfolioSheetOpen}
                    handleFormSubmit={handlePortfolioFormSubmit}
                  />
              </TabsContent>
              <TabsContent value="media" className="flex-1 overflow-auto mt-4">
                  {isUserLoading ? <Preloader /> : <MediaAdmin onUploadComplete={handleUploadComplete} onLibraryOpenRequest={() => setIsLibraryOpen(true)} onMediaSelect={handleOpenPortfolioFormWithMedia} />}
              </TabsContent>
              <TabsContent value="contact" className="flex-1 overflow-auto mt-4">
                  <ContactAdmin />
              </TabsContent>
          </Tabs>
        </div>
      </div>
      <PortfolioItemFormSheet 
        isOpen={isPortfolioSheetOpen}
        setIsOpen={handlePortfolioSheetOpenChange}
        item={selectedPortfolioItem}
        onSubmit={(values) => handlePortfolioFormSubmit(values, 0)} // Note: minOrder logic is now in ProjectAdmin, may need to pass it up
        onChooseFromLibrary={handleOpenLibraryForSelection}
      />
      <MediaAdmin 
        isDialog={true}
        isOpen={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onMediaSelect={librarySelectionConfig ? librarySelectionConfig.onSelect : handleOpenPortfolioFormWithMedia}
        isSelectionMode={!!librarySelectionConfig}
        onSelectionComplete={() => {
            setIsLibraryOpen(false);
            setLibrarySelectionConfig(null);
        }}
        activeTab={dialogActiveTab}
        setActiveTab={setDialogActiveTab}
        newlyUploadedId={newlyUploadedId}
      />
    </>
  );
}

export default AdminPage;
