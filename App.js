import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';

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

const soundAssets = {
  background:   require('./assets/sounds/background.mp3'),
  tap:          require('./assets/sounds/tap.mp3'),
  flip:         require('./assets/sounds/flip.mp3'),
  match:        require('./assets/sounds/match.mp3'),
  wrong:        require('./assets/sounds/wrong.mp3'),
  pick:         require('./assets/sounds/pick.mp3'),
  place:        require('./assets/sounds/place.mp3'),
  win:          require('./assets/sounds/win.mp3'),
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
  win: 0.65,
  navigate: 0.38,
  themeSelect: 0.45,
  levelSelect: 0.48,
  star1: 0.55,
  star2: 0.6,
  star3: 0.65,
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

  const bg = isMatched ? '#DCF8E0' : '#FFFFFF';
  const shadow = isMatched
    ? { shadowColor: '#2E7D32', shadowOpacity: 0.55, shadowRadius: 8, elevation: 8 }
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
          borderColor: isHinted && face === 'back' ? '#FFD54F' : '#FFFFFF',
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
              <Text style={{ fontSize: cardSize * 0.55, color: '#6A55C2', fontWeight: '900' }}>?</Text>
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

  const bg = isFound ? '#A5D6A7' : isWrong ? '#EF9A9A' : 'white';
  const shadow = isFound
    ? { shadowColor: '#2E7D32', shadowOpacity: 0.55, shadowRadius: 6, elevation: 6 }
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

// Reusable win screen with confetti + sequential stars
const WinScreen = ({ title, subtitle, stars, onPlayAgain, onExit, playSound }) => {
  const starScales = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const confettiAnims = useRef(
    Array.from({ length: 22 }, () => new Animated.Value(0))
  ).current;

  const confettiData = useMemo(() =>
    confettiAnims.map((_, i) => ({
      x: Math.floor(Math.random() * (SCREEN_WIDTH - 30)),
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
      size: 16 + Math.floor(Math.random() * 16),
    })), []);

  useEffect(() => {
    // Sequential stars
    [0, 1, 2].forEach((i) => {
      if (i < stars) {
        setTimeout(() => {
          playSound(`star${i + 1}`);
          Animated.spring(starScales[i], {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 20,
            speed: 16,
          }).start();
        }, 300 + i * 320);
      }
    });

    // Confetti burst
    setTimeout(() => {
      Animated.stagger(45,
        confettiAnims.map(a =>
          Animated.timing(a, { toValue: 1, duration: 1400, useNativeDriver: true })
        )
      ).start();
    }, 200);
  }, []);

  return (
    <LinearGradient colors={['#FFECD2', '#FCB69F']} style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
      {/* Confetti layer */}
      {confettiAnims.map((anim, i) => (
        <ConfettiParticle key={i} anim={anim} x={confettiData[i].x} emoji={confettiData[i].emoji} size={confettiData[i].size} />
      ))}

      <View style={styles.winCard}>
        <Text style={{ fontSize: 76 }}>🎉</Text>
        <Text style={[styles.winTitle]}>{title}</Text>

        {/* Stars */}
        <View style={{ flexDirection: 'row', marginVertical: 16, gap: 10 }}>
          {[0, 1, 2].map((i) => (
            <Animated.Text key={i} style={{ fontSize: 44, transform: [{ scale: starScales[i] }] }}>
              {i < stars ? '⭐' : '🌑'}
            </Animated.Text>
          ))}
        </View>

        <Text style={styles.winSubtitle}>{subtitle}</Text>

        <AnimatedPressable onPress={() => { playSound('tap'); onPlayAgain(); }} style={{ width: '100%', marginTop: 18 }}>
          <LinearGradient colors={['#FF9A56','#FF6B35']} style={styles.winButton}>
            <View style={styles.winButtonInner}>
              <View style={styles.winButtonIconBubble}>
                <Text style={styles.winButtonIcon}>🔄</Text>
              </View>
              <Text style={styles.winButtonText}>Chơi lại</Text>
            </View>
          </LinearGradient>
        </AnimatedPressable>

        <AnimatedPressable onPress={() => { playSound('navigate'); onExit(); }} style={{ width: '100%', marginTop: 14 }}>
          <LinearGradient colors={['#667EEA','#764BA2']} style={styles.winButton}>
            <View style={styles.winButtonInner}>
              <View style={styles.winButtonIconBubble}>
                <Text style={styles.winButtonIcon}>🏠</Text>
              </View>
              <Text style={styles.winButtonText}>Về trang chính</Text>
            </View>
          </LinearGradient>
        </AnimatedPressable>
      </View>
    </LinearGradient>
  );
};

// ============================================
// GAME 1: MEMORY MATCH
// ============================================

// Theme card colours (background tint per theme)
const THEME_COLORS = {
  animals:  { bg: '#FFF3E0', accent: '#FF8F00', border: '#FFCC80' },
  fruits:   { bg: '#F3E5F5', accent: '#8E24AA', border: '#CE93D8' },
  vehicles: { bg: '#E3F2FD', accent: '#1565C0', border: '#90CAF9' },
};

// Full-card gradients for the new theme row cards
const THEME_GRADIENTS = {
  animals:  ['#FF9A56', '#F7654B'],
  fruits:   ['#F953C6', '#B91D73'],
  vehicles: ['#4facfe', '#00c6fb'],
};

// Level visual config
const LEVEL_CONFIG = {
  easy:   { color: '#43A047', bg: '#F1F8E9', label: '⭐',      desc: '4 ô · 2 cặp thẻ' },
  medium: { color: '#FB8C00', bg: '#FFF8E1', label: '⭐⭐',    desc: '9 ô · 3 cặp thẻ' },
  hard:   { color: '#E53935', bg: '#FFEBEE', label: '⭐⭐⭐',  desc: '8 ô · 4 cặp thẻ' },
};

const MemoryGame = ({ playSound, onExit }) => {
  const levels = {
    easy:   { name: 'Dễ',   pairs: 2, cols: 2 },
    medium: { name: 'Vừa',  pairs: 3, cols: 3 },
    hard:   { name: 'Khó',  pairs: 4, cols: 3 }
  };

  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [stars, setStars] = useState(0);
  const [consecutiveMatches, setConsecutiveMatches] = useState(0);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintCardIndex, setHintCardIndex] = useState(null);
  const [guidedAnchorIndex, setGuidedAnchorIndex] = useState(null);

  const startGame = (theme, level) => {
    const items = themes[theme].items.slice(0, levels[level].pairs);
    const deck = [...items, ...items]
      .map((item, i) => ({ id: i, value: item }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]); setMatched([]); setMoves(0); setStars(0); setConsecutiveMatches(0); setWrongAttempts(0); setHintCardIndex(null); setGuidedAnchorIndex(null);
    setSelectedTheme(theme); setSelectedLevel(level); setScreen('play');
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
        if (nextWrongAttempts >= 5) {
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
      if (moves <= pairs * 1.5) s = 3;
      else if (moves <= pairs * 2) s = 2;
      setStars(s);
      setTimeout(() => { playSound('win'); setScreen('win'); }, 500);
    }
  }, [matched]);

  // ── Theme screen ──
  if (screen === 'theme') {
    return (
      <LinearGradient colors={['#667EEA', '#764BA2']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <Text style={styles.headerTitle}>🃏 Chọn chủ đề</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>Chọn chủ đề tìm cặp</Text>
          <Text style={styles.kidSelectIntroSub}>Bé hãy chọn bộ hình mình yêu thích</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {Object.entries(themes).map(([key, theme]) => (
            <AnimatedPressable key={key}
              onPress={() => { playSound('themeSelect'); setSelectedTheme(key); setScreen('level'); }}>
              <LinearGradient colors={THEME_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.kidThemeCard}>
                <View style={styles.kidThemeEmojiWrap}>
                  <Text style={styles.kidThemeEmoji}>{theme.emoji}</Text>
                </View>
                <View style={styles.kidThemeTextWrap}>
                  <Text style={styles.kidThemeName}>{theme.name}</Text>
                  <Text style={styles.kidThemeSub}>Chạm để chọn ▶</Text>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Level screen ──
  if (screen === 'level') {
    const LEVEL_GRADIENTS = {
      easy:   ['#43E97B', '#38F9D7'],
      medium: ['#FA8231', '#f7b733'],
      hard:   ['#f953c6', '#b91d73'],
    };
    const LEVEL_UI = {
      easy:   { emoji: '😊', badge: '2 cặp', cells: '4 ô', meter: 1 },
      medium: { emoji: '🤔', badge: '3 cặp', cells: '9 ô', meter: 2 },
      hard:   { emoji: '🔥', badge: '4 cặp', cells: '8 ô', meter: 3 },
    };

    return (
      <LinearGradient colors={['#667EEA', '#764BA2']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <Text style={styles.headerTitle}>🎯 Chọn độ khó</Text>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView
          style={{ width: '100%' }}
          contentContainerStyle={styles.memoryLevelScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.memoryLevelIntroCard}>
            <Text style={styles.memoryLevelIntroTitle}>Chọn cấp độ cho bé</Text>
            <Text style={styles.memoryLevelIntroSub}>
              Chủ đề: {selectedTheme ? `${themes[selectedTheme].emoji} ${themes[selectedTheme].name}` : '---'}
            </Text>
          </View>

          {Object.entries(levels).map(([key, level]) => {
            const lv = LEVEL_UI[key];
            return (
              <AnimatedPressable key={key}
                onPress={() => { playSound('levelSelect'); startGame(selectedTheme, key); }}>
                <LinearGradient
                  colors={LEVEL_GRADIENTS[key]}
                  start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                  style={styles.memoryLevelCard}>
                  <View style={styles.memoryLevelCardTopRow}>
                    <View style={styles.memoryLevelIconWrap}>
                      <Text style={styles.memoryLevelIcon}>{lv.emoji}</Text>
                    </View>
                    <View style={styles.memoryLevelTextWrap}>
                      <Text style={styles.memoryLevelName}>{level.name}</Text>
                    </View>
                    <View style={styles.memoryLevelArrowWrap}>
                      <Text style={styles.memoryLevelArrow}>▶</Text>
                    </View>
                  </View>

                  <View style={styles.memoryLevelMetaRow}>
                    <View style={styles.memoryLevelBadge}>
                      <Text style={styles.memoryLevelBadgeText}>{lv.badge}</Text>
                    </View>
                    <View style={styles.memoryLevelBadge}>
                      <Text style={styles.memoryLevelBadgeText}>{lv.cells}</Text>
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

  // ── Play screen ──
  if (screen === 'play') {
    const levelConfig = levels[selectedLevel];
    const totalCards = levelConfig.pairs * 2;
    const maxCols = Math.min(levelConfig.cols, 3, totalCards);
    let cols = maxCols;
    while (cols > 1 && totalCards % cols !== 0) cols -= 1;
    const rows = totalCards / cols;
    const pairs = levelConfig.pairs;
    const foundPairs = matched.length / 2;

    // Gap shrinks at higher difficulty so all cards fit
    const gap = cols <= 2 ? 12 : cols === 3 ? 10 : 8;

    // Reserve space for top controls + hint and keep board always visible
    const reservedHeight = 44 + 44 + 58 + 36 + 24;
    const availH = SCREEN_HEIGHT - reservedHeight;
    const availW = SCREEN_WIDTH - 32;

    const cardFromW = Math.floor((availW - gap * (cols - 1)) / cols);
    const cardFromH = Math.floor((availH - gap * (rows - 1)) / rows);
    const sizeCap = cols <= 2 ? 160 : cols === 3 ? 116 : 86;
    const cardSize  = Math.max(56, Math.min(cardFromW, cardFromH, sizeCap));

    const gridW = cols * cardSize + (cols - 1) * gap;

    return (
      <LinearGradient colors={['#FF9A56', '#FF6B35']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        {/* Header */}
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <View style={{ flex: 1 }} />
        </View>

        {/* Hint */}
        <Text style={[styles.hintText, { marginBottom: 8 }]}>Lật 2 thẻ giống nhau ✨</Text>

        {/* Card grid — centred, all cards visible without scroll */}
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
      </LinearGradient>
    );
  }

  // ── Win screen ──
  if (screen === 'win') {
    return (
      <WinScreen
        title="Giỏi quá! 🎉"
        subtitle={`Bé đã hoàn thành trong ${moves} lượt`}
        stars={stars}
        onPlayAgain={() => startGame(selectedTheme, selectedLevel)}
        onExit={onExit}
        playSound={playSound}
      />
    );
  }
  return null;
};

// ============================================
// GAME 2: ANIMAL SOUND QUIZ
// ============================================
const AnimalCard = ({ animal, isWrong, isCorrect, onPress, disabled }) => {
  const cardColors = isCorrect
    ? ['#66BB6A', '#43A047']
    : isWrong
      ? ['#EF5350', '#E53935']
      : ['#FFFFFF', '#F4F8FF'];

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
          playSound('win');
          setScreen('win');
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
      easy: ['#56CCF2', '#2F80ED'],
      medium: ['#F2994A', '#F2C94C'],
      hard: ['#D66D75', '#E29587'],
    };

    return (
      <LinearGradient colors={['#5F72FF', '#9A5BFF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <Text style={styles.headerTitle}>🐾 Nghe tiếng thú</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>Bấm loa và chọn đúng con vật</Text>
          <Text style={styles.kidSelectIntroSub}>Bộ âm thanh dịu nhẹ: chim hót và ve sầu, phù hợp cho bé nhỏ.</Text>
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
      <LinearGradient colors={['#5F72FF', '#9A5BFF']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
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
            <LinearGradient colors={['#FFFFFF', '#E8F1FF']} style={styles.soundPlayButton}>
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
      </LinearGradient>
    );
  }

  if (screen === 'win') {
    return (
      <WinScreen
        title="Tai thính quá!"
        subtitle={`Bé hoàn thành ${levels[selectedLevel].roundsToWin} câu nghe tiếng thú`}
        stars={getStars()}
        onPlayAgain={() => startGame(selectedLevel)}
        onExit={onExit}
        playSound={playSound}
      />
    );
  }
  return null;
};

// --- Puzzle: screen coords → slot index ---
function puzzleScreenToSlot(absX, absY, g) {
  if (!g) return null;
  const { wx, wy, width, height, padding, gap, slotSize, rows, cols } = g;
  const lx = absX - wx - padding;
  const ly = absY - wy - padding;
  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const margin = 48;
  if (lx < -margin || ly < -margin || lx > innerW + margin || ly > innerH + margin) return null;
  const cx = Math.max(0, Math.min(innerW - 1e-6, lx));
  const cy = Math.max(0, Math.min(innerH - 1e-6, ly));
  const col = Math.min(cols - 1, Math.floor(cx / (slotSize + gap)));
  const row = Math.min(rows - 1, Math.floor(cy / (slotSize + gap)));
  return row * cols + col;
}

const PuzzleDraggablePiece = React.memo(function PuzzleDraggablePiece({
  pieceIndex, trayPieceSize, renderPiece, isDragging, disabled, onDragStart, onDropAtScreen,
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  const onGestureEvent = useMemo(
    () => Animated.event([{ nativeEvent: { translationX: tx, translationY: ty } }], { useNativeDriver: false }),
    [tx, ty]
  );

  const handleStateChange = useCallback((e) => {
    const { state, oldState, absoluteX, absoluteY } = e.nativeEvent;
    if (state === State.BEGAN) onDragStart(pieceIndex);
    if (oldState === State.ACTIVE && (state === State.END || state === State.CANCELLED)) {
      onDropAtScreen(pieceIndex, absoluteX, absoluteY);
      Animated.parallel([
        Animated.spring(tx, { toValue: 0, useNativeDriver: false, bounciness: 6, speed: 18 }),
        Animated.spring(ty, { toValue: 0, useNativeDriver: false, bounciness: 6, speed: 18 }),
      ]).start();
    }
  }, [pieceIndex, onDragStart, onDropAtScreen, tx, ty]);

  return (
    <PanGestureHandler enabled={!disabled} onGestureEvent={onGestureEvent} onHandlerStateChange={handleStateChange}>
      <Animated.View style={[
        styles.puzzlePieceDraggableWrap,
        { transform: [{ translateX: tx }, { translateY: ty }],
          zIndex: isDragging ? 50 : 2,
          elevation: isDragging ? 14 : 3,
          opacity: disabled ? 0.65 : 1 }
      ]}>
        {renderPiece(pieceIndex, trayPieceSize, isDragging)}
      </Animated.View>
    </PanGestureHandler>
  );
});

// ============================================
// GAME 3: COUNTING QUIZ
// ============================================
const PuzzleGame = ({ playSound, onExit }) => {
  const levels = {
    easy:   { name: 'Dễ', maxCount: 3, optionCount: 4 },
    medium: { name: 'Vừa', maxCount: 5, optionCount: 4 },
    hard:   { name: 'Khó', maxCount: 7, optionCount: 4 },
  };

  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [roundData, setRoundData] = useState(null);
  const [wrongPicks, setWrongPicks] = useState(0);
  const [selectedWrongOption, setSelectedWrongOption] = useState(null);

  const generateRound = useCallback((themeKey, levelKey) => {
    const themeItems = themes[themeKey].items;
    const level = levels[levelKey];
    if (!themeItems || !level) return;

    const firstIndex = Math.floor(Math.random() * themeItems.length);
    let secondIndex = Math.floor(Math.random() * themeItems.length);
    while (secondIndex === firstIndex) secondIndex = Math.floor(Math.random() * themeItems.length);

    const firstEmoji = themeItems[firstIndex];
    const secondEmoji = themeItems[secondIndex];
    const firstCount = 1 + Math.floor(Math.random() * level.maxCount);
    const secondCount = 1 + Math.floor(Math.random() * level.maxCount);
    const answer = firstCount + secondCount;

    const wrongOptions = new Set();
    while (wrongOptions.size < level.optionCount - 1) {
      const delta = Math.floor(Math.random() * 7) - 3;
      const candidate = answer + (delta === 0 ? 2 : delta);
      if (candidate > 1 && candidate !== answer) wrongOptions.add(candidate);
    }

    const options = [answer, ...wrongOptions].sort(() => Math.random() - 0.5);
    setRoundData({ firstEmoji, secondEmoji, firstCount, secondCount, answer, options });
    setSelectedWrongOption(null);
  }, []);

  const startGame = (themeKey, levelKey) => {
    setSelectedTheme(themeKey);
    setSelectedLevel(levelKey);
    setWrongPicks(0);
    generateRound(themeKey, levelKey);
    setScreen('play');
  };

  const handlePickOption = (value) => {
    if (!roundData) return;
    if (value === roundData.answer) {
      playSound('match');
      setScreen('win');
      return;
    }
    playSound('wrong');
    setWrongPicks((v) => v + 1);
    setSelectedWrongOption(value);
    setTimeout(() => setSelectedWrongOption(null), 420);
  };

  const getStars = () => {
    if (wrongPicks === 0) return 3;
    if (wrongPicks <= 2) return 2;
    return 1;
  };

  if (screen === 'theme') {
    return (
      <LinearGradient colors={['#4FAC5B', '#2C8E6B']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <Text style={styles.headerTitle}>🧮 Chọn chủ đề</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>Đếm hình và chọn số</Text>
          <Text style={styles.kidSelectIntroSub}>Ví dụ: 2 quả + 3 quả = 5</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {Object.entries(themes).map(([key, theme]) => (
            <AnimatedPressable key={key}
              onPress={() => { playSound('themeSelect'); setSelectedTheme(key); setScreen('level'); }}>
              <LinearGradient colors={THEME_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.kidThemeCard}>
                <View style={styles.kidThemeEmojiWrap}>
                  <Text style={styles.kidThemeEmoji}>{theme.emoji}</Text>
                </View>
                <View style={styles.kidThemeTextWrap}>
                  <Text style={styles.kidThemeName}>{theme.name}</Text>
                  <Text style={styles.kidThemeSub}>Chạm để chọn ▶</Text>
                </View>
              </LinearGradient>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </LinearGradient>
    );
  }

  if (screen === 'level') {
    const COUNT_LEVEL_UI = {
      easy:   { emoji: '1️⃣', badge: '4 đáp án', board: 'Số nhỏ', meter: 1 },
      medium: { emoji: '2️⃣', badge: '4 đáp án', board: 'Số vừa', meter: 2 },
      hard:   { emoji: '3️⃣', badge: '4 đáp án', board: 'Số lớn', meter: 3 },
    };
    const COUNT_LEVEL_GRADIENTS = {
      easy:   ['#43C6AC', '#2BC0E4'],
      medium: ['#FDC830', '#F37335'],
      hard:   ['#7F53AC', '#647DEE'],
    };

    return (
      <LinearGradient colors={['#4FAC5B', '#2C8E6B']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <Text style={styles.headerTitle}>🎯 Chọn độ khó</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={styles.kidSelectIntroCard}>
          <Text style={styles.kidSelectIntroTitle}>Độ khó bài đếm</Text>
          <Text style={styles.kidSelectIntroSub}>Nhìn hình rồi chọn kết quả đúng</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {Object.entries(levels).map(([key, level]) => {
            const lv = COUNT_LEVEL_UI[key];
            return (
              <AnimatedPressable key={key} onPress={() => { playSound('levelSelect'); startGame(selectedTheme, key); }}>
                <LinearGradient colors={COUNT_LEVEL_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.kidLevelCard}>
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
                      <Text style={styles.levelMiniBadgeText}>{lv.board}</Text>
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

  if (screen === 'play' && roundData) {
    const countRowA = Array.from({ length: roundData.firstCount });
    const countRowB = Array.from({ length: roundData.secondCount });
    const optionWidth = Math.max(120, Math.floor((SCREEN_WIDTH - 62) / 2));

    return (
      <LinearGradient colors={['#4FAC5B', '#2C8E6B']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Text style={styles.backButtonText}>◀ Về</Text>
          </AnimatedPressable>
          <View style={{ flex: 1 }} />
        </View>

        <View style={styles.countPlayContent}>
          <View style={styles.countQuestionCard}>
            <Text style={styles.countQuestionTitle}>Đếm hình và chọn kết quả</Text>
            <View style={styles.countEquationWrap}>
              <View style={styles.countItemCard}>
                <Text style={styles.countItemNumber}>{roundData.firstCount}</Text>
                <View style={styles.countEmojiRow}>
                  {countRowA.map((_, i) => <Text key={`a-${i}`} style={styles.countEmoji}>{roundData.firstEmoji}</Text>)}
                </View>
              </View>
              <Text style={styles.countMathSign}>＋</Text>
              <View style={styles.countItemCard}>
                <Text style={styles.countItemNumber}>{roundData.secondCount}</Text>
                <View style={styles.countEmojiRow}>
                  {countRowB.map((_, i) => <Text key={`b-${i}`} style={styles.countEmoji}>{roundData.secondEmoji}</Text>)}
                </View>
              </View>
              <View style={styles.countResultWrap}>
                <Text style={styles.countMathSign}>＝</Text>
                <Text style={styles.countResultText}>?</Text>
              </View>
            </View>
          </View>

          <View style={styles.countOptionsWrap}>
            <Text style={styles.countOptionsTitle}>Chọn đáp án đúng</Text>
            <View style={styles.countOptionGrid}>
              {roundData.options.map((option) => {
                const isWrongSelected = selectedWrongOption === option;
                return (
                  <AnimatedPressable key={option} onPress={() => handlePickOption(option)}>
                    <LinearGradient
                      colors={isWrongSelected ? ['#EF5350', '#E53935'] : ['#FFFFFF', '#F3F7FF']}
                      style={[styles.countOptionButton, { width: optionWidth }]}
                    >
                      <Text style={[styles.countOptionText, isWrongSelected && { color: '#FFF' }]}>{option}</Text>
                    </LinearGradient>
                  </AnimatedPressable>
                );
              })}
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  if (screen === 'win') {
    return (
      <WinScreen
        title="Giỏi đếm số!"
        subtitle={`${roundData.firstCount} + ${roundData.secondCount} = ${roundData.answer}`}
        stars={getStars()}
        onPlayAgain={() => startGame(selectedTheme, selectedLevel)}
        onExit={onExit}
        playSound={playSound}
      />
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
  const playAnimalSound = async (source, options) => soundManager.playClip(source, 0.42, options);
  const stopAnimalSound = async () => soundManager.stopClip();
  const toggleMusic = async () => {
    playSound('tap');
    const nextEnabled = !musicEnabled;
    setMusicEnabled(nextEnabled);
    await soundManager.setBackgroundEnabled(nextEnabled);
  };

  const handleGameSelect = async (game) => {
    playSound('tap');
    // Animal listening game needs clear foreground audio, so force background music off.
    if (game === 'finddiff' && musicEnabled) {
      setMusicEnabled(false);
      await soundManager.setBackgroundEnabled(false);
    }
    setCurrentGame(game);
    setScreen('game');
  };

  const handleExit = () => {
    playSound('navigate');
    setScreen('home');
  };

  if (!audioReady) {
    return (
      <LinearGradient colors={['#667EEA', '#764BA2']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" />
        <Text style={{ fontSize: 72 }}>🎵</Text>
        <Text style={styles.audioLoadingText}>Đang chuẩn bị nhạc nền...</Text>
      </LinearGradient>
    );
  }

  if (screen === 'game') {
    let gameScreen = null;
    if (currentGame === 'memory')   gameScreen = <MemoryGame         playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    if (currentGame === 'finddiff') gameScreen = <AnimalSoundGame playSound={playSound} playAnimalSound={playAnimalSound} stopAnimalSound={stopAnimalSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    return (
      <View style={{ flex: 1 }}>
        {gameScreen}
        <TouchableOpacity onPress={toggleMusic} style={styles.musicToggleGame} activeOpacity={0.9}>
          <LinearGradient
            colors={musicEnabled ? ['#F4FFF7', '#D7F6E2'] : ['#FFF3F3', '#F6D7D7']}
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
    <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      <TouchableOpacity onPress={toggleMusic} style={styles.musicToggleHome} activeOpacity={0.9}>
        <LinearGradient
          colors={musicEnabled ? ['#F4FFF7', '#D7F6E2'] : ['#FFF3F3', '#F6D7D7']}
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
          🎮
        </Animated.Text>
        <Text style={[styles.title, { fontFamily: F }]}>Bé Học Vui</Text>
        <Text style={[styles.subtitle, { fontFamily: F7 }]}>Chạm vào trò bé muốn chơi 👇</Text>

        {/* Game buttons */}
        <View style={{ width: '100%', paddingHorizontal: 20, gap: 14, marginTop: 20 }}>
          <AnimatedPressable onPress={() => handleGameSelect('memory')}>
            <LinearGradient colors={['#FF9A56', '#FF6B35']} style={styles.gameButtonCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.gameButtonCardIcon}><Text style={{ fontSize: 46 }}>🃏</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameButtonText, { fontFamily: F }]}>Tìm Cặp</Text>
                <Text style={[styles.gameButtonSubText, { fontFamily: F7 }]}>Rèn trí nhớ nhanh</Text>
              </View>
              <View style={styles.gameButtonArrowBadge}><Text style={styles.gameButtonArrow}>▶</Text></View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('finddiff')}>
            <LinearGradient colors={['#B06FEA', '#8E44AD']} style={styles.gameButtonCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.gameButtonCardIcon}><Text style={{ fontSize: 46 }}>🔊</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.gameButtonText, { fontFamily: F }]}>Nghe Tiếng Thú</Text>
                <Text style={[styles.gameButtonSubText, { fontFamily: F7 }]}>Nghe âm thanh, chọn đúng con vật</Text>
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
    top: 58,
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
    shadowColor: '#2A2A45',
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
    backgroundColor: '#FF6B35',
    elevation: 5,
    shadowColor: '#C94A1A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 6,
  },
  bigButtonText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 0.4 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4, zIndex: 2,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    minHeight: 54,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#2A2A45',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  backButtonText: {
    color: '#5A3CA8',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.25,
  },
  statsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.92)', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, elevation: 3,
  },
  statPillText: { fontSize: 14, fontWeight: '800', color: '#FF6B35' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 3 },
  // ── Win screen ──
  winCard: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 32, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 400,
    elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16,
  },
  winTitle:     { fontSize: 30, fontWeight: '900', color: '#FF6B35', marginTop: 4, textAlign: 'center' },
  winSubtitle:  { fontSize: 16, color: '#666', textAlign: 'center', fontWeight: '700' },
  winButton: {
    borderRadius: 28,
    minHeight: 58,
    width: '100%',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.23,
    shadowRadius: 7,
  },
  winButtonInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  winButtonIconBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winButtonIcon: {
    fontSize: 16,
  },
  winButtonText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.2,
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
    backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
  },
  kidSelectIntroTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '900',
  },
  kidSelectIntroSub: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.9)',
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
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  kidThemeEmojiWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
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
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  kidThemeSub: {
    marginTop: 3,
    color: 'rgba(255,255,255,0.93)',
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
  themeName: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 25, padding: 24,
    width: '100%', maxWidth: 400,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 5,
  },
  levelCardPurple: { borderLeftWidth: 4, borderLeftColor: '#9060D8' },
  levelCardGreen:  { borderLeftWidth: 4, borderLeftColor: '#45B25F' },
  levelName: { fontSize: 26, fontWeight: '800', color: '#FF6B35' },
  levelDesc: { fontSize: 16, color: '#666', marginTop: 5 },
  movesBox: {
    backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 15, minWidth: 126,
  },
  movesText: { fontSize: 16, fontWeight: '700', color: '#FF6B35' },
  progressText: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  gameGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14,
    marginTop: 10, zIndex: 2,
  },
  card: {
    backgroundColor: 'white', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },
  cardFlipped: { backgroundColor: '#FFF3E0' },
  cardMatched: { backgroundColor: '#C8E6C9' },
  hintText: {
    color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 10, textAlign: 'center',
  },
  countQuestionCard: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  countPlayContent: {
    flex: 1,
  },
  countQuestionTitle: {
    color: '#2E7D32',
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 14,
  },
  countEquationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countItemCard: {
    backgroundColor: '#F5FFF7',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#BEE8C8',
    flex: 1,
    minHeight: 152,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countItemNumber: {
    color: '#2E7D32',
    fontSize: 40,
    fontWeight: '900',
    lineHeight: 44,
  },
  countEmojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    minHeight: 78,
  },
  countEmoji: {
    fontSize: 42,
    lineHeight: 46,
  },
  countMathSign: {
    color: '#2E7D32',
    fontSize: 46,
    fontWeight: '900',
  },
  countResultWrap: {
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  countResultText: {
    color: '#2E7D32',
    fontSize: 52,
    fontWeight: '900',
    lineHeight: 56,
    marginTop: -8,
  },
  countOptionsWrap: {
    marginTop: 14,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingVertical: 14,
    paddingHorizontal: 10,
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
  countOptionText: {
    color: '#2E7D32',
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
    color: '#5A3CA8',
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
    backgroundColor: '#E8EEF8',
  },
  animalEmojiHeroWrap: {
    width: '100%',
    height: 98,
    borderRadius: 12,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalFallbackWrap: {
    width: '100%',
    height: 98,
    borderRadius: 12,
    backgroundColor: '#EEF3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalFallbackEmoji: {
    fontSize: 56,
  },
  animalOptionName: {
    marginTop: 8,
    color: '#2C3A57',
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
    borderColor: '#FFE082',
  },
  correctToastIcon: {
    fontSize: 28,
  },
  correctToastText: {
    marginTop: 2,
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  puzzleGuideCard: {
    width: '100%', maxWidth: 500, backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12,
  },
  puzzleGuideTitle: { fontSize: 16, fontWeight: '800', color: '#FF6B35', textAlign: 'center' },
  puzzleGuideDesc:  { marginTop: 4, fontSize: 13, color: '#5f6368', textAlign: 'center', lineHeight: 18 },
  puzzlePlayContent: { width: '100%', alignItems: 'center', paddingBottom: 14, flex: 1 },
  puzzleBoardShell:  { width: '100%', alignItems: 'center' },
  puzzleBoard: {
    backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 16,
    flexDirection: 'row', flexWrap: 'wrap', alignContent: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 5, elevation: 4,
  },
  puzzleSlot: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#7DC87D',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  puzzlePlacedPiece: {
    backgroundColor: '#DDF6DF', borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  puzzleSlotHintText: { color: '#B6B6B6', fontSize: 12, fontWeight: '700' },
  puzzleTray: {
    width: '100%', maxWidth: 500, backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 20, paddingVertical: 12, paddingHorizontal: 10, marginBottom: 12,
  },
  puzzleTrayTitle: { textAlign: 'center', color: '#5A6470', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  puzzleTrayGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, minHeight: 70,
  },
  puzzleMeasureText: { marginTop: 8, textAlign: 'center', color: '#8390A2', fontSize: 12, fontWeight: '600' },
  puzzlePieceDraggableWrap: { borderRadius: 12 },
  puzzlePiece: {
    borderRadius: 10, backgroundColor: '#F8FBFF',
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
    borderWidth: 3, borderColor: '#2E7D32',
  },
});
