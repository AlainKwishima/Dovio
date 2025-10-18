import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Smile, Paperclip, Phone, Video, Check, CheckCheck, Mic, StopCircle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import { transcribeAudio } from '@/lib/transcription';
import { useWallet } from '@/contexts/WalletContext';
import { Message } from '@/types';
import EmojiPicker from '@/components/EmojiPicker';
import Toast, { ToastType } from '@/components/Toast';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';
import { chats as mockChats, chatMessages as mockChatMessages } from '@/data/mockData';

export default function ChatRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { addEarnings } = useWallet();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const typingDots = useRef(new Animated.Value(0)).current;
  
  const [chat, setChat] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const convRes = await api.getConversation(String(chatId));
        if (mounted && convRes?.success && convRes.data) {
          const raw = convRes.data as any[];
          const msgs: Message[] = (raw || []).map((m: any) => ({
            id: m.id,
            senderId: m.senderId || m.sender?.id || m.userId || 'other',
            text: m.text || m.content || '',
            timestamp: m.timestamp || m.createdAt || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            isRead: !!m.isRead,
          }));
          setMessages(msgs);
        }
        // derive minimal chat header data
        const participantsRes = await api.getConversations();
        let found: any = participantsRes?.data?.find((c: any) => String(c.id || c.conversationId) === String(chatId));
        if (!found) {
          found = (mockChats as any[]).find((c: any) => String(c.id) === String(chatId));
        }
        if (!found) {
          // create a basic header from first available mock
          const fallback = (mockChats as any[])[0];
          found = fallback;
          if (!convRes?.data || (convRes.data as any[]).length === 0) {
            const m = (mockChatMessages as any)[String(fallback?.id)] || [];
            const msgs: Message[] = (m || []).map((mm: any) => ({
              id: mm.id,
              senderId: mm.senderId || mm.sender?.id || 'other',
              text: mm.text,
              timestamp: mm.timestamp || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              isRead: !!mm.isRead,
            }));
            setMessages(msgs);
          }
        }
        if (mounted) setChat(found || null);
      } catch {
        // Hard fallback entirely to mock
        const fallback = (mockChats as any[]).find((c: any) => String(c.id) === String(chatId)) || (mockChats as any[])[0];
        setChat(fallback || null);
        const m = (mockChatMessages as any)[String(fallback?.id)] || [];
        const msgs: Message[] = (m || []).map((mm: any) => ({
          id: mm.id,
          senderId: mm.senderId || mm.sender?.id || 'other',
          text: mm.text,
          timestamp: mm.timestamp || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isRead: !!mm.isRead,
        }));
        setMessages(msgs);
      }
    })();
    return () => { mounted = false; };
  }, [chatId]);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(typingDots, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(typingDots, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isTyping]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      senderId: 'current-user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isRead: false,
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const payload = { conversationId: chatId as string, content: message.trim(), type: 'text' } as any;
      const sendRes = await api.sendMessage(payload);
      if (sendRes.success && sendRes.data) {
        const real = sendRes.data as any;
        const ui: Message = {
          id: real.id,
          senderId: real.senderId || real.sender?.id || 'current-user',
          text: real.text || real.content || message.trim(),
          timestamp: real.timestamp || real.createdAt || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          isRead: true,
        } as any;
        setMessages(prev => prev.map(m => m.id === tempId ? ui : m));
      } else {
        throw new Error('send failed');
      }
    } catch {
      // Keep the message locally even if network fails
      const localFinal: Message = {
        id: `local-${Date.now()}`,
        senderId: 'current-user',
        text: newMessage.text,
        timestamp: newMessage.timestamp,
        isRead: true,
      } as any;
      setMessages(prev => prev.map(m => m.id === tempId ? localFinal : m));
      // Do not show error toast to avoid confusing the user in hybrid mode
    }
  };

  const handleMic = async () => {
    if (Platform.OS === 'web') {
      setListening(true);
      try {
        const text = await transcribeAudio({});
        if (text) setMessage(prev => (prev ? prev + ' ' : '') + text);
      } catch (e) {
        showToast('Transcription error', 'error');
      } finally {
        setListening(false);
      }
    } else {
      showToast('Voice transcription available on web or via server upload', 'info');
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        showToast('Image attachment coming soon!', 'info');
      }
    } catch {
      showToast('Failed to pick image', 'error');
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const showToast = (message: string, type: ToastType) => {
    setToast({ visible: true, message, type });
  };

  const handleTextChange = (text: string) => {
    setMessage(text);
    
    if (text.length > 0 && !isTyping) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  if (!chat) {
    // Show a lightweight skeleton header with basic fallback
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>Chat</Text>
            <Text style={styles.status}>Loading…</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => chat?.user?.id && router.push({ pathname: '/story-viewer', params: { userId: chat.user.id } })} activeOpacity={0.8}>
          <Image source={{ uri: (chat?.user?.avatar) || 'https://i.pravatar.cc/100?img=13' }} style={styles.avatar} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{chat?.user?.username || 'User'}</Text>
            {chat?.user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓</Text>
              </View>
            )}
          </View>
          {chat?.user?.id && (
            <TouchableOpacity onPress={() => router.push({ pathname: '/story-viewer', params: { userId: chat.user.id } })} activeOpacity={0.8}>
              <Text style={styles.status}>View stories</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => showToast('Voice call coming soon!', 'info')}>
          <Phone size={22} color={Colors.light.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={() => showToast('Video call coming soon!', 'info')}>
          <Video size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === 'current-user';
          const showTimestamp = index === 0 || messages[index - 1].timestamp !== msg.timestamp;

          return (
            <View key={msg.id}>
              {showTimestamp && (
                <Text style={styles.timestampText}>{msg.timestamp}</Text>
              )}
              <View
                style={[
                  styles.messageBubble,
                  isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    isCurrentUser ? styles.currentUserText : styles.otherUserText,
                  ]}
                >
                  {msg.text}
                </Text>
                {isCurrentUser && (
                  <View style={styles.messageStatus}>
                    {msg.isRead ? (
                      <CheckCheck size={14} color="rgba(255, 255, 255, 0.7)" />
                    ) : (
                      <Check size={14} color="rgba(255, 255, 255, 0.7)" />
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
        
        {isTyping && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingBubble}>
              <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
              <Animated.View style={[styles.typingDot, { opacity: typingDots }]} />
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <TouchableOpacity style={styles.attachButton} onPress={handleImagePick} activeOpacity={0.7}>
          <Paperclip size={24} color={Colors.light.icon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.emojiButton} onPress={() => setShowEmojiPicker(true)} activeOpacity={0.7}>
          <Smile size={24} color={Colors.light.icon} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor={Colors.light.placeholder}
          value={message}
          onChangeText={handleTextChange}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.iconInline}
          onPress={handleMic}
          activeOpacity={0.7}
          accessibilityLabel={listening ? 'Stop' : 'Transcribe voice'}
        >
          {listening ? <StopCircle size={24} color={Colors.light.tint} /> : <Mic size={24} color={Colors.light.icon} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!message.trim()}
          activeOpacity={0.7}
        >
          <Send size={20} color={message.trim() ? Colors.light.tint : Colors.light.icon} />
        </TouchableOpacity>
      </View>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onEmojiSelect={handleEmojiSelect}
      />
    </KeyboardAvoidingView>
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
    paddingBottom: SPACING.md,
    backgroundColor: Colors.light.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: SPACING.sm,
  },
  backButton: {
    marginRight: SPACING.xs,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: Colors.light.text,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: FONT_WEIGHT.bold,
  },
  status: {
    fontSize: FONT_SIZE.xs,
    color: Colors.light.icon,
    marginTop: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: SPACING.lg,
  },
  timestampText: {
    fontSize: FONT_SIZE.xs,
    color: Colors.light.icon,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  currentUserBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.light.tint,
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: FONT_SIZE.md,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: Colors.light.text,
  },
  messageStatus: {
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.icon,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    backgroundColor: Colors.light.card,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: SPACING.xs,
  },
  attachButton: {
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  emojiButton: {
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: FONT_SIZE.md,
    color: Colors.light.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  iconInline: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  sendButton: {
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
