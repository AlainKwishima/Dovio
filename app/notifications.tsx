import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react-native';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';
import api from '@/services/api';
import { useTheme } from '@/contexts/ThemeContext';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [notificationList, setNotificationList] = useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.getNotifications({ page: 1, limit: 50 });
        if (mounted && res.success && res.data) {
          setNotificationList(res.data.data || []);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const getIcon = (type: string) => {
    const iconSize = 20;
    const iconColor = colors.tint;

    switch (type) {
      case 'like':
        return <Heart size={iconSize} color={iconColor} fill={iconColor} />;
      case 'comment':
        return <MessageCircle size={iconSize} color={iconColor} />;
      case 'follow':
        return <UserPlus size={iconSize} color={iconColor} />;
      case 'mention':
        return <AtSign size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  const markAllAsRead = () => {
    setNotificationList(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const groupedNotifications = notificationList.reduce((acc, notif) => {
    const key = notif.isRead ? 'read' : 'unread';
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {} as Record<string, typeof notifications>);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllAsRead}
          activeOpacity={0.7}
        >
          <Text style={[styles.markAllText, { color: colors.tint }]}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groupedNotifications.unread && groupedNotifications.unread.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>New</Text>
            {groupedNotifications.unread.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notificationItem, { backgroundColor: colors.card }, !notif.isRead && { backgroundColor: `${colors.tint}08` }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (notif.post) {
                    router.push('/post-detail');
                  }
                }}
              >
                <Image source={{ uri: notif.user?.avatar }} style={styles.avatar} />
                <View style={[styles.iconBadge, { backgroundColor: colors.card, borderColor: colors.background }]}>{getIcon(notif.type)}</View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationText, { color: colors.text }]}>
                    <Text style={styles.username}>{notif.user?.username || 'User'}</Text>
                    {' '}
                    {notif.text || notif.message}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.icon }]}>{notif.timestamp || ''}</Text>
                </View>
                {notif.post && (
                  <Image source={{ uri: notif.post.image }} style={[styles.postThumbnail, { backgroundColor: colors.border }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {groupedNotifications.read && groupedNotifications.read.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Earlier</Text>
            {groupedNotifications.read.map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notificationItem, { backgroundColor: colors.card }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (notif.post) {
                    router.push('/post-detail');
                  }
                }}
              >
                <Image source={{ uri: notif.user?.avatar }} style={styles.avatar} />
                <View style={[styles.iconBadge, { backgroundColor: colors.card, borderColor: colors.background }]}>{getIcon(notif.type)}</View>
                <View style={styles.notificationContent}>
                  <Text style={[styles.notificationText, { color: colors.text }]}>
                    <Text style={styles.username}>{notif.user?.username || 'User'}</Text>
                    {' '}
                    {notif.text || notif.message}
                  </Text>
                  <Text style={[styles.timestamp, { color: colors.icon }]}>{notif.timestamp || ''}</Text>
                </View>
                {notif.post && (
                  <Image source={{ uri: notif.post.image }} style={[styles.postThumbnail, { backgroundColor: colors.border }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  title: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
  },
  markAllButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  markAllText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.tint,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: Colors.light.card,
    marginBottom: 1,
  },
  unreadItem: {
    backgroundColor: '#FFF5F0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.md,
  },
  iconBadge: {
    position: 'absolute',
    left: SPACING.lg + 32,
    top: SPACING.md + 28,
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.light.background,
  },
  notificationContent: {
    flex: 1,
    marginRight: SPACING.md,
  },
  notificationText: {
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  username: {
    fontWeight: FONT_WEIGHT.bold,
  },
  timestamp: {
    fontSize: FONT_SIZE.xs,
    color: Colors.light.icon,
  },
  postThumbnail: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: Colors.light.border,
  },
  bottomSpacer: {
    height: SPACING.xxl,
  },
});
