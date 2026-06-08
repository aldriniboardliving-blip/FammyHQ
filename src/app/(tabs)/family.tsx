import EditFamilyModal from "@/components/edit-family-modal";
import EditProfileModal from "@/components/edit-profile-modal";
import QRDisplay from "@/components/qr-display";
import { BorderRadius, Colors } from "@/constants/theme";
import { useFamilyStore } from "@/stores/familyStore";
import { useUserStore } from "@/stores/userStore";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tab = "members" | "pending" | "invite" | "locations";

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    family,
    members,
    loadMembers,
    approveMember,
    rejectMember,
    updateFamily,
  } = useFamilyStore();
  const { user, updateUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [refreshing, setRefreshing] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditName, setShowEditName] = useState(false);

  useEffect(() => {
    if (family?.id) loadMembers(family.id);
  }, [family?.id, loadMembers]);

  const onRefresh = useCallback(async () => {
    if (!family?.id) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadMembers(family.id);
    setRefreshing(false);
  }, [family, loadMembers]);

  const pendingMembers = members.filter((m) => m.status === "pending");
  const approvedMembers = members.filter((m) => m.status === "approved");
  const isAdmin = user?.role === "parent" || user?.role === "co-parent";
  const isCreator = user?.id === family?.createdBy;

  const handleApprove = useCallback(
    (memberId: string, memberName: string) => {
      Alert.alert(
        "Approve Member",
        `Approve ${memberName} to join the family?`,
        [
          {
            text: "Reject",
            style: "destructive",
            onPress: () => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Warning,
              );
              rejectMember(memberId);
            },
          },
          {
            text: "Approve",
            onPress: () => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              approveMember(memberId);
            },
          },
        ],
      );
    },
    [approveMember, rejectMember],
  );

  const familyId = family?.id;
  const handleSaveProfile = useCallback(
    async (name: string, photoUri?: string) => {
      await updateUser({ displayName: name, photoUri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [updateUser],
  );

  const handleEditSave = useCallback(
    async (name: string, photoUri?: string) => {
      if (!familyId) return;
      await updateFamily(familyId, { name, photoUri });
    },
    [familyId, updateFamily],
  );

  const tabs: {
    key: Tab;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    count?: number;
  }[] = [
    {
      key: "members",
      icon: "people-outline",
      label: "Members",
      count: approvedMembers.length,
    },
    ...(isAdmin
      ? [
          {
            key: "pending" as Tab,
            icon: "person-add-outline" as keyof typeof Ionicons.glyphMap,
            label: "Requests",
            count: pendingMembers.length,
          },
        ]
      : []),
    { key: "invite", icon: "qr-code-outline", label: "Invite" },
    { key: "locations", icon: "location-outline", label: "Locations" },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.familyIcon}>
            {family?.photoUri ? (
              <Image
                source={{ uri: family.photoUri }}
                style={styles.familyPhoto}
              />
            ) : (
              <Ionicons name="people" size={22} color={Colors.light.primary} />
            )}
          </View>
          <View>
            <View style={styles.familyNameRow}>
              <Text style={styles.familyName}>
                {family?.name || "No Family"}
              </Text>
              {isCreator && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowEdit(true);
                  }}
                  style={styles.editBtn}
                >
                  <Ionicons
                    name="pencil"
                    size={12}
                    color={Colors.light.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.familyMeta}>
              {approvedMembers.length} members
            </Text>
          </View>
        </View>
        {isAdmin && pendingMembers.length > 0 && (
          <TouchableOpacity
            style={styles.pendingBadge}
            onPress={() => setActiveTab("pending")}
          >
            <Text style={styles.pendingBadgeText}>{pendingMembers.length}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab.key);
              }}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={
                  isActive ? Colors.light.primary : Colors.light.textTertiary
                }
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && ` (${tab.count})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPadding}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* MEMBERS TAB */}
        {activeTab === "members" && (
          <>
            {approvedMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="people-outline"
                  size={48}
                  color={Colors.light.textTertiary}
                />
                <Text style={styles.emptyTitle}>No members yet</Text>
                <Text style={styles.emptyDesc}>
                  Invite family members to join your family group
                </Text>
                <TouchableOpacity
                  style={styles.emptyCta}
                  onPress={() => setActiveTab("invite")}
                >
                  <Ionicons name="qr-code-outline" size={18} color="#fff" />
                  <Text style={styles.emptyCtaText}>Invite Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.sectionLabel}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={Colors.light.primary}
                  />
                  <Text style={styles.sectionLabelText}>Admin</Text>
                </View>
                {approvedMembers
                  .filter((m) => m.role === "parent" || m.role === "co-parent")
                  .map((member) => {
                    const isMe = member.userId === user?.id;
                    const showPhoto = isMe && user?.photoUri;
                    return (
                      <View key={member.id}>
                        <View
                          style={[
                            styles.memberCard,
                            isMe && styles.memberCardSelf,
                          ]}
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={
                              isMe
                                ? () => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    setShowEditName(true);
                                  }
                                : undefined
                            }
                            style={styles.memberAvatarTouch}
                          >
                            <View
                              style={[
                                styles.memberAvatar,
                                {
                                  backgroundColor: showPhoto
                                    ? "transparent"
                                    : Colors.light.primary,
                                  overflow: "hidden",
                                },
                              ]}
                            >
                              {showPhoto ? (
                                <Image
                                  source={{ uri: user.photoUri }}
                                  style={styles.memberPhoto}
                                />
                              ) : (
                                <Text style={styles.memberAvatarText}>
                                  {member.displayName
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.memberInfo}
                            activeOpacity={isMe ? 0.7 : 1}
                            onPress={
                              isMe
                                ? () => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    setShowEditName(true);
                                  }
                                : undefined
                            }
                          >
                            <View style={styles.memberNameRow}>
                              <Text
                                style={[
                                  styles.memberName,
                                  isMe && { color: Colors.light.primary },
                                ]}
                              >
                                {member.displayName}
                              </Text>
                              <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>
                                  {member.role === "parent"
                                    ? "Admin"
                                    : "Co-Admin"}
                                </Text>
                              </View>
                              {isMe && <Text style={styles.youTag}>You</Text>}
                            </View>
                            {isMe && (
                              <Text style={styles.editHint}>
                                Tap to edit name & photo
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                        {isMe && (
                          <TouchableOpacity
                            style={styles.editProfileRow}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setShowEditName(true);
                            }}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={14}
                              color={Colors.light.primary}
                            />
                            <Text style={styles.editProfileRowText}>
                              Edit your profile
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}

                <View style={[styles.sectionLabel, { marginTop: 8 }]}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={Colors.light.secondary}
                  />
                  <Text style={styles.sectionLabelText}>Members</Text>
                </View>
                {approvedMembers
                  .filter((m) => m.role !== "parent" && m.role !== "co-parent")
                  .map((member) => {
                    const isMe = member.userId === user?.id;
                    const showPhoto = isMe && user?.photoUri;
                    return (
                      <View key={member.id}>
                        <View
                          style={[
                            styles.memberCard,
                            isMe && styles.memberCardSelf,
                          ]}
                        >
                          <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={
                              isMe
                                ? () => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    setShowEditName(true);
                                  }
                                : undefined
                            }
                            style={styles.memberAvatarTouch}
                          >
                            <View
                              style={[
                                styles.memberAvatar,
                                {
                                  backgroundColor: showPhoto
                                    ? "transparent"
                                    : Colors.light.secondary,
                                  overflow: "hidden",
                                },
                              ]}
                            >
                              {showPhoto ? (
                                <Image
                                  source={{ uri: user.photoUri }}
                                  style={styles.memberPhoto}
                                />
                              ) : (
                                <Text style={styles.memberAvatarText}>
                                  {member.displayName
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.memberInfo}
                            activeOpacity={isMe ? 0.7 : 1}
                            onPress={
                              isMe
                                ? () => {
                                    Haptics.impactAsync(
                                      Haptics.ImpactFeedbackStyle.Light,
                                    );
                                    setShowEditName(true);
                                  }
                                : undefined
                            }
                          >
                            <View style={styles.memberNameRow}>
                              <Text
                                style={[
                                  styles.memberName,
                                  isMe && { color: Colors.light.primary },
                                ]}
                              >
                                {member.displayName}
                              </Text>
                              {isMe && <Text style={styles.youTag}>You</Text>}
                            </View>
                            <Text style={styles.memberRole}>{member.role}</Text>
                            {isMe && (
                              <Text style={styles.editHint}>
                                Tap to edit name & photo
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                        {isMe && (
                          <TouchableOpacity
                            style={styles.editProfileRow}
                            onPress={() => {
                              Haptics.impactAsync(
                                Haptics.ImpactFeedbackStyle.Light,
                              );
                              setShowEditName(true);
                            }}
                          >
                            <Ionicons
                              name="pencil-outline"
                              size={14}
                              color={Colors.light.primary}
                            />
                            <Text style={styles.editProfileRowText}>
                              Edit your profile
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
              </>
            )}
          </>
        )}

        {/* PENDING TAB */}
        {activeTab === "pending" && (
          <>
            {pendingMembers.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={48}
                  color={Colors.light.success}
                />
                <Text style={styles.emptyTitle}>All clear</Text>
                <Text style={styles.emptyDesc}>
                  No pending membership requests
                </Text>
              </View>
            ) : (
              pendingMembers.map((member) => (
                <View key={member.id} style={styles.pendingCard}>
                  <View style={styles.pendingContent}>
                    <View
                      style={[
                        styles.memberAvatar,
                        { backgroundColor: Colors.light.warning },
                      ]}
                    >
                      <Text style={styles.memberAvatarText}>
                        {member.displayName?.charAt(0).toUpperCase() || "?"}
                      </Text>
                    </View>
                    <View style={styles.pendingInfo}>
                      <Text style={styles.pendingName}>
                        {member.displayName}
                      </Text>
                      <Text style={styles.pendingRole}>
                        Wants to join as{" "}
                        <Text style={{ fontWeight: "700" }}>{member.role}</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.pendingActions}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        rejectMember(member.id);
                      }}
                    >
                      <Ionicons
                        name="close-outline"
                        size={18}
                        color={Colors.light.danger}
                      />
                      <Text style={styles.rejectBtnText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() =>
                        handleApprove(member.id, member.displayName || "")
                      }
                    >
                      <Ionicons
                        name="checkmark-outline"
                        size={18}
                        color={Colors.light.success}
                      />
                      <Text style={styles.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* INVITE TAB */}
        {activeTab === "invite" && family && (
          <View style={styles.inviteSection}>
            <QRDisplay
              value={family.inviteCode}
              title="Invite Family Members"
              subtitle="Share this QR code or invite code with family members to join"
            />
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/qr-scan");
              }}
            >
              <Ionicons name="scan-outline" size={20} color="#fff" />
              <Text style={styles.scanBtnText}>Scan QR Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* LOCATIONS TAB */}
        {activeTab === "locations" && (
          <View style={styles.inviteSection}>
            <View style={styles.card}>
              <View style={styles.locCardContent}>
                <View style={styles.locIconBox}>
                  <Ionicons
                    name="location-outline"
                    size={28}
                    color={Colors.light.primary}
                  />
                </View>
                <Text style={styles.locTitle}>Family Locations</Text>
                <Text style={styles.locDesc}>
                  See where your family members are right now. Check in to share
                  your location.
                </Text>
                <TouchableOpacity
                  style={styles.locCta}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push("/family-locations");
                  }}
                >
                  <Ionicons name="compass-outline" size={18} color="#fff" />
                  <Text style={styles.locCtaText}>Open Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      <EditFamilyModal
        visible={showEdit}
        initialName={family?.name || ""}
        initialPhotoUri={family?.photoUri}
        onClose={() => setShowEdit(false)}
        onSave={handleEditSave}
      />
      <EditProfileModal
        visible={showEditName}
        initialName={user?.displayName || ""}
        initialPhotoUri={user?.photoUri}
        onClose={() => setShowEditName(false)}
        onSave={handleSaveProfile}
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerContent: { flexDirection: "row", alignItems: "center", gap: 12 },
  familyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  familyPhoto: { width: 44, height: 44, borderRadius: 22 },
  familyNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  familyName: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  editBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  familyMeta: { fontSize: 12, color: Colors.light.textTertiary, marginTop: 1 },
  pendingBadge: {
    backgroundColor: Colors.light.danger,
    borderRadius: 14,
    minWidth: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  pendingBadgeText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.light.backgroundElement,
    padding: 3,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textTertiary,
  },
  tabTextActive: { color: Colors.light.primary },
  content: { flex: 1 },
  contentPadding: { paddingHorizontal: 16, paddingTop: 16 },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionLabelText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.text,
  },
  emptyState: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: Colors.light.text },
  emptyDesc: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
    marginTop: 8,
  },
  emptyCtaText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  memberCardSelf: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  memberAvatarTouch: {
    marginRight: 12,
  },
  editNameBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  editHint: {
    fontSize: 11,
    color: Colors.light.primary,
    fontWeight: "500",
    marginTop: 2,
  },
  editProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.light.primaryLight,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    paddingVertical: 10,
    marginBottom: 8,
  },
  editProfileRowText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  memberPhoto: { width: 42, height: 42, borderRadius: 21 },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  memberAvatarText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  memberInfo: { flex: 1 },
  memberNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  memberName: { fontSize: 15, fontWeight: "700", color: Colors.light.text },
  roleBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.light.primary,
    textTransform: "uppercase",
  },
  youTag: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.textTertiary,
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  memberRole: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  pendingCard: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.warning + "30",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  pendingContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  pendingInfo: { flex: 1, marginLeft: 12 },
  pendingName: { fontSize: 15, fontWeight: "700", color: Colors.light.text },
  pendingRole: { fontSize: 13, color: Colors.light.textTertiary, marginTop: 2 },
  pendingActions: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.dangerLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  rejectBtnText: {
    color: Colors.light.danger,
    fontSize: 14,
    fontWeight: "600",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.successLight,
    paddingVertical: 10,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  approveBtnText: {
    color: Colors.light.success,
    fontSize: 14,
    fontWeight: "600",
  },
  inviteSection: { gap: 12 },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  scanBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  locCardContent: { alignItems: "center", gap: 12 },
  locIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  locTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  locDesc: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  locCta: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    marginTop: 4,
  },
  locCtaText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
