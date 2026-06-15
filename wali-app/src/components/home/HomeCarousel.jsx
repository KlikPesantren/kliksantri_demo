import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import {
  PesantrenBannerSlideContent,
  PesantrenWelcomeSlideContent,
} from './PesantrenHeroBanner';
import { HeroPengumumanSlide } from './HeroPengumumanCard';
import { shouldShowPesantrenBanner } from '../../utils/pesantrenBanner';
import { spacing } from '../../constants/theme';
import { colors } from '../../constants/colors';
import {
  CAROUSEL_AUTO_MS,
  CAROUSEL_SLIDE_WIDTH,
  getCarouselSlideHeight,
} from './carouselShared';

const LOOP_JUMP_MS = 380;

export function buildHomeCarouselSlides(pesantren, pengumuman) {
  const slides = [];

  if (shouldShowPesantrenBanner(pesantren)) {
    slides.push({
      key: 'pesantren-banner',
      type: 'pesantren',
      bannerUrl: pesantren.banner_url,
      nama: pesantren.nama_pesantren,
      alamat: pesantren.alamat,
    });
  }

  (pengumuman ?? []).forEach((item) => {
    slides.push({
      key: `pengumuman-${item.id}`,
      type: 'pengumuman',
      item,
    });
  });

  if (slides.length === 0) {
    slides.push({ key: 'welcome', type: 'welcome' });
  }

  return slides;
}

function CarouselSlide({ slide, onPengumumanPress }) {
  if (slide.type === 'pesantren') {
    return (
      <PesantrenBannerSlideContent
        bannerUrl={slide.bannerUrl}
        nama={slide.nama}
        alamat={slide.alamat}
        fullBleed
      />
    );
  }

  if (slide.type === 'pengumuman') {
    return <HeroPengumumanSlide item={slide.item} onPress={onPengumumanPress} />;
  }

  return <PesantrenWelcomeSlideContent fullBleed />;
}

const SlideItem = React.memo(function SlideItem({ slide, onPengumumanPress }) {
  return (
    <View style={styles.slideItem}>
      <CarouselSlide slide={slide} onPengumumanPress={onPengumumanPress} />
    </View>
  );
});

function DotIndicator({ count, activeIndex }) {
  if (count <= 1) return null;

  return (
    <View style={styles.dots} pointerEvents="none">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={`dot-${index}`}
          style={[styles.dot, index === activeIndex && styles.dotActive]}
        />
      ))}
    </View>
  );
}

export function HomeCarousel({ pesantren, pengumuman, onPengumumanPress }) {
  const slides = useMemo(
    () => buildHomeCarouselSlides(pesantren, pengumuman),
    [pesantren, pengumuman],
  );

  const loopData = useMemo(() => {
    if (slides.length <= 1) return slides;
    return [slides[slides.length - 1], ...slides, slides[0]];
  }, [slides]);

  const flatListRef = useRef(null);
  const slidesRef = useRef(slides);
  const loopDataRef = useRef(loopData);
  const activeLoopIndexRef = useRef(slides.length > 1 ? 1 : 0);
  const pausedRef = useRef(false);
  const userInteractingRef = useRef(false);
  const loopJumpTimerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  slidesRef.current = slides;
  loopDataRef.current = loopData;

  const slideWidth = CAROUSEL_SLIDE_WIDTH;
  const frameHeight = getCarouselSlideHeight();
  const isLooping = slides.length > 1;

  const scrollToLoopIndex = useCallback((index, animated) => {
    const list = flatListRef.current;
    if (!list) return;

    try {
      list.scrollToIndex({ index, animated });
    } catch {
      list.scrollToOffset({ offset: slideWidth * index, animated });
    }
  }, [slideWidth]);

  const applyLoopBoundary = useCallback(
    (rawLoopIndex) => {
      const count = slidesRef.current.length;
      const loop = loopDataRef.current;

      if (count <= 1) {
        activeLoopIndexRef.current = 0;
        setActiveIndex(0);
        return 0;
      }

      const loopIndex = Math.round(rawLoopIndex);

      if (loopIndex <= 0) {
        const target = count;
        activeLoopIndexRef.current = target;
        setActiveIndex(count - 1);
        scrollToLoopIndex(target, false);
        return target;
      }

      if (loopIndex >= loop.length - 1) {
        activeLoopIndexRef.current = 1;
        setActiveIndex(0);
        scrollToLoopIndex(1, false);
        return 1;
      }

      activeLoopIndexRef.current = loopIndex;
      setActiveIndex(loopIndex - 1);
      return loopIndex;
    },
    [scrollToLoopIndex],
  );

  const clearLoopJumpTimer = useCallback(() => {
    if (loopJumpTimerRef.current) {
      clearTimeout(loopJumpTimerRef.current);
      loopJumpTimerRef.current = null;
    }
  }, []);

  const advanceSlide = useCallback(() => {
    const count = slidesRef.current.length;
    const loop = loopDataRef.current;

    if (count <= 1) return;
    if (pausedRef.current || userInteractingRef.current) return;

    const currentLoopIndex = activeLoopIndexRef.current;
    const nextLoopIndex = currentLoopIndex + 1;

    if (__DEV__) {
      console.log('[CAROUSEL] timer tick');
      console.log('[CAROUSEL] current index', currentLoopIndex);
      console.log('[CAROUSEL] scroll to', nextLoopIndex);
    }

    clearLoopJumpTimer();

    if (nextLoopIndex >= loop.length - 1) {
      activeLoopIndexRef.current = loop.length - 1;
      setActiveIndex(0);
      scrollToLoopIndex(loop.length - 1, true);

      loopJumpTimerRef.current = setTimeout(() => {
        applyLoopBoundary(loop.length - 1);
        loopJumpTimerRef.current = null;
      }, LOOP_JUMP_MS);
      return;
    }

    activeLoopIndexRef.current = nextLoopIndex;
    setActiveIndex(nextLoopIndex - 1);
    scrollToLoopIndex(nextLoopIndex, true);
  }, [applyLoopBoundary, clearLoopJumpTimer, scrollToLoopIndex]);

  useEffect(() => {
    clearLoopJumpTimer();

    if (!isLooping) {
      activeLoopIndexRef.current = 0;
      setActiveIndex(0);
      return undefined;
    }

    const timer = setTimeout(() => {
      activeLoopIndexRef.current = 1;
      setActiveIndex(0);
      scrollToLoopIndex(1, false);
    }, 50);

    return () => {
      clearTimeout(timer);
      clearLoopJumpTimer();
    };
  }, [clearLoopJumpTimer, isLooping, scrollToLoopIndex]);

  useEffect(() => {
    if (!isLooping) return undefined;

    const timer = setInterval(advanceSlide, CAROUSEL_AUTO_MS);

    return () => clearInterval(timer);
  }, [advanceSlide, isLooping]);

  useEffect(() => () => clearLoopJumpTimer(), [clearLoopJumpTimer]);

  const handleScrollBegin = useCallback(() => {
    userInteractingRef.current = true;
    pausedRef.current = true;
    clearLoopJumpTimer();
  }, [clearLoopJumpTimer]);

  const handleMomentumScrollEnd = useCallback(
    (event) => {
      userInteractingRef.current = false;
      pausedRef.current = false;

      const offsetX = event.nativeEvent.contentOffset.x;
      const loopIndex = Math.round(offsetX / slideWidth);
      applyLoopBoundary(loopIndex);
    },
    [applyLoopBoundary, slideWidth],
  );

  const handleScrollToIndexFailed = useCallback(
    (info) => {
      flatListRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });

      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: false,
        });
      });
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <SlideItem slide={item} onPengumumanPress={onPengumumanPress} />
    ),
    [onPengumumanPress],
  );

  const keyExtractor = useCallback((item, index) => `${item.key}-${index}`, []);

  const getItemLayout = useCallback(
    (_, index) => ({
      length: slideWidth,
      offset: slideWidth * index,
      index,
    }),
    [slideWidth],
  );

  return (
    <View style={styles.wrap}>
      <View style={[styles.frame, { height: frameHeight }]}>
        <FlatList
          ref={flatListRef}
          data={loopData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled
          snapToInterval={slideWidth}
          snapToAlignment="start"
          disableIntervalMomentum
          getItemLayout={getItemLayout}
          onScrollBeginDrag={handleScrollBegin}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
        <DotIndicator count={slides.length} activeIndex={activeIndex} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  frame: {
    width: CAROUSEL_SLIDE_WIDTH,
    alignSelf: 'center',
    position: 'relative',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    alignItems: 'stretch',
  },
  slideItem: {
    width: CAROUSEL_SLIDE_WIDTH,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
});
