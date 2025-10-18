import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Wallet as WalletIcon, TrendingUp, ArrowUpRight, MessageCircle, Heart, Share2, Users } from 'lucide-react-native';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, NEUMORPHIC } from '@/constants/theme';

const getSourceIcon = (source: string, tintColor: string) => {
  switch (source) {
    case 'chat':
      return <MessageCircle size={16} color={tintColor} />;
    case 'post':
      return <Share2 size={16} color={tintColor} />;
    case 'like':
      return <Heart size={16} color={tintColor} />;
    case 'comment':
      return <MessageCircle size={16} color={tintColor} />;
    case 'referral':
      return <Users size={16} color={tintColor} />;
    default:
      return <WalletIcon size={16} color={tintColor} />;
  }
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { balance, totalEarned, transactions, isLoading } = useWallet();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={[styles.title, { color: colors.text }]}>Wallet</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.balanceCard}>
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <WalletIcon size={32} color="#FFFFFF" />
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>${balance.toFixed(2)}</Text>
            <View style={styles.earnedRow}>
              <TrendingUp size={16} color="#FFFFFF" />
              <Text style={styles.earnedText}>Total Earned: ${totalEarned.toFixed(2)}</Text>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity style={[styles.withdrawButton, { backgroundColor: colors.text }]} activeOpacity={0.8}>
          <ArrowUpRight size={20} color="#FFFFFF" />
          <Text style={styles.withdrawText}>Withdraw</Text>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
          {transactions.map((transaction) => (
            <View key={transaction.id} style={[styles.transactionItem, { backgroundColor: colors.card }]}>
              <View style={[styles.transactionIcon, { backgroundColor: `${colors.tint}15` }]}>
                {getSourceIcon(transaction.source, colors.tint)}
              </View>
              <View style={styles.transactionContent}>
                <Text style={[styles.transactionDescription, { color: colors.text }]}>{transaction.description}</Text>
                <Text style={[styles.transactionTimestamp, { color: colors.icon }]}>{transaction.timestamp}</Text>
              </View>
              <Text style={styles.transactionAmount}>+${transaction.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>How to Earn More?</Text>
          <View style={styles.infoItem}>
            <MessageCircle size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.icon }]}>Chat with friends and earn per message</Text>
          </View>
          <View style={styles.infoItem}>
            <Share2 size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.icon }]}>Create engaging posts and get bonuses</Text>
          </View>
          <View style={styles.infoItem}>
            <Heart size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.icon }]}>Receive likes and comments on your content</Text>
          </View>
          <View style={styles.infoItem}>
            <Users size={20} color={colors.tint} />
            <Text style={[styles.infoText, { color: colors.icon }]}>Invite friends and earn referral bonuses</Text>
          </View>
        </View>

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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
  },
  scrollView: {
    flex: 1,
  },
  balanceCard: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    ...NEUMORPHIC.raised,
  },
  balanceGradient: {
    padding: SPACING.xl,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.md,
  },
  earnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  earnedText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
    ...NEUMORPHIC.raised,
  },
  withdrawText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  comingSoonText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: FONT_WEIGHT.semibold,
    color: '#FFFFFF',
  },
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
    ...NEUMORPHIC.flat,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
    marginBottom: 2,
  },
  transactionTimestamp: {
    fontSize: FONT_SIZE.xs,
  },
  transactionAmount: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#10B981',
  },
  infoCard: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    ...NEUMORPHIC.flat,
  },
  infoTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.md,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
