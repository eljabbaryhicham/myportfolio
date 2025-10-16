
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, LogOut } from 'lucide-react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PortfolioItemFormSheet } from './portfolio-item-form';
import { useUser, useAuth, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';

function AdminPage() {
  const firestore = useFirestore();
  const projectsCollection = useMemoFirebase(() => collection(firestore, 'projects'), [firestore]);
  const { data: items, isLoading } = useCollection<PortfolioItem>(projectsCollection);
  
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  if (!isUserLoading && !user) {
    router.push('/login');
  }

  const handleLogout = async () => {
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

  if (isUserLoading || !user) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
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
      const docRef = doc(firestore, 'projects', values.id);
      setDocumentNonBlocking(docRef, values, { merge: true });
       toast({
        title: 'Changes Saved',
        description: 'Your portfolio has been updated.',
      });
    } else {
      // New item
      addDocumentNonBlocking(collection(firestore, 'projects'), values);
       toast({
        title: 'Item Added',
        description: 'A new item has been added to your portfolio.',
      });
    }
    setIsSheetOpen(false);
  };

  return (
    <div className="p-[5%] h-full flex flex-col">
      <div className="container mx-auto px-0 flex flex-col h-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-md md:text-lg text-foreground/70 break-all">
              Welcome, {user.email}!
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
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

        <ScrollArea className="flex-1">
          <div className="border rounded-lg overflow-hidden glass-effect">
            <Table className="text-left">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px] md:w-[80px]">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-right w-[50px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading portfolio...</TableCell>
                  </TableRow>
                )}
                {!isLoading && items && items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        width={50}
                        height={50}
                        className="object-cover rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[100px] md:max-w-xs truncate">{item.title}</TableCell>
                    <TableCell className="hidden md:table-cell">{item.type}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs truncate">{item.description}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleEditItem(item)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive"
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
          </div>
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

export default AdminPage;

    