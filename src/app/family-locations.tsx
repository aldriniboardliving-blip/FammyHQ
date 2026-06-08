import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useCallback, useState } from "react";
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, BorderRadius } from "@/constants/theme";
import { getFamilyLocations, getRecentCheckIns, saveCheckIn, saveUserLocation } from "@/lib/location";
import type { LocationRecord } from "@/lib/location";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 5) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getLocationStatus(loc: LocationRecord | null): { label: string; color: string } {
  if (!loc) return { label: "Unknown", color: Colors.light.textTertiary };
  const diff = Date.now() - new Date(loc.timestamp).getTime();
  if (diff < 600000) return { label: "Active", color: Colors.light.success };
  if (diff < 3600000) return { label: "Recent", color: Colors.light.warning };
  return { label: "Old", color: Colors.light.textTertiary };
}

export default function FamilyLocationsScreen() {
  const insets = useSafeAreaInsets();
  const { family } = useFamilyStore();
  const { user } = useUserStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [tab, setTab] = useState<"locations" | "checkins">("locations");

  const fid = family?.id;
  const uid = user?.id;
  const locations = fid ? getFamilyLocations(fid) : [];
  const checkIns = fid ? getRecentCheckIns(fid) : [];

  const onRefresh = useCallback(async () => {
    if (!fid) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshKey((k) => k + 1);
    setRefreshing(false);
  }, [fid]);

  const handleCheckIn = useCallback(async () => {
    if (!uid || !fid) return;
    setCheckingIn(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is needed for check-in.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await saveUserLocation(uid, fid, pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy ?? null);

      const geocode = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      const placeName = geocode[0]
        ? [geocode[0].street, geocode[0].city].filter(Boolean).join(", ") || `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;

      await saveCheckIn(uid, fid, pos.coords.latitude, pos.coords.longitude, placeName, "");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Checked In", `📍 ${placeName}`);
      setRefreshKey((k) => k + 1);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to check in. Make sure location is enabled.");
    }
    setCheckingIn(false);
  }, [uid, fid]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family Locations</Text>
        <TouchableOpacity
          style={[styles.checkinBtn, checkingIn && { opacity: 0.6 }]}
          onPress={handleCheckIn}
          disabled={checkingIn}
        >
          <Ionicons name="location" size={16} color="#fff" />
          <Text style={styles.checkinBtnText}>{checkingIn ? "..." : "Check In"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === "locations" && styles.tabActive]} onPress={() => setTab("locations")}>
          <Ionicons name="people-outline" size={16} color={tab === "locations" ? Colors.light.primary : Colors.light.textTertiary} />
          <Text style={[styles.tabText, tab === "locations" && styles.tabTextActive]}>Live ({locations.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "checkins" && styles.tabActive]} onPress={() => setTab("checkins")}>
          <Ionicons name="time-outline" size={16} color={tab === "checkins" ? Colors.light.primary : Colors.light.textTertiary} />
          <Text style={[styles.tabText, tab === "checkins" && styles.tabTextActive]}>History ({checkIns.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        key={refreshKey}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.light.primary} colors={[Colors.light.primary]} />}
      >
        {tab === "locations" && (
          locations.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="location-outline" size={48} color={Colors.light.textTertiary} />
              <Text style={styles.emptyTitle}>No locations yet</Text>
              <Text style={styles.emptyDesc}>Tap &quot;Check In&quot; to share your location</Text>
            </View>
          ) : (
            locations.map((loc) => {
              const status = getLocationStatus(loc);
              return (
                <View key={loc.id} style={styles.locCard}>
                  <View style={[styles.locAvatar, { backgroundColor: Colors.light.primary }]}>
                    <Text style={styles.locAvatarText}>{loc.displayName?.charAt(0).toUpperCase() || "?"}</Text>
                  </View>
                  <View style={styles.locBody}>
                    <Text style={styles.locName}>{loc.displayName}</Text>
                    <Text style={styles.locCoords}>{loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}</Text>
                    <Text style={styles.locTime}>{timeAgo(new Date(loc.timestamp))}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.color + "18" }]}>
                    <View style={[styles.statusDotSm, { backgroundColor: status.color }]} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
              );
            })
          )
        )}

        {tab === "checkins" && (
          checkIns.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="time-outline" size={48} color={Colors.light.textTertiary} />
              <Text style={styles.emptyTitle}>No check-ins yet</Text>
              <Text style={styles.emptyDesc}>Check in to start tracking</Text>
            </View>
          ) : (
            checkIns.map((ci) => (
              <View key={ci.id} style={styles.checkinCard}>
                <View style={styles.checkinIcon}>
                  <Ionicons name="location" size={18} color={Colors.light.primary} />
                </View>
                <View style={styles.checkinBody}>
                  <Text style={styles.checkinName}>{ci.displayName}</Text>
                  <Text style={styles.checkinPlace}>{ci.locationName}</Text>
                  {ci.note ? <Text style={styles.checkinNote}>&ldquo;{ci.note}&rdquo;</Text> : null}
                  <Text style={styles.checkinTime}>{timeAgo(new Date(ci.createdAt))}</Text>
                </View>
              </View>
            ))
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.light.text },
  checkinBtn: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.light.primary, paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20, gap: 6 },
  checkinBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, backgroundColor: Colors.light.backgroundElement, borderRadius: BorderRadius.md, padding: 3, marginBottom: 8 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 8, borderRadius: BorderRadius.sm, gap: 5 },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, fontWeight: "600", color: Colors.light.textTertiary },
  tabTextActive: { color: Colors.light.primary },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.light.text },
  emptyDesc: { fontSize: 14, color: Colors.light.textTertiary, textAlign: "center", paddingHorizontal: 40 },
  locCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: BorderRadius.xl, padding: 14, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  locAvatar: { width: 42, height: 42, borderRadius: 21, justifyContent: "center", alignItems: "center", marginRight: 12 },
  locAvatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  locBody: { flex: 1 },
  locName: { fontSize: 15, fontWeight: "700", color: Colors.light.text },
  locCoords: { fontSize: 12, color: Colors.light.textTertiary, marginTop: 1, fontFamily: "monospace" },
  locTime: { fontSize: 11, color: Colors.light.textTertiary, marginTop: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, gap: 5 },
  statusDotSm: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "700" },
  checkinCard: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#fff", borderRadius: BorderRadius.lg, padding: 14, marginBottom: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  checkinIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.light.primaryLight, justifyContent: "center", alignItems: "center", marginRight: 12, marginTop: 2 },
  checkinBody: { flex: 1 },
  checkinName: { fontSize: 14, fontWeight: "600", color: Colors.light.text },
  checkinPlace: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  checkinNote: { fontSize: 12, color: Colors.light.textTertiary, fontStyle: "italic", marginTop: 1 },
  checkinTime: { fontSize: 11, color: Colors.light.textTertiary, marginTop: 2 },
});
