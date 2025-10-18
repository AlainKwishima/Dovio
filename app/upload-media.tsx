import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Upload, Image as ImageIcon, Video, Music, Folder } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS } from '@/constants/theme';

export default function UploadMediaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your photos to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedMedia(result.assets[0]);
    }
  };

  const pickVideoFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need access to your videos to upload media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      setSelectedMedia(result.assets[0]);
    }
  };

  const handleContinue = () => {
    if (!selectedMedia) {
      Alert.alert('No Media Selected', 'Please select a photo or video to continue.');
      return;
    }

    // Navigate to create story screen with selected media
    router.push({
      pathname: '/create-story',
      params: { mediaUri: selectedMedia.uri, mediaType: selectedMedia.type }
    });
  };

  const mediaOptions = [
    {
      id: 'photo',
      title: 'Photo',
      subtitle: 'Select from gallery',
      icon: ImageIcon,
      color: colors.gradient.start,
      onPress: pickImageFromGallery,
    },
    {
      id: 'video',
      title: 'Video',
      subtitle: 'Select from gallery',
      icon: Video,
      color: '#FF6B6B',
      onPress: pickVideoFromGallery,
    },
    {
      id: 'files',
      title: 'Files',
      subtitle: 'Browse documents',
      icon: Folder,
      color: '#4ECDC4',
      onPress: () => Alert.alert('Coming Soon', 'File upload will be available soon!'),
    },
    {
      id: 'music',
      title: 'Audio',
      subtitle: 'Add music or sounds',
      icon: Music,
      color: '#45B7D1',
      onPress: () => Alert.alert('Coming Soon', 'Audio upload will be available soon!'),
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>Upload Media</Text>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.animatedContent,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Selected Media Preview */}
          {selectedMedia && (
            <View style={[styles.mediaPreview, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Selected Media</Text>
              <View style={styles.previewContainer}>
                {selectedMedia.type === 'image' ? (
                  <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.videoPreview, { backgroundColor: colors.background }]}>
                    <Video size={48} color={colors.icon} />
                    <Text style={[styles.videoText, { color: colors.icon }]}>Video Selected</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Upload Options */}
          <View style={styles.optionsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Media Type</Text>
            
            <View style={styles.optionsGrid}>
              {mediaOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionCard, { backgroundColor: colors.card }]}
                  activeOpacity={0.8}
                  onPress={option.onPress}
                >
                  <LinearGradient
                    colors={[`${option.color}20`, `${option.color}10`]}
                    style={styles.optionIconContainer}
                  >
                    <option.icon size={32} color={option.color} strokeWidth={2} />
                  </LinearGradient>
                  
                  <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.optionSubtitle, { color: colors.icon }]}>
                    {option.subtitle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Upload Guidelines */}
          <View style={[styles.guidelinesSection, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upload Guidelines</Text>
            
            <View style={styles.guideline}>
              <View style={[styles.guidelineDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.guidelineText, { color: colors.icon }]}>
                Maximum file size: 100MB
              </Text>
            </View>
            
            <View style={styles.guideline}>
              <View style={[styles.guidelineDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.guidelineText, { color: colors.icon }]}>
                Supported formats: JPG, PNG, MP4, MOV
              </Text>
            </View>
            
            <View style={styles.guideline}>
              <View style={[styles.guidelineDot, { backgroundColor: colors.tint }]} />
              <Text style={[styles.guidelineText, { color: colors.icon }]}>
                Recommended aspect ratio: 9:16 (vertical)
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Continue Button */}
      {selectedMedia && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.gradient.start, colors.gradient.end]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueGradient}
            >
              <Upload size={20} color="white" strokeWidth={2} />
              <Text style={styles.continueText}>Continue with Selected Media</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  animatedContent: {
    paddingHorizontal: 16,
  },
  mediaPreview: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 16,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 300,
    borderRadius: 12,
  },
  videoPreview: {
    width: 200,
    height: 300,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    marginTop: 8,
    fontSize: FONT_SIZE.sm,
    fontWeight: FONT_WEIGHT.medium,
  },
  optionsSection: {
    marginBottom: 24,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
  guidelinesSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  guideline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  guidelineText: {
    fontSize: FONT_SIZE.sm,
    flex: 1,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  continueButton: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  continueText: {
    color: 'white',
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
  },
});