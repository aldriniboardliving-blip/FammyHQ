import AnnouncementCarousel from "@/components/announcement-carousel";
import AnnouncementFormModal from "@/components/announcement-form-modal";
import { BorderRadius, Colors } from "@/constants/theme";
import { useAnnouncementStore } from "@/stores/announcementStore";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getPriorityColor(p: string): string {
  const map: Record<string, string> = {
    urgent: Colors.light.danger,
    high: Colors.light.warning,
    normal: Colors.light.primary,
    low: Colors.light.success,
  };
  return map[p] || map.normal;
}

function ExpandableCard({
  item,
  isOwner,
  onDelete,
}: {
  item: any;
  isOwner: boolean;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const anim = useMemo(() => new Animated.Value(0), []);

  const toggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = expanded ? 0 : 1;
    Animated.spring(anim, {
      toValue,
      useNativeDriver: false,
      friction: 10,
      tension: 40,
    }).start();
    setExpanded(!expanded);
  }, [expanded, anim]);

  const contentHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const contentOpacity = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.95}
      onPress={toggleExpand}
    >
      <View style={styles.cardHead}>
        <View
          style={[
            styles.priorityDot,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        />
        <View style={styles.cardHeadText}>
          <Text
            style={styles.cardTitle}
            numberOfLines={expanded ? undefined : 1}
          >
            {item.title}
          </Text>
          <Text style={styles.cardAuthor}>
            {item.authorName || "Unknown"} · {timeAgo(new Date(item.createdAt))}
          </Text>
        </View>
        <View style={styles.cardHeadRight}>
          {item.priority !== "normal" && (
            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(item.priority) + "18" },
              ]}
            >
              <Text
                style={[
                  styles.priorityBadgeText,
                  { color: getPriorityColor(item.priority) },
                ]}
              >
                {item.priority}
              </Text>
            </View>
          )}
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.light.textTertiary}
            style={{ marginLeft: 4 }}
          />
        </View>
      </View>

      {/* Expandable content */}
      <Animated.View
        style={[
          styles.expandableContent,
          { maxHeight: contentHeight, opacity: contentOpacity },
        ]}
      >
        <Text style={styles.cardContent}>{item.content}</Text>
        <View style={styles.cardActions}>
          {isOwner && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onDelete(item.id);
              }}
            >
              <Ionicons
                name="trash-outline"
                size={14}
                color={Colors.light.danger}
              />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const { family } = useFamilyStore();
  const { user } = useUserStore();
  const {
    announcements,
    loadAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
  } = useAnnouncementStore();
  const [showForm, setShowForm] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (family?.id) loadAnnouncements(family.id);
  }, [family?.id, loadAnnouncements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (family?.id) await loadAnnouncements(family.id);
    setRefreshing(false);
  }, [family, loadAnnouncements]);

  const handleCreate = async (data: {
    title: string;
    content: string;
    priority: string;
  }) => {
    if (!family?.id || !user?.id) return;
    await createAnnouncement({
      familyId: family.id,
      title: data.title,
      content: data.content,
      priority: data.priority,
      createdBy: user.id,
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Announcement", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteAnnouncement(id);
        },
      },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSub}>{announcements.length} total</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setFormKey((k) => k + 1);
            setShowForm(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="megaphone" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {announcements.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons
              name="megaphone-outline"
              size={52}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>No announcements yet</Text>
            <Text style={styles.emptyDesc}>
              Tap the megaphone to create your first announcement
            </Text>
          </View>
        ) : (
          <>
            <AnnouncementCarousel
              key={announcements.length}
              announcements={announcements}
              currentUserId={user?.id}
              onDelete={handleDelete}
            />
            {announcements.map((a) => (
              <ExpandableCard
                key={a.id}
                item={a}
                isOwner={a.createdBy === user?.id}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </ScrollView>

      <AnnouncementFormModal
        key={formKey}
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: Colors.light.text },
  headerSub: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    fontWeight: "500",
    marginTop: 2,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.light.text },
  emptyDesc: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  priorityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  cardHeadText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  cardAuthor: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
    fontWeight: "500",
  },
  cardHeadRight: { flexDirection: "row", alignItems: "center", flexShrink: 0 },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expandableContent: { overflow: "hidden" },
  cardContent: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginTop: 12,
  },
  cardActions: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.borderLight,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.light.dangerLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.danger,
  },
});
