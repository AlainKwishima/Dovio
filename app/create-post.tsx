import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, X, FileText, Image as ImageIcon, Play, Upload } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZE, FONT_WEIGHT, BORDER_RADIUS, NEUMORPHIC } from '@/constants/theme';

type PostType = 'post' | 'article';

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ imageUri?: string; mediaUri?: string; mediaType?: string }>();
  const { user } = useAuth();
  const { addEarnings } = useWallet();
  const { colors } = useTheme();

  const [postType, setPostType] = useState<PostType>('post');
  const [imageUri, setImageUri] = useState<string | undefined>(params.imageUri || params.mediaUri);
  const [mediaType, setMediaType] = useState<'image' | 'video'>((params.mediaType as 'image' | 'video') || 'image');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.85,
      videoMaxDuration: 60,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const handlePost = async () => {
    // Check authentication first
    if (!api.isAuthenticated()) {
      Alert.alert('Authentication Required', 'Please log in to create posts. You will be redirected to the login screen.', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);
      return;
    }

    if (postType === 'post' && !imageUri) {
      Alert.alert('Error', 'Please select media for your post');
      return;
    }

    if (postType === 'post' && !caption.trim()) {
      Alert.alert('Error', 'Please add a caption');
      return;
    }

    if (postType === 'article' && !title.trim()) {
      Alert.alert('Error', 'Please add a title for your article');
      return;
    }

    if (postType === 'article' && !content.trim()) {
      Alert.alert('Error', 'Please add content for your article');
      return;
    }

    setIsPosting(true);
    try {
      let mediaUrl: string | undefined;
      if (imageUri) {
        console.log('Uploading file:', { uri: imageUri, mediaType });
        const file: any = { uri: imageUri, name: `upload-${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`, type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' };
        const res = await api.uploadFile(file);
        console.log('Upload response:', res);
        mediaUrl = (res as any)?.data?.url || (res as any)?.url;
      }

      const media = mediaUrl ? [{ id: `m-${Date.now()}`, type: mediaType, url: mediaUrl, size: 0 } as any] : [];
      const postData = {
        content: postType === 'article' ? (content || caption) : caption,
        type: postType,
        media,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        visibility: 'public',
      };
      console.log('Creating post with data:', postData);
      const created = await api.createPost(postData);
      console.log('Create post response:', created);
      
      if (created.success) {
        await addEarnings(15.0, 'post', `New ${postType} created`);
        Alert.alert(
          '🎉 Success!', 
          `Your ${postType} has been published successfully!\n\nIt will now appear in your gallery and feed.`, 
          [{ text: 'Awesome!', onPress: () => router.back() }]
        );
      } else {
        throw new Error(created.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Post creation error:', error);
      Alert.alert('Error', `Failed to create post: ${error.message || 'Please try again.'}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md, backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Create {postType === 'post' ? 'Post' : 'Article'}</Text>
        <TouchableOpacity
          style={styles.postButton}
          onPress={handlePost}
          disabled={isPosting}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.gradient.start, colors.gradient.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.postButtonGradient}
          >
            <Text style={styles.postButtonText}>
              {isPosting ? 'Posting...' : 'Post'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, postType === 'post' && { backgroundColor: colors.tint }]}
          onPress={() => setPostType('post')}
          activeOpacity={0.7}
        >
          <ImageIcon
            size={20}
            color={postType === 'post' ? '#FFFFFF' : colors.icon}
          />
          <Text
            style={[
              styles.typeButtonText,
              { color: postType === 'post' ? '#FFFFFF' : colors.icon },
            ]}
          >
            Post
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, postType === 'article' && { backgroundColor: colors.tint }]}
          onPress={() => setPostType('article')}
          activeOpacity={0.7}
        >
          <FileText
            size={20}
            color={postType === 'article' ? '#FFFFFF' : colors.icon}
          />
          <Text
            style={[
              styles.typeButtonText,
              { color: postType === 'article' ? '#FFFFFF' : colors.icon },
            ]}
          >
            Article
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <Image source={{ uri: user?.avatar }} style={styles.avatar} />
            <View>
              <Text style={[styles.username, { color: colors.text }]}>{user?.displayName}</Text>
              <Text style={[styles.userHandle, { color: colors.icon }]}>@{user?.username}</Text>
            </View>
          </View>

          {postType === 'post' ? (
            <>
              {imageUri && (
                <View style={styles.imageContainer}>
                  {mediaType === 'video' ? (
                    <View style={styles.videoContainer}>
                      <Video
                        source={{ uri: imageUri }}
                        style={styles.postImage}
                        useNativeControls
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                      />
                      <View style={styles.playIconOverlay}>
                        <Play size={48} color="rgba(255, 255, 255, 0.8)" fill="rgba(255, 255, 255, 0.8)" />
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: imageUri }} style={styles.postImage} />
                  )}
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUri(undefined)}
                    activeOpacity={0.7}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={[styles.captionInput, { color: colors.text, backgroundColor: colors.card }]}
                placeholder="Write a caption..."
                placeholderTextColor={colors.placeholder}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
              />

              {!imageUri && (
                <TouchableOpacity style={[styles.typeButton, { backgroundColor: colors.card }]} onPress={pickMedia} activeOpacity={0.7}>
                  <Upload size={20} color={colors.icon} />
                  <Text style={[styles.typeButtonText, { color: colors.text }]}>Add Photo/Video</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.charCount, { color: colors.icon }]}>{caption.length}/2200</Text>
            </>
          ) : (
            <>
              <TextInput
                style={[styles.titleInput, { color: colors.text, backgroundColor: colors.card }]}
                placeholder="Article Title"
                placeholderTextColor={colors.placeholder}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />

              <TextInput
                style={[styles.captionInput, { color: colors.text, backgroundColor: colors.card }]}
                placeholder="Short description (optional)"
                placeholderTextColor={colors.placeholder}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={200}
              />

              <TextInput
                style={[styles.contentInput, { color: colors.text, backgroundColor: colors.card }]}
                placeholder="Write your article content here..."
                placeholderTextColor={colors.placeholder}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
              />

              <TextInput
                style={[styles.tagsInput, { color: colors.text, backgroundColor: colors.card }]}
                placeholder="Tags (comma separated)"
                placeholderTextColor={colors.placeholder}
                value={tags}
                onChangeText={setTags}
              />

              {!imageUri && (
                <TouchableOpacity style={[styles.typeButton, { backgroundColor: colors.card, marginTop: SPACING.md }]} onPress={pickMedia} activeOpacity={0.7}>
                  <Upload size={20} color={colors.icon} />
                  <Text style={[styles.typeButtonText, { color: colors.text }]}>Attach Photo/Video</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    flex: 1,
    textAlign: 'center',
  },
  postButton: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  postButtonGradient: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  postButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.bold,
    color: '#FFFFFF',
  },
  typeSelector: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: '#F0F0F0',
    borderRadius: BORDER_RADIUS.lg,
    ...NEUMORPHIC.flat,
  },
  typeButtonText: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
  },
  username: {
    fontSize: FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.semibold,
  },
  userHandle: {
    fontSize: FONT_SIZE.sm,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  postImage: {
    width: '100%',
    height: 400,
    borderRadius: BORDER_RADIUS.xl,
  },
  removeImageButton: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  videoContainer: {
    position: 'relative',
    width: '100%',
    height: 400,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  playIconOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    zIndex: 5,
  },
  titleInput: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...NEUMORPHIC.flat,
  },
  captionInput: {
    fontSize: FONT_SIZE.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 120,
    textAlignVertical: 'top',
    ...NEUMORPHIC.flat,
  },
  contentInput: {
    fontSize: FONT_SIZE.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    minHeight: 300,
    marginTop: SPACING.md,
    ...NEUMORPHIC.flat,
  },
  tagsInput: {
    fontSize: FONT_SIZE.sm,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    ...NEUMORPHIC.flat,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  bottomSpacer: {
    height: SPACING.xxxl,
  },
});
