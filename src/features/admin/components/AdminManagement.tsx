
'use client';

import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, useUser } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
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
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useToast } from '@/hooks/use-toast';
import { useMemo } from 'react';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
      canEditContact: boolean;
      canEditHome: boolean;
    }
}

export default function AdminManagement() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('username', 'asc')) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<AdminUser>(usersQuery);
  const isSuperAdmin = currentUser?.email === 'eljabbaryhicham@example.com';

  const displayedUsers = useMemo(() => {
    return users || [];
  }, [users]);

  const handleDeleteUser = (userId: string, username: string) => {
    if (!firestore || !isSuperAdmin) return;
    
    deleteDocumentNonBlocking(doc(firestore, 'users', userId));

    toast({
        title: `Admin '${username}' Removed`,
        description: 'The user has been removed from the list. To fully revoke their access, delete them from Firebase Authentication as well.',
        duration: 8000,
    });
  }

  const handlePermissionChange = (userId: string, permission: keyof AdminUser['permissions'], value: boolean) => {
    if (!firestore || !isSuperAdmin) return;
    const userDocRef = doc(firestore, 'users', userId);
    updateDocumentNonBlocking(userDocRef, {
      [`permissions.${permission}`]: value,
    });
  };

  const renderPermissionCheckboxes = (user: AdminUser) => (
    <>
        {user.email !== 'eljabbaryhicham@example.com' && (
            <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center space-x-2">
                <Checkbox
                    id={`upload-${user.id}`}
                    checked={user.permissions?.canUploadMedia ?? true}
                    onCheckedChange={(checked) => handlePermissionChange(user.id, 'canUploadMedia', !!checked)}
                    disabled={!isSuperAdmin}
                />
                <Label htmlFor={`upload-${user.id}`} className='text-sm font-medium leading-none'>Upload Media</Label>
                </div>
                <div className="flex items-center space-x-2">
                <Checkbox
                    id={`delete-${user.id}`}
                    checked={user.permissions?.canDeleteMedia ?? true}
                    onCheckedChange={(checked) => handlePermissionChange(user.id, 'canDeleteMedia', !!checked)}
                    disabled={!isSuperAdmin}
                />
                    <Label htmlFor={`delete-${user.id}`} className='text-sm font-medium leading-none'>Delete Media</Label>
                </div>
                <div className="flex items-center space-x-2">
                <Checkbox
                    id={`edit-projects-${user.id}`}
                    checked={user.permissions?.canEditProjects ?? true}
                    onCheckedChange={(checked) => handlePermissionChange(user.id, 'canEditProjects', !!checked)}
                    disabled={!isSuperAdmin}
                />
                    <Label htmlFor={`edit-projects-${user.id}`} className='text-sm font-medium leading-none'>Edit Projects</Label>
                </div>
                    <div className="flex items-center space-x-2">
                <Checkbox
                    id={`edit-contact-${user.id}`}
                    checked={user.permissions?.canEditContact ?? true}
                    onCheckedChange={(checked) => handlePermissionChange(user.id, 'canEditContact', !!checked)}
                    disabled={!isSuperAdmin}
                />
                    <Label htmlFor={`edit-contact-${user.id}`} className='text-sm font-medium leading-none'>Edit Contact</Label>
                </div>
                    <div className="flex items-center space-x-2">
                <Checkbox
                    id={`edit-home-${user.id}`}
                    checked={user.permissions?.canEditHome ?? true}
                    onCheckedChange={(checked) => handlePermissionChange(user.id, 'canEditHome', !!checked)}
                    disabled={!isSuperAdmin}
                />
                    <Label htmlFor={`edit-home-${user.id}`} className='text-sm font-medium leading-none'>Edit Home</Label>
                </div>
            </div>
        )}
    </>
  );

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Admin Management</h2>
        <p className="text-muted-foreground">View and manage administrator accounts and permissions.</p>
      </div>
       <div className="flex-1 rounded-lg overflow-hidden glass-effect">
         {isLoading && (
            <div className="flex justify-center items-center h-full min-h-96">
                <Preloader />
            </div>
         )}
         {!isLoading && (
            <ScrollArea className="h-full">
                {/* Mobile View */}
                <div className="md:hidden p-4 space-y-4">
                    {displayedUsers.map((user, index) => (
                        <div key={user.id} className="p-4 rounded-lg glass-effect border">
                            <div className='flex justify-between items-start'>
                                <div>
                                    <p className="font-bold">{user.username}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                                <Badge variant={user.email === 'eljabbaryhicham@example.com' ? 'destructive' : 'secondary'} className="ml-2 whitespace-nowrap">
                                    {user.email === 'eljabbaryhicham@example.com' ? 'Super Admin' : 'Admin'}
                                </Badge>
                            </div>
                            <Separator className="my-4 bg-white/10" />
                            <div className='flex justify-between items-center'>
                                <div className='space-y-1'>
                                    <p className="font-medium text-sm">Permissions</p>
                                    {renderPermissionCheckboxes(user)}
                                </div>
                                {user.email !== 'eljabbaryhicham@example.com' && (
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.username)} disabled={!isSuperAdmin}>
                                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block">
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {!isLoading && displayedUsers.map((user) => (
                            <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.email === 'eljabbaryhicham@example.com' ? 'destructive' : 'secondary'}>
                                {user.email === 'eljabbaryhicham@example.com' ? 'Super Admin' : 'Admin'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {renderPermissionCheckboxes(user)}
                            </TableCell>
                            <TableCell className="text-right">
                                {user.email !== 'eljabbaryhicham@example.com' && (
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.username)} disabled={!isSuperAdmin}>
                                        <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                                </Button>
                                )}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
                 {!isLoading && displayedUsers.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">
                        No admin users found.
                    </div>
                )}
            </ScrollArea>
         )}
      </div>
    </div>
  );
}
