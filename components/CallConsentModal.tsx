import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';
import Colors from '@/constants/colors';

interface CallConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  callType: 'audio' | 'video';
}

export default function CallConsentModal({ visible, onAccept, onDecline, callType }: CallConsentModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <AlertCircle size={48} color={Colors.light.tint} />
          </View>

          <Text style={styles.title}>Call Recording Consent</Text>
          
          <Text style={styles.description}>
            This {callType} call may be recorded for quality and training purposes. 
            By accepting, you give consent to the recording and storage of this call.
          </Text>

          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              • Recordings are stored securely{'\n'}
              • Both parties will see a REC indicator{'\n'}
              • You can request deletion of recordings{'\n'}
              • See our Privacy Policy for details
            </Text>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.light.gradient.start, Colors.light.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptGradient}
              >
                <Text style={styles.acceptText}>Accept & Continue</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZE.md,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  notice: {
    backgroundColor: Colors.light.background,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  noticeText: {
    fontSize: FONT_SIZE.sm,
    color: Colors.light.text,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  declineButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  declineText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: Colors.light.text,
  },
  acceptButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  acceptGradient: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  acceptText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
});
