const tintColorLight = '#7C3AED';
const tintColorDark = '#8B5CF6';

export default {
  light: {
    text: '#1F2937',
    background: '#F8FAFC',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E5E7EB',
    placeholder: '#9CA3AF',
    gradient: {
      start: '#7C3AED',
      end: '#A855F7',
    },
    shadow: {
      color: '#7C3AED',
      opacity: 0.2,
    },
    neumorphic: {
      light: '#FFFFFF',
      dark: '#E5E7EB',
      shadowLight: 'rgba(255, 255, 255, 0.8)',
      shadowDark: 'rgba(124, 58, 237, 0.15)',
    },
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#6B7280',
    tabIconSelected: tintColorDark,
    card: '#1F2937',
    border: '#374151',
    placeholder: '#6B7280',
    gradient: {
      start: '#8B5CF6',
      end: '#A78BFA',
    },
    shadow: {
      color: '#000',
      opacity: 0.5,
    },
    neumorphic: {
      light: '#374151',
      dark: '#0F172A',
      shadowLight: 'rgba(139, 92, 246, 0.1)',
      shadowDark: 'rgba(0, 0, 0, 0.6)',
    },
  },
};
