import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FARM, SHADOWS } from '../theme';
import sharedStyles from '../shared/styles';
import { AnimatedPressable, Icon, RewardPopup } from '../shared/components';
import {
  themes, THEME_ORDER, MEMORY_LEVELS,
  getReleasedLevelConfigs, HAND_POINTER_ASSET,
  SCREEN_WIDTH, SCREEN_HEIGHT, ANIMAL_ASSETS, VEHICLE_ASSETS,
} from '../shared/constants';

// ── Memory card with flip animation ──
const MemoryCard = ({ card, isFlipped, isMatched, cardSize, onPress, disabled, isHinted }) => {
  const flipAnim  = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hintAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const showingFront = useRef(isFlipped);
  const [face, setFace] = useState(isFlipped ? 'front' : 'back');

  useEffect(() => {
    if (showingFront.current === isFlipped) return;
    showingFront.current = isFlipped;
    Animated.timing(flipAnim, { toValue: 0, duration: 90, useNativeDriver: true }).start(() => {
      setFace(isFlipped ? 'front' : 'back');
      Animated.timing(flipAnim, { toValue: 1, duration: 90, useNativeDriver: true }).start();
    });
  }, [isFlipped]);

  useEffect(() => {
    if (!isMatched) return;
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.22, useNativeDriver: true, bounciness: 18, speed: 24 }),
      Animated.spring(scaleAnim, { toValue: 1.0,  useNativeDriver: true, bounciness: 6,  speed: 18 }),
    ]).start();
  }, [isMatched]);

  useEffect(() => {
    if (!isMatched) { fadeAnim.setValue(1); return; }
    Animated.timing(fadeAnim, { toValue: 0, duration: 520, useNativeDriver: true }).start();
  }, [isMatched, fadeAnim]);

  useEffect(() => {
    if (!isHinted || isMatched || face === 'front') {
      hintAnim.stopAnimation();
      hintAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.timing(hintAnim, { toValue: 0, duration: 520, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isHinted, isMatched, face, hintAnim]);

  const bg = isMatched ? FARM.cardMatched : face === 'back' ? FARM.cardBack : FARM.cardFront;
  const borderCol = isMatched
    ? FARM.cardMatchedBorder
    : isHinted && face === 'back'
      ? FARM.cardHintBorder
      : face === 'back' ? FARM.cardBackBorder : FARM.cardFrontBorder;
  const shadow     = isMatched ? SHADOWS.cardMatched : SHADOWS.card;
  const hintScale  = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const hintLift   = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const handLift   = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [-22, -12] });
  const handScale  = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || isMatched} activeOpacity={0.85}>
      <Animated.View style={[
        styles.card,
        shadow,
        {
          width: cardSize, height: cardSize,
          backgroundColor: bg, opacity: fadeAnim,
          borderWidth: isHinted && face === 'back' ? 4 : 3, borderColor: borderCol,
          transform: [
            { scaleX: flipAnim },
            { scale: scaleAnim },
            { scale: isHinted && face === 'back' ? hintScale : 1 },
            { translateY: isHinted && face === 'back' ? hintLift : 0 },
          ],
        },
      ]}>
        {face === 'front'
          ? <Icon value={card.value} size={cardSize * 0.65} />
          : (
            <Icon value={FARM.cardBackIcon} size={cardSize * 0.52} />
          )
        }
        {isHinted && face === 'back' && (
          <Animated.View
            pointerEvents="none"
            style={[
              sharedStyles.hintHandWrap,
              {
                width: cardSize * 0.72, height: cardSize * 0.72,
                top: -cardSize * 0.60,
                left: (cardSize - cardSize * 0.72) / 2,
                transform: [{ translateY: handLift }, { scale: handScale }],
              },
            ]}
          >
            <Image source={HAND_POINTER_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── MemoryGame ──
const MemoryGame = ({ playSound, onExit, fontsLoaded }) => {
  const releasedLevels = useMemo(() => getReleasedLevelConfigs(MEMORY_LEVELS), []);
  const memoryThemeGradients = useMemo(() => ({
    animals:  ['#FB923C', '#FBBF24'],
    fruits:   ['#F472B6', '#FB923C'],
    vehicles: ['#60A5FA', '#34D399'],
  }), []);
  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [consecutiveMatches, setConsecutiveMatches] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintCardIndex, setHintCardIndex] = useState(null);
  const [guidedAnchorIndex, setGuidedAnchorIndex] = useState(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStars, setPopupStars] = useState(0);

  const currentLevel = releasedLevels[currentLevelIndex] || releasedLevels[0];

  const startGame = (theme, levelIndex = 0) => {
    const level = releasedLevels[levelIndex];
    if (!theme || !level) return;
    const items = themes[theme].items.slice(0, level.pairs);
    const deck = [...items, ...items]
      .map((item, i) => ({ id: i, value: item }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setConsecutiveMatches(0);
    setWrongAttempts(0);
    setHintCardIndex(null);
    setGuidedAnchorIndex(null);
    setSelectedTheme(theme);
    setCurrentLevelIndex(levelIndex);
    setShowPopup(false);
    setScreen('play');
  };

  const handleContinue = () => {
    setShowPopup(false);
    if (!selectedTheme) return;
    if (popupStars <= 1) {
      startGame(selectedTheme, currentLevelIndex);
    } else if (currentLevelIndex < releasedLevels.length - 1) {
      startGame(selectedTheme, currentLevelIndex + 1);
    } else {
      onExit();
    }
  };

  const suggestCard = useCallback((currentFlipped = [], focusIndex = null, keepUntilPick = false) => {
    const unmatched = cards.map((c, idx) => ({ ...c, idx })).filter((c) => !matched.includes(c.idx));
    if (unmatched.length < 2) return;

    let targetIndex = -1;
    if (focusIndex !== null && cards[focusIndex]) {
      const focusValue = cards[focusIndex].value;
      targetIndex = cards.findIndex((c, idx) => idx !== focusIndex && c.value === focusValue && !matched.includes(idx));
    }

    if (targetIndex < 0 && currentFlipped.length === 1) {
      const first = cards[currentFlipped[0]];
      targetIndex = cards.findIndex((c, idx) => idx !== currentFlipped[0] && c.value === first.value && !matched.includes(idx));
    }

    if (targetIndex < 0) {
      const pairByValue = {};
      unmatched.forEach((c) => {
        if (!pairByValue[c.value]) pairByValue[c.value] = [];
        pairByValue[c.value].push(c.idx);
      });
      const firstPair = Object.values(pairByValue).find((arr) => arr.length >= 2);
      if (!firstPair) return;
      const hiddenPair = firstPair.filter((idx) => !currentFlipped.includes(idx));
      targetIndex = hiddenPair[0] ?? firstPair[0];
    }

    if (targetIndex >= 0) {
      setHintCardIndex(targetIndex);
      if (!keepUntilPick) setTimeout(() => setHintCardIndex(null), 2400);
    }
    return targetIndex;
  }, [cards, matched]);

  const handleCardClick = (index) => {
    if (flipped.length === 2) return;
    if (flipped.includes(index) || matched.includes(index)) return;
    playSound('flip');
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].value === cards[second].value) {
        setTimeout(() => {
          const newConsec = consecutiveMatches + 1;
          setConsecutiveMatches(newConsec);
          setWrongAttempts(0);
          setHintCardIndex(null);
          setGuidedAnchorIndex(null);
          if (newConsec >= 3) { playSound('combo'); } else { playSound('match'); }
          setMatched(prev => [...prev, first, second]);
          setFlipped([]);
        }, 600);
      } else {
        setConsecutiveMatches(0);
        setHintCardIndex(null);
        setGuidedAnchorIndex(null);
        const nextWrongAttempts = wrongAttempts + 1;
        setWrongAttempts(nextWrongAttempts);
        const hintThreshold = currentLevel?.tier === 'easy' ? 5 : currentLevel?.tier === 'medium' ? 6 : 7;
        if (nextWrongAttempts >= hintThreshold) {
          setTimeout(() => {
            setFlipped([second]);
            const target = suggestCard([second], second, true);
            if (target >= 0) setGuidedAnchorIndex(second);
          }, 700);
          setWrongAttempts(0);
        } else {
          setTimeout(() => setFlipped([]), 1000);
        }
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length) {
      const pairs = cards.length / 2;
      let s = 1;
      if (moves <= pairs * 1.45) s = 3;
      else if (moves <= pairs * 1.9) s = 2;
      setTimeout(() => { setPopupStars(s); setShowPopup(true); }, 500);
    }
  }, [cards.length, matched.length, moves]);

  // ── Theme screen ──
  if (screen === 'theme') {
    return (
      <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={[sharedStyles.header, { marginTop: 10, paddingVertical: 0 }]}>
          <AnimatedPressable onPress={() => { playSound('tap'); onExit(); }}>
            <View style={sharedStyles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
          <Text style={sharedStyles.farmHeaderTitle}>🎮 Chủ đề</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={[sharedStyles.kidSelectScrollContent, sharedStyles.farmThemeSelectScrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={sharedStyles.farmIntroCard}>
            <Text style={sharedStyles.farmIntroTitle}>Chọn bộ hình</Text>
            <Text style={sharedStyles.farmIntroSub}>10 màn · Flip & Match!</Text>
          </View>
          {THEME_ORDER.map((key) => {
            const theme = themes[key];
            if (!theme) return null;
            return (
              <AnimatedPressable key={key} onPress={() => { playSound('themeSelect'); startGame(key, 0); }}>
                <LinearGradient colors={memoryThemeGradients[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={sharedStyles.farmThemeCard}>
                  <View style={sharedStyles.farmThemeEmojiWrap}>
                    <Image
                      source={ANIMAL_ASSETS[theme.assetKey] || VEHICLE_ASSETS[theme.assetKey]}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={sharedStyles.kidThemeTextWrap}>
                    <Text style={sharedStyles.farmThemeName}>{theme.name}</Text>
                    <Text style={sharedStyles.farmThemeSub}>CHƠI NGAY ▶</Text>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
        <View style={sharedStyles.farmGrassBar} />
      </LinearGradient>
    );
  }

  // ── Play screen ──
  if (screen === 'play' && currentLevel) {
    const totalCards = currentLevel.pairs * 2;
    const maxCols = Math.min(currentLevel.cols, 4, totalCards);
    let cols = maxCols;
    while (cols > 1 && totalCards % cols !== 0) cols -= 1;
    const rows = totalCards / cols;
    const gap = cols <= 2 ? 12 : cols === 3 ? 10 : 8;
    const reservedHeight = 10 + 44 + FARM.headerContentGap + 58 + 36 + 24;
    const availH = SCREEN_HEIGHT - reservedHeight;
    const availW = SCREEN_WIDTH - 32;
    const cardFromW = Math.floor((availW - gap * (cols - 1)) / cols);
    const cardFromH = Math.floor((availH - gap * (rows - 1)) / rows);
    const sizeCap = cols <= 2 ? 160 : cols === 3 ? 116 : 82;
    const cardSize = Math.max(48, Math.min(cardFromW, cardFromH, sizeCap));
    const gridW = cols * cardSize + (cols - 1) * gap;

    return (
      <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={[sharedStyles.farmPlayHeader, { marginTop: 10 }]}>
          <AnimatedPressable onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <View style={sharedStyles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
          <View style={sharedStyles.farmLevelBadge}>
            <Text style={sharedStyles.farmLevelText}>Màn {currentLevelIndex + 1}</Text>
          </View>
          <View style={sharedStyles.farmHeaderSpacer} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
          <View style={{ width: gridW, flexDirection: 'row', flexWrap: 'wrap', gap }}>
            {cards.map((card, i) => {
              const isFlipped = flipped.includes(i) || matched.includes(i);
              const isMatched  = matched.includes(i);
              return (
                <MemoryCard
                  key={i}
                  card={card}
                  isFlipped={isFlipped}
                  isMatched={isMatched}
                  cardSize={cardSize}
                  isHinted={hintCardIndex === i && !isFlipped}
                  onPress={() => handleCardClick(i)}
                  disabled={isMatched || flipped.length === 2}
                />
              );
            })}
          </View>
        </View>
        <View style={sharedStyles.farmGrassBar} />

        <RewardPopup
          visible={showPopup}
          stars={popupStars}
          levelNum={currentLevelIndex + 1}
          totalLevels={releasedLevels.length}
          onContinue={handleContinue}
          onExit={() => { setShowPopup(false); onExit(); }}
          playSound={playSound}
          fontsLoaded={fontsLoaded}
        />
      </LinearGradient>
    );
  }
  return null;
};

export default MemoryGame;

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },
});
