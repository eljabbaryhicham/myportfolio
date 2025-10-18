
'use client'
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import HomePageContent from "@/features/portfolio/components/HomePage";
import { doc } from "firebase/firestore";

interface HomePageSettings {
    featuredProjectId: string;
}

export default function HomePage() {
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const featuredProjectRef = useMemoFirebase(
        () => (firestore && homeSettings?.featuredProjectId ? doc(firestore, 'projects', homeSettings.featuredProjectId) : null),
        [firestore, homeSettings]
    );
    const { data: featuredProject, isLoading: isLoadingProject } = useDoc(featuredProjectRef);


    return <HomePageContent featuredProject={featuredProject} isLoading={isLoadingSettings || isLoadingProject} />;
}
