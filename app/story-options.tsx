import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  BackHandler,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Music,
  X,
  Sparkles,
  Palette,
  Video,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

  interface StoryOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: [string, string];
  route: string;
  delay: number;
}

export default function StoryOptionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isVisible, setIsVisible] = useState(true);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const optionAnims = useRef(
    Array(4).fill(0).map(() => ({
      scale: new Animated.Value(0),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(50),
    }))
  ).current;

  const storyOptions: StoryOption[] = [
    {
      id: 'capture',
      title: 'Capture or Record',
      subtitle: 'Take photos, videos or go live',
      icon: <Camera size={32} color="white" strokeWidth={2.5} />,
      gradient: ['#7C3AED', '#A855F7'],
      route: '/create-story',
      delay: 0,
    },
    {
      id: 'upload',
      title: 'Upload Media',
      subtitle: 'Choose from your gallery',
      icon: <ImageIcon size={32} color="white" strokeWidth={2.5} />,
      gradient: ['#06B6D4', '#3B82F6'],
      route: '/upload-media',
      delay: 150,
    },
    {
      id: 'create',
      title: 'Create Manually',
      subtitle: 'Text, backgrounds & stickers',
      icon: <FileText size={32} color="white" strokeWidth={2.5} />,
      gradient: ['#10B981', '#059669'],
      route: '/create-manual',
      delay: 300,
    },
    {
      id: 'music',
      title: 'Add Music or Sound',
      subtitle: 'Background music & effects',
      icon: <Music size={32} color="white" strokeWidth={2.5} />,
      gradient: ['#F59E0B', '#EF4444'],
      route: '/add-music',
      delay: 450,
    },
  ];

  useEffect(() => {
    StatusBar.setHidden(false);
    StatusBar.setBarStyle('light-content');

    // Entry animations
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
    ];

    // Stagger option animations
    const optionAnimations = optionAnims.map((anim, index) => {
      const delay = storyOptions[index].delay;
      return Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 600,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 80,
          friction: 6,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          tension: 80,
          friction: 8,
          delay,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel([...animations, ...optionAnimations]).start();

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleClose();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    
    const exitAnimations = [
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(exitAnimations).start(() => {
      router.back();
    });
  };

  const handleOptionPress = (option: StoryOption) => {
    // Add press animation
    const optionIndex = storyOptions.findIndex(o => o.id === option.id);
    const anim = optionAnims[optionIndex];
    
    Animated.sequence([
      Animated.spring(anim.scale, {
        toValue: 0.95,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(anim.scale, {
        toValue: 1.05,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(anim.scale, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Navigate after animation
      router.push(option.route as any);
    });
  };

  if (!isVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }
      ]}
    >
      <LinearGradient
        colors={[colors.background, colors.card]}
        style={styles.background}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={24} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Animated.View style={styles.headerIcon}>
              <Sparkles size={28} color={colors.tint} strokeWidth={2} />
            </Animated.View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Create Your Story
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.icon }]}>
              Choose how you want to express yourself
            </Text>
          </View>
        </View>

        {/* Options */}
        <ScrollView style={styles.optionsContainer} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
          {storyOptions.map((option, index) => {
            const anim = optionAnims[index];
            
            return (
              <Animated.View
                key={option.id}
                style={[
                  styles.optionWrapper,
                  {
                    opacity: anim.opacity,
                    transform: [
                      { scale: anim.scale },
                      { translateY: anim.translateY }
                    ]
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleOptionPress(option)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={option.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.optionGradient}
                  >
                    <View style={styles.optionIcon}>
                      {option.icon}
                    </View>
                    
                    <View style={styles.optionContent}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                    
                    <View style={styles.optionArrow}>
                      <View style={styles.arrowIcon} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.footerContent}>
            <Palette size={20} color={colors.icon} strokeWidth={2} />
            <Text style={[styles.footerText, { color: colors.icon }]}>
              Express yourself with Dovio Stories
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  optionWrapper: {
    marginBottom: 16,
  },
  option: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 90,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  optionArrow: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    width: 8,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    transform: [{ rotate: '45deg' }],
  },
  footer: {
    paddingHorizontal: 20,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
