import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  BounceIn,
  ZoomIn,
  SlideInUp,
  type ComplexAnimationBuilder,
} from 'react-native-reanimated';
import { Spacing } from '@/constants/theme';

type AnimationType = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'bounce' | 'zoom' | 'slideUp';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  style?: any;
}

const animationMap: Record<AnimationType, typeof ComplexAnimationBuilder> = {
  fadeUp: FadeInUp,
  fadeDown: FadeInDown,
  fadeLeft: FadeInLeft,
  fadeRight: FadeInRight,
  bounce: BounceIn,
  zoom: ZoomIn,
  slideUp: SlideInUp,
};

export function AnimatedSection({
  children,
  animation = 'fadeUp',
  delay = 0,
  duration = 300,
  style,
}: AnimatedSectionProps) {
  const entering = useMemo(() => {
    const Component = animationMap[animation];
    return Component.duration(duration).delay(delay);
  }, [animation, delay, duration]);

  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

export function AnimatedList({ children }: { children: React.ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

export function AnimatedListItem({
  children,
  index = 0,
  animation = 'fadeUp',
}: {
  children: React.ReactNode;
  index?: number;
  animation?: AnimationType;
}) {
  return (
    <AnimatedSection animation={animation} delay={index * 80} duration={300}>
      {children}
    </AnimatedSection>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
});
