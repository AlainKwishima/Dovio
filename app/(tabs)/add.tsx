import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Video, FileText, Folder, Film } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, NEUMORPHIC } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

export default function AddScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to make this work!');
        return false;
      }
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to make this work!');
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/create-post',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/create-post',
          params: { imageUri: result.assets[0].uri },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordVideo = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/create-post',
          params: {
            mediaUri: result.assets[0].uri,
            mediaType: 'video'
          },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to record video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        videoMaxDuration: 60,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        router.push({
          pathname: '/create-post',
          params: {
            mediaUri: result.assets[0].uri,
            mediaType: 'video'
          },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseMixedMedia = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const mediaType = asset.type === 'video' ? 'video' : 'image';
        router.push({
          pathname: '/create-post',
          params: {
            mediaUri: asset.uri,
            mediaType
          },
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select media');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <Text style={[styles.title, { color: colors.text }]}>Create Post</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={[styles.option, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={handleTakePhoto} disabled={isLoading}>
          <View style={[styles.iconContainer, { backgroundColor: colors.gradient.start }]}>
            <Camera size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Take Photo</Text>
          <Text style={[styles.optionDescription, { color: colors.icon }]}>Capture a moment with your camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={handleChooseFromGallery} disabled={isLoading}>
          <View style={[styles.iconContainer, { backgroundColor: colors.gradient.end }]}>
            <ImageIcon size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Choose from Gallery</Text>
          <Text style={[styles.optionDescription, { color: colors.icon }]}>Select photos from your library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={handleRecordVideo} disabled={isLoading}>
          <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
            <Video size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Record Video</Text>
          <Text style={[styles.optionDescription, { color: colors.icon }]}>Record a video with your camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={handleChooseVideo} disabled={isLoading}>
          <View style={[styles.iconContainer, { backgroundColor: '#FF6B6B' }]}>
            <Film size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Choose Video</Text>
          <Text style={[styles.optionDescription, { color: colors.icon }]}>Select videos from your library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.option, { backgroundColor: colors.card }]} activeOpacity={0.7} onPress={handleChooseMixedMedia} disabled={isLoading}>
          <View style={[styles.iconContainer, { backgroundColor: '#4ECDC4' }]}>
            <Folder size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Choose Media</Text>
          <Text style={[styles.optionDescription, { color: colors.icon }]}>Select photos or videos from gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.option, { backgroundColor: colors.card }]}
          activeOpacity={0.7}
          onPress={() => router.push('/create-post')}
          disabled={isLoading}
        >
          <View style={[styles.iconContainer, { backgroundColor: colors.icon }]}>
            <FileText size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.optionTitle, { color: colors.text }]}>Write Article</Text>
          <Text style={[styles.optionDescription, { color: colors.icon }]}>Create a long-form article</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.lg,
  },
  option: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    ...NEUMORPHIC.flat,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  optionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    marginBottom: SPACING.xs,
  },
  optionDescription: {
    fontSize: FONT_SIZE.sm,
    textAlign: 'center',
  },
});
