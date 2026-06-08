import { BorderRadius, Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdBy: string;
  createdAt: string;
  authorName?: string;
}

interface AnnouncementCarouselProps {
  announcements: AnnouncementItem[];
  compact?: boolean;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

export default function AnnouncementCarousel({
  announcements,
  compact = false,
  onDelete,
  currentUserId,
}: AnnouncementCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const slideAnim = useMemo(() => new Animated.Value(0), []);
  const fadeAnim = useMemo(() => new Animated.Value(1), []);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const mountedRef = useRef(true);

  const total = announcements.length;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const animateTo = useCallback(
    (targetIndex: number, direction: "left" | "right") => {
      if (targetIndex < 0 || targetIndex >= total) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpandedId(null);

      const offset = direction === "right" ? -40 : 40;
      slideAnim.setValue(-offset);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start(() => {
        if (!mountedRef.current) return;
        setCurrentIndex(targetIndex);
        slideAnim.setValue(offset);

        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 9,
            tension: 60,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [total, slideAnim, fadeAnim],
  );

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      animateTo(currentIndex + 1, "right");
    }
  }, [currentIndex, total, animateTo]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      animateTo(currentIndex - 1, "left");
    }
  }, [currentIndex, animateTo]);

  const startAutoAdvance = useCallback(() => {
    if (autoRef.current) clearInterval(autoRef.current);
    if (total <= 1) return;
    autoRef.current = setInterval(() => {
      if (!mountedRef.current || pausedRef.current) return;
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= total) return 0;
        return next;
      });
    }, 4000);
  }, [total]);

  const stopAutoAdvance = useCallback(() => {
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return stopAutoAdvance;
  }, [startAutoAdvance, stopAutoAdvance]);

  const item = announcements[currentIndex];
  const isOwner = item?.createdBy === currentUserId;

  const handleExpand = useCallback(
    (id: string) => {
      pausedRef.current = expandedId !== id;
      setExpandedId((prev) => (prev === id ? null : id));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (pausedRef.current) {
        stopAutoAdvance();
      } else {
        pausedRef.current = false;
        startAutoAdvance();
      }
    },
    [expandedId, stopAutoAdvance, startAutoAdvance],
  );

  const handleDelete = useCallback(() => {
    if (!item || !onDelete) return;
    pausedRef.current = true;
    stopAutoAdvance();
    Alert.alert("Delete Announcement", "This cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => {
          pausedRef.current = false;
          startAutoAdvance();
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete(item.id);
          pausedRef.current = false;
          startAutoAdvance();
        },
      },
    ]);
  }, [item, onDelete, stopAutoAdvance, startAutoAdvance]);

  if (total === 0) return null;

  const isExpanded = expandedId === item?.id;

  return (
    <View>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <Animated.View
          style={[
            styles.animatedContent,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => handleExpand(item.id)}
            style={styles.cardInner}
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
                  style={[styles.cardTitle, compact && styles.cardTitleCompact]}
                  numberOfLines={isExpanded ? undefined : 1}
                >
                  {item.title}
                </Text>
                <Text style={styles.cardAuthor}>
                  {item.authorName || "Unknown"} ·{" "}
                  {timeAgo(new Date(item.createdAt))}
                </Text>
              </View>
              <View style={styles.cardHeadRight}>
                {item.priority !== "normal" && (
                  <View
                    style={[
                      styles.priorityBadge,
                      {
                        backgroundColor: getPriorityColor(item.priority) + "18",
                      },
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
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={Colors.light.textTertiary}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedContent}>
                <Text
                  style={[
                    styles.cardContent,
                    compact && styles.cardContentCompact,
                  ]}
                >
                  {item.content}
                </Text>
                {isOwner && onDelete && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={handleDelete}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color={Colors.light.danger}
                      />
                      <Text style={styles.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        {total > 1 && (
          <View style={[styles.navRow, compact && styles.navRowCompact]}>
            <TouchableOpacity
              style={[
                styles.navBtn,
                currentIndex === 0 && styles.navBtnDisabled,
              ]}
              onPress={goPrev}
              disabled={currentIndex === 0}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={compact ? 18 : 22}
                color={
                  currentIndex === 0
                    ? Colors.light.textTertiary
                    : Colors.light.primary
                }
              />
            </TouchableOpacity>

            <View style={styles.dotsRow}>
              {announcements.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    if (i === currentIndex) return;
                    animateTo(i, i > currentIndex ? "right" : "left");
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.dot, i === currentIndex && styles.dotActive]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.navBtn,
                currentIndex === total - 1 && styles.navBtnDisabled,
              ]}
              onPress={goNext}
              disabled={currentIndex === total - 1}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-forward"
                size={compact ? 18 : 22}
                color={
                  currentIndex === total - 1
                    ? Colors.light.textTertiary
                    : Colors.light.primary
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: "hidden",
  },
  cardCompact: {
    borderRadius: BorderRadius.lg,
  },
  animatedContent: {
    padding: 20,
    paddingBottom: 8,
  },
  cardInner: {},
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  cardHeadText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  cardTitleCompact: {
    fontSize: 15,
  },
  cardAuthor: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
    fontWeight: "500",
  },
  cardHeadRight: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expandedContent: {
    overflow: "hidden",
  },
  cardContent: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    lineHeight: 22,
    marginTop: 12,
  },
  cardContentCompact: {
    fontSize: 14,
    lineHeight: 20,
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
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 12,
  },
  navRowCompact: {
    paddingBottom: 10,
    paddingHorizontal: 8,
    gap: 8,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
  },
});
