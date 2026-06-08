import { BorderRadius, Colors } from "@/constants/theme";
import { useCalendarStore } from "@/stores/calendarStore";
import { useFamilyStore } from "@/stores/familyStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getItemColor(item: any): string {
  if (item.source === "task") return Colors.light.accent;
  const colors: Record<string, string> = {
    event: Colors.light.primary,
    birthday: "#FF9500",
    appointment: "#10B981",
    school: "#8B5CF6",
  };
  return colors[item.eventType] || Colors.light.textTertiary;
}

function getItemIcon(item: any): keyof typeof Ionicons.glyphMap {
  if (item.source === "task") return "checkbox-outline";
  if (item.eventType === "birthday") return "gift-outline";
  if (item.eventType === "appointment") return "medkit-outline";
  if (item.eventType === "school") return "school-outline";
  return "calendar-outline";
}

export default function CalendarScreen() {
  const { family } = useFamilyStore();
  const { events, loadAllCalendarItems } = useCalendarStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Swipe animation
  const swipeAnim = useMemo(() => new Animated.Value(0), []);
  const swipeOpacity = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (family?.id) loadAllCalendarItems(family.id);
  }, [family?.id, loadAllCalendarItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (family?.id) await loadAllCalendarItems(family.id);
    setRefreshing(false);
  }, [family, loadAllCalendarItems]);

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

  const getItemsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.startDate.startsWith(dateStr));
  };

  const navigateMonth = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Animate out, change, animate in
    Animated.parallel([
      Animated.timing(swipeOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(swipeAnim, {
        toValue: delta * 30,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedDate(new Date(year, month + delta, 1));
      swipeAnim.setValue(delta * -30);
      Animated.parallel([
        Animated.timing(swipeOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.spring(swipeAnim, {
          toValue: 0,
          friction: 10,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const selectedItems = getItemsForDate(selectedDate.getDate());
  const today = new Date();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.light.primary}
          colors={[Colors.light.primary]}
        />
      }
    >
      {/* Calendar Header */}
      <View style={styles.calendarHeader}>
        <TouchableOpacity
          onPress={() => navigateMonth(-1)}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={Colors.light.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.monthContainer}
          onPress={() => {
            // Jump to today
            if (month !== today.getMonth() || year !== today.getFullYear()) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedDate(
                new Date(
                  today.getFullYear(),
                  today.getMonth(),
                  today.getDate(),
                ),
              );
            }
          }}
        >
          <Animated.View
            style={{
              opacity: swipeOpacity,
              transform: [{ translateX: swipeAnim }],
              alignItems: "center",
            }}
          >
            <Text style={styles.monthText}>{MONTHS[month]}</Text>
            <Text style={styles.yearText}>{year}</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigateMonth(1)}
          style={styles.navButton}
        >
          <Ionicons
            name="chevron-forward"
            size={22}
            color={Colors.light.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Today indicator */}
      {month !== today.getMonth() || year !== today.getFullYear() ? (
        <TouchableOpacity
          style={styles.todayBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setSelectedDate(today);
          }}
        >
          <Ionicons
            name="today-outline"
            size={14}
            color={Colors.light.primary}
          />
          <Text style={styles.todayBtnText}>Today</Text>
        </TouchableOpacity>
      ) : null}

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        <View style={styles.weekdayRow}>
          {DAYS.map((d) => (
            <Text
              key={d}
              style={[
                styles.weekdayText,
                d === "Sun" && { color: Colors.light.danger },
              ]}
            >
              {d}
            </Text>
          ))}
        </View>
        <View style={styles.daysGrid}>
          {calendarDays.map((day, i) => {
            if (!day) return <View key={i} style={styles.dayCell} />;

            const isSelected = day === selectedDate.getDate();
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const dayItems = getItemsForDate(day);

            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDate(new Date(year, month, day));
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSelected,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {day}
                </Text>
                <View style={styles.dotRow}>
                  {dayItems.slice(0, 3).map((e) => (
                    <View
                      key={e.id}
                      style={[styles.dot, { backgroundColor: getItemColor(e) }]}
                    />
                  ))}
                  {dayItems.length > 3 && (
                    <Text style={styles.moreDots}>+{dayItems.length - 3}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected Date Items */}
      <View style={styles.itemsSection}>
        <View style={styles.itemsHeader}>
          <Text style={styles.itemsTitle}>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </Text>
          <Text style={styles.itemCount}>
            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {selectedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={44}
              color={Colors.light.textTertiary}
            />
            <Text style={styles.emptyTitle}>Nothing scheduled</Text>
            <Text style={styles.emptyDesc}>
              No events or tasks due on this day
            </Text>
          </View>
        ) : (
          selectedItems.map((item) => {
            const isTask = item.source === "task";
            return (
              <View
                key={item.id}
                style={[styles.itemCard, isTask && styles.itemCardTask]}
              >
                <View
                  style={[
                    styles.itemIndicator,
                    { backgroundColor: getItemColor(item) },
                  ]}
                />
                <View style={styles.itemIconBox}>
                  <Ionicons
                    name={getItemIcon(item)}
                    size={16}
                    color={getItemColor(item)}
                  />
                </View>
                <View style={styles.itemContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.description && (
                    <Text style={styles.itemDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                  )}
                  <View style={styles.itemMeta}>
                    {isTask ? (
                      <>
                        <Text style={styles.itemMetaText}>Task</Text>
                        {item.status && (
                          <Text style={styles.itemMetaText}>
                            ·{" "}
                            {item.status.charAt(0).toUpperCase() +
                              item.status.slice(1)}
                          </Text>
                        )}
                      </>
                    ) : (
                      <>
                        {item.location && (
                          <Text style={styles.itemMetaText}>
                            {item.location}
                          </Text>
                        )}
                        <Text style={styles.itemMetaText}>
                          {new Date(item.startDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={14}
                  color={Colors.light.textTertiary}
                />
              </View>
            );
          })
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  monthContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  monthText: { fontSize: 20, fontWeight: "700", color: Colors.light.text },
  yearText: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    fontWeight: "500",
    marginTop: 1,
  },
  todayBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: Colors.light.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    gap: 4,
    marginBottom: 8,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  calendarGrid: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  weekdayRow: { flexDirection: "row", marginBottom: 8 },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textTertiary,
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.sm,
  },
  dayCellSelected: { backgroundColor: Colors.light.primary },
  dayText: { fontSize: 15, fontWeight: "500", color: Colors.light.text },
  dayTextSelected: { color: "#fff", fontWeight: "700" },
  dayTextToday: { color: Colors.light.primary, fontWeight: "700" },
  dotRow: { flexDirection: "row", gap: 2, marginTop: 2, alignItems: "center" },
  dot: { width: 4, height: 4, borderRadius: 2 },
  moreDots: {
    fontSize: 7,
    color: Colors.light.textTertiary,
    fontWeight: "600",
  },
  itemsSection: { paddingHorizontal: 16, paddingTop: 20 },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    flex: 1,
  },
  itemCount: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    fontWeight: "500",
  },
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  emptyDesc: { fontSize: 13, color: Colors.light.textTertiary },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.lg,
    marginBottom: 8,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  itemCardTask: {},
  itemIndicator: {
    width: 3,
    height: "100%",
    position: "absolute",
    left: 0,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  itemIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: "600", color: Colors.light.text },
  itemDesc: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  itemMeta: { flexDirection: "row", gap: 6, marginTop: 3 },
  itemMetaText: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    fontWeight: "500",
  },
});
