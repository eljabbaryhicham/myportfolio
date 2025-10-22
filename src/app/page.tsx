
'use client'
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import HomePageContent from "@/features/portfolio/components/HomePage";
import { doc } from "firebase/firestore";

interface HomePageSettings {
    homePageBackgroundVideoId: string;
}

export default function HomePage() {
    const firestore = useFirestore();

    const settingsDocRef = useMemoFirebase(
      () => (firestore ? doc(firestore, 'homepage', 'settings') : null),
      [firestore]
    );
    const { data: homeSettings, isLoading: isLoadingSettings } = useDoc<HomePageSettings>(settingsDocRef);
    
    const backgroundVideoRef = useMemoFirebase(
        () => (firestore && homeSettings?.homePageBackgroundVideoId ? doc(firestore, 'projects', homeSettings.homePageBackgroundVideoId) : null),
        [firestore, homeSettings]
    );
    const { data: backgroundVideo, isLoading: isLoadingProject } = useDoc(backgroundVideoRef);


    return <HomePageContent backgroundVideo={backgroundVideo} isLoading={isLoadingSettings || isLoadingProject} />;
}
