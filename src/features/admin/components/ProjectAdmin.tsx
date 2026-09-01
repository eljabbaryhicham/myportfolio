
'use client';

import { useState, useEffect, useRef } from 'react';
import PageTextEditor from '@/features/admin/components/PageTextEditor';
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
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { revalidateHome } from '@/lib/revalidate-home';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { defaultPortfolioItems, type PortfolioItem } from '@/features/portfolio/data/portfolio-data';
import { cn } from '@/lib/utils';
import { isSuperAdmin as isSuperAdminCheck } from '@/lib/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle, faEllipsisH, faCloudUploadAlt, faGripVertical, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import Preloader from '@/components/preloader';
import type { AppUser } from '@/firebase/auth/use-user';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { getLocalizedString } from '@/lib/i18n/multilingual';
import { Checkbox } from '@/components/ui/checkbox';
import BulkActionBar from './BulkActionBar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ProjectAdminProps {
  setSelectedItem: (item: PortfolioItem | null) => void;
  setIsSheetOpen: (isOpen: boolean) => void;
}


function ProjectAdmin({ setSelectedItem, setIsSheetOpen }: ProjectAdminProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const { t, lang } = useTranslation();
  
  const typedUser = user as AppUser | null;
  const isSuperAdmin = isSuperAdminCheck(typedUser);
  const canEditProjects = isSuperAdmin || (typedUser?.permissions?.canEditProjects ?? true);

  const projectsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
  const { data: items, isLoading } = useCollection<PortfolioItem>(projectsCollection);

  const [sortedItems, setSortedItems] = useState<PortfolioItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  
  const draggingItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  useEffect(() => {
    if (items) {
      const newSortedItems = [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSortedItems(newSortedItems);
    }
  }, [items]);

  const handleSeedData = async () => {
    if (!firestore || !canEditProjects) {
        toast({ variant: 'destructive', title: t('projectAdmin.toast.permissionDenied.title'), description: t('projectAdmin.toast.permissionDenied.description') });
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
        toast({ title: t('projectAdmin.toast.seedSuccess.title'), description: t('projectAdmin.toast.seedSuccess.description') });
    } catch (e: any) {
        console.error('Seed data write blocked.', e);
        toast({ variant: 'destructive', title: t('projectAdmin.toast.permissionDenied.title'), description: t('projectAdmin.toast.permissionDenied.description') });
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
    if (!firestore || !canEditProjects) return;
    deleteDocumentNonBlocking(doc(firestore, 'projects', id));
    revalidateHome(auth);
    toast({
      title: t('projectAdmin.toast.deleted.title'),
      description: t('projectAdmin.toast.deleted.description'),
    });
  };

  const handleToggleVisibility = (item: PortfolioItem) => {
    if (!firestore || !canEditProjects) return;
    const docRef = doc(firestore, 'projects', item.id);
    const newVisibility = !(item.isVisible ?? true);
    updateDocumentNonBlocking(docRef, { isVisible: newVisibility });
    revalidateHome(auth);
    toast({
        title: t('projectAdmin.toast.visibilityChanged.title').replace('{visibility}', newVisibility ? t('projectAdmin.show') : t('projectAdmin.hide')),
        description: t('projectAdmin.toast.visibilityChanged.description').replace('{title}', getLocalizedString(item.title, lang)).replace('{visibility}', newVisibility ? 'visible' : 'hidden'),
    });
  };

  const allVisible = sortedItems.length > 0 && sortedItems.every(item => item.isVisible !== false);

  const handleSelectAll = () => {
    if (selectedIds.size === sortedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedItems.map(item => item.id)));
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
    if (!firestore || !canEditProjects) return;
    const batch = writeBatch(firestore);
    selectedIds.forEach(id => {
      batch.delete(doc(firestore, 'projects', id));
    });
    batch.commit().then(() => {
      toast({ title: t('projectAdmin.toast.deleted.title'), description: `Deleted ${selectedIds.size} items.` });
      revalidateHome(auth);
    }).catch((error) => {
      console.error('Batch delete blocked.', error);
      toast({ variant: 'destructive', title: t('projectAdmin.toast.permissionDenied.title'), description: t('projectAdmin.toast.permissionDenied.description') });
    });
    setSelectedIds(new Set());
    setIsBulkDeleteOpen(false);
  };

  const handleBulkToggleVisibility = () => {
    if (!firestore || !canEditProjects) return;
    const batch = writeBatch(firestore);
    const newVisibility = !allVisible;
    selectedIds.forEach(id => {
      batch.update(doc(firestore, 'projects', id), { isVisible: newVisibility });
    });
    batch.commit().then(() => {
      toast({ title: t('projectAdmin.toast.visibilityChanged.title').replace('{visibility}', newVisibility ? t('projectAdmin.show') : t('projectAdmin.hide')), description: `Updated ${selectedIds.size} items.` });
      revalidateHome(auth);
    }).catch((error) => {
      console.error('Batch visibility update blocked.', error);
      toast({ variant: 'destructive', title: t('projectAdmin.toast.permissionDenied.title'), description: t('projectAdmin.toast.permissionDenied.description') });
    });
    setSelectedIds(new Set());
  };

  const handleDragEnd = () => {
    if (!firestore || !canEditProjects) return;

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
        toast({ title: t('projectAdmin.toast.reordered.title'), description: t('projectAdmin.toast.reordered.description') });
        revalidateHome(auth);
}).catch(error => {
        // Reset local state on failure
        if (items) {
          setSortedItems([...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }

        console.error('Reorder write blocked.', error);
        toast({ variant: 'destructive', title: t('projectAdmin.toast.permissionDenied.title'), description: t('projectAdmin.toast.permissionDenied.description') });
      });
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, id: string) => {
    if (!canEditProjects) return;
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
    <div className="flex-1 flex flex-col h-full">
        <div className="mb-6">
          <PageTextEditor
            titleKey="pageContent.workTitle"
            fields={[
              { name: 'workHeading', labelKey: 'pageContent.workHeadingLabel' },
              { name: 'workSubtitle', labelKey: 'pageContent.subheadingLabel' },
            ]}
          />
        </div>
        <div className="flex items-start justify-between mb-6">
            <div className="text-left">
                <h2 className="text-xl font-headline">{t('projectAdmin.title')}</h2>
                <p className="text-muted-foreground">
                {t('projectAdmin.description')}
                </p>
            </div>
            <div className="flex items-center gap-2">
                {!isLoading && items?.length === 0 && (
                <Button onClick={handleSeedData} variant="secondary" size="sm" disabled={!canEditProjects}>
                    <FontAwesomeIcon icon={faCloudUploadAlt} className="mr-2 h-4 w-4" />
                    {t('projectAdmin.seed')}
                </Button>
                )}
                <Button onClick={handleAddItem} size="sm" disabled={!canEditProjects}>
                <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                {t('projectAdmin.addNew')}
                </Button>
            </div>
        </div>
        <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
        <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] text-center">
                    {sortedItems.length > 0 && (
                      <Checkbox
                        checked={selectedIds.size === sortedItems.length && sortedItems.length > 0}
                        onCheckedChange={handleSelectAll}
                        disabled={!canEditProjects}
                      />
                    )}
                  </TableHead>
                  <TableHead className="w-[80px] text-center">{t('projectAdmin.col.image')}</TableHead>
                  <TableHead className="text-center">{t('projectAdmin.col.title')}</TableHead>
                  <TableHead className="hidden md:table-cell text-center">{t('projectAdmin.col.type')}</TableHead>
                  <TableHead className="hidden lg:table-cell text-center">{t('projectAdmin.col.description')}</TableHead>
                  <TableHead className="text-center w-[100px]">{t('projectAdmin.col.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-96">
                      <div className="flex justify-center items-center h-full">
                        <Preloader />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedItems && sortedItems.map((item) => (
                  <TableRow 
                    key={item.id} 
                    draggable={canEditProjects}
                    onDragStart={(e) => {
                      if (!canEditProjects) return;
                      draggingItem.current = item.id;
                      e.currentTarget.classList.add('dragging');
                    }}
                    onDragEnter={(e) => handleDragEnter(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className={cn(
                        "border-b-0 transition-all relative", 
                        canEditProjects && "cursor-grab",
                        (item.isVisible === false) && "opacity-50 hover:opacity-80"
                    )}
                  >
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => handleToggleSelect(item.id)}
                          disabled={!canEditProjects}
                        />
                        <FontAwesomeIcon icon={faGripVertical} className={cn("h-5 w-5 text-foreground/50", !canEditProjects && "opacity-20")} />
                      </div>
                    </TableCell>
                    <TableCell className="flex justify-center">
                      <Image
                        src={item.thumbnailUrl}
                        alt={getLocalizedString(item.title, lang)}
                        width={50}
                        height={50}
                        className="object-cover rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium max-w-[100px] md:max-w-xs truncate text-center">{getLocalizedString(item.title, lang)}</TableCell>
                    <TableCell className="hidden md:table-cell text-center">{item.type}</TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs truncate text-center">{getLocalizedString(item.description, lang)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleToggleVisibility(item)} disabled={!canEditProjects} title={item.isVisible === false ? t('projectAdmin.show') : t('projectAdmin.hide')}>
                            <FontAwesomeIcon icon={item.isVisible === false ? faEyeSlash : faEye} />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <FontAwesomeIcon icon={faEllipsisH} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="glass-effect">
                              <DropdownMenuItem onClick={() => handleEditItem(item)} className="justify-center">
                                {canEditProjects ? t('projectAdmin.edit') : t('projectAdmin.view')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-destructive justify-center"
                                disabled={!canEditProjects}
                              >
                                {t('projectAdmin.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </ScrollArea>
      </div>

      <BulkActionBar
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onToggleVisibility={handleBulkToggleVisibility}
        allSelectedVisible={allVisible}
      />

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent className="w-[80vw] glass-effect">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projectAdmin.confirmBulkDelete') || 'Delete selected items?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projectAdmin.confirmBulkDeleteDescription') || `This will permanently delete ${selectedIds.size} items.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('projectAdmin.cancel') || 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('projectAdmin.delete') || 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProjectAdmin;
