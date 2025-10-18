import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, SHADOW } from '@/constants/theme';
import { ArrowLeft, Trash2, PlusCircle, SwitchCamera } from 'lucide-react-native';

export default function ManageAccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { accounts, addAccount, removeAccount, switchAccount } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setIsSubmitting(true);
    try {
      await addAccount(email, password);
      setEmail('');
      setPassword('');
      Alert.alert('Success', 'Account added');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to add account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitch = async (index: number) => {
    try {
      await switchAccount(index);
      Alert.alert('Switched', 'Account switched');
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Unable to switch account');
    }
  };

  const handleRemove = async (index: number) => {
    Alert.alert('Remove Account', 'Are you sure you want to remove this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try {
          await removeAccount(index);
        } catch (e: any) {
          Alert.alert('Error', e?.message || 'Unable to remove account');
        }
      } }
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Manage Accounts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Account</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Email"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
            placeholder="Password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.tint }]} onPress={handleAdd} disabled={isSubmitting} activeOpacity={0.8}>
            <PlusCircle size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Adding...' : 'Add Account'}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Accounts</Text>
          {accounts.length === 0 && (
            <Text style={{ color: colors.icon }}>No accounts saved. Add one above.</Text>
          )}
          {accounts.map((acc, index) => (
            <View key={acc.user.id || index} style={[styles.accountRow, { borderColor: colors.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{acc.user.displayName || acc.user.username}</Text>
                <Text style={{ color: colors.icon, marginTop: 2 }}>{acc.user.email}</Text>
              </View>
              <TouchableOpacity style={[styles.iconButton, { borderColor: colors.border }]} onPress={() => handleSwitch(index)} activeOpacity={0.7}>
                <SwitchCamera size={18} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { borderColor: colors.border }]} onPress={() => handleRemove(index)} activeOpacity={0.7}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    ...SHADOW.small,
  },
  sectionTitle: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, marginBottom: SPACING.md },
  input: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZE.md },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  iconButton: { padding: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, marginLeft: SPACING.xs },
});



