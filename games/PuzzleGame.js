import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Image, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FARM, SHADOWS } from '../theme';
import sharedStyles from '../shared/styles';
import { AnimatedPressable, Icon, RewardPopup } from '../shared/components';
import { themes, THEME_ORDER, PUZZLE_LEVELS, getReleasedLevelConfigs, getTierLabel, HAND_POINTER_ASSET, ANIMAL_ASSETS, VEHICLE_ASSETS } from '../shared/constants';

const DiffCell = ({ emoji, index, isClickable, isFound, isWrong, onTap, cellSize }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isWrong) return;
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [isWrong]);

  useEffect(() => {
    if (!isFound) return;
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.18, useNativeDriver: true, bounciness: 16, speed: 28 }),
      Animated.spring(scaleAnim, { toValue: 1.0,  useNativeDriver: true, bounciness: 4,  speed: 20 }),
    ]).start();
  }, [isFound]);

  const bg = isFound ? '#C4E4C5' : isWrong ? '#F4BCBC' : 'white';
  const shadow = isFound
    ? { shadowColor: '#18C66A', shadowOpacity: 0.56, shadowRadius: 7, elevation: 6 }
    : { elevation: 1 };

  return (
    <TouchableOpacity onPress={() => isClickable && onTap(index)} disabled={!isClickable} activeOpacity={0.85}>
      <Animated.View style={[
        styles.diffCell,
        shadow,
        { width: cellSize, height: cellSize, backgroundColor: bg,
          transform: [{ translateX: shakeAnim }, { scale: scaleAnim }] }
      ]}>
        <Icon value={emoji} size={cellSize * 0.70} />
        {isFound && <View style={[styles.foundBorder, { borderRadius: 8 }]} />}
      </Animated.View>
    </TouchableOpacity>
  );
};

const PuzzleGame = ({ playSound, onExit, fontsLoaded }) => {
  const releasedLevels = useMemo(() => getReleasedLevelConfigs(PUZZLE_LEVELS), []);
  const puzzleThemeGradients = useMemo(() => ({
    animals: ['#FB923C', '#FBBF24'],
    fruits: ['#F472B6', '#FB923C'],
    vehicles: ['#60A5FA', '#34D399'],
  }), []);
  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;
  const F7 = fontsLoaded ? 'Nunito_700Bold' : undefined;
  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [wrongPicks, setWrongPicks] = useState(0);
  const [selectedWrongOption, setSelectedWrongOption] = useState(null);
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStars, setPopupStars] = useState(0);

  const hintAnim = useRef(new Animated.Value(0)).current;
  const hintTimer = useRef(null);
  const [showHint, setShowHint] = useState(false);
  const currentLevel = releasedLevels[currentLevelIndex] || releasedLevels[0];
  const [leftCountCardBox, setLeftCountCardBox] = useState({ width: 0, height: 0 });
  const [rightCountCardBox, setRightCountCardBox] = useState({ width: 0, height: 0 });

  const computeEmojiSizeForCard = useCallback((itemCount, box) => {
    if (!itemCount) return 32;
    const width = box?.width ?? 0;
    const height = box?.height ?? 0;

    if (width <= 0 || height <= 0) {
      return itemCount >= 10 ? 20 : itemCount >= 8 ? 22 : itemCount >= 6 ? 26 : itemCount >= 4 ? 32 : 40;
    }

    const gap = 6;
    const availW = Math.max(1, width - 16);
    const availH = Math.max(1, height - 14);
    const maxCols = Math.min(itemCount, 8);
    let best = 18;

    for (let cols = 1; cols <= maxCols; cols += 1) {
      const rows = Math.ceil(itemCount / cols);
      const byW = (availW - gap * (cols - 1)) / cols;
      const byH = (availH - gap * (rows - 1)) / rows;
      const candidate = Math.min(byW, byH);
      if (candidate > best) best = candidate;
    }

    return Math.max(16, Math.min(56, Math.floor(best * 0.78)));
  }, []);

  const startHintTimer = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintAnim.stopAnimation();
    hintAnim.setValue(0);
    setShowHint(false);
    hintTimer.current = setTimeout(() => {
      setShowHint(true);
      Animated.loop(
        Animated.sequence([
          Animated.timing(hintAnim, { toValue: 1, duration: 520, useNativeDriver: true }),
          Animated.timing(hintAnim, { toValue: 0, duration: 520, useNativeDriver: true }),
        ])
      ).start();
    }, 18000);
  }, [hintAnim]);

  useEffect(() => {
    if (screen === 'play' && roundData) startHintTimer();
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current); hintAnim.stopAnimation(); };
  }, [screen, roundData, startHintTimer]);

  const generateRound = useCallback((themeKey, levelConfig) => {
    const themeItems = themes[themeKey].items;
    if (!themeItems || !levelConfig) return;

    const firstIndex = Math.floor(Math.random() * themeItems.length);
    const firstEmoji = themeItems[firstIndex];
    const secondEmoji = firstEmoji;
    const firstCount = 1 + Math.floor(Math.random() * levelConfig.maxCount);
    const secondCount = 1 + Math.floor(Math.random() * levelConfig.maxCount);
    const answer = firstCount + secondCount;

    const wrongOptions = new Set();
    while (wrongOptions.size < levelConfig.optionCount - 1) {
      const delta = Math.floor(Math.random() * (levelConfig.maxCount + 2)) - Math.floor(levelConfig.maxCount / 2);
      const candidate = answer + (delta === 0 ? 2 : delta);
      if (candidate > 1 && candidate !== answer) wrongOptions.add(candidate);
    }

    const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);
    setRoundData({ firstEmoji, secondEmoji, firstCount, secondCount, answer, options });
    setSelectedWrongOption(null);
  }, []);

  const startGame = (themeKey, levelIndex = 0) => {
    const level = releasedLevels[levelIndex];
    if (!themeKey || !level) return;
    setSelectedTheme(themeKey);
    setWrongPicks(0);
    setCurrentLevelIndex(levelIndex);
    setShowPopup(false);
    generateRound(themeKey, level);
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

  const handlePickOption = (value) => {
    if (!roundData || !currentLevel) return;
    startHintTimer();
    if (value === roundData.answer) {
      playSound('match');
      const s = wrongPicks === 0 ? 3 : wrongPicks <= currentLevel.star2MaxWrong ? 2 : 1;
      setPopupStars(s);
      setShowPopup(true);
      return;
    }
    playSound('wrong');
    setWrongPicks((v) => {
      const next = v + 1;
      if (next >= currentLevel.mistakeBudget) {
        setTimeout(() => {
          setPopupStars(1);
          setShowPopup(true);
        }, 250);
      }
      return next;
    });
    setSelectedWrongOption(value);
    setTimeout(() => setSelectedWrongOption(null), 420);
  };

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
          <Text style={[sharedStyles.farmHeaderTitle, { fontFamily: F }]}>🧮 Chủ đề</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={[sharedStyles.kidSelectScrollContent, sharedStyles.farmThemeSelectScrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={sharedStyles.farmIntroCard}>
            <Text style={[sharedStyles.farmIntroTitle, { fontFamily: F }]}>Đếm & chọn số</Text>
            <Text style={[sharedStyles.farmIntroSub, { fontFamily: F8 }]}>🎯 10 màn mở khóa</Text>
          </View>
          {THEME_ORDER.map((key) => {
            const theme = themes[key];
            if (!theme) return null;
            return (
              <AnimatedPressable key={key}
                onPress={() => { playSound('themeSelect'); startGame(key, 0); }}>
                <LinearGradient colors={puzzleThemeGradients[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={sharedStyles.farmThemeCard}>
                  <View style={sharedStyles.farmThemeEmojiWrap}>
                    <Image
                      source={ANIMAL_ASSETS[theme.assetKey] || VEHICLE_ASSETS[theme.assetKey]}
                      style={{ width: 56, height: 56 }}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={sharedStyles.kidThemeTextWrap}>
                    <Text style={[sharedStyles.farmThemeName, { fontFamily: F }]}>{theme.name}</Text>
                    <Text style={[sharedStyles.farmThemeSub, { fontFamily: F8 }]}>CHƠI NGAY ▶</Text>
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

  const hintScale = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const hintLift = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const handLift = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [-28, -16] });
  const handScale = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  if (screen === 'play' && roundData && currentLevel) {
    const countRowA = Array.from({ length: roundData.firstCount });
    const countRowB = Array.from({ length: roundData.secondCount });
    const emojiSizeA = computeEmojiSizeForCard(roundData.firstCount, leftCountCardBox);
    const emojiSizeB = computeEmojiSizeForCard(roundData.secondCount, rightCountCardBox);

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
            <Text style={[sharedStyles.farmLevelText, { fontFamily: F }]}>Màn {currentLevelIndex + 1}</Text>
          </View>
          <View style={sharedStyles.farmHeaderSpacer} />
        </View>

        <View style={styles.countPlayContent}>
          <View style={styles.countTopHalf}>
            <View style={styles.countQuestionCard}>
              <Text style={[styles.countQuestionTitle, { fontFamily: F }]}>🧮 + 🧮 = ?</Text>
              <Text style={[styles.countPlayMeta, { fontFamily: F7 }]}>
                {getTierLabel(currentLevel.tier)} · Sai {wrongPicks}/{currentLevel.mistakeBudget}
              </Text>
              <View style={styles.countEquationWrap}>
                <View
                  style={styles.countItemCard}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setLeftCountCardBox((prev) => (
                      prev.width === width && prev.height === height ? prev : { width, height }
                    ));
                  }}
                >
                  <View style={styles.countEmojiRow}>
                    {countRowA.map((_, i) => (
                      <Text key={`a-${i}`} style={[styles.countEmoji, { fontSize: emojiSizeA, lineHeight: emojiSizeA + 2 }]}>
                        {roundData.firstEmoji}
                      </Text>
                    ))}
                  </View>
                </View>
                <Text style={[styles.countMathSign, { fontFamily: F }]}>＋</Text>
                <View
                  style={styles.countItemCard}
                  onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setRightCountCardBox((prev) => (
                      prev.width === width && prev.height === height ? prev : { width, height }
                    ));
                  }}
                >
                  <View style={styles.countEmojiRow}>
                    {countRowB.map((_, i) => (
                      <Text key={`b-${i}`} style={[styles.countEmoji, { fontSize: emojiSizeB, lineHeight: emojiSizeB + 2 }]}>
                        {roundData.secondEmoji}
                      </Text>
                    ))}
                  </View>
                </View>
                <View style={styles.countResultWrap}>
                  <Text style={[styles.countMathSign, { fontFamily: F }]}>＝</Text>
                  <Text style={[styles.countResultText, { fontFamily: F }]}>?</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.countBottomHalf}>
            <View style={styles.countOptionsWrap}>
              <Text style={[styles.countOptionsTitle, { fontFamily: F }]}>Chọn đáp án</Text>
              <View style={styles.countOptionGrid}>
                {roundData.options.map((option) => {
                  const isWrongSelected = selectedWrongOption === option;
                  const isHinted = showHint && option === roundData.answer;
                  return (
                    <AnimatedPressable key={option} onPress={() => handlePickOption(option)}>
                      <Animated.View style={[
                        { position: 'relative' },
                        isHinted && { transform: [{ scale: hintScale }, { translateY: hintLift }] },
                      ]}>
                        <LinearGradient
                          colors={
                            isWrongSelected
                              ? [FARM.closeButtonBg, FARM.closeButtonBorder]
                              : [FARM.cardFront, '#FFFEF5']
                          }
                          style={[
                            styles.countOptionButton,
                            styles.countOptionButtonHalf,
                            isWrongSelected && { borderColor: FARM.closeButtonBorder },
                            isHinted && !isWrongSelected && { borderWidth: 3, borderColor: FARM.cardHintBorder },
                          ]}
                        >
                          <Text style={[
                            styles.countOptionText,
                            { fontFamily: F },
                            isWrongSelected && { color: FARM.white },
                          ]}>
                            {option}
                          </Text>
                        </LinearGradient>
                        {isHinted && (
                          <Animated.View
                            pointerEvents="none"
                            style={[sharedStyles.hintHandWrap, {
                              width: 52,
                              height: 52,
                              top: 16,
                              right: 10,
                              transform: [{ translateY: handLift }, { scale: handScale }],
                            }]}
                          >
                            <Image source={HAND_POINTER_ASSET} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                          </Animated.View>
                        )}
                      </Animated.View>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>
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

export default PuzzleGame;

const styles = StyleSheet.create({
  countQuestionCard: {
    flex: 1,
    backgroundColor: FARM.cardFront,
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
    ...SHADOWS.card,
  },
  countPlayContent: {
    flex: 1,
    paddingBottom: 12,
  },
  countTopHalf: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  countBottomHalf: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  countQuestionTitle: {
    color: FARM.headerTitleColor,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  countPlayMeta: {
    color: FARM.subtitleColor,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  countEquationWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 8,
    minHeight: 0,
  },
  countItemCard: {
    backgroundColor: FARM.cardMatched,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: FARM.cardMatchedBorder,
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  countItemNumber: {
    color: '#047857',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  countEmojiRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    gap: 6,
    minHeight: 82,
    overflow: 'hidden',
  },
  countEmoji: {
    fontSize: 42,
    lineHeight: 46,
  },
  countMathSign: {
    color: FARM.headerTitleColor,
    fontSize: 40,
    fontWeight: '900',
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  countResultWrap: {
    minWidth: 28,
    maxHeight: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    alignSelf: 'center',
  },
  countResultText: {
    color: FARM.headerTitleColor,
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
    marginTop: -4,
  },
  countOptionsWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: 'hidden',
    ...SHADOWS.header,
  },
  countOptionsTitle: {
    color: FARM.titleColor,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  countOptionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'flex-start',
    gap: 10,
  },
  countOptionButton: {
    minHeight: 84,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
    ...SHADOWS.button,
  },
  countOptionButtonHalf: {
    width: '47%',
    minWidth: 110,
  },
  countOptionText: {
    color: FARM.playButtonText,
    fontSize: 38,
    fontWeight: '900',
    lineHeight: 42,
  },
  diffCell: {
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  foundBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderColor: '#18C66A',
  },
});
