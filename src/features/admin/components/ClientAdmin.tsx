
'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEllipsisH, faCloudUploadAlt, faImages } from '@fortawesome/free-solid-svg-icons';
import Preloader from '@/components/preloader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import MediaAdmin from './MediaAdmin';

interface Client {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
}

const defaultClients: Omit<Client, 'id'>[] = [
    { name: 'QuantumLeap', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 0 },
    { name: 'StellarForge', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 1 },
    { name: 'ApexInnovate', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 2 },
    { name: 'NexusCore', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 3 },
    { name: 'VertexDynamics', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 4 },
    { name: 'MomentumSuite', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 5 },
];


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  logoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

type ClientFormValues = z.infer<typeof formSchema>;

function ClientForm({ client, onSubmit, onCancel, onChooseFromLibrary }: { client: Partial<Client> | null, onSubmit: (values: ClientFormValues) => void, onCancel: () => void, onChooseFromLibrary: (onSelect: (url: string, type: 'image' | 'video', filename: string) => void) => void }) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: client?.name || '',
      logoUrl: client?.logoUrl || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: client?.name || '',
      logoUrl: client?.logoUrl || '',
    });
  }, [client, form]);

  const handleChooseLogo = () => {
    onChooseFromLibrary((url, type) => {
        if(type === 'image') {
            form.setValue('logoUrl', url, { shouldValidate: true });
        }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client Name</FormLabel>
              <FormControl>
                <Input placeholder="Client Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                </FormControl>
                <Button type="button" variant="outline" size="icon" onClick={handleChooseLogo}>
                    <FontAwesomeIcon icon={faImages} />
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}

export default function ClientAdmin() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const isSuperAdmin = user?.email === 'eljabbaryhicham@example.com';
  const canEdit = isSuperAdmin || (user?.permissions?.canEditProjects ?? true); // Using canEditProjects for now

  const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'clients'), orderBy('order')) : null, [firestore]);
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video', filename: string) => void } | null>(null);


  const handleSeedData = async () => {
    if (!firestore || !canEdit) {
        toast({ variant: 'destructive', title: 'Permission Denied', description: 'You do not have permission to seed data.' });
        return;
    }
    const batch = writeBatch(firestore);
    const clientsCol = collection(firestore, 'clients');

    defaultClients.forEach((client) => {
        const docRef = doc(clientsCol); // Auto-generate ID
        batch.set(docRef, client);
    });

    try {
        await batch.commit();
        toast({ title: 'Success', description: 'Default clients have been added.' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not seed clients.' });
    }
  }

  const handleAddItem = () => {
    setSelectedClient({});
    setIsFormOpen(true);
  };

  const handleEditItem = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };
  
  const handleDeleteItem = (id: string) => {
    if (!firestore || !canEdit) return;
    deleteDocumentNonBlocking(doc(firestore, 'clients', id));
    toast({
      title: 'Client Deleted',
      description: 'The client has been removed.',
    });
  };
  
  const handleFormSubmit = (values: ClientFormValues) => {
    if (!firestore || !canEdit) return;

    if (selectedClient && selectedClient.id) {
        // Editing existing client
        const clientRef = doc(firestore, 'clients', selectedClient.id);
        setDocumentNonBlocking(clientRef, values, { merge: true });
        toast({ title: 'Client Updated', description: 'The client has been updated.'});
    } else {
        // Adding new client
        const maxOrder = clients ? Math.max(-1, ...clients.map(c => c.order)) : -1;
        const newClient = { ...values, order: maxOrder + 1 };
        addDocumentNonBlocking(collection(firestore, 'clients'), newClient);
        toast({ title: 'Client Added', description: 'A new client has been added.'});
    }
    setIsFormOpen(false);
    setSelectedClient(null);
  };
  
  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video', filename: string) => void) => {
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };


  return (
    <>
      <div className="flex-1 flex flex-col h-full">
          <div className="flex items-start justify-between mb-6">
              <div className="text-left">
                  <h2 className="text-xl font-bold">Client Management</h2>
                  <p className="text-muted-foreground">
                  Manage the client logos displayed on the About page.
                  </p>
              </div>
              <div className="flex items-center gap-2">
                  {!isLoading && (!clients || clients.length === 0) && (
                  <Button onClick={handleSeedData} variant="secondary" size="sm" disabled={!canEdit}>
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2 h-4 w-4" />
                      Seed Clients
                  </Button>
                  )}
                  <Button onClick={handleAddItem} size="sm" disabled={!canEdit}>
                  <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                  Add New
                  </Button>
              </div>
          </div>
          <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
          <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Logo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={3} className="h-96">
                        <div className="flex justify-center items-center h-full">
                          <Preloader />
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && clients && clients.map((client) => (
                    <TableRow key={client.id} className="border-b-0">
                      <TableCell className="flex justify-center">
                        <Image
                          src={client.logoUrl}
                          alt={client.name}
                          width={100}
                          height={40}
                          className="object-contain h-10 w-24 invert brightness-0"
                          style={{ filter: 'grayscale(1) brightness(1.5)'}}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[100px] md:max-w-xs truncate">{client.name}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!canEdit}>
                              <FontAwesomeIcon icon={faEllipsisH} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="glass-effect">
                            <DropdownMenuItem onClick={() => handleEditItem(client)} disabled={!canEdit}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteItem(client.id)}
                              className="text-destructive"
                              disabled={!canEdit}
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
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="glass-effect">
            <DialogHeader>
              <DialogTitle>{selectedClient?.id ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              <DialogDescription>
                Enter the details for the client.
              </DialogDescription>
            </DialogHeader>
            <ClientForm 
              client={selectedClient} 
              onSubmit={handleFormSubmit}
              onCancel={() => {
                  setIsFormOpen(false);
                  setSelectedClient(null);
              }}
              onChooseFromLibrary={handleOpenLibraryForSelection}
              />
          </DialogContent>
        </Dialog>
      </div>
      
      <MediaAdmin
          isDialog={true}
          isOpen={isLibraryOpen}
          onOpenChange={setIsLibraryOpen}
          onMediaSelect={(url, type, filename) => {
              if (librarySelectionConfig?.onSelect) {
                  librarySelectionConfig.onSelect(url, type, filename);
                  setIsFormOpen(true); // Re-focus the form dialog
              }
          }}
          isSelectionMode={!!librarySelectionConfig}
          onSelectionComplete={() => {
              setIsLibraryOpen(false);
              setLibrarySelectionConfig(null);
          }}
          activeTab={'images'}
          setActiveTab={() => {}} // Only show images for logos
          newlyUploadedId={null}
      />
    </>
  );
}

    