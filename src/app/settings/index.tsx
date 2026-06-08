import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import EditProfileModal from '@/components/edit-profile-modal';
import { useUserStore } from '@/stores/userStore';
import { useFamilyStore } from '@/stores/familyStore';
import { AnimatedSection, AnimatedListItem } from '@/components/ui/animated-section';
import { Colors, BorderRadius } from '@/constants/theme';

const settingsSections = [
  {
    title: 'Profile',
    items: [
      { icon: 'person-outline' as const, label: 'Edit Name & Photo', desc: 'Update your display name and profile picture' },
    ],
  },
  {
    title: 'Security',
    items: [
      { icon: 'lock-closed-outline' as const, label: 'Change PIN', desc: 'Update your security PIN' },
      { icon: 'finger-print-outline' as const, label: 'Biometric Auth', desc: 'Fingerprint or Face ID' },
    ],
  },
  {
    title: 'About',
    items: [
      { icon: 'information-circle-outline' as const, label: 'App Version', desc: '1.0.0' },
    ],
  },
];

export default function SettingsScreen() {
  const { user, updateUser } = useUserStore();
  const { family } = useFamilyStore();
  const [showEditName, setShowEditName] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure? Your data is preserved locally.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => Alert.alert('Logged out') },
    ]);
  };

  const handleSaveProfile = useCallback(async (name: string, photoUri?: string) => {
    await updateUser({ displayName: name, photoUri });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [updateUser]);

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <AnimatedSection animation="fadeUp" delay={50}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>
              {user?.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.displayName}</Text>
          <Text style={styles.profileRole}>{user?.role}</Text>
          {family && (
            <View style={styles.familyBadge}>
              <Text style={styles.familyBadgeText}>{family.name}</Text>
            </View>
          )}
        </View>
      </AnimatedSection>

      {/* Settings Sections */}
      {settingsSections.map((section, si) => (
        <View key={si} style={styles.section}>
          <AnimatedSection animation="fadeUp" delay={100 + si * 50}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </AnimatedSection>
          {section.items.map((item, ii) => (
            <AnimatedListItem key={ii} index={ii + si * 10}>
              <TouchableOpacity style={styles.settingRow}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (item.label === 'Edit Name & Photo') setShowEditName(true);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.settingIconBox, { backgroundColor: Colors.light.primaryLight }]}>
                  <Ionicons name={item.icon} size={18} color={Colors.light.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  <Text style={styles.settingDesc}>{item.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.textTertiary} />
              </TouchableOpacity>
            </AnimatedListItem>
          ))}
        </View>
      ))}

      {/* Logout */}
      <AnimatedSection animation="fadeUp" delay={500}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.light.danger} />
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
      </AnimatedSection>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>FammyHQ v1.0.0</Text>
        <Text style={styles.footerText}>Made with love for families</Text>
      </View>

      <EditProfileModal
        visible={showEditName}
        initialName={user?.displayName || ''}
        initialPhotoUri={user?.photoUri}
        onClose={() => setShowEditName(false)}
        onSave={handleSaveProfile}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.backgroundCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  profileRole: {
    fontSize: 14,
    color: Colors.light.textTertiary,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  familyBadge: {
    backgroundColor: Colors.light.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  familyBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  section: {
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  settingDesc: {
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 18,
    color: Colors.light.textTertiary,
  },
  logoutBtn: {
    flexDirection: 'row',
    margin: 16,
    padding: 14,
    backgroundColor: Colors.light.dangerLight,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutBtnText: {
    color: Colors.light.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginBottom: 2,
  },
});
