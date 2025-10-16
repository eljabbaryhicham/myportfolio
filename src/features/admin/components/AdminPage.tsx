
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, LogOut, UploadCloud, GripVertical } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PortfolioItemFormSheet } from '@/app/admin/portfolio-item-form';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { defaultPortfolioItems } from '@/features/portfolio/data/portfolio-data';
import type { PortfolioItem } from '@/lib/portfolio-data';
import { cn } from '@/lib/utils';

function AdminPage() {
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const { user, isUserLoading } = useUser();
  
  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: items, isLoading } = useCollection<PortfolioItem>(projectsCollection);

  const [sortedItems, setSortedItems] = useState<PortfolioItem[]>([]);
  
  // Drag and Drop state
  const draggingItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    if (items) {
      const newSortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSortedItems(newSortedItems);
    }
  }, [items]);

  const maxOrder = useMemo(() => {
    if (!items || items.length === 0) return 0;
    return Math.max(...items.map(i => i.order || 0));
  }, [items]);

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

  const handleSeedData = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Firestore not available' });
        return;
    }
    const batch = writeBatch(firestore);
    const projectsCol = collection(firestore, 'projects');

    defaultPortfolioItems.forEach((item) => {
        const docRef = doc(projectsCol, item.id);
        batch.set(docRef, item);
    });

    try {
        await batch.commit();
        toast({ title: 'Success', description: 'Default projects have been added.' });
    } catch (e: any) {
        console.error("Error seeding data:", e);
        toast({ variant: 'destructive', title: 'Error seeding data', description: e.message });
    }
  }

  const handleAddItem = () => {
    setSelectedItem(null);
    setIsSheetOpen(true);
  };

  const handleEditItem = (item: PortfolioItem) => {
    setSelectedItem(item);
    setIsSheetOpen(true);
  };
  
  const handleDeleteItem = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'projects', id));
    toast({
      title: 'Item Deleted',
      description: 'The portfolio item has been removed.',
    });
  };

  const handleFormSubmit = (values: PortfolioItem) => {
    if (!firestore) return;
    const dataToSave = { ...values, order: values.order ?? maxOrder + 1 };
    if (values.id) {
      // Existing item
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, dataToSave, { merge: true });
       toast({
        title: 'Changes Saved',
        description: 'Your portfolio has been updated.',
      });
    } else {
      // New item
      addDocumentNonBlocking(collection(firestore, 'projects'), dataToSave);
       toast({
        title: 'Item Added',
        description: 'A new item has been added to your portfolio.',
      });
    }
    setIsSheetOpen(false);
  };

  const handleDragEnd = () => {
    if (!firestore) return;

    const draggingId = draggingItem.current;
    const dragOverId = dragOverItem.current;

    if (!draggingId || !dragOverId || draggingId === dragOverId) {
      draggingItem.current = null;
      dragOverItem.current = null;
      // Reset visual styles if any
      document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      return;
    }
    
    const dragIndex = sortedItems.findIndex(item => item.id === draggingId);
    const hoverIndex = sortedItems.findIndex(item => item.id === dragOverId);

    const newSortedItems = [...sortedItems];
    const [draggedItem] = newSortedItems.splice(dragIndex, 1);
    newSortedItems.splice(hoverIndex, 0, draggedItem);
    
    setSortedItems(newSortedItems);

    const batch = writeBatch(firestore);
    newSortedItems.forEach((item, index) => {
        const docRef = doc(firestore, 'projects', item.id);
        if (item.order !== index) {
            batch.update(docRef, { order: index });
        }
    });

    batch.commit().then(() => {
        toast({ title: "Reordered!", description: "Project order has been updated." });
    }).catch(e => {
        console.error("Error reordering items:", e);
        toast({ variant: "destructive", title: "Reorder failed", description: e.message });
        // Revert UI on failure
        setSortedItems([...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    });

    draggingItem.current = null;
    dragOverItem.current = null;
  };


  if (isUserLoading || !user) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="p-[5%] h-full flex flex-col">
      <div className="container mx-auto px-0 flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 text-center">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-md md:text-lg text-foreground/70 break-all">
              Welcome, {user.email}!
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            {!isLoading && items?.length === 0 && (
                <Button onClick={handleSeedData} variant="secondary">
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Seed Default Projects
                </Button>
            )}
            <Button onClick={handleAddItem}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New
            </Button>
            <Button onClick={handleLogout} variant="secondary">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center"></TableHead>
                  <TableHead className="w-[80px] text-center">Image</TableHead>
                  <TableHead className="text-center">Title</TableHead>
                  <TableHead className="hidden md:table-cell text-center">Type</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">Description</TableHead>
                  <TableHead className="text-center w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody
                onDragOver={(e) => e.preventDefault()}
              >
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading portfolio...</TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedItems && sortedItems.map((item) => (
                  <TableRow 
                    key={item.id} 
                    draggable
                    onDragStart={() => (draggingItem.current = item.id)}
                    onDragEnter={() => (dragOverItem.current = item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                      "border-b border-white/10 transition-all cursor-grab",
                      draggingItem.current === item.id && 'opacity-50 scale-95',
                      dragOverItem.current === item.id && draggingItem.current !== item.id && 'bg-primary/20'
                    )}
                  >
                    <TableCell className="text-center">
                      <GripVertical className="h-5 w-5 text-foreground/50" />
                    </TableCell>
                    <TableCell className="flex justify-center">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        width={50}
                        height={50}
                        className="object-cover rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[100px] md:max-w-xs truncate text-center">{item.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-center">{item.type}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs truncate text-center">{item.description}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="glass-effect">
                          <DropdownMenuItem onClick={() => handleEditItem(item)} className="justify-center">
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive justify-center"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>
      <PortfolioItemFormSheet 
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        item={selectedItem}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default AdminPage;

    