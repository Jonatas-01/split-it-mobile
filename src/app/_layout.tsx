import { SplashScreen, Stack } from "expo-router";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import "@/styles/global.css";

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        'Figtree-Regular': require('@/assets/fonts/Figtree-Regular.ttf'),
        'Figtree-Medium': require('@/assets/fonts/Figtree-Medium.ttf'),
        'Figtree-SemiBold': require('@/assets/fonts/Figtree-SemiBold.ttf'),
        'Figtree-Bold': require('@/assets/fonts/Figtree-Bold.ttf'),
        'Figtree-ExtraBold': require('@/assets/fonts/Figtree-ExtraBold.ttf'),
        'Figtree-Black': require('@/assets/fonts/Figtree-Black.ttf'),
        'SpaceMono-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
        'SpaceMono-Bold': require('@/assets/fonts/SpaceMono-Bold.ttf')
    });

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);
    if (!fontsLoaded) {
        return null;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
