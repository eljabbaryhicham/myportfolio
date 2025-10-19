
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
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

  const handleDeleteUser = (userId: string) => {
    // This is a placeholder. Deleting a user from Auth requires admin privileges
    // and should be handled by a backend function, not directly from the client.
    console.warn(`Deletion of user ${userId} should be handled by a secure backend function.`);
    toast({
        variant: 'destructive',
        title: 'Action Not Implemented',
        description: 'User deletion must be done from a secure admin backend.',
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
              {!isLoading && users?.map((user) => (
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
                       <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                            <FontAwesomeIcon icon={faTrash} className="h-4 w-4 text-destructive" />
                       </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
               {!isLoading && users?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                    No other admin users found.
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

    