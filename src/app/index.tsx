import { BorderRadius } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function LandingScreen() {
  const { user, isLoading: userLoading } = useUserStore();
  const { family, isLoading: familyLoading, memberStatus } = useFamilyStore();
  const isLoading = userLoading || familyLoading;

  const titleAnim = useMemo(() => new Animated.Value(0), []);
  const subtitleAnim = useMemo(() => new Animated.Value(0), []);
  const buttonAnim = useMemo(() => new Animated.Value(0), []);
  const floatAnim = useMemo(() => new Animated.Value(0), []);
  const pulseAnim = useMemo(() => new Animated.Value(0), []);
  const iconAnim = useMemo(() => new Animated.Value(0), []);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -15],
  });
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (family && memberStatus === "approved") {
      router.replace("/(tabs)");
    } else if (family && memberStatus === "pending") {
      router.replace("/onboarding/awaiting-approval");
    } else if (family) {
      router.replace("/(tabs)");
    } else {
      router.replace("/onboarding/family-setup");
    }
  }, [isLoading, user, family, memberStatus]);

  useEffect(() => {
    if (isLoading) return;
    Animated.parallel([
      Animated.spring(titleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 80,
        delay: 300,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        delay: 700,
      }),
      Animated.spring(buttonAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 80,
        delay: 1100,
      }),
      Animated.spring(iconAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 10,
        stiffness: 60,
        delay: 100,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [isLoading, titleAnim, subtitleAnim, buttonAnim, floatAnim, pulseAnim, iconAnim]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1E506E", "#467896", "#82C8BE"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      <Animated.View
        style={[
          styles.bgCircle1,
          { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
        ]}
      />
      <Animated.View
        style={[
          styles.bgCircle2,
          { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
        ]}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.iconWrapper,
              {
                opacity: iconAnim,
                transform: [
                  { translateY: floatTranslate },
                  {
                    scale: iconAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0.05)"]}
                style={styles.iconGlow}
              />
              <Image
                source={require("@/assets/fammyHQ.png")}
                style={styles.logoImage}
                contentFit="contain"
              />
            </View>
          </Animated.View>

          <Animated.View
            style={[
              styles.titleContainer,
              {
                opacity: titleAnim,
                transform: [
                  {
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [40, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.titleLine1}>FammyHQ</Text>
            <Text style={styles.titleLine2}>Family Hub & Connection</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.subtitleContainer,
              {
                opacity: subtitleAnim,
                transform: [
                  {
                    translateY: subtitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.subtitle}>
              Stay connected, manage tasks, schedules, and locations — all while
              keeping your data private.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.featurePills,
              {
                opacity: subtitleAnim,
                transform: [
                  {
                    translateY: subtitleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {["Tasks", "Calendar", "Chat", "Location"].map((feature) => (
              <View key={feature} style={styles.pill}>
                <Text style={styles.pillText}>{feature}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonAnim,
                transform: [
                  {
                    translateY: buttonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("/onboarding/identity")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#FFFFFF", "#EFF7F5"]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1E506E" },
  gradient: { ...StyleSheet.absoluteFill },
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  bgCircle1: {
    position: "absolute",
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -width * 0.3,
    right: -width * 0.2,
  },
  bgCircle2: {
    position: "absolute",
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -width * 0.2,
    left: -width * 0.15,
  },
  iconWrapper: { marginBottom: 24 },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.10)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  iconGlow: { ...StyleSheet.absoluteFill, borderRadius: 70 },
  logoImage: { width: 100, height: 100 },
  titleContainer: { alignItems: "center", marginBottom: 16 },
  titleLine1: {
    fontSize: 48,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -1,
    marginTop: -4,
  },
  titleLine2: {
    fontSize: 25,
    fontWeight: "300",
    color: "#FFFFFF",
    letterSpacing: 2,
    opacity: 0.8,
  },
  subtitleContainer: { marginBottom: 28, paddingHorizontal: 16 },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    lineHeight: 24,
  },
  featurePills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 40,
  },
  pill: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pillText: { fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: "500" },
  buttonContainer: { width: "100%", alignItems: "center" },
  button: {
    width: "100%",
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 8,
  },
  buttonText: { fontSize: 18, fontWeight: "700", color: "#1E506E" },
  buttonArrow: { fontSize: 20, color: "#1E506E" },
});
