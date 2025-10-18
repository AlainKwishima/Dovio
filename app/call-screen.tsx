import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Phone, Video, Mic, MicOff, VideoOff, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { users } from '@/data/mockData';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';

type CallType = 'audio' | 'video';

export default function CallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, type } = useLocalSearchParams<{ userId: string; type: CallType }>();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const pulseAnim = new Animated.Value(1);

  const user = users.find(u => u.id === userId) || users[0];
  const isVideoCall = type === 'video';

  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callStatus === 'connected') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [callStatus]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      router.back();
    }, 500);
  };

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d']}
      style={styles.container}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={styles.callType}>{isVideoCall ? 'Video Call' : 'Voice Call'}</Text>
        <Text style={styles.duration}>
          {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
        </Text>
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
        </Animated.View>
        
        <Text style={styles.username}>{user.displayName}</Text>
        <Text style={styles.status}>
          {callStatus === 'connecting' ? 'Calling...' : callStatus === 'connected' ? 'Connected' : 'Call Ended'}
        </Text>

        {isVideoCall && callStatus === 'connected' && (
          <View style={styles.localVideo}>
            <Image source={{ uri: user.avatar }} style={styles.localVideoImage} />
          </View>
        )}
      </View>

      <View style={[styles.controls, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.7}
        >
          {isMuted ? (
            <MicOff size={28} color="#FFFFFF" />
          ) : (
            <Mic size={28} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
            onPress={() => setIsVideoOff(!isVideoOff)}
            activeOpacity={0.7}
          >
            {isVideoOff ? (
              <VideoOff size={28} color="#FFFFFF" />
            ) : (
              <Video size={28} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
          activeOpacity={0.7}
        >
          <X size={32} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  callType: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: SPACING.xs,
  },
  duration: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    marginBottom: SPACING.xl,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  username: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
    marginBottom: SPACING.sm,
  },
  status: {
    fontSize: FONT_SIZE.lg,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  localVideo: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.lg,
    width: 120,
    height: 160,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  localVideoImage: {
    width: '100%',
    height: '100%',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.xl,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255, 122, 61, 0.8)',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
