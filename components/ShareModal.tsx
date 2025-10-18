import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
} from 'react-native';
import { X, Send, Check } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Post, User } from '@/types';
import { chats } from '@/data/mockData';
import Colors from '@/constants/colors';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, NEUMORPHIC } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/services/api';

interface ShareModalProps {
  visible: boolean;
  post: Post;
  onClose: () => void;
  onShare: (userIds: string[], message?: string) => void;
}

export default function ShareModal({ visible, post, onClose, onShare }: ShareModalProps) {
  const { colors } = useTheme();
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleShare = async () => {
    if (selectedUsers.size > 0) {
      const ids = Array.from(selectedUsers);
      try {
        for (const userId of ids) {
          const conv = await api.createConversation({ participantIds: [userId] } as any);
          const convId = (conv as any)?.data?.id || `conv-${userId}`;
          await api.sendMessage({ conversationId: convId, content: message ? `${message}` : `Shared a post: ${post.id}`, type: 'text' } as any);
        }
        await api.createShare({ postId: post.id, type: 'message', content: message || '' });
      } catch {}
      onShare(ids, message);
      setSelectedUsers(new Set());
      setMessage('');
      setSearchQuery('');
      onClose();
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Share Post</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.postPreview, { backgroundColor: colors.card }] }>
            <Image source={{ uri: post.image }} style={[styles.postImage, { backgroundColor: colors.border }]} />
            <View style={styles.postInfo}>
              <Text style={[styles.postUser, { color: colors.tint }]}>@{post.user.username}</Text>
              <Text style={[styles.postCaption, { color: colors.text }]} numberOfLines={2}>
                {post.caption}
              </Text>
            </View>
          </View>

          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Search people..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
            {filteredChats.map(chat => (
              <TouchableOpacity
                key={chat.id}
                style={styles.userItem}
                onPress={() => handleToggleUser(chat.user.id)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: chat.user.avatar }} style={styles.avatar} />
                <View style={styles.userInfo}>
                  <Text style={[styles.username, { color: colors.text }]}>{chat.user.displayName}</Text>
                  <Text style={[styles.userHandle, { color: colors.icon }]}>@{chat.user.username}</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    selectedUsers.has(chat.user.id) && [styles.checkboxSelected, { backgroundColor: colors.tint, borderColor: colors.tint }],
                  ]}
                >
                  {selectedUsers.has(chat.user.id) && (
                    <Check size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedUsers.size > 0 && (
            <View style={styles.footer}>
              <TextInput
                style={[styles.messageInput, { backgroundColor: colors.card, color: colors.text }]}
                placeholder="Add a message (optional)"
                placeholderTextColor={colors.placeholder}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={200}
              />
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.light.gradient.start, Colors.light.gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shareButtonGradient}
                >
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.shareButtonText}>
                    Send to {selectedUsers.size} {selectedUsers.size === 1 ? 'person' : 'people'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postPreview: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: Colors.light.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.md,
    ...NEUMORPHIC.flat,
  },
  postImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: Colors.light.border,
  },
  postInfo: {
    flex: 1,
  },
  postUser: {
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.tint,
    marginBottom: SPACING.xs,
  },
  postCaption: {
    fontSize: FONT_SIZE.sm,
    color: Colors.light.text,
    lineHeight: 18,
  },
  searchInput: {
    backgroundColor: Colors.light.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    ...NEUMORPHIC.flat,
  },
  userList: {
    flex: 1,
    marginTop: SPACING.lg,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.text,
  },
  userHandle: {
    fontSize: FONT_SIZE.sm,
    color: Colors.light.icon,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  messageInput: {
    backgroundColor: Colors.light.card,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    marginBottom: SPACING.md,
    minHeight: 60,
    textAlignVertical: 'top',
    ...NEUMORPHIC.flat,
  },
  shareButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  shareButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
});
