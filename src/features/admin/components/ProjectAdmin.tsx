
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
import { PlusCircle, MoreHorizontal, UploadCloud, GripVertical } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PortfolioItemFormSheet } from '@/app/admin/portfolio-item-form';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { defaultPortfolioItems } from '@/features/portfolio/data/portfolio-data';
import type { PortfolioItem } from '@/lib/portfolio-data';
import { cn } from '@/lib/utils';

function ProjectAdmin() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: items, isLoading } = useCollection<PortfolioItem>(projectsCollection);

  const [sortedItems, setSortedItems] = useState<PortfolioItem[]>([]);
  
  const draggingItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    if (items) {
      const newSortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSortedItems(newSortedItems);
    }
  }, [items]);

  const minOrder = useMemo(() => {
    if (!items || items.length === 0) return 0;
    return Math.min(...items.map(i => i.order || 0));
  }, [items]);

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
    setIsSheetOpen(false);
  };

  const handleDragEnd = () => {
    if (!firestore) return;

    const draggingId = draggingItem.current;
    const dragOverId = dragOverItem.current;

    draggingItem.current = null;
    dragOverItem.current = null;
    
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.drag-over-top').forEach(el => el.classList.remove('drag-over-top'));
    document.querySelectorAll('.drag-over-bottom').forEach(el => el.classList.remove('drag-over-bottom'));


    if (!draggingId || !dragOverId || draggingId === dragOverId) {
      return;
    }
    
    const dragIndex = sortedItems.findIndex(item => item.id === draggingId);
    const hoverIndex = sortedItems.findIndex(item => item.id === dragOverId);

    if (dragIndex === -1 || hoverIndex === -1) return;

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
        setSortedItems([...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    dragOverItem.current = id;
    const target = e.currentTarget as HTMLTableRowElement;
    const rect = target.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    target.parentElement?.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
      el.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    if (e.clientY < midpoint) {
      target.classList.add('drag-over-top');
    } else {
      target.classList.add('drag-over-bottom');
    }
  }

  return (
    <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-end mb-4">
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
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading portfolio...</TableCell>
                </TableRow>
              )}
              {!isLoading && sortedItems && sortedItems.map((item) => (
                <TableRow 
                  key={item.id} 
                  draggable
                  onDragStart={(e) => {
                    draggingItem.current = item.id;
                    e.currentTarget.classList.add('dragging');
                  }}
                  onDragEnter={(e) => handleDragEnter(e, item.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn("border-b-0 transition-all cursor-grab relative")}
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
      <PortfolioItemFormSheet 
        isOpen={isSheetOpen}
        setIsOpen={setIsSheetOpen}
        item={selectedItem}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

export default ProjectAdmin;
