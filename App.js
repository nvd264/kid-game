import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';

// ============ SHARED DATA ============
const themes = {
  animals: {
    name: 'Con vật',
    emoji: '🐾',
    items: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸']
  },
  fruits: {
    name: 'Trái cây',
    emoji: '🍓',
    items: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🥝', '🍑', '🥭', '🍍']
  },
  vehicles: {
    name: 'Phương tiện',
    emoji: '🚗',
    items: ['🚗', '🚕', '🚌', '🚑', '🚒', '🚜', '🚲', '🛵', '✈️', '🚢']
  }
};
const THEME_ORDER = ['animals', 'fruits', 'vehicles'];

const soundAssets = {
  background:   require('./assets/sounds/background.mp3'),
  tap:          require('./assets/sounds/tap.mp3'),
  flip:         require('./assets/sounds/flip.mp3'),
  match:        require('./assets/sounds/match.mp3'),
  wrong:        require('./assets/sounds/wrong.mp3'),
  pick:         require('./assets/sounds/pick.mp3'),
  place:        require('./assets/sounds/place.mp3'),
  win:          require('./assets/sounds/win-fantasy.wav'),
  navigate:     require('./assets/sounds/navigate.mp3'),
  themeSelect:  require('./assets/sounds/themeSelect.mp3'),
  levelSelect:  require('./assets/sounds/levelSelect.mp3'),
  star1:        require('./assets/sounds/star1.mp3'),
  star2:        require('./assets/sounds/star2.mp3'),
  star3:        require('./assets/sounds/star3.mp3'),
  combo:        require('./assets/sounds/combo.mp3'),
};
const HAND_POINTER_ASSET = require('./assets/ui/hand-pointer.png');
const ANIMAL_SOUNDS = [
  {
    id: 'sparrow',
    name: 'Chim sẻ',
    emoji: '🐦',
    imageUri: 'https://images.pexels.com/photos/355154/pexels-photo-355154.jpeg',
    soundAssets: [
      require('./assets/sounds/animals/sparrow-1.wav'),
      require('./assets/sounds/animals/sparrow-2.wav'),
      require('./assets/sounds/animals/sparrow-3.wav'),
    ],
  },
  {
    id: 'dove',
    name: 'Bồ câu',
    emoji: '🕊️',
    imageUri: 'https://images.pexels.com/photos/6508358/pexels-photo-6508358.jpeg',
    soundAssets: [
      require('./assets/sounds/animals/dove-1.wav'),
      require('./assets/sounds/animals/dove-2.wav'),
      require('./assets/sounds/animals/dove-3.wav'),
    ],
  },
  {
    id: 'canary',
    name: 'Chim hoang yến',
    emoji: '🐤',
    imageUri: 'https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg',
    soundAssets: [
      require('./assets/sounds/animals/canary-1.wav'),
      require('./assets/sounds/animals/canary-2.wav'),
      require('./assets/sounds/animals/canary-3.wav'),
    ],
  },
  {
    id: 'nightingale',
    name: 'Chim sơn ca',
    emoji: '🐦',
    imageUri: 'https://images.pexels.com/photos/326900/pexels-photo-326900.jpeg',
    soundAssets: [
      require('./assets/sounds/animals/nightingale-1.wav'),
      require('./assets/sounds/animals/nightingale-2.wav'),
      require('./assets/sounds/animals/nightingale-3.wav'),
    ],
  },
  {
    id: 'cicada',
    name: 'Ve sầu',
    emoji: '🎵',
    imageUri: 'https://images.pexels.com/photos/2071882/pexels-photo-2071882.jpeg',
    soundAssets: [
      require('./assets/sounds/animals/cicada-1.wav'),
      require('./assets/sounds/animals/cicada-2.wav'),
      require('./assets/sounds/animals/cicada-3.wav'),
    ],
  },
  {
    id: 'bird',
    name: 'Chim non',
    emoji: '🐥',
    imageUri: 'https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg',
    soundAssets: [
      require('./assets/sounds/animals/bird-2.wav'),
      require('./assets/sounds/animals/bird-3.wav'),
      require('./assets/sounds/animals/bird.wav'),
    ],
  },
];

const SOUND_VOLUMES = {
  background: 0.12,
  tap: 0.4,
  flip: 0.42,
  match: 0.5,
  wrong: 0.45,
  pick: 0.42,
  place: 0.5,
  win: 0.5,
  navigate: 0.38,
  themeSelect: 0.45,
  levelSelect: 0.48,
  star1: 0.35,
  star2: 0.38,
  star3: 0.42,
  combo: 0.6,
};

const toCodePoint = (emoji) =>
  Array.from(emoji)
    .map((char) => char.codePointAt(0).toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');

const getEmojiImageUri = (emoji) =>
  `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${toCodePoint(emoji)}.png`;

// Twemoji icon with native emoji fallback
const Icon = ({ value, size }) => {
  const [loadFailed, setLoadFailed] = useState(false);
  if (!loadFailed && value) {
    return (
      <Image
        source={{ uri: getEmojiImageUri(value) }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setLoadFailed(true)}
      />
    );
  }
  return <Text style={{ fontSize: size * 0.85 }}>{value}</Text>;
};

// ============ AUDIO MANAGER ============
class SoundManager {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.backgroundEnabled = false;
    this.externalSound = null;
  }

  async loadSounds() {
    if (this.loaded) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });
      for (const [type, source] of Object.entries(soundAssets)) {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          isLooping: type === 'background',
          volume: SOUND_VOLUMES[type] ?? 0.4,
        });
        this.sounds[type] = sound;
      }
      this.loaded = true;
      await this.ensureBackgroundPlayback();
    } catch (error) {
      console.log('Error loading sounds:', error);
    }
  }

  async ensureBackgroundPlayback() {
    const bg = this.sounds.background;
    if (!bg) return;
    try {
      const status = await bg.getStatusAsync();
      if (!status.isLoaded) return;
      if (this.backgroundEnabled) {
        await bg.setVolumeAsync(SOUND_VOLUMES.background ?? 0.12);
        if (!status.isPlaying) await bg.playAsync();
      } else if (status.isPlaying) {
        await bg.pauseAsync();
      }
    } catch (error) {
      console.log('Error ensuring background playback:', error);
    }
  }

  async setBackgroundEnabled(enabled) {
    this.backgroundEnabled = enabled;
    await this.ensureBackgroundPlayback();
  }

  isBackgroundEnabled() {
    return this.backgroundEnabled;
  }

  async play(type) {
    if (type === 'background') {
      await this.ensureBackgroundPlayback();
      return;
    }
    const sound = this.sounds[type];
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  async playClip(source, volume = 0.42, options = {}) {
    const { waitForFinish = false, maxWaitMs = 2400 } = options;
    if (!source) return false;
    try {
      if (this.externalSound) {
        await this.externalSound.unloadAsync();
        this.externalSound = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false, isLooping: false, volume }
      );
      this.externalSound = sound;
      let finishResolver = null;
      const finishPromise = waitForFinish
        ? new Promise((resolve) => { finishResolver = resolve; })
        : null;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status?.isLoaded || status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
          if (this.externalSound === sound) this.externalSound = null;
          if (finishResolver) {
            finishResolver(true);
            finishResolver = null;
          }
        }
      });
      if (finishPromise) {
        await Promise.race([
          finishPromise,
          new Promise((resolve) => setTimeout(resolve, maxWaitMs)),
        ]);
      }
      return true;
    } catch (error) {
      console.log('Error playing clip sound:', error);
      if (this.externalSound) {
        try { await this.externalSound.unloadAsync(); } catch {}
        this.externalSound = null;
      }
      return false;
    }
  }

  async stopClip() {
    if (!this.externalSound) return;
    try {
      await this.externalSound.stopAsync();
    } catch {}
    try {
      await this.externalSound.unloadAsync();
    } catch {}
    this.externalSound = null;
  }

  async unloadSounds() {
    if (this.externalSound) {
      try { await this.externalSound.unloadAsync(); } catch {}
      this.externalSound = null;
    }
    for (const sound of Object.values(this.sounds)) {
      try { await sound.unloadAsync(); } catch {}
    }
    this.sounds = {};
    this.loaded = false;
  }
}

const soundManager = new SoundManager();
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============ SHARED UI COMPONENTS ============

// Button with scale-press animation
const AnimatedPressable = ({ onPress, style, children, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
      activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Memory card with flip (scaleX squish) and match bounce
const MemoryCard = ({ card, isFlipped, isMatched, cardSize, onPress, disabled, isHinted }) => {
  const flipAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
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
    if (!isMatched) {
      fadeAnim.setValue(1);
      return;
    }
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 520,
      useNativeDriver: true,
    }).start();
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

  const bg = isMatched ? '#E8FAEB' : '#FFFFFF';
  const shadow = isMatched
    ? { shadowColor: '#8EB990', shadowOpacity: 0.55, shadowRadius: 8, elevation: 8 }
    : { elevation: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4 };
  const hintScale = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const hintLift = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });
  const handLift = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [-22, -12] });
  const handScale = hintAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled || isMatched} activeOpacity={0.85}>
      <Animated.View style={[
        styles.card,
        shadow,
        {
          width: cardSize,
          height: cardSize,
          backgroundColor: bg,
          opacity: fadeAnim,
          borderWidth: isHinted && face === 'back' ? 4 : 3,
          borderColor: isHinted && face === 'back' ? '#FFE38B' : '#FFFFFF',
          transform: [
            { scaleX: flipAnim },
            { scale: scaleAnim },
            { scale: isHinted && face === 'back' ? hintScale : 1 },
            { translateY: isHinted && face === 'back' ? hintLift : 0 },
          ],
        }
      ]}>
        {face === 'front'
          ? <Icon value={card.value} size={cardSize * 0.65} />
          : (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: cardSize * 0.55, color: '#AFA3DE', fontWeight: '900' }}>?</Text>
            </View>
          )
        }
        {isHinted && face === 'back' && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.hintHandWrap,
              {
                width: cardSize * 0.72,
                height: cardSize * 0.72,
                top: -cardSize * 0.60,
                left: (cardSize - cardSize * 0.72) / 2,
                transform: [{ translateY: handLift }, { scale: handScale }],
              },
            ]}
          >
            <Image
              source={HAND_POINTER_ASSET}
              style={{ width: '100%', height: '100%' }}
              resizeMode="contain"
            />
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Find-difference cell with shake on wrong and bounce on found
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
    ? { shadowColor: '#8EB990', shadowOpacity: 0.55, shadowRadius: 6, elevation: 6 }
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

// Confetti particle
const CONFETTI_EMOJIS = ['⭐', '🌟', '✨', '🎉', '🎊', '💛', '🌈'];
const LEVEL_TIERS = ['easy', 'medium', 'hard', 'expert', 'master'];
const MAX_SUB_LEVELS = 3;
const RELEASED_SUB_LEVELS = 2; // TODO: enable sub-level 3 after tuning.

const makeLevelKey = (tier, subLevel) => `${tier}-${subLevel}`;
const getReleasedLevelConfigs = (configs) =>
  configs
    .filter((level) => LEVEL_TIERS.includes(level.tier))
    .filter((level) => level.subLevel >= 1 && level.subLevel <= MAX_SUB_LEVELS)
    .filter((level) => level.subLevel <= RELEASED_SUB_LEVELS)
    .sort((a, b) => LEVEL_TIERS.indexOf(a.tier) - LEVEL_TIERS.indexOf(b.tier) || a.subLevel - b.subLevel);

const getTierLabel = (tier) => {
  switch (tier) {
    case 'easy': return 'Dễ';
    case 'medium': return 'Vừa';
    case 'hard': return 'Khó';
    case 'expert': return 'Chuyên gia';
    case 'master': return 'Bậc thầy';
    default: return tier;
  }
};

const getTierIcon = (tier) => {
  switch (tier) {
    case 'easy': return '🐣';
    case 'medium': return '🐥';
    case 'hard': return '🦊';
    case 'expert': return '🚀';
    case 'master': return '👑';
    default: return '🎯';
  }
};
const ConfettiParticle = ({ anim, x, emoji, size }) => {
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -340] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.9, 0] });
  const rotate     = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(Math.random() > 0.5 ? 1 : -1) * 360}deg`] });
  return (
    <Animated.Text style={{
      position: 'absolute',
      bottom: 40,
      left: x,
      fontSize: size,
      opacity,
      transform: [{ translateY }, { rotate }],
    }}>{emoji}</Animated.Text>
  );
};

// Reward popup modal — shown after each level win
const RewardPopup = ({ visible, stars, levelNum, totalLevels, onContinue, onExit, playSound }) => {
  const starScales = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const confettiAnims = useRef(Array.from({ length: 18 }, () => new Animated.Value(0))).current;
  const celebrationStoppedRef = useRef(false);
  const timeoutIdsRef = useRef([]);

  const confettiData = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: Math.floor(Math.random() * (SCREEN_WIDTH - 40)),
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      size: 16 + Math.floor(Math.random() * 16),
    }))
  ).current;

  const stopCelebration = useCallback(() => {
    celebrationStoppedRef.current = true;
    timeoutIdsRef.current.forEach((id) => clearTimeout(id));
    timeoutIdsRef.current = [];
    confettiAnims.forEach((anim) => { anim.stopAnimation(); anim.setValue(0); });
  }, [confettiAnims]);

  const schedule = useCallback((delayMs, callback) => {
    const id = setTimeout(() => {
      if (!celebrationStoppedRef.current) callback();
    }, delayMs);
    timeoutIdsRef.current.push(id);
  }, []);

  useEffect(() => {
    if (!visible) { stopCelebration(); return; }
    celebrationStoppedRef.current = false;
    starScales.forEach((anim) => anim.setValue(0));
    schedule(120, () => playSound('win'));
    [0, 1, 2].forEach((i) => {
      if (i < stars) {
        schedule(300 + i * 320, () => {
          playSound(`star${i + 1}`);
          Animated.spring(starScales[i], { toValue: 1, useNativeDriver: true, bounciness: 20, speed: 16 }).start();
        });
      }
    });

    const runConfettiBurst = () => {
      if (celebrationStoppedRef.current) return;
      confettiAnims.forEach((anim) => { anim.stopAnimation(); anim.setValue(0); });
      Animated.stagger(45,
        confettiAnims.map((a) => Animated.timing(a, { toValue: 1, duration: 1400, useNativeDriver: true }))
      ).start(() => {
        if (celebrationStoppedRef.current) return;
        const t = setTimeout(runConfettiBurst, 260);
        timeoutIdsRef.current.push(t);
      });
    };
    const t = setTimeout(runConfettiBurst, 160);
    timeoutIdsRef.current.push(t);
    return () => { stopCelebration(); };
  }, [visible, stars]);

  const praiseText = stars >= 3 ? 'Xuất sắc! 🌟' : stars >= 2 ? 'Giỏi lắm! 😊' : 'Cố lên bé nhé! 💪';
  const isLastLevel = levelNum >= totalLevels;
  const continueLabel = stars <= 1 ? 'Chơi lại' : isLastLevel ? 'Về chọn game' : 'Tiếp theo ▶';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.popupOverlay}>
        {confettiAnims.map((anim, i) => (
          <ConfettiParticle key={i} anim={anim} x={confettiData[i].x} emoji={confettiData[i].emoji} size={confettiData[i].size} />
        ))}
        <View style={styles.popupCard}>
          <TouchableOpacity
            onPress={() => { stopCelebration(); playSound('tap'); onExit(); }}
            style={styles.popupCloseBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.popupCloseBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.popupPraiseText}>{praiseText}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
            {[0, 1, 2].map((i) => (
              <Animated.Text key={i} style={{ fontSize: 44, transform: [{ scale: starScales[i] }] }}>
                {i < stars ? '⭐' : '🌑'}
              </Animated.Text>
            ))}
          </View>

          <Text style={styles.popupLevelText}>{levelNum}/{totalLevels}</Text>

          <AnimatedPressable
            onPress={() => { stopCelebration(); playSound('tap'); onContinue(); }}
            style={{ width: '100%', marginTop: 18 }}
          >
            <LinearGradient colors={['#FFC8A4', '#FFAF92']} style={styles.winButton}>
              <Text style={styles.winButtonText}>{continueLabel}</Text>
            </LinearGradient>
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
};

const LevelProgressHeader = ({
  tier,
  levelNum,
  totalLevels,
}) => {
  const pct = Math.max(0, Math.min(1, levelNum / Math.max(1, totalLevels)));
  return (
    <View style={styles.levelHeaderCard}>
      <View style={styles.levelHeaderTopRow}>
        <View style={styles.levelHeaderTierIconWrap}>
          <Text style={styles.levelHeaderTierIcon}>{getTierIcon(tier)}</Text>
        </View>
        <View style={styles.levelHeaderValueWrap}>
          <Text style={styles.levelHeaderValueMain}>{levelNum}/{totalLevels}</Text>
        </View>
      </View>
      <View style={styles.levelHeaderBarTrack}>
        <View style={[styles.levelHeaderBarFill, { width: `${Math.round(pct * 100)}%` }]}>
          <View style={styles.levelHeaderProgressGlow} />
        </View>
      </View>
    </View>
  );
};

// ============================================
// GAME 1: MEMORY MATCH
// ============================================

// Theme card colours (background tint per theme)
const THEME_COLORS = {
  animals:  { bg: '#FFF7EB', accent: '#FFC375', border: '#FFDDAB' },
  fruits:   { bg: '#F7EEF8', accent: '#C289D1', border: '#DFB8E5' },
  vehicles: { bg: '#EDF6FE', accent: '#81ACDD', border: '#B6DCFB' },
};

// Full-card gradients for the new theme row cards
const THEME_GRADIENTS = {
  animals:  ['#FFC9AF', '#FFAEB6'],
  fruits:   ['#F6A8E3', '#C9A7EE'],
  vehicles: ['#ABD9FF', '#8FD5F8'],
};

// Level visual config
const LEVEL_CONFIG = {
  easy: { color: '#99CC9C', bg: '#F6FAF0', label: '⭐', desc: 'Khởi động nhẹ nhàng' },
  medium: { color: '#FDC175', bg: '#FFFAEB', label: '⭐⭐', desc: 'Tăng số lượng và nhịp độ' },
  hard: { color: '#F19492', bg: '#FFF2F4', label: '⭐⭐⭐', desc: 'Nhiều thẻ và ít sai sót' },
  expert: { color: '#C289D1', bg: '#F7EEF8', label: '⭐⭐⭐⭐', desc: 'Mật độ cao, phản xạ nhanh' },
  master: { color: '#8B92C5', bg: '#F0F1F9', label: '⭐⭐⭐⭐⭐', desc: 'Thử thách tối đa' },
};

const MEMORY_LEVELS = [
  { key: makeLevelKey('easy', 1), tier: 'easy', subLevel: 1, pairs: 2, cols: 2 },
  { key: makeLevelKey('easy', 2), tier: 'easy', subLevel: 2, pairs: 3, cols: 3 },
  { key: makeLevelKey('easy', 3), tier: 'easy', subLevel: 3, pairs: 4, cols: 3 },
  { key: makeLevelKey('medium', 1), tier: 'medium', subLevel: 1, pairs: 4, cols: 3 },
  { key: makeLevelKey('medium', 2), tier: 'medium', subLevel: 2, pairs: 5, cols: 4 },
  { key: makeLevelKey('medium', 3), tier: 'medium', subLevel: 3, pairs: 5, cols: 4 },
  { key: makeLevelKey('hard', 1), tier: 'hard', subLevel: 1, pairs: 6, cols: 4 },
  { key: makeLevelKey('hard', 2), tier: 'hard', subLevel: 2, pairs: 6, cols: 4 },
  { key: makeLevelKey('hard', 3), tier: 'hard', subLevel: 3, pairs: 7, cols: 4 },
  { key: makeLevelKey('expert', 1), tier: 'expert', subLevel: 1, pairs: 7, cols: 4 },
  { key: makeLevelKey('expert', 2), tier: 'expert', subLevel: 2, pairs: 8, cols: 4 },
  { key: makeLevelKey('expert', 3), tier: 'expert', subLevel: 3, pairs: 8, cols: 4 },
  { key: makeLevelKey('master', 1), tier: 'master', subLevel: 1, pairs: 8, cols: 4 },
  { key: makeLevelKey('master', 2), tier: 'master', subLevel: 2, pairs: 9, cols: 4 },
  { key: makeLevelKey('master', 3), tier: 'master', subLevel: 3, pairs: 10, cols: 5 },
];

const PUZZLE_LEVELS = [
  { key: makeLevelKey('easy', 1), tier: 'easy', subLevel: 1, maxCount: 3, optionCount: 3, mistakeBudget: 6, star2MaxWrong: 2 },
  { key: makeLevelKey('easy', 2), tier: 'easy', subLevel: 2, maxCount: 4, optionCount: 3, mistakeBudget: 5, star2MaxWrong: 2 },
  { key: makeLevelKey('easy', 3), tier: 'easy', subLevel: 3, maxCount: 4, optionCount: 4, mistakeBudget: 5, star2MaxWrong: 1 },
  { key: makeLevelKey('medium', 1), tier: 'medium', subLevel: 1, maxCount: 5, optionCount: 4, mistakeBudget: 4, star2MaxWrong: 1 },
  { key: makeLevelKey('medium', 2), tier: 'medium', subLevel: 2, maxCount: 6, optionCount: 4, mistakeBudget: 4, star2MaxWrong: 1 },
  { key: makeLevelKey('medium', 3), tier: 'medium', subLevel: 3, maxCount: 6, optionCount: 5, mistakeBudget: 4, star2MaxWrong: 1 },
  { key: makeLevelKey('hard', 1), tier: 'hard', subLevel: 1, maxCount: 7, optionCount: 5, mistakeBudget: 3, star2MaxWrong: 1 },
  { key: makeLevelKey('hard', 2), tier: 'hard', subLevel: 2, maxCount: 8, optionCount: 5, mistakeBudget: 3, star2MaxWrong: 1 },
  { key: makeLevelKey('hard', 3), tier: 'hard', subLevel: 3, maxCount: 8, optionCount: 6, mistakeBudget: 3, star2MaxWrong: 0 },
  { key: makeLevelKey('expert', 1), tier: 'expert', subLevel: 1, maxCount: 9, optionCount: 6, mistakeBudget: 3, star2MaxWrong: 0 },
  { key: makeLevelKey('expert', 2), tier: 'expert', subLevel: 2, maxCount: 10, optionCount: 6, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('expert', 3), tier: 'expert', subLevel: 3, maxCount: 10, optionCount: 7, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('master', 1), tier: 'master', subLevel: 1, maxCount: 11, optionCount: 7, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('master', 2), tier: 'master', subLevel: 2, maxCount: 12, optionCount: 7, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('master', 3), tier: 'master', subLevel: 3, maxCount: 12, optionCount: 8, mistakeBudget: 2, star2MaxWrong: 0 },
];

const MemoryGame = ({ playSound, onExit }) => {
  const releasedLevels = useMemo(() => getReleasedLevelConfigs(MEMORY_LEVELS), []);
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
    const unmatched = cards
      .map((c, idx) => ({ ...c, idx }))
      .filter((c) => !matched.includes(c.idx));
    if (unmatched.length < 2) return;

    let targetIndex = -1;
    if (focusIndex !== null && cards[focusIndex]) {
      const focusValue = cards[focusIndex].value;
      targetIndex = cards.findIndex(
        (c, idx) => idx !== focusIndex && c.value === focusValue && !matched.includes(idx)
      );
    }

    if (targetIndex < 0 && currentFlipped.length === 1) {
      const first = cards[currentFlipped[0]];
      targetIndex = cards.findIndex(
        (c, idx) => idx !== currentFlipped[0] && c.value === first.value && !matched.includes(idx)
      );
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
      if (!keepUntilPick) {
        setTimeout(() => setHintCardIndex(null), 2400);
      }
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
      <LinearGradient colors={['#CBE4FF', '#DCC7F7']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { color: '#536E88', textShadowColor: 'rgba(255,255,255,0.4)', textShadowRadius: 1 }]}>🃏 Chủ đề</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>🃏 Chọn bộ hình</Text>
          <Text style={styles.kidSelectIntroSub}>🎯 10 màn mở khóa</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {THEME_ORDER.map((key) => {
            const theme = themes[key];
            if (!theme) return null;
            return (
              <AnimatedPressable key={key}
                onPress={() => { playSound('themeSelect'); startGame(key, 0); }}>
                <LinearGradient colors={THEME_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.kidThemeCard}>
                  <View style={styles.kidThemeEmojiWrap}>
                    <Text style={styles.kidThemeEmoji}>{theme.emoji}</Text>
                  </View>
                  <View style={styles.kidThemeTextWrap}>
                    <Text style={styles.kidThemeName}>{theme.name}</Text>
                    <Text style={styles.kidThemeSub}>▶</Text>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
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
    const reservedHeight = 44 + 44 + 58 + 36 + 24;
    const availH = SCREEN_HEIGHT - reservedHeight;
    const availW = SCREEN_WIDTH - 32;

    const cardFromW = Math.floor((availW - gap * (cols - 1)) / cols);
    const cardFromH = Math.floor((availH - gap * (rows - 1)) / rows);
    const sizeCap = cols <= 2 ? 160 : cols === 3 ? 116 : 82;
    const cardSize  = Math.max(48, Math.min(cardFromW, cardFromH, sizeCap));

    const gridW = cols * cardSize + (cols - 1) * gap;

    return (
      <LinearGradient colors={['#FFC8A4', '#FFAF92']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <LevelProgressHeader
            tier={currentLevel.tier}
            levelNum={currentLevelIndex + 1}
            totalLevels={releasedLevels.length}
          />
        </View>
        <Text style={[styles.hintText, { marginBottom: 8 }]}>👀✨</Text>
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
        <RewardPopup
          visible={showPopup}
          stars={popupStars}
          levelNum={currentLevelIndex + 1}
          totalLevels={releasedLevels.length}
          onContinue={handleContinue}
          onExit={() => { setShowPopup(false); onExit(); }}
          playSound={playSound}
        />
      </LinearGradient>
    );
  }
  return null;
};

// ============================================
// GAME 2: ANIMAL SOUND QUIZ
// ============================================
const AnimalCard = ({ animal, isWrong, isCorrect, onPress, disabled }) => {
  const cardColors = isCorrect
    ? ['#ACDAAF', '#99CC9C']
    : isWrong
      ? ['#F6A2A0', '#F19492']
      : ['#FFFFFF', '#F8FAFF'];

  return (
    <AnimatedPressable onPress={onPress} disabled={disabled}>
      <LinearGradient
        colors={cardColors}
        style={styles.animalOptionCard}
      >
        <View style={styles.animalEmojiHeroWrap}>
          <Icon value={animal.emoji} size={74} />
        </View>
        <Text style={[styles.animalOptionName, (isWrong || isCorrect) && { color: '#FFF' }]}>{animal.name}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const AnimalSoundGame = ({ playSound, playAnimalSound, stopAnimalSound, onExit }) => {
  const levels = {
    easy: { name: 'Dễ', optionCount: 2, roundsToWin: 4 },
    medium: { name: 'Vừa', optionCount: 3, roundsToWin: 5 },
    hard: { name: 'Khó', optionCount: 4, roundsToWin: 6 },
  };

  const [screen, setScreen] = useState('level');
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [currentRound, setCurrentRound] = useState(1);
  const [wrongPicks, setWrongPicks] = useState(0);
  const [selectedWrongId, setSelectedWrongId] = useState(null);
  const [isPlayingAnimalSound, setIsPlayingAnimalSound] = useState(false);
  const [isRoundPreparing, setIsRoundPreparing] = useState(false);
  const [isCorrectCelebrating, setIsCorrectCelebrating] = useState(false);
  const [selectedCorrectId, setSelectedCorrectId] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStars, setPopupStars] = useState(0);
  const roundPlaybackTokenRef = useRef(0);

  const generateRound = useCallback((levelKey) => {
    const levelConfig = levels[levelKey];
    if (!levelConfig) return;

    const shuffled = [...ANIMAL_SOUNDS].sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, levelConfig.optionCount);
    const answer = options[Math.floor(Math.random() * options.length)];
    setRoundData({ answer, options });
    setSelectedWrongId(null);
  }, []);

  const playRoundSound = useCallback(async () => {
    const availableSounds = roundData?.answer?.soundAssets;
    if (!availableSounds?.length || isPlayingAnimalSound) return;
    setIsPlayingAnimalSound(true);
    const randomIndex = Math.floor(Math.random() * availableSounds.length);
    await playAnimalSound(availableSounds[randomIndex], { waitForFinish: true, maxWaitMs: 2400 });
    setTimeout(() => setIsPlayingAnimalSound(false), 500);
  }, [roundData, isPlayingAnimalSound, playAnimalSound]);

  const playRoundSoundSequence = useCallback(async () => {
    const availableSounds = roundData?.answer?.soundAssets;
    if (!availableSounds?.length) return;

    const playbackToken = roundPlaybackTokenRef.current + 1;
    roundPlaybackTokenRef.current = playbackToken;
    setIsRoundPreparing(true);

    for (let repeat = 0; repeat < 3; repeat += 1) {
      if (roundPlaybackTokenRef.current !== playbackToken) return;
      const randomIndex = Math.floor(Math.random() * availableSounds.length);
      await playAnimalSound(availableSounds[randomIndex], { waitForFinish: true, maxWaitMs: 2400 });
      if (roundPlaybackTokenRef.current !== playbackToken) return;
      if (repeat < 2) {
        await new Promise((resolve) => setTimeout(resolve, 320));
      }
    }

    if (roundPlaybackTokenRef.current === playbackToken) {
      setIsRoundPreparing(false);
    }
  }, [roundData, playAnimalSound]);

  const startGame = useCallback((levelKey) => {
    setSelectedLevel(levelKey);
    setCurrentRound(1);
    setWrongPicks(0);
    setSelectedWrongId(null);
    setSelectedCorrectId(null);
    setIsCorrectCelebrating(false);
    setIsRoundPreparing(false);
    generateRound(levelKey);
    setScreen('play');
  }, [generateRound]);

  useEffect(() => {
    if (screen !== 'play' || !roundData) return;
    const timeout = setTimeout(() => {
      playRoundSoundSequence();
    }, 450);
    return () => {
      clearTimeout(timeout);
      roundPlaybackTokenRef.current += 1;
      setIsRoundPreparing(false);
      setIsPlayingAnimalSound(false);
    };
  }, [screen, roundData, playRoundSoundSequence]);

  const handlePickAnimal = (pickedAnimal) => {
    if (!roundData || !selectedLevel) return;
    if (isCorrectCelebrating) return;
    if (pickedAnimal.id === roundData.answer.id) {
      roundPlaybackTokenRef.current += 1;
      setIsRoundPreparing(false);
      setIsPlayingAnimalSound(false);
      stopAnimalSound?.();
      playSound('match');
      setSelectedCorrectId(pickedAnimal.id);
      setIsCorrectCelebrating(true);
      const nextRound = currentRound + 1;
      const goal = levels[selectedLevel].roundsToWin;
      if (nextRound > goal) {
        setTimeout(() => {
          const s = wrongPicks === 0 ? 3 : wrongPicks <= 2 ? 2 : 1;
          setPopupStars(s);
          setShowPopup(true);
          setIsCorrectCelebrating(false);
          setSelectedCorrectId(null);
        }, 900);
        return;
      }
      setTimeout(() => {
        setCurrentRound(nextRound);
        setSelectedCorrectId(null);
        setIsCorrectCelebrating(false);
        generateRound(selectedLevel);
      }, 900);
      return;
    }

    playSound('wrong');
    setWrongPicks((value) => value + 1);
    setSelectedWrongId(pickedAnimal.id);
    setTimeout(() => setSelectedWrongId(null), 420);
  };

  const getStars = () => {
    if (wrongPicks === 0) return 3;
    if (wrongPicks <= 2) return 2;
    return 1;
  };

  if (screen === 'level') {
    const LEVEL_UI = {
      easy: { emoji: '🌟', badge: '2 lựa chọn', rounds: '4 câu', meter: 1 },
      medium: { emoji: '🎧', badge: '3 lựa chọn', rounds: '5 câu', meter: 2 },
      hard: { emoji: '🚀', badge: '4 lựa chọn', rounds: '6 câu', meter: 3 },
    };
    const LEVEL_GRADIENTS = {
      easy: ['#8FDDF6', '#8FBAF5'],
      medium: ['#F8C89D', '#F6DB89'],
      hard: ['#E9B0B4', '#ECB9B0'],
    };

    return (
      <LinearGradient colors={['#A9B3FF', '#C8A6FF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <Text style={styles.headerTitle}>🐾 Nghe tiếng thú</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>🔊 Chọn con đúng</Text>
          <Text style={styles.kidSelectIntroSub}>👂➡️🐾</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {Object.entries(levels).map(([key, level]) => {
            const lv = LEVEL_UI[key];
            return (
              <AnimatedPressable key={key} onPress={() => { playSound('levelSelect'); startGame(key); }}>
                <LinearGradient colors={LEVEL_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.kidLevelCard}>
                  <View style={styles.kidLevelTopRow}>
                    <Text style={styles.kidLevelEmoji}>{lv.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.kidLevelName}>{level.name}</Text>
                    </View>
                    <Text style={styles.kidLevelArrow}>▶</Text>
                  </View>
                  <View style={styles.levelVisualRow}>
                    <View style={styles.levelMiniBadge}>
                      <Text style={styles.levelMiniBadgeText}>{lv.badge}</Text>
                    </View>
                    <View style={styles.levelMiniBadge}>
                      <Text style={styles.levelMiniBadgeText}>{lv.rounds}</Text>
                    </View>
                    <View style={styles.levelDotsRow}>
                      {[0, 1, 2].map((i) => (
                        <View key={i} style={[styles.levelDot, i < lv.meter && styles.levelDotActive]} />
                      ))}
                    </View>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
      </LinearGradient>
    );
  }

  if (screen === 'play' && roundData && selectedLevel) {
    const levelConfig = levels[selectedLevel];
    return (
      <LinearGradient colors={['#A9B3FF', '#C8A6FF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <View style={styles.statPill}>
            <Text style={styles.animalRoundText}>Câu {currentRound}/{levelConfig.roundsToWin}</Text>
          </View>
        </View>

        <View style={styles.animalPlayContent}>
          <Text style={styles.animalInstructionTitle}>Nghe tiếng và chọn đúng con vật</Text>
          <Text style={styles.animalInstructionSub}>
            {isRoundPreparing ? 'Đang phát 3 lần, bé lắng nghe nhé...' : 'Bấm vào nút loa để nghe lại âm thanh'}
          </Text>

          <AnimatedPressable onPress={playRoundSound} disabled={isPlayingAnimalSound || isCorrectCelebrating}>
            <LinearGradient colors={['#FFFFFF', '#F0F6FF']} style={styles.soundPlayButton}>
              <Text style={styles.soundPlayButtonIcon}>{(isPlayingAnimalSound || isRoundPreparing) ? '🔊' : '🔈'}</Text>
            </LinearGradient>
          </AnimatedPressable>

          <View style={styles.animalOptionsGrid}>
            {roundData.options.map((animal) => (
              <AnimalCard
                key={animal.id}
                animal={animal}
                isWrong={selectedWrongId === animal.id}
                isCorrect={selectedCorrectId === animal.id}
                disabled={isCorrectCelebrating}
                onPress={() => handlePickAnimal(animal)}
              />
            ))}
          </View>
          {isCorrectCelebrating && (
            <View style={styles.correctToast}>
              <Text style={styles.correctToastIcon}>🎉</Text>
              <Text style={styles.correctToastText}>Chúc mừng bé chọn đúng!</Text>
            </View>
          )}
        </View>
        <RewardPopup
          visible={showPopup}
          stars={popupStars}
          levelNum={1}
          totalLevels={1}
          onContinue={() => { setShowPopup(false); startGame(selectedLevel); }}
          onExit={() => { setShowPopup(false); onExit(); }}
          playSound={playSound}
        />
      </LinearGradient>
    );
  }
  return null;
};

const GardenDraggableItem = React.memo(function GardenDraggableItem({
  item,
  disabled,
  isDone,
  isWrong,
  wrongMarkOpacity,
  onTap,
  onDropAtScreen,
  allowTap,
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  const onGestureEvent = useMemo(
    () => Animated.event([{ nativeEvent: { translationX: tx, translationY: ty } }], { useNativeDriver: false }),
    [tx, ty]
  );

  const resetPosition = useCallback(() => {
    Animated.parallel([
      Animated.spring(tx, { toValue: 0, useNativeDriver: false, bounciness: 8, speed: 18 }),
      Animated.spring(ty, { toValue: 0, useNativeDriver: false, bounciness: 8, speed: 18 }),
    ]).start();
  }, [tx, ty]);

  const handleStateChange = useCallback((e) => {
    const { state, oldState, absoluteX, absoluteY } = e.nativeEvent;
    if (oldState === State.ACTIVE && (state === State.END || state === State.CANCELLED)) {
      onDropAtScreen(item.id, absoluteX, absoluteY);
      resetPosition();
    }
  }, [item.id, onDropAtScreen, resetPosition]);

  const handleTap = useCallback(() => {
    if (!allowTap) return;
    onTap(item.id);
    resetPosition();
  }, [allowTap, item.id, onTap, resetPosition]);

  return (
    <PanGestureHandler enabled={!disabled} onGestureEvent={onGestureEvent} onHandlerStateChange={handleStateChange}>
      <Animated.View style={[
        styles.gardenDragWrap,
        { transform: [{ translateX: tx }, { translateY: ty }],
          opacity: disabled ? 0.65 : 1 }
      ]}>
        <TouchableOpacity activeOpacity={0.9} onPress={handleTap} disabled={disabled || !allowTap}>
          <LinearGradient colors={isDone ? ['#E6FAEA', '#DBF4E1'] : ['#FFFFFF', '#F8FFFA']} style={styles.gardenDragItem}>
            <Text style={styles.gardenDragEmoji}>{item.emoji}</Text>
            {isDone && (
              <View style={styles.gardenCheckBadge}>
                <Text style={styles.gardenCheckBadgeText}>✓</Text>
              </View>
            )}
            {isWrong && (
              <Animated.View style={[styles.gardenWrongMark, { opacity: wrongMarkOpacity }]}>
                <Text style={styles.gardenWrongMarkText}>✕</Text>
              </Animated.View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
});

// ============================================
// GAME 3: GARDEN HARVEST
// ============================================
const GARDEN_TASK_TYPE = {
  HARVEST: 'harvest',
  FEED: 'feed',
  WATER: 'water',
};

const GARDEN_TASK_META = {
  [GARDEN_TASK_TYPE.HARVEST]: {
    id: GARDEN_TASK_TYPE.HARVEST,
    title: 'Thu hoạch',
    prompt: 'Chạm để hái đúng nông sản',
    actionHint: '👉 Đúng món',
    icon: '🧺',
    targetEmojiPool: ['🍎', '🍓', '🍇', '🥕'],
    targetName: 'Nông sản',
    distractorEmojiPool: ['🍄', '🪨', '🍋', '🌰'],
    targetLabel: 'Giỏ thu hoạch',
    successToast: 'Giỏ đầy rồi!',
    interaction: 'tap',
  },
  [GARDEN_TASK_TYPE.FEED]: {
    id: GARDEN_TASK_TYPE.FEED,
    title: 'Cho ăn',
    prompt: 'Kéo đồ ăn vào đúng chỗ',
    actionHint: 'Kéo thức ăn vào bạn thỏ',
    icon: '🐰',
    targetEmojiPool: ['🥕', '🥬', '🍏', '🌽'],
    targetName: 'Thức ăn',
    distractorEmojiPool: ['🍋', '🧅', '🪨', '🫑'],
    targetLabel: 'Bạn thỏ đang đói',
    successToast: 'Bạn thỏ no rồi!',
    interaction: 'drag',
  },
  [GARDEN_TASK_TYPE.WATER]: {
    id: GARDEN_TASK_TYPE.WATER,
    title: 'Tưới nước',
    prompt: 'Kéo giọt nước vào luống hoa',
    actionHint: 'Kéo giọt nước vào luống hoa',
    icon: '🌼',
    targetEmojiPool: ['💧', '🫧', '🚿'],
    targetName: 'Nước tưới',
    distractorEmojiPool: ['🪨', '🍂', '🧱', '🥥'],
    targetLabel: 'Luống hoa',
    successToast: 'Hoa nở đẹp quá!',
    interaction: 'drag',
  },
};

const GARDEN_LEVELS = [
  { id: 1, key: makeLevelKey('easy', 1), tier: 'easy', subLevel: 1, taskType: GARDEN_TASK_TYPE.HARVEST, targetCount: 4, distractorCount: 1, timeLimit: 40, maxMistakes: 6, tapAssist: true, sequence: false },
  { id: 2, key: makeLevelKey('easy', 2), tier: 'easy', subLevel: 2, taskType: GARDEN_TASK_TYPE.FEED, targetCount: 4, distractorCount: 1, timeLimit: 38, maxMistakes: 6, tapAssist: true, sequence: false },
  { id: 3, key: makeLevelKey('easy', 3), tier: 'easy', subLevel: 3, taskType: GARDEN_TASK_TYPE.WATER, targetCount: 5, distractorCount: 1, timeLimit: 38, maxMistakes: 6, tapAssist: true, sequence: false },
  { id: 4, key: makeLevelKey('medium', 1), tier: 'medium', subLevel: 1, taskType: GARDEN_TASK_TYPE.HARVEST, targetCount: 5, distractorCount: 2, timeLimit: 34, maxMistakes: 5, tapAssist: false, sequence: false },
  { id: 5, key: makeLevelKey('medium', 2), tier: 'medium', subLevel: 2, taskType: GARDEN_TASK_TYPE.WATER, targetCount: 5, distractorCount: 2, timeLimit: 33, maxMistakes: 5, tapAssist: false, sequence: false },
  { id: 6, key: makeLevelKey('medium', 3), tier: 'medium', subLevel: 3, taskType: GARDEN_TASK_TYPE.FEED, targetCount: 6, distractorCount: 2, timeLimit: 32, maxMistakes: 5, tapAssist: false, sequence: false },
  { id: 7, key: makeLevelKey('hard', 1), tier: 'hard', subLevel: 1, taskType: GARDEN_TASK_TYPE.FEED, targetCount: 6, distractorCount: 3, timeLimit: 30, maxMistakes: 4, tapAssist: false, sequence: true },
  { id: 8, key: makeLevelKey('hard', 2), tier: 'hard', subLevel: 2, taskType: GARDEN_TASK_TYPE.HARVEST, targetCount: 6, distractorCount: 3, timeLimit: 28, maxMistakes: 4, tapAssist: false, sequence: true },
  { id: 9, key: makeLevelKey('hard', 3), tier: 'hard', subLevel: 3, taskType: GARDEN_TASK_TYPE.WATER, targetCount: 6, distractorCount: 3, timeLimit: 28, maxMistakes: 4, tapAssist: false, sequence: true },
  { id: 10, key: makeLevelKey('expert', 1), tier: 'expert', subLevel: 1, taskType: GARDEN_TASK_TYPE.WATER, targetCount: 7, distractorCount: 3, timeLimit: 26, maxMistakes: 3, tapAssist: false, sequence: true },
  { id: 11, key: makeLevelKey('expert', 2), tier: 'expert', subLevel: 2, taskType: GARDEN_TASK_TYPE.FEED, targetCount: 7, distractorCount: 4, timeLimit: 24, maxMistakes: 3, tapAssist: false, sequence: true },
  { id: 12, key: makeLevelKey('expert', 3), tier: 'expert', subLevel: 3, taskType: GARDEN_TASK_TYPE.HARVEST, targetCount: 7, distractorCount: 4, timeLimit: 24, maxMistakes: 3, tapAssist: false, sequence: true },
  { id: 13, key: makeLevelKey('master', 1), tier: 'master', subLevel: 1, taskType: GARDEN_TASK_TYPE.HARVEST, targetCount: 8, distractorCount: 4, timeLimit: 22, maxMistakes: 3, tapAssist: false, sequence: true },
  { id: 14, key: makeLevelKey('master', 2), tier: 'master', subLevel: 2, taskType: GARDEN_TASK_TYPE.WATER, targetCount: 8, distractorCount: 4, timeLimit: 20, maxMistakes: 2, tapAssist: false, sequence: true },
  { id: 15, key: makeLevelKey('master', 3), tier: 'master', subLevel: 3, taskType: GARDEN_TASK_TYPE.FEED, targetCount: 9, distractorCount: 5, timeLimit: 18, maxMistakes: 2, tapAssist: false, sequence: true },
];

const GardenHarvestGame = ({ playSound, onExit }) => {
  const releasedLevels = useMemo(() => getReleasedLevelConfigs(GARDEN_LEVELS), []);
  const [screen, setScreen] = useState('play');
  const [levelIndex, setLevelIndex] = useState(0);
  const [playItems, setPlayItems] = useState([]);
  const [taskProgress, setTaskProgress] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [wrongPicks, setWrongPicks] = useState(0);
  const [, setComboStreak] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [hintVisible, setHintVisible] = useState(false);
  const [selectedWrongItem, setSelectedWrongItem] = useState(null);
  const [successToast, setSuccessToast] = useState('');
  const [targetRect, setTargetRect] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupStars, setPopupStars] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sequenceTarget, setSequenceTarget] = useState([]);
  const targetRef = useRef(null);
  const wrongMarkOpacity = useRef(new Animated.Value(0)).current;

  const currentLevel = releasedLevels[levelIndex] || null;
  const currentMeta = currentLevel ? GARDEN_TASK_META[currentLevel.taskType] : null;

  const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);
  const chooseRandom = (pool) => pool[Math.floor(Math.random() * pool.length)];

  const buildLevelItems = useCallback((level) => {
    if (!level) return { items: [], sequence: [] };
    const meta = GARDEN_TASK_META[level.taskType];

    const sequence = Array.from({ length: level.targetCount }, () => chooseRandom(meta.targetEmojiPool));
    const items = sequence.map((emoji, i) => ({
      id: `target-${level.id}-${i}`,
      kind: 'target',
      emoji,
      done: false,
    }));

    for (let i = 0; i < level.distractorCount; i += 1) {
      items.push({
        id: `wrong-${level.id}-${i}`,
        kind: 'wrong',
        emoji: chooseRandom(meta.distractorEmojiPool),
        done: false,
      });
    }
    return { items: shuffled(items), sequence };
  }, []);

  const prepareLevel = useCallback((level) => {
    const next = buildLevelItems(level);
    setPlayItems(next.items);
    setSequenceTarget(next.sequence);
    setTaskProgress(0);
    setHintVisible(false);
    setSelectedWrongItem(null);
    setSuccessToast('');
    setTargetRect(null);
    setTimeLeft(level?.timeLimit ?? 0);
    setTotalCorrect(0);
    setWrongPicks(0);
    setComboStreak(0);
    setBestCombo(0);
    wrongMarkOpacity.setValue(0);
  }, [buildLevelItems, wrongMarkOpacity]);

  useEffect(() => {
    if (currentLevel) prepareLevel(currentLevel);
  }, [currentLevel, prepareLevel]);

  useEffect(() => {
    if (!currentLevel || showPopup) return;
    const timer = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timer);
          setSuccessToast('Hết giờ rồi, thử lại màn này nhé!');
          setTimeout(() => {
            setSuccessToast('');
            setPopupStars(1);
            setShowPopup(true);
          }, 420);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentLevel, showPopup]);

  const refreshTargetRect = useCallback(() => {
    if (!targetRef.current) return;
    targetRef.current.measureInWindow((x, y, width, height) => {
      setTargetRect({ x, y, width, height });
    });
  }, []);

  useLayoutEffect(() => {
    if (screen !== 'play' || currentMeta?.interaction !== 'drag') return;
    const timeout = setTimeout(refreshTargetRect, 120);
    return () => clearTimeout(timeout);
  }, [screen, levelIndex, currentMeta, refreshTargetRect]);

  const getStars = useCallback(() => {
    if (!currentLevel) return 1;
    const accuracy = totalCorrect / Math.max(1, totalCorrect + wrongPicks);
    if (wrongPicks === 0 && accuracy >= 0.9 && timeLeft >= Math.ceil(currentLevel.timeLimit * 0.35)) return 3;
    if (wrongPicks <= Math.max(1, currentLevel.maxMistakes - 2) && accuracy >= 0.65) return 2;
    return 1;
  }, [currentLevel, timeLeft, totalCorrect, wrongPicks]);

  const registerWrongPick = useCallback((itemId, customHint = null) => {
    if (!currentLevel) return;
    playSound('wrong');
    setComboStreak(0);
    setSelectedWrongItem(itemId);
    wrongMarkOpacity.setValue(1);
    Animated.timing(wrongMarkOpacity, {
      toValue: 0,
      duration: 520,
      useNativeDriver: true,
    }).start(() => {
      setSelectedWrongItem(null);
    });
    setWrongPicks((value) => {
      const next = value + 1;
      if (next >= currentLevel.maxMistakes) {
        setSuccessToast('Ôi, hết lượt sai rồi!');
        setTimeout(() => {
          setSuccessToast('');
          setPopupStars(1);
          setShowPopup(true);
        }, 420);
      }
      return next;
    });
    if (currentLevel.tier === 'easy' || currentLevel.tier === 'medium') {
      setHintVisible(true);
      setTimeout(() => setHintVisible(false), 1500);
    }
    if (customHint) {
      setSuccessToast(customHint);
      setTimeout(() => setSuccessToast(''), 1100);
    }
  }, [currentLevel, playSound, wrongMarkOpacity]);

  const goNextLevel = useCallback(() => {
    const nextLevelIndex = levelIndex + 1;
    if (nextLevelIndex >= releasedLevels.length) {
      setPopupStars(getStars());
      setShowPopup(true);
      return;
    }
    setLevelIndex(nextLevelIndex);
  }, [getStars, levelIndex, releasedLevels.length]);

  const registerCorrectPick = useCallback((itemId) => {
    if (!currentLevel || !currentMeta) return;
    const item = playItems.find((entry) => entry.id === itemId);
    if (!item || item.done) return;

    const expectedEmoji = sequenceTarget[taskProgress] || null;
    if (currentLevel.sequence && expectedEmoji && item.emoji !== expectedEmoji) {
      registerWrongPick(itemId, `Thử theo thứ tự: ${expectedEmoji}`);
      return;
    }

    playSound('match');
    setPlayItems((prev) =>
      prev.map((entry) => (entry.id === itemId ? { ...entry, done: true } : entry))
    );
    setTaskProgress((prev) => {
      const next = prev + 1;
      if (next >= currentLevel.targetCount) {
        setSuccessToast(currentMeta.successToast);
        setTimeout(() => {
          setSuccessToast('');
          const stars = getStars();
          if (stars <= 1) {
            setPopupStars(1);
            setShowPopup(true);
          } else {
            goNextLevel();
          }
        }, 720);
      }
      return next;
    });
    setTotalCorrect((value) => value + 1);
    setComboStreak((value) => {
      const next = value + 1;
      setBestCombo((best) => Math.max(best, next));
      return next;
    });
  }, [currentLevel, currentMeta, getStars, goNextLevel, playItems, playSound, registerWrongPick, sequenceTarget, taskProgress]);

  const handleHarvestTap = useCallback((itemId) => {
    const item = playItems.find((entry) => entry.id === itemId);
    if (!item || item.done) return;
    if (item.kind === 'target') {
      registerCorrectPick(itemId);
      return;
    }
    registerWrongPick(itemId);
  }, [playItems, registerCorrectPick, registerWrongPick]);

  const isInsideTarget = useCallback((absX, absY) => {
    if (!targetRect) return false;
    return (
      absX >= targetRect.x &&
      absX <= targetRect.x + targetRect.width &&
      absY >= targetRect.y &&
      absY <= targetRect.y + targetRect.height
    );
  }, [targetRect]);

  const handleDropAtScreen = useCallback((itemId, absX, absY) => {
    const item = playItems.find((entry) => entry.id === itemId);
    if (!item || item.done) return;
    if (!isInsideTarget(absX, absY)) {
      registerWrongPick(itemId);
      return;
    }
    if (item.kind === 'target') {
      registerCorrectPick(itemId);
      return;
    }
    registerWrongPick(itemId);
  }, [isInsideTarget, playItems, registerCorrectPick, registerWrongPick]);

  const handleDragTap = useCallback((itemId) => {
    const item = playItems.find((entry) => entry.id === itemId);
    if (!item || item.done) return;
    if (!currentLevel?.tapAssist) {
      registerWrongPick(itemId, 'Màn này cần kéo thả vào đúng mục tiêu nhé!');
      return;
    }
    if (item.kind === 'target') {
      registerCorrectPick(itemId);
      return;
    }
    registerWrongPick(itemId);
  }, [currentLevel, playItems, registerCorrectPick, registerWrongPick]);

  const handleContinue = () => {
    setShowPopup(false);
    if (popupStars <= 1) {
      if (currentLevel) prepareLevel(currentLevel);
    } else if (levelIndex < releasedLevels.length - 1) {
      setLevelIndex((value) => value + 1);
    } else {
      onExit();
    }
  };

  if (screen === 'play' && currentLevel && currentMeta) {
    const finishedCount = playItems.filter((item) => item.kind === 'target' && item.done).length;
    const taskLeft = Math.max(0, currentLevel.targetCount - finishedCount);
    const visibleItems = playItems.filter((item) => !item.done);
    const isDragTask = currentMeta.interaction === 'drag';
    const nextVisibleTarget = visibleItems.find((item) => item.kind === 'target');
    const previewEmoji = currentLevel.sequence
      ? (sequenceTarget[taskProgress] || nextVisibleTarget?.emoji || currentMeta.targetEmojiPool[0])
      : currentMeta.icon;
    const mistakesLeft = Math.max(0, currentLevel.maxMistakes - wrongPicks);

    return (
      <LinearGradient colors={['#CDEFD7', '#C4E6FF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <LevelProgressHeader
            tier={currentLevel.tier}
            levelNum={levelIndex + 1}
            totalLevels={releasedLevels.length}
          />
        </View>

        <View style={styles.gardenPlayWrap}>
          <View style={styles.gardenMissionCard}>
            <Text style={styles.gardenMissionTitle}>{currentMeta.title} · {getTierLabel(currentLevel.tier)}</Text>
            <View style={styles.gardenMissionStatsRow}>
              <View style={styles.gardenMissionStatChip}>
                <Text style={styles.gardenMissionStatText}>🎯 {taskLeft}</Text>
              </View>
              <View style={styles.gardenMissionStatChip}>
                <Text style={styles.gardenMissionStatText}>⏱️ {timeLeft}s</Text>
              </View>
              <View style={styles.gardenMissionStatChip}>
                <Text style={styles.gardenMissionStatText}>❤️ {mistakesLeft}</Text>
              </View>
            </View>
            <View style={styles.gardenTargetPreviewCard}>
              <View style={styles.gardenTargetPreviewIconWrap}>
                <Text style={styles.gardenTargetPreviewEmoji}>{previewEmoji}</Text>
              </View>
            </View>
            <Text style={styles.gardenMissionHint}>{currentMeta.actionHint}</Text>
            {currentLevel.sequence && (
              <Text style={styles.gardenMissionHint}>✨ Làm đúng theo thứ tự</Text>
            )}
            {hintVisible && (
              <View style={styles.gardenHintBubble}>
                <Text style={styles.gardenHintText}>Gợi ý: {currentMeta.actionHint}</Text>
              </View>
            )}
            {successToast ? (
              <View style={styles.gardenToast}>
                <Text style={styles.gardenToastText}>{successToast}</Text>
              </View>
            ) : null}
          </View>

          {isDragTask ? (
            <View style={styles.gardenDragTaskWrap}>
              <View ref={targetRef} onLayout={refreshTargetRect} style={styles.gardenDropZone}>
                <Text style={styles.gardenDropZoneIcon}>{currentMeta.icon}</Text>
                <Text style={styles.gardenDropZoneLabel}>{currentMeta.targetLabel}</Text>
                <Text style={styles.gardenDropZoneCounter}>
                  {taskProgress}/{currentLevel.targetCount}
                </Text>
              </View>

              <View style={styles.gardenDragTray}>
                {visibleItems.map((item) => (
                  <GardenDraggableItem
                    key={item.id}
                    item={item}
                    disabled={item.done}
                    isDone={item.done}
                    isWrong={selectedWrongItem === item.id}
                    wrongMarkOpacity={wrongMarkOpacity}
                    onTap={handleDragTap}
                    onDropAtScreen={handleDropAtScreen}
                    allowTap={currentLevel.tapAssist}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.gardenHarvestGrid}>
              {visibleItems.map((item) => {
                const isWrong = selectedWrongItem === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleHarvestTap(item.id)}
                    disabled={item.done}
                    activeOpacity={0.86}
                  >
                    <LinearGradient
                      colors={isWrong ? ['#F6A2A0', '#F19492'] : item.done ? ['#E6FAEA', '#DBF4E1'] : ['#FFFFFF', '#F8FFFA']}
                      style={styles.gardenHarvestItem}
                    >
                      <Text style={styles.gardenHarvestEmoji}>{item.emoji}</Text>
                      {item.done && (
                        <View style={styles.gardenCheckBadge}>
                          <Text style={styles.gardenCheckBadgeText}>✓</Text>
                        </View>
                      )}
                      {isWrong && (
                        <Animated.View style={[styles.gardenWrongMark, { opacity: wrongMarkOpacity }]}>
                          <Text style={styles.gardenWrongMarkText}>✕</Text>
                        </Animated.View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        <RewardPopup
          visible={showPopup}
          stars={popupStars}
          levelNum={levelIndex + 1}
          totalLevels={releasedLevels.length}
          onContinue={handleContinue}
          onExit={() => { setShowPopup(false); onExit(); }}
          playSound={playSound}
        />
      </LinearGradient>
    );
  }
  return null;
};

// ============================================
// RESTORED GAME: COUNTING QUIZ
// ============================================
const PuzzleGame = ({ playSound, onExit }) => {
  const releasedLevels = useMemo(() => getReleasedLevelConfigs(PUZZLE_LEVELS), []);
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

    // Fallback before first layout pass completes.
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

    // Keep extra headroom because emoji glyph bounds are not exact squares.
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
      <LinearGradient colors={['#A0D2A6', '#8DC2AF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <Text style={[styles.headerTitle, { color: '#4F6F67', textShadowColor: 'rgba(255,255,255,0.4)', textShadowRadius: 1 }]}>🧮 Chủ đề</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>🧮 Đếm & chọn số</Text>
          <Text style={styles.kidSelectIntroSub}>🎯 10 màn mở khóa</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {THEME_ORDER.map((key) => {
            const theme = themes[key];
            if (!theme) return null;
            return (
              <AnimatedPressable key={key}
                onPress={() => { playSound('themeSelect'); startGame(key, 0); }}>
                <LinearGradient colors={THEME_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.kidThemeCard}>
                  <View style={styles.kidThemeEmojiWrap}>
                    <Text style={styles.kidThemeEmoji}>{theme.emoji}</Text>
                  </View>
                  <View style={styles.kidThemeTextWrap}>
                    <Text style={styles.kidThemeName}>{theme.name}</Text>
                    <Text style={styles.kidThemeSub}>▶</Text>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            );
          })}
        </ScrollView>
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
      <LinearGradient colors={['#A0D2A6', '#8DC2AF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Ionicons name="chevron-back" size={24} color="#979FD6" />
          </AnimatedPressable>
          <LevelProgressHeader
            tier={currentLevel.tier}
            levelNum={currentLevelIndex + 1}
            totalLevels={releasedLevels.length}
          />
        </View>

        <View style={styles.countPlayContent}>
          <View style={styles.countTopHalf}>
            <View style={styles.countQuestionCard}>
              <Text style={styles.countQuestionTitle}>🧮 + 🧮 = ?</Text>
              <Text style={[styles.countOptionsTitle, { color: '#8EB990', marginBottom: 10 }]}>
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
                <Text style={styles.countMathSign}>＋</Text>
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
                  <Text style={styles.countMathSign}>＝</Text>
                  <Text style={styles.countResultText}>?</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.countBottomHalf}>
            <View style={styles.countOptionsWrap}>
              <Text style={styles.countOptionsTitle}>✅</Text>
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
                          colors={isWrongSelected ? ['#F6A2A0', '#F19492'] : ['#FFFFFF', '#F7FAFF']}
                          style={[styles.countOptionButton, styles.countOptionButtonHalf, isHinted && { borderWidth: 3, borderColor: '#FFE38B' }]}
                        >
                          <Text style={[styles.countOptionText, isWrongSelected && { color: '#FFF' }]}>{option}</Text>
                        </LinearGradient>
                        {isHinted && (
                          <Animated.View
                            pointerEvents="none"
                            style={[styles.hintHandWrap, {
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
        <RewardPopup
          visible={showPopup}
          stars={popupStars}
          levelNum={currentLevelIndex + 1}
          totalLevels={releasedLevels.length}
          onContinue={handleContinue}
          onExit={() => { setShowPopup(false); onExit(); }}
          playSound={playSound}
        />
      </LinearGradient>
    );
  }
  return null;
};

// ============================================
// MAIN APP (HOME)
// ============================================
export default function App() {
  const [screen, setScreen]           = useState('home');
  const [currentGame, setCurrentGame] = useState(null);
  const [audioReady, setAudioReady]   = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  useEffect(() => {
    let mounted = true;
    (async () => {
      await soundManager.loadSounds();
      if (!mounted) return;
      setMusicEnabled(soundManager.isBackgroundEnabled());
      await soundManager.ensureBackgroundPlayback();
      setAudioReady(true);
    })();
    return () => {
      mounted = false;
      soundManager.unloadSounds();
    };
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const playSound = (type) => { soundManager.play(type); };
  const toggleMusic = async () => {
    playSound('tap');
    const nextEnabled = !musicEnabled;
    setMusicEnabled(nextEnabled);
    await soundManager.setBackgroundEnabled(nextEnabled);
  };

  const handleGameSelect = async (game) => {
    playSound('tap');
    setCurrentGame(game);
    setScreen('game');
  };

  const handleExit = () => {
    setScreen('home');
  };

  if (!audioReady) {
    return (
      <LinearGradient colors={['#ACB9F4', '#B59ECD']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <Text style={{ fontSize: 72 }}>🎵</Text>
        <Text style={styles.audioLoadingText}>Đang chuẩn bị nhạc nền...</Text>
      </LinearGradient>
    );
  }

  if (screen === 'game') {
    let gameScreen = null;
    if (currentGame === 'memory')   gameScreen = <MemoryGame         playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    if (currentGame === 'puzzle')   gameScreen = <PuzzleGame         playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    if (currentGame === 'garden')   gameScreen = <GardenHarvestGame  playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    return (
      <View style={{ flex: 1 }}>
        {gameScreen}
        <TouchableOpacity onPress={toggleMusic} style={styles.musicToggleGame} activeOpacity={0.9}>
          <LinearGradient
            colors={musicEnabled ? ['#F8FFFA', '#E5F9EC'] : ['#FFF7F7', '#F9E5E5']}
            style={styles.musicToggleButton}
          >
            <Text style={styles.musicToggleIcon}>{musicEnabled ? '🔊' : '🔇'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F7 = fontsLoaded ? 'Nunito_700Bold' : undefined;
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;

  return (
    <LinearGradient colors={['#ACB9F4', '#B59ECD']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={toggleMusic} style={styles.musicToggleHome} activeOpacity={0.9}>
        <LinearGradient
          colors={musicEnabled ? ['#F8FFFA', '#E5F9EC'] : ['#FFF7F7', '#F9E5E5']}
          style={styles.musicToggleButton}
        >
          <Text style={styles.musicToggleIcon}>{musicEnabled ? '🔊' : '🔇'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Decorative circles */}
      <View style={styles.bgBubbleOne} />
      <View style={styles.bgBubbleTwo} />
      <View style={styles.bgBubbleThree} />

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.Text style={{ fontSize: 88, marginTop: 24, marginBottom: 4, transform: [{ translateY: floatAnim }] }}>
          🧸
        </Animated.Text>
        <Text style={[styles.title, { fontFamily: F }]}>Bé Học Vui</Text>
        <Text style={[styles.subtitle, { fontFamily: F7 }]}>🎮👇</Text>

        {/* Game buttons */}
        <View style={{ width: '100%', paddingHorizontal: 20, gap: 14, marginTop: 20 }}>
          <AnimatedPressable onPress={() => handleGameSelect('memory')}>
            <LinearGradient colors={['#FFC8A4', '#FFAF92']} style={styles.gameButtonCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.gameButtonCardIcon}><Text style={{ fontSize: 46 }}>🃏</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameButtonText, { fontFamily: F }]}>Tìm Cặp</Text>
                <Text style={[styles.gameButtonSubText, { fontFamily: F7 }]}>🧠✨</Text>
              </View>
              <View style={styles.gameButtonArrowBadge}><Text style={styles.gameButtonArrow}>▶</Text></View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('puzzle')}>
            <LinearGradient colors={['#A4EAC0', '#8EE3B2']} style={styles.gameButtonCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.gameButtonCardIcon}><Text style={{ fontSize: 46 }}>🧮</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameButtonText, { fontFamily: F }]}>Đếm Hình</Text>
                <Text style={[styles.gameButtonSubText, { fontFamily: F7 }]}>🧮✅</Text>
              </View>
              <View style={styles.gameButtonArrowBadge}><Text style={styles.gameButtonArrow}>▶</Text></View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('garden')}>
            <LinearGradient colors={['#99E2B7', '#8DD1A8']} style={styles.gameButtonCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.gameButtonCardIcon}><Text style={{ fontSize: 46 }}>🌾</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameButtonText, { fontFamily: F }]}>Vườn Thu Hoạch</Text>
                <Text style={[styles.gameButtonSubText, { fontFamily: F7 }]}>🌱🧺</Text>
              </View>
              <View style={styles.gameButtonArrowBadge}><Text style={styles.gameButtonArrow}>▶</Text></View>
            </LinearGradient>
          </AnimatedPressable>

        </View>

        {/* Footer credit */}
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 28, fontFamily: F7 }}>
          Music: Kevin MacLeod · Sounds: Kenney.nl (CC0)
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    overflow: 'hidden',
  },
  bgBubbleOne: {
    position: 'absolute', width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.10)', top: -80, right: -80,
  },
  bgBubbleTwo: {
    position: 'absolute', width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.08)', bottom: 60, left: -70,
  },
  bgBubbleThree: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)', top: 220, left: 30,
  },
  title:    { fontSize: 38, fontWeight: '900', color: 'white', textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.18)', textShadowOffset: {width:0,height:2}, textShadowRadius: 4 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 6, textAlign: 'center' },
  audioLoadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  musicToggleHome: {
    position: 'absolute',
    top: 58,
    right: 16,
    zIndex: 20,
  },
  musicToggleGame: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 50,
  },
  musicToggleButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#8C8C9B',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  musicToggleIcon: {
    fontSize: 27,
  },
  // ── Game buttons (home screen) ──
  gameButtonCard: {
    borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10,
  },
  gameButtonCardIcon: {
    width: 64, height: 64, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  gameButtonText:    { color: 'white', fontSize: 22, fontWeight: '900' },
  gameButtonSubText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2, fontWeight: '700' },
  gameButtonArrowBadge: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  gameButtonArrow: { color: 'white', fontSize: 16, fontWeight: '900' },
  // ── Big action button (win screen etc.) ──
  bigButton: {
    paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 30, width: '100%', alignItems: 'center',
    backgroundColor: '#FFAF92',
    elevation: 5,
    shadowColor: '#E29D83', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  bigButtonText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 0.4 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4, zIndex: 2,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E5EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#838DAC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  statsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, elevation: 3,
  },
  statPillText: { fontSize: 14, fontWeight: '800', color: '#FFAF92' },
  levelHeaderCard: {
    minWidth: 220,
    maxWidth: 270,
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
    elevation: 4,
  },
  levelHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  levelHeaderTierIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2FAF4',
  },
  levelHeaderTierIcon: {
    fontSize: 20,
  },
  levelHeaderValueWrap: {
    flex: 1,
    marginLeft: 8,
  },
  levelHeaderValueMain: {
    color: '#8EB990',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
  },
  levelHeaderValueSub: {
    marginTop: 1,
    color: '#A2B3A6',
    fontSize: 11,
    fontWeight: '800',
  },
  levelHeaderBarTrack: {
    marginTop: 8,
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E3F0E6',
  },
  levelHeaderBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#9ED4A0',
    justifyContent: 'center',
  },
  levelHeaderProgressGlow: {
    alignSelf: 'flex-end',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FAFFF9',
    marginRight: -1,
  },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 3 },
  // ── Reward popup ──
  popupOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center',
  },
  popupCard: {
    backgroundColor: '#FFF', borderRadius: 28, padding: 28, width: '84%', alignItems: 'center',
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20,
  },
  popupCloseBtn: {
    position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#FFEEEE', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  popupCloseBtnText: { fontSize: 16, color: '#F19492', fontWeight: '700' },
  popupPraiseText: { fontSize: 26, fontWeight: '900', color: '#333', marginTop: 8, textAlign: 'center' },
  popupLevelText: {
    fontSize: 24,
    color: '#9FA9A2',
    marginBottom: 4,
    fontWeight: '900',
    letterSpacing: 0.3,
    backgroundColor: '#F6FFF8',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },

  // ── Win screen ──
  winCard: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 32, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 400,
    elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16,
  },
  winTitle:     { fontSize: 30, fontWeight: '900', color: '#FFAF92', marginTop: 4, textAlign: 'center' },
  winSubtitle:  { fontSize: 16, color: '#666', textAlign: 'center', fontWeight: '700' },
  winButton: {
    borderRadius: 28,
    minHeight: 62,
    width: '100%',
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.23,
    shadowRadius: 7,
  },
  winButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
  // ── Theme / Level select screens ──
  selectList: {
    flex: 1,
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  selectCard: {
    flex: 1,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    elevation: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 10,
  },
  selectCardEmoji: {
    fontSize: 72,
  },
  selectCardName: {
    color: 'white', fontSize: 38, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  selectCardSub: {
    color: 'rgba(255,255,255,0.88)', fontSize: 17, fontWeight: '700',
  },
  kidSelectIntroCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    elevation: 4,
    shadowColor: '#8FA8B7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
  },
  kidSelectIntroTitle: {
    color: '#4A5F5D',
    fontSize: 18,
    fontWeight: '900',
  },
  kidSelectIntroSub: {
    marginTop: 4,
    color: '#5D6F6D',
    fontSize: 14,
    fontWeight: '700',
  },
  kidSelectScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  kidThemeCard: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 122,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.27,
    shadowRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  kidThemeEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  kidThemeEmoji: {
    fontSize: 44,
  },
  kidThemeTextWrap: {
    flex: 1,
  },
  kidThemeName: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.26)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  kidThemeSub: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.98)',
    fontSize: 14,
    fontWeight: '800',
  },
  kidLevelCard: {
    borderRadius: 24,
    padding: 16,
    minHeight: 116,
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  kidLevelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  kidLevelEmoji: {
    fontSize: 34,
  },
  kidLevelName: {
    color: 'white',
    fontSize: 33,
    fontWeight: '900',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  kidLevelSubtitle: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 14,
    fontWeight: '800',
  },
  kidLevelArrow: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  levelVisualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelMiniBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelMiniBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
  },
  levelDotsRow: {
    marginLeft: 'auto',
    flexDirection: 'row',
    gap: 6,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  levelDotActive: {
    backgroundColor: 'white',
  },
  hintHandWrap: {
    position: 'absolute',
    zIndex: 20,
    elevation: 20,
  },
  kidLevelDesc: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '700',
  },
  memoryLevelScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  memoryLevelIntroCard: {
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  memoryLevelIntroTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  memoryLevelIntroSub: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '700',
  },
  memoryLevelCard: {
    borderRadius: 24,
    padding: 16,
    minHeight: 148,
    justifyContent: 'space-between',
    elevation: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  memoryLevelCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memoryLevelIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryLevelIcon: {
    fontSize: 35,
  },
  memoryLevelTextWrap: {
    flex: 1,
  },
  memoryLevelName: {
    color: 'white',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 38,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  memoryLevelSubtitle: {
    marginTop: 2,
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    fontWeight: '800',
  },
  memoryLevelArrowWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryLevelArrow: {
    color: 'white',
    fontSize: 15,
    fontWeight: '900',
    marginLeft: 1,
  },
  memoryLevelMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memoryLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  memoryLevelBadgeText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '900',
  },
  memoryLevelDesc: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    fontWeight: '700',
  },
  memoryLevelTips: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
  },
  levelList: { alignItems: 'center', paddingBottom: 24, gap: 14, width: '100%' },
  levelCardNew: {
    borderRadius: 22, borderWidth: 2, padding: 16,
    width: '100%', maxWidth: 420, flexDirection: 'row', alignItems: 'center', gap: 14,
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 6,
  },
  levelCardBadge: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', minWidth: 60,
  },
  levelCardBadgeText: { color: 'white', fontSize: 18, fontWeight: '800' },
  levelCardStars:     { fontSize: 20, marginBottom: 2 },
  levelCardDesc:      { fontSize: 14, fontWeight: '700' },
  // legacy aliases kept for games 2 & 3
  themeCard: {
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 25, padding: 26,
    alignItems: 'center', width: '100%', maxWidth: 400, gap: 10,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 5,
  },
  themeName: { fontSize: 22, fontWeight: '700', color: '#8F8F8F' },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 25, padding: 24,
    width: '100%', maxWidth: 400,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 5,
  },
  levelCardPurple: { borderLeftWidth: 4, borderLeftColor: '#C3A9EA' },
  levelCardGreen:  { borderLeftWidth: 4, borderLeftColor: '#9BD5A9' },
  levelName: { fontSize: 26, fontWeight: '800', color: '#FFAF92' },
  levelDesc: { fontSize: 16, color: '#666', marginTop: 5 },
  movesBox: {
    backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 15, minWidth: 126,
  },
  movesText: { fontSize: 16, fontWeight: '700', color: '#FFAF92' },
  progressText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  gameGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14,
    marginTop: 10, zIndex: 2,
  },
  card: {
    backgroundColor: 'white', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },
  cardFlipped: { backgroundColor: '#FFF7EB' },
  cardMatched: { backgroundColor: '#DBEEDB' },
  hintText: {
    color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 10, textAlign: 'center',
  },
  gardenPlayWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 18,
    justifyContent: 'center',
  },
  gardenMissionCard: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E5F8E9',
  },
  gardenMissionTitle: {
    color: '#8EB990',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  gardenMissionStatsRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  gardenMissionStatChip: {
    backgroundColor: '#F0FAF2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D0EBD6',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gardenMissionStatText: {
    color: '#8EB094',
    fontSize: 15,
    fontWeight: '900',
  },
  gardenMissionSub: {
    marginTop: 4,
    color: '#97AF99',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  gardenMissionHint: {
    marginTop: 6,
    color: '#9FACA0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  gardenTargetPreviewCard: {
    marginTop: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 260,
    borderRadius: 18,
    backgroundColor: '#F6FFF8',
    borderWidth: 2,
    borderColor: '#D4F0DB',
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  gardenTargetPreviewLabel: {
    color: '#97AF99',
    fontSize: 14,
    fontWeight: '800',
  },
  gardenTargetPreviewIconWrap: {
    marginTop: 6,
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E4F4E7',
  },
  gardenTargetPreviewEmoji: {
    fontSize: 62,
    lineHeight: 66,
  },
  gardenTargetPreviewName: {
    marginTop: 6,
    color: '#8EB990',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  gardenHintBubble: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#FFF9DF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F6E3A6',
  },
  gardenHintText: {
    color: '#C2A775',
    fontSize: 13,
    fontWeight: '800',
  },
  gardenToast: {
    marginTop: 10,
    alignSelf: 'center',
    backgroundColor: '#E5FAEA',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#B3E5C1',
  },
  gardenToastText: {
    color: '#86B791',
    fontSize: 14,
    fontWeight: '900',
  },
  gardenDragTaskWrap: {
    marginTop: 14,
    gap: 12,
  },
  gardenDropZone: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#B5E2C0',
    minHeight: 182,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenDropZoneIcon: {
    fontSize: 56,
  },
  gardenDropZoneLabel: {
    marginTop: 8,
    color: '#8FAA98',
    fontSize: 16,
    fontWeight: '900',
  },
  gardenDropZoneCounter: {
    marginTop: 5,
    color: '#8EB990',
    fontSize: 22,
    fontWeight: '900',
  },
  gardenDragTray: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  gardenDragWrap: {
    borderRadius: 14,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
  },
  gardenDragItem: {
    width: 98,
    height: 98,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gardenDragEmoji: {
    fontSize: 52,
  },
  gardenHarvestGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
  },
  gardenHarvestItem: {
    width: 104,
    height: 104,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E6F6E9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
  },
  gardenHarvestEmoji: {
    fontSize: 56,
  },
  gardenCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#8EB990',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenCheckBadgeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 18,
  },
  gardenWrongMark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,57,53,0.25)',
  },
  gardenWrongMarkText: {
    color: '#E08B8B',
    fontSize: 52,
    fontWeight: '900',
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countQuestionCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
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
    color: '#8EB990',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
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
    backgroundColor: '#F8FFFA',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#D4F0DB',
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
  },
  countItemNumber: {
    color: '#8EB990',
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
    color: '#8EB990',
    fontSize: 42,
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
    color: '#8EB990',
    fontSize: 54,
    fontWeight: '900',
    lineHeight: 58,
    marginTop: -4,
  },
  countOptionsWrap: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingVertical: 12,
    paddingHorizontal: 10,
    overflow: 'hidden',
  },
  countOptionsTitle: {
    color: 'white',
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  countOptionButtonHalf: {
    width: '47%',
    minWidth: 110,
  },
  countOptionText: {
    color: '#8EB990',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  animalPlayContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  animalInstructionTitle: {
    marginTop: 8,
    color: 'white',
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  animalInstructionSub: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.94)',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  soundPlayButton: {
    marginTop: 14,
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  soundPlayButtonIcon: {
    fontSize: 56,
  },
  animalRoundText: {
    color: '#A696D0',
    fontSize: 16,
    fontWeight: '900',
  },
  animalOptionsGrid: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  animalOptionCard: {
    width: Math.min(166, Math.floor((SCREEN_WIDTH - 52) / 2)),
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  animalOptionImage: {
    width: '100%',
    height: 98,
    borderRadius: 12,
    backgroundColor: '#F0F4FA',
  },
  animalEmojiHeroWrap: {
    width: '100%',
    height: 98,
    borderRadius: 12,
    backgroundColor: '#F4F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalFallbackWrap: {
    width: '100%',
    height: 98,
    borderRadius: 12,
    backgroundColor: '#F4F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalFallbackEmoji: {
    fontSize: 56,
  },
  animalOptionName: {
    marginTop: 8,
    color: '#8D95A4',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
  correctToast: {
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 230,
    borderWidth: 2,
    borderColor: '#FFEBAC',
  },
  correctToastIcon: {
    fontSize: 28,
  },
  correctToastText: {
    marginTop: 2,
    color: '#8EB990',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  puzzleGuideCard: {
    width: '100%', maxWidth: 500, backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12,
  },
  puzzleGuideTitle: { fontSize: 16, fontWeight: '800', color: '#FFAF92', textAlign: 'center' },
  puzzleGuideDesc:  { marginTop: 4, fontSize: 13, color: '#A9ABAD', textAlign: 'center', lineHeight: 18 },
  puzzlePlayContent: { width: '100%', alignItems: 'center', paddingBottom: 14, flex: 1 },
  puzzleBoardShell:  { width: '100%', alignItems: 'center' },
  puzzleBoard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16,
    flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 5, elevation: 4,
  },
  puzzleSlot: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#B9E1B9',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  puzzlePlacedPiece: {
    backgroundColor: '#E9F9EA', borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  puzzleSlotHintText: { color: '#CFCFCF', fontSize: 12, fontWeight: '700' },
  puzzleTray: {
    width: '100%', maxWidth: 500, backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 20, paddingVertical: 12, paddingHorizontal: 10, marginBottom: 12,
  },
  puzzleTrayTitle: { textAlign: 'center', color: '#A6ABB2', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  puzzleTrayGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, minHeight: 70,
  },
  puzzleMeasureText: { marginTop: 8, textAlign: 'center', color: '#BCC3CD', fontSize: 12, fontWeight: '600' },
  puzzlePieceDraggableWrap: { borderRadius: 12 },
  puzzlePiece: {
    borderRadius: 10, backgroundColor: '#FAFCFF',
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 3,
  },
  puzzlePieceBadge: {
    position: 'absolute', top: 2, left: 4,
    backgroundColor: 'rgba(0,0,0,0.35)', paddingHorizontal: 4, borderRadius: 4,
  },
  puzzlePieceBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  boardLabel: { color: 'white', fontSize: 14, fontWeight: '800', marginBottom: 5 },
  boardGrid: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.97)',
    padding: 8, borderRadius: 12, gap: 4,
  },
  diffCell: {
    backgroundColor: 'white', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', elevation: 1,
  },
  foundBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 3, borderColor: '#8EB990',
  },
});
