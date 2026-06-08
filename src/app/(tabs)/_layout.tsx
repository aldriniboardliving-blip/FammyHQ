import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const iconMap: Record<
  string,
  {
    focused: keyof typeof Ionicons.glyphMap;
    default: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { focused: "home", default: "home-outline" },
  calendar: { focused: "calendar", default: "calendar-outline" },
  chat: {
    focused: "chatbubble-ellipses",
    default: "chatbubble-ellipses-outline",
  },
  tasks: { focused: "checkbox", default: "checkbox-outline" },
  family: { focused: "people", default: "people-outline" },
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 4);

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textTertiary,
        tabBarStyle: {
          backgroundColor: Colors.light.backgroundCard,
          borderTopColor: Colors.light.borderLight,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: Colors.light.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: Colors.light.text,
        headerTitleStyle: { fontWeight: "700", fontSize: 18 },
        tabBarIcon: ({ focused, color }) => {
          const icons = iconMap[route.name];
          return (
            <Ionicons
              name={focused ? icons.focused : icons.default}
              size={24}
              color={color}
              style={focused ? styles.activeIcon : undefined}
            />
          );
        },
      })}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", headerTitle: "FammyHQ" }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: "Calendar", headerTitle: "Family Calendar" }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: "Chat", headerTitle: "Family Chat" }}
      />
      <Tabs.Screen
        name="tasks"
        options={{ title: "Tasks", headerTitle: "Family Tasks" }}
      />
      <Tabs.Screen
        name="family"
        options={{ title: "Family", headerTitle: "Family Hub" }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIcon: { marginTop: -2 },
});
