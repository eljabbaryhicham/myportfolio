
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
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
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCollection, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError, updateDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteDocumentNonBlocking, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc, query, orderBy, writeBatch } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEllipsisH, faCloudUploadAlt, faImages, faGripVertical, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Preloader from '@/components/preloader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import MediaAdmin from './MediaAdmin';
import type { AppUser } from '@/firebase/auth/use-user';
import { Checkbox } from '@/components/ui/checkbox';
import BulkActionBar from './BulkActionBar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Client {
  id: string;
  name: string;
  logoUrl: string;
  order: number;
  isVisible?: boolean;
}

const defaultClients: Omit<Client, 'id'>[] = [
    { name: 'QuantumLeap', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 0, isVisible: true },
    { name: 'StellarForge', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 1, isVisible: true },
    { name: 'ApexInnovate', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 2, isVisible: true },
    { name: 'NexusCore', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 3, isVisible: true },
    { name: 'VertexDynamics', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 4, isVisible: true },
    { name: 'MomentumSuite', logoUrl: 'https://res.cloudinary.com/da1srnoer/image/upload/v1760834216/nqnqvmroqxngfamrcpuf.png', order: 5, isVisible: true },
];


const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  logoUrl: z.string().url({ message: 'Please enter a valid URL.' }),
});

type ClientFormValues = z.infer<typeof formSchema>;

function ClientForm({ client, onSubmit, onCancel, onChooseFromLibrary, canEdit }: { client: Partial<Client> | null, onSubmit: (values: ClientFormValues) => void, onCancel: () => void, onChooseFromLibrary: (onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void) => void, canEdit: boolean }) {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (!canEdit) {
      Object.keys(form.getValues()).forEach(key => {
        form.control.getFieldState(key as keyof ClientFormValues).isDirty = false;
      });
    }
  }, [canEdit, form]);

  const handleChooseLogo = () => {
    if (!canEdit) return;
    onChooseFromLibrary((url, type) => {
        if(type === 'image') {
            form.setValue('logoUrl', url, { shouldValidate: true });
        }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <fieldset disabled={!canEdit} className="group space-y-8">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('clientAdmin.name')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('clientAdmin.namePlaceholder')} {...field} />
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
                <FormLabel>{t('clientAdmin.logoUrl')}</FormLabel>
                <div className="flex items-center gap-2">
                    <FormControl>
                        <Input placeholder={t('clientAdmin.logoUrlPlaceholder')} {...field} />
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
                <Button type="button" variant="outline" onClick={onCancel}>{t('clientAdmin.cancel')}</Button>
                <Button type="submit">{t('clientAdmin.save')}</Button>
            </div>
        </fieldset>
      </form>
    </Form>
  );
}

export default function ClientAdmin() {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const typedUser = user as AppUser | null;
  const isSuperAdmin = typedUser?.email === 'eljabbaryhicham@example.com';
  const canEdit = isSuperAdmin || (typedUser?.permissions?.canEditAbout ?? true); 

  const clientsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'clients'), orderBy('order')) : null, [firestore]);
  const { data: clients, isLoading } = useCollection<Client>(clientsQuery);
  
  const [sortedClients, setSortedClients] = useState<Client[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [librarySelectionConfig, setLibrarySelectionConfig] = useState<{ onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void } | null>(null);

  const draggingItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    if (clients) {
        setSortedClients([...clients].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    }
  }, [clients]);

  const handleSeedData = async () => {
    if (!firestore || !canEdit) {
        toast({ variant: 'destructive', title: t('clientAdmin.toast.permissionDenied.title'), description: t('clientAdmin.toast.permissionDenied.description') });
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
        toast({ title: t('clientAdmin.toast.seedSuccess.title'), description: t('clientAdmin.toast.seedSuccess.description') });
    } catch (e: any) {
        toast({ variant: 'destructive', title: t('clientAdmin.toast.seedError.title'), description: t('clientAdmin.toast.seedError.description') });
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
      title: t('clientAdmin.toast.deleted.title'),
      description: t('clientAdmin.toast.deleted.description'),
    });
  };

  const handleToggleVisibility = (item: Client) => {
    if (!firestore || !canEdit) return;
    const docRef = doc(firestore, 'clients', item.id);
    const newVisibility = !(item.isVisible ?? true);
    updateDocumentNonBlocking(docRef, { isVisible: newVisibility });
    toast({
        title: t('clientAdmin.toast.visibilityChanged.title').replace('{visibility}', newVisibility ? 'visible' : 'hidden'),
        description: t('clientAdmin.toast.visibilityChanged.description').replace('{name}', item.name).replace('{visibility}', newVisibility ? 'visible' : 'hidden'),
    });
  };

  const allVisible = sortedClients.length > 0 && sortedClients.every(c => c.isVisible !== false);

  const handleSelectAll = () => {
    if (selectedIds.size === sortedClients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedClients.map(c => c.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (!firestore || !canEdit) return;
    const batch = writeBatch(firestore);
    selectedIds.forEach(id => {
      batch.delete(doc(firestore, 'clients', id));
    });
    batch.commit().then(() => {
      toast({ title: t('clientAdmin.toast.deleted.title'), description: `Deleted ${selectedIds.size} items.` });
    }).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'clients', operation: 'delete', requestResourceData: { note: `Batch delete ${selectedIds.size} documents.` } }));
    });
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  const handleBulkToggleVisibility = () => {
    if (!firestore || !canEdit) return;
    const batch = writeBatch(firestore);
    const newVisibility = !allVisible;
    selectedIds.forEach(id => {
      batch.update(doc(firestore, 'clients', id), { isVisible: newVisibility });
    });
    batch.commit().then(() => {
      toast({ title: t('clientAdmin.toast.visibilityChanged.title').replace('{visibility}', newVisibility ? 'visible' : 'hidden'), description: `Updated ${selectedIds.size} items.` });
    }).catch(() => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: 'clients', operation: 'update', requestResourceData: { note: `Batch update ${selectedIds.size} documents.` } }));
    });
    setSelectedIds(new Set());
  };
  
  const handleFormSubmit = (values: ClientFormValues) => {
    if (!firestore || !canEdit) return;

    if (selectedClient && selectedClient.id) {
        // Editing existing client
        const clientRef = doc(firestore, 'clients', selectedClient.id);
        setDocumentNonBlocking(clientRef, { ...values, order: selectedClient.order ?? 0, isVisible: selectedClient.isVisible ?? true }, { merge: true });
        toast({ title: t('clientAdmin.toast.updated.title'), description: t('clientAdmin.toast.updated.description')});
    } else {
        // Adding new client
        const maxOrder = clients ? Math.max(-1, ...clients.map(c => c.order)) : -1;
        const newClient = { ...values, order: maxOrder + 1, isVisible: true };
        addDocumentNonBlocking(collection(firestore, 'clients'), newClient);
        toast({ title: t('clientAdmin.toast.added.title'), description: t('clientAdmin.toast.added.description')});
    }
    setIsFormOpen(false);
    setSelectedClient(null);
  };
  
  const handleOpenLibraryForSelection = (onSelect: (url: string, type: 'image' | 'video' | 'raw', filename: string) => void) => {
    if (!canEdit) return;
    setLibrarySelectionConfig({ onSelect });
    setIsLibraryOpen(true);
  };

  const handleDragEnd = () => {
    if (!firestore || !canEdit) return;

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
    
    const dragIndex = sortedClients.findIndex(item => item.id === draggingId);
    const hoverIndex = sortedClients.findIndex(item => item.id === dragOverId);

    if (dragIndex === -1 || hoverIndex === -1) return;

    const newSortedItems = [...sortedClients];
    const [draggedItem] = newSortedItems.splice(dragIndex, 1);
    newSortedItems.splice(hoverIndex, 0, draggedItem);
    
    setSortedClients(newSortedItems);

    const batch = writeBatch(firestore);
    newSortedItems.forEach((item, index) => {
        const docRef = doc(firestore, 'clients', item.id);
        if (item.order !== index) {
            batch.update(docRef, { order: index });
        }
    });

    batch.commit().then(() => {
        toast({ title: t('clientAdmin.toast.reordered.title'), description: t('clientAdmin.toast.reordered.description') });
    }).catch(e => {
        if (clients) {
          setSortedClients([...clients].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }
        errorEmitter.emit(
          'permission-error',
          new FirestorePermissionError({
            path: 'clients',
            operation: 'update',
            requestResourceData: { note: `Batch update to reorder ${newSortedItems.length} documents.` },
          })
        );
    });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>, id: string) => {
    if (!canEdit) return;
    dragOverItem.current = id;
    const target = e.currentTarget;
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
    <>
      <div className="flex-1 flex flex-col h-full min-h-0">
          <div className="flex items-start justify-between mb-6">
              <div className="text-left">
                  {/* Title and description are now in the parent component */}
              </div>
              <div className="flex items-center gap-2">
                  {!isLoading && (!clients || clients.length === 0) && (
                  <Button onClick={handleSeedData} variant="secondary" size="sm" disabled={!canEdit}>
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2 h-4 w-4" />
                      {t('clientAdmin.seed')}
                  </Button>
                  )}
                  <Button onClick={handleAddItem} size="sm" disabled={!canEdit}>
                  <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                  {t('clientAdmin.addNew')}
                  </Button>
              </div>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden glass-effect min-h-0">
            <ScrollArea className="h-full">
                {isLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <Preloader />
                    </div>
                ) : (
                <>
                    {/* Mobile View */}
                    <div className="md:hidden p-4 space-y-4">
                        {sortedClients?.map(client => (
                            <div 
                                key={client.id}
                                draggable={canEdit}
                                onDragStart={(e) => { if (canEdit) { draggingItem.current = client.id; e.currentTarget.classList.add('dragging'); }}}
                                onDragEnter={(e) => handleDragEnter(e, client.id)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => e.preventDefault()}
                                className={cn("p-4 rounded-lg bg-black/10 border border-white/10 flex items-center justify-between relative", (client.isVisible === false) && "opacity-50 hover:opacity-80")}
                            >
                                <div className="flex items-center gap-4">
                                    <Checkbox
                                      checked={selectedIds.has(client.id)}
                                      onCheckedChange={() => handleToggleSelect(client.id)}
                                      disabled={!canEdit}
                                    />
                                    <FontAwesomeIcon icon={faGripVertical} className={cn("h-5 w-5 text-foreground/50", !canEdit && "opacity-20", canEdit && "cursor-grab")} />
                                    <Image
                                        src={client.logoUrl}
                                        alt={client.name}
                                        width={80}
                                        height={32}
                                        className="object-contain h-8 w-20 grayscale brightness-0 invert"
                                    />
                                    <p className="font-medium truncate">{client.name}</p>
                                </div>
                                <div className="flex items-center">
                                    <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(client)} disabled={!canEdit} title={client.isVisible === false ? t('clientAdmin.show') : t('clientAdmin.hide')}>
                                        <FontAwesomeIcon icon={client.isVisible === false ? faEyeSlash : faEye} />
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={!canEdit}>
                                                <FontAwesomeIcon icon={faEllipsisH} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="glass-effect">
                                            <DropdownMenuItem onClick={() => handleEditItem(client)}>{t('clientAdmin.edit')}</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDeleteItem(client.id)} className="text-destructive">{t('clientAdmin.delete')}</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]">
                                  {sortedClients.length > 0 && (
                                    <Checkbox
                                      checked={selectedIds.size === sortedClients.length && sortedClients.length > 0}
                                      onCheckedChange={handleSelectAll}
                                      disabled={!canEdit}
                                    />
                                  )}
                                </TableHead>
                                <TableHead className="w-[100px] text-center">{t('clientAdmin.col.logo')}</TableHead>
                                <TableHead>{t('clientAdmin.col.name')}</TableHead>
                                <TableHead className="text-right w-[100px]">{t('clientAdmin.col.actions')}</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {sortedClients && sortedClients.map((client) => (
                                <TableRow 
                                    key={client.id}
                                    draggable={canEdit}
                                    onDragStart={(e) => { if (canEdit) { draggingItem.current = client.id; e.currentTarget.classList.add('dragging'); }}}
                                    onDragEnter={(e) => handleDragEnter(e, client.id)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => e.preventDefault()}
                                    className={cn("border-b-0 transition-all relative", canEdit && "cursor-grab", (client.isVisible === false) && "opacity-50 hover:opacity-80")}
                                >
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Checkbox
                                      checked={selectedIds.has(client.id)}
                                      onCheckedChange={() => handleToggleSelect(client.id)}
                                      disabled={!canEdit}
                                    />
                                    <FontAwesomeIcon icon={faGripVertical} className={cn("h-5 w-5 text-foreground/50", !canEdit && "opacity-20")} />
                                  </div>
                                </TableCell>
                                <TableCell className="flex justify-center">
                                    <Image
                                    src={client.logoUrl}
                                    alt={client.name}
                                    width={100}
                                    height={40}
                                    className="object-contain h-10 w-24 grayscale brightness-0 invert"
                                    />
                                </TableCell>
                                <TableCell className="font-medium max-w-[100px] md:max-w-xs truncate">{client.name}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end items-center gap-1">
                                      <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(client)} disabled={!canEdit} title={client.isVisible === false ? t('clientAdmin.show') : t('clientAdmin.hide')}>
                                        <FontAwesomeIcon icon={client.isVisible === false ? faEyeSlash : faEye} />
                                      </Button>
                                      <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="icon" disabled={!canEdit}>
                                          <FontAwesomeIcon icon={faEllipsisH} />
                                          </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent className="glass-effect">
                                          <DropdownMenuItem onClick={() => handleEditItem(client)}>
                                          {t('clientAdmin.edit')}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                          onClick={() => handleDeleteItem(client.id)}
                                          className="text-destructive"
                                          >
                                          {t('clientAdmin.delete')}
                                          </DropdownMenuItem>
                                      </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>

                    {!isLoading && (!clients || clients.length === 0) && (
                        <div className="flex items-center justify-center h-48 text-muted-foreground">
                            <p>{t('clientAdmin.empty')}</p>
                        </div>
                    )}
                </>
                )}
            </ScrollArea>
          </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="w-[80vw] glass-effect">
            <DialogHeader>
              <DialogTitle className="font-headline">{selectedClient?.id ? t('clientAdmin.dialogEditTitle') : t('clientAdmin.dialogAddTitle')}</DialogTitle>
              <DialogDescription>
                {t('clientAdmin.dialogDescription')}
                {!canEdit && <span className="text-destructive font-bold block mt-2"> {t('clientAdmin.readonly')}</span>}
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
              canEdit={canEdit}
              />
          </DialogContent>
        </Dialog>
      </div>
      
      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onToggleVisibility={handleBulkToggleVisibility}
        allSelectedVisible={allVisible}
      />

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="w-[80vw]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clientAdmin.confirmBulkDelete') || 'Delete selected clients?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clientAdmin.confirmBulkDeleteDescription') || `This will permanently delete ${selectedIds.size} clients.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('clientAdmin.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('clientAdmin.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
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
          setActiveTab={() => {}}
          activeLibrary={'primary'}
          setActiveLibrary={() => {}}
          newlyUploadedId={null}
      />
    </>
  );
}
