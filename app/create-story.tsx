import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions, CameraMode as ExpoCameraMode } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import {
  X,
  Download,
  RotateCcw,
  Zap,
  Camera,
  Image as ImageIcon,
  Video as VideoIcon,
  Smile,
  Type,
  Palette
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import type { MediaFile } from '@/types/api';

const { width, height } = Dimensions.get('window');
const STORY_HEIGHT = height;
const STORY_WIDTH = width;

type StoryMode = 'camera' | 'preview' | 'gallery';
type CameraMode = 'picture' | 'video';

export default function CreateStory() {
  const [mode, setMode] = useState<StoryMode>('camera');
  const [cameraMode, setCameraMode] = useState<CameraMode>('picture');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isRecording, setIsRecording] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const params = useLocalSearchParams<{ mediaUri?: string; mediaType?: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const recordingAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(0)).current;
  
  const cameraRef = useRef<CameraView>(null);

  // Initialize animations and auto-open camera
  useEffect(() => {
    const initializeScreen = async () => {
      // If we're opening with a pre-selected media (from gallery), skip camera permission
      const fromParams = typeof params?.mediaUri === 'string' && params.mediaUri.length > 0;

      // Request camera permissions only when using the camera
      if (!fromParams && !permission?.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            'Camera Permission Required',
            'Please allow camera access to create stories.',
            [
              { text: 'Cancel', onPress: () => router.back() },
              { text: 'Settings', onPress: () => requestPermission() }
            ]
          );
          return;
        }
      }

      // If media provided via params, jump to preview
      if (fromParams) {
        setMediaUri(params.mediaUri as string);
        const t = (params.mediaType as string) === 'video' ? 'video' : 'image';
        setMediaType(t as any);
        setMode('preview');
      }

      // Animate entry
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    };

    initializeScreen();

    // Hide status bar for fullscreen experience
    StatusBar.setHidden(true);
    
    return () => {
      StatusBar.setHidden(false);
    };
  }, [params?.mediaUri, params?.mediaType]);

  // Recording animation
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          })
        ])
      ).start();
    } else {
      recordingAnim.setValue(1);
    }
  }, [isRecording]);

  const triggerFlash = () => {
    Animated.sequence([
      Animated.timing(flashAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(flashAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      if (cameraMode === 'picture') {
        triggerFlash();
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        if (photo) {
          setMediaUri(photo.uri);
          setMediaType('image');
          setMode('preview');
        }
      } else {
        if (isRecording) {
          // Stop recording
          cameraRef.current.stopRecording();
          setIsRecording(false);
        } else {
          // Start recording
          setIsRecording(true);
          const video = await cameraRef.current.recordAsync({
            maxDuration: 30, // 30 seconds max
          });
          if (video) {
            setMediaUri(video.uri);
            setMediaType('video');
            setMode('preview');
            setIsRecording(false);
          }
        }
      }
    } catch (error) {
      console.log('Capture error:', error);
      Alert.alert('Error', 'Failed to capture media');
      setIsRecording(false);
    }
  };

  const handleGallerySelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'image');
        setMode('preview');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const toggleCamera = () => {
    setFacing((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleCameraMode = () => {
    setCameraMode((current: CameraMode) => current === 'picture' ? 'video' : 'picture');
  };

  const handleSave = async () => {
    if (!mediaUri) return;

    setIsLoading(true);
    try {
      // Save to device storage
      await AsyncStorage.setItem(`story_draft_${Date.now()}`, JSON.stringify({
        uri: mediaUri,
        type: mediaType,
        timestamp: Date.now()
      }));
      
      Alert.alert(
        'Saved!',
        'Your story has been saved to drafts.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save story.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareStory = async () => {
    if (!mediaUri) return;

    // Check authentication first
    if (!api.isAuthenticated()) {
      Alert.alert('Authentication Required', 'Please log in to create stories. You will be redirected to the login screen.', [
        { text: 'OK', onPress: () => router.push('/login') }
      ]);
      return;
    }

    setIsLoading(true);
    try {
      // Prepare RN file for upload
      const isVideo = mediaType === 'video';
      const file = {
        uri: mediaUri,
        name: `story-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
        type: isVideo ? 'video/mp4' : 'image/jpeg',
      } as any;

      console.log('Uploading story file:', file);
      // Upload media
      const upload = await api.uploadFile(file);
      console.log('Story upload response:', upload);
      const url = (upload as any)?.data?.url || mediaUri;
      const m: MediaFile = {
        id: `m-${Date.now()}`,
        type: isVideo ? 'video' : 'image',
        url,
        size: (upload as any)?.data?.size || 0,
      } as any;

      console.log('Creating story with media:', m);
      // Create story via API with proper structure
      const storyResponse = await api.createStory({ 
        content: '', // Empty content is fine when media is provided
        media: m 
      });
      console.log('Story creation response:', storyResponse);

      if (storyResponse.success) {
        console.log('✅ Story created successfully!');
        console.log('📖 Story data from backend:', JSON.stringify(storyResponse.data, null, 2));
        
        setIsLoading(false);
        
        // Navigate to success screen
        router.replace('/story-success');
        return;
      } else {
        throw new Error(storyResponse.error || 'Failed to create story');
      }
    } catch (error) {
      console.error('Story creation error:', error);
      setIsLoading(false);
      Alert.alert('Error', `Failed to share story: ${(error as any).message || 'Please try again.'}`);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      router.back();
    });
  };

  const resetToCamera = () => {
    setMode('camera');
    setMediaUri(null);
    setMediaType('image');
    setCameraMode('picture');
  };

  if (mode === 'camera' && !permission?.granted) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={[styles.permissionText, { color: colors.text }]}>
          Camera access is required to create stories
        </Text>
        <TouchableOpacity 
          style={[styles.permissionButton, { backgroundColor: colors.tint }]} 
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }, { scale: scaleAnim }]
        }
      ]}
    >
      {/* Flash overlay */}
      <Animated.View 
        style={[
          styles.flashOverlay,
          { opacity: flashAnim }
        ]} 
        pointerEvents="none"
      />

      {mode === 'camera' && (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mode={cameraMode as ExpoCameraMode}
          >
            {/* Top controls */}
            <View style={[styles.topControls, { paddingTop: insets.top + 10 }]}>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <X size={28} color="white" strokeWidth={2} />
              </TouchableOpacity>
              
              <View style={styles.topRightControls}>
                <TouchableOpacity 
                  style={styles.controlButton} 
                  onPress={() => {/* Flash toggle */}}
                  activeOpacity={0.7}
                >
                  <Zap size={24} color="white" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mode switcher */}
            <View style={styles.modeSwitcher}>
              <TouchableOpacity 
                style={[
                  styles.modeButton,
                  cameraMode === 'picture' && styles.modeButtonActive
                ]}
                onPress={() => setCameraMode('picture')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modeText,
                  cameraMode === 'picture' && styles.modeTextActive
                ]}>PHOTO</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modeButton,
                  cameraMode === 'video' && styles.modeButtonActive
                ]}
                onPress={() => setCameraMode('video')}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.modeText,
                  cameraMode === 'video' && styles.modeTextActive
                ]}>VIDEO</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom controls */}
            <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 30 }]}>
              <TouchableOpacity 
                style={styles.galleryButton} 
                onPress={handleGallerySelect}
                activeOpacity={0.7}
              >
                <ImageIcon size={24} color="white" strokeWidth={2} />
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: recordingAnim }] }}>
                <TouchableOpacity 
                  style={[
                    styles.captureButton,
                    cameraMode === 'video' && isRecording && styles.captureButtonRecording
                  ]}
                  onPress={handleCapture}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.captureButtonInner,
                    cameraMode === 'video' && isRecording && styles.captureButtonInnerRecording
                  ]} />
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity 
                style={styles.switchButton} 
                onPress={toggleCamera}
                activeOpacity={0.7}
              >
                <RotateCcw size={24} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </>
      )}

      {mode === 'preview' && mediaUri && (
        <View style={styles.previewContainer}>
          {mediaType === 'video' ? (
            <Video
              source={{ uri: mediaUri }}
              style={styles.previewMedia}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
          ) : (
            <Image source={{ uri: mediaUri }} style={styles.previewMedia} />
          )}

          {/* Preview top controls */}
          <View style={[styles.previewTopControls, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={resetToCamera}
              activeOpacity={0.7}
            >
              <X size={28} color="white" strokeWidth={2} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Download size={24} color="white" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Preview bottom controls */}
          <View style={[styles.previewBottomControls, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.storyActions}>
              <TouchableOpacity style={styles.storyAction} activeOpacity={0.7}>
                <Smile size={24} color="white" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyAction} activeOpacity={0.7}>
                <Type size={24} color="white" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.storyAction} activeOpacity={0.7}>
                <Palette size={24} color="white" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[
                styles.shareStoryButton,
                { backgroundColor: colors.tint }
              ]}
              onPress={handleShareStory}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.gradient.start, colors.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.shareButtonGradient}
              >
                <Text style={styles.shareStoryText}>
                  {isLoading ? 'Sharing...' : 'Share to Story'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightControls: {
    alignItems: 'flex-end',
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modeSwitcher: {
    position: 'absolute',
    top: '50%',
    left: 20,
    transform: [{ translateY: -50 }],
    zIndex: 100,
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  modeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modeTextActive: {
    color: 'white',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 100,
  },
  galleryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonRecording: {
    borderColor: '#FF3040',
  },
  captureButtonInner: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'white',
  },
  captureButtonInnerRecording: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: '#FF3040',
  },
  switchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Preview styles
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewMedia: {
    flex: 1,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
  },
  previewTopControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  previewBottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  storyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  storyAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  shareStoryButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  shareButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareStoryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
