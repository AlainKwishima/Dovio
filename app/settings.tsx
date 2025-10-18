import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  Eye,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';
import api from '@/services/api';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { mode, scheme, colors, setMode, toggle } = useTheme();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [useDemoContent, setUseDemoContent] = useState(api.getMockMode());

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } finally {
              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md }}>
          <Text style={{ color: colors.text, opacity: 0.8, marginBottom: 8, fontWeight: FONT_WEIGHT.bold }}>Appearance</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 12, padding: 12, gap: 12, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: colors.text }}>Use Dark Mode</Text>
              <Switch value={scheme === 'dark'} onValueChange={toggle} trackColor={{ true: colors.tint, false: colors.border }} thumbColor={scheme === 'dark' ? '#fff' : '#fff'} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['system','light','dark'] as const).map((m) => (
                <TouchableOpacity key={m} onPress={() => setMode(m)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: mode === m ? colors.tint : colors.border, backgroundColor: mode === m ? colors.tint : 'transparent' }}>
                  <Text style={{ color: mode === m ? '#fff' : colors.text, fontWeight: FONT_WEIGHT.semibold }}>{m[0].toUpperCase() + m.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Account</Text>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={() => router.push('/edit-profile')}>
            <View style={styles.settingLeft}>
              <User size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
          {/* Account switcher */}
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={() => router.push('/manage-accounts')}>
            <View style={styles.settingLeft}>
              <User size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Switch Account</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Lock size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Change Password</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Content</Text>
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0 }]}>
            <View style={styles.settingLeft}>
              <Text style={[styles.settingText, { color: colors.text }]}>Use Demo Content</Text>
            </View>
            <Switch
              value={useDemoContent}
              onValueChange={(v) => { setUseDemoContent(v); api.setMockMode(v); }}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Notifications</Text>
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0 }] }>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={[styles.settingItem, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 0 }] }>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Privacy</Text>
          <View style={[styles.settingItem, { backgroundColor: colors.card }]}>
            <View style={styles.settingLeft}>
              <Eye size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Private Account</Text>
            </View>
            <Switch
              value={privateAccount}
              onValueChange={setPrivateAccount}
              trackColor={{ false: colors.border, true: colors.tint }}
              thumbColor="#FFFFFF"
            />
          </View>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Lock size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Blocked Accounts</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.icon }]}>Support</Text>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <HelpCircle size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>Help Center</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.card }]} activeOpacity={0.7}>
            <View style={styles.settingLeft}>
              <Info size={20} color={colors.icon} />
              <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
            </View>
            <ChevronRight size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    textTransform: 'uppercase',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginBottom: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  settingText: {
    fontSize: FONT_SIZE.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  logoutText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#EF4444',
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
