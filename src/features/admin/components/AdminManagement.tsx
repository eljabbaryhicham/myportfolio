
'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { SUPERADMIN_EMAIL } from '@/lib/constants';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import Preloader from '@/components/preloader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faShieldHalved, faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { useMemo, useState } from 'react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { AppUser } from '@/firebase/auth/use-user';
import NewAdminForm from './NewAdminForm';

interface AdminUser {
    id: string;
    uid: string;
    username: string;
    email: string;
    role: 'admin' | 'superadmin';
    createdAt: string;
    permissions: {
      canUploadMedia: boolean;
      canDeleteMedia: boolean;
      canEditProjects: boolean;
      canEditAbout: boolean;
      canEditContact: boolean;
      canEditHome: boolean;
    }
}
type Permissions = AdminUser['permissions'];

function PermissionsDialog({ user, isOpen, onOpenChange, onSave }: { user: AdminUser, isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (permissions: Permissions) => void }) {
    const { t } = useTranslation();
    const [permissions, setPermissions] = useState<Permissions>(user.permissions || {});
    
    const handlePermissionChange = (permission: keyof Permissions, value: boolean) => {
        setPermissions(prev => ({ ...prev, [permission]: value }));
    };

    const handleSave = () => {
        onSave(permissions);
        onOpenChange(false);
    };

    const permissionItems: { key: keyof Permissions, label: string }[] = [
        { key: 'canUploadMedia', label: t('adminMgmt.permission.uploadMedia') },
        { key: 'canDeleteMedia', label: t('adminMgmt.permission.deleteMedia') },
        { key: 'canEditProjects', label: t('adminMgmt.permission.editProjects') },
        { key: 'canEditAbout', label: t('adminMgmt.permission.editAbout') },
        { key: 'canEditContact', label: t('adminMgmt.permission.editContact') },
        { key: 'canEditHome', label: t('adminMgmt.permission.editHome') },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[80vw] glass-effect">
                <DialogHeader>
                    <DialogTitle className="font-headline">{t('adminMgmt.editPermissions').replace('{user}', user.username)}</DialogTitle>
                    <DialogDescription>
                        {t('adminMgmt.editPermissionsDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {permissionItems.map(({ key, label }) => (
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm glass-effect" key={key}>
                            <Label htmlFor={`${key}-${user.id}`} className='text-sm font-medium leading-none'>{label}</Label>
                            <Switch
                                id={`${key}-${user.id}`}
                                checked={permissions[key] ?? true}
                                onCheckedChange={(checked) => handlePermissionChange(key, !!checked)}
                            />
                        </div>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>{t('adminMgmt.cancel')}</Button>
                    <Button onClick={handleSave}>{t('adminMgmt.savePermissions')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminManagement() {
  const { t } = useTranslation();
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('username', 'asc')) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<AdminUser>(usersQuery);
  
  const typedUser = currentUser as AppUser | null;
  const isSuperAdmin = typedUser?.email === SUPERADMIN_EMAIL;
  
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);


  const displayedUsers = useMemo(() => {
    return users || [];
  }, [users]);

  const handleDeleteUser = (userId: string, username: string) => {
    if (!firestore || !isSuperAdmin) return;
    
    deleteDocumentNonBlocking(doc(firestore, 'users', userId));

    toast({
        title: t('adminMgmt.toast.adminRemoved.title').replace('{username}', username),
        description: t('adminMgmt.toast.adminRemoved.description'),
        duration: 8000,
    });
  }
  
  const handleOpenPermissions = (user: AdminUser) => {
    setSelectedUser(user);
    setIsPermissionsDialogOpen(true);
  };

  const handleSavePermissions = (permissions: Permissions) => {
    if (!firestore || !isSuperAdmin || !selectedUser) return;
    const userDocRef = doc(firestore, 'users', selectedUser.id);
    updateDocumentNonBlocking(userDocRef, { permissions });
    toast({
        title: t('adminMgmt.toast.permissionsUpdated.title'),
        description: t('adminMgmt.toast.permissionsUpdated.description').replace('{user}', selectedUser.username),
    });
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="mb-6 flex items-start justify-between">
            <div>
                <h2 className="text-xl font-headline">{t('adminMgmt.title')}</h2>
                <p className="text-muted-foreground">{t('adminMgmt.description')}</p>
            </div>
             {isSuperAdmin && (
                <Button onClick={() => setIsAddAdminDialogOpen(true)} size="sm">
                    <FontAwesomeIcon icon={faPlusCircle} className="mr-2 h-4 w-4" />
                    {t('adminMgmt.newAdmin')}
                </Button>
            )}
        </div>
        
        {isLoading && (
          <div className="flex justify-center items-center h-full min-h-96">
              <Preloader />
          </div>
        )}
        
        {!isLoading && (
          <div className="flex-1 flex flex-col min-h-0">
              {/* Mobile View */}
              <div className="md:hidden flex-1 border rounded-lg overflow-hidden glass-effect">
                <ScrollArea className='h-full'>
                  <div className='p-4 space-y-4'>
                      {displayedUsers.map((user) => (
                          <div key={user.id} className="p-4 rounded-lg bg-black/10 border border-white/10">
                              <div className='flex justify-between items-start'>
                                  <div>
                                      <p className="font-bold">{user.username}</p>
                                      <p className="text-sm text-muted-foreground">{user.email}</p>
                                  </div>
                                  <Badge variant={user.email === SUPERADMIN_EMAIL ? 'destructive' : 'secondary'} className="ml-2 whitespace-nowrap">
                                      {user.email === SUPERADMIN_EMAIL ? t('adminMgmt.superAdmin') : t('adminMgmt.admin')}
                                  </Badge>
                              </div>
                              <Separator className="my-4 bg-white/10" />
                              <div className='flex justify-between items-center'>
                                  {user.email !== SUPERADMIN_EMAIL ? (
                                      <Button variant="outline" size="sm" onClick={() => handleOpenPermissions(user)} disabled={!isSuperAdmin}>
                                          <FontAwesomeIcon icon={faShieldHalved} className="mr-2 h-4 w-4" />
                                          {t('adminMgmt.permissions')}
                                      </Button>
                                  ) : <div />}
                                  {user.email !== SUPERADMIN_EMAIL && (
                                      <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.username)} disabled={!isSuperAdmin}>
                                          <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                                      </Button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Desktop View */}
              <div className="hidden md:block flex-1 rounded-lg overflow-hidden glass-effect">
                <ScrollArea className='h-full'>
                  <Table>
                      <TableHeader>
                      <TableRow>
                          <TableHead>{t('adminMgmt.col.username')}</TableHead>
                          <TableHead>{t('adminMgmt.col.email')}</TableHead>
                          <TableHead>{t('adminMgmt.col.role')}</TableHead>
                          <TableHead className="text-center">{t('adminMgmt.col.permissions')}</TableHead>
                          <TableHead className="text-right">{t('adminMgmt.col.actions')}</TableHead>
                      </TableRow>
                      </TableHeader>
                      <TableBody>
                      {displayedUsers.map((user) => (
                          <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                              <Badge variant={user.email === SUPERADMIN_EMAIL ? 'destructive' : 'secondary'}>
                              {user.email === SUPERADMIN_EMAIL ? t('adminMgmt.superAdmin') : t('adminMgmt.admin')}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                              {user.email !== SUPERADMIN_EMAIL ? (
                                <Button variant="outline" size="sm" onClick={() => handleOpenPermissions(user)} disabled={!isSuperAdmin}>
                                  <FontAwesomeIcon icon={faShieldHalved} className="mr-2 h-4 w-4" />
                                  {t('adminMgmt.manage')}
                                </Button>
                              ) : (
                                <p className="text-sm text-muted-foreground">{t('adminMgmt.allPermissions')}</p>
                              )}
                          </TableCell>
                          <TableCell className="text-right">
                              {user.email !== SUPERADMIN_EMAIL && (
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.username)} disabled={!isSuperAdmin}>
                                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                              </Button>
                              )}
                          </TableCell>
                          </TableRow>
                      ))}
                      </TableBody>
                  </Table>
                  </ScrollArea>
              </div>
              
              {!isLoading && displayedUsers.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                      {t('adminMgmt.empty')}
                  </div>
              )}
          </div>
        )}
      </div>
      
      {selectedUser && (
        <PermissionsDialog 
          user={selectedUser} 
          isOpen={isPermissionsDialogOpen} 
          onOpenChange={setIsPermissionsDialogOpen}
          onSave={handleSavePermissions} 
        />
      )}

       <Dialog open={isAddAdminDialogOpen} onOpenChange={setIsAddAdminDialogOpen}>
        <DialogContent className="w-[80vw] glass-effect">
            <DialogHeader>
                <DialogTitle className="font-headline">{t('adminMgmt.createNewAdmin')}</DialogTitle>
                <DialogDescription>
                    {t('adminMgmt.createNewAdminDescription')}
                </DialogDescription>
            </DialogHeader>
            <NewAdminForm onSuccess={() => setIsAddAdminDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
