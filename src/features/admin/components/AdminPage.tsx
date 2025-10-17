
'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { useUser } from '@/firebase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ProjectAdmin from './ProjectAdmin';
import ContactAdmin from './ContactAdmin';


function AdminPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();
    
  const { user, isUserLoading } = useUser();
  
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
            <Button onClick={handleLogout} variant="secondary">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="projects" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
            <TabsContent value="projects" className="flex-1 overflow-auto mt-4">
                <ProjectAdmin />
            </TabsContent>
            <TabsContent value="contact" className="flex-1 overflow-auto mt-4">
                <ContactAdmin />
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default AdminPage;
