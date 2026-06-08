import { initDatabase } from "@/database/init";
import { startBackgroundSync } from "@/lib/sync";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";

export default function RootLayout() {
  const { loadUser, user } = useUserStore();
  const { loadFamily, setLoading } = useFamilyStore();

  useEffect(() => {
    const initialize = async () => {
      await initDatabase();
      await loadUser();
      startBackgroundSync();
    };
    initialize();
  }, [loadUser]);

  useEffect(() => {
    if (user?.id) {
      loadFamily(user.id);
    } else {
      setLoading(false);
    }
  }, [user?.id, loadFamily, setLoading]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen
          name="onboarding"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="announcements"
          options={{
            headerShown: true,
            title: "Announcements",
            animation: "slide_from_right",
          }}
        />
        <Stack.Screen
          name="qr-scan"
          options={{
            headerShown: true,
            title: "Scan QR",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="family-locations"
          options={{
            headerShown: true,
            title: "Family Locations",
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </>
  );
}
