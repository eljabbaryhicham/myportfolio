
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
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


interface AdminUser {
    id: string;
    uid: string;
    username: string;
    email: string;
    role: 'admin' | 'superadmin';
    createdAt: string;
}

export default function AdminManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), orderBy('createdAt', 'desc')) : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<AdminUser>(usersQuery);

  const displayedUsers = useMemo(() => {
    return users || [];
  }, [users]);

  const handleDeleteUser = (userId: string, username: string) => {
    if (!firestore) return;
    
    // This deletes the user's document from the 'users' collection in Firestore.
    deleteDocumentNonBlocking(doc(firestore, 'users', userId));

    toast({
        title: `Admin '${username}' Removed`,
        description: 'The user has been removed from the list. To fully revoke their access, delete them from Firebase Authentication as well.',
        duration: 8000,
    });
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Admin Management</h2>
        <p className="text-muted-foreground">View and manage administrator accounts.</p>
      </div>
      <div className="flex-1 border rounded-lg overflow-hidden glass-effect">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-96">
                    <div className="flex justify-center items-center h-full">
                      <Preloader />
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && displayedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.email === 'eljabbaryhicham@example.com' ? 'destructive' : 'secondary'}>
                      {user.email === 'eljabbaryhicham@example.com' ? 'Super Admin' : 'Admin'}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    {user.email !== 'eljabbaryhicham@example.com' && (
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id, user.username)}>
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                       </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && displayedUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No admin users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
