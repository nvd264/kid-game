import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { FARM, SHADOWS } from './theme';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar, Animated, Modal, PanResponder, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Updates from 'expo-updates';
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

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

// Letter pronunciation clips (paths; data list is below with LetterGame)
const LETTER_SOUND_ASSETS = {
  u0041: require('./assets/sounds/letters/u0041.mp3'),
  u0102: require('./assets/sounds/letters/u0102.mp3'),
  u00c2: require('./assets/sounds/letters/u00c2.mp3'),
  u0042: require('./assets/sounds/letters/u0042.mp3'),
  u0043: require('./assets/sounds/letters/u0043.mp3'),
  u0044: require('./assets/sounds/letters/u0044.mp3'),
  u0110: require('./assets/sounds/letters/u0110.mp3'),
  u0045: require('./assets/sounds/letters/u0045.mp3'),
  u00ca: require('./assets/sounds/letters/u00ca.mp3'),
  u0047: require('./assets/sounds/letters/u0047.mp3'),
  u0048: require('./assets/sounds/letters/u0048.mp3'),
  u0049: require('./assets/sounds/letters/u0049.mp3'),
  u004b: require('./assets/sounds/letters/u004b.mp3'),
  u004c: require('./assets/sounds/letters/u004c.mp3'),
  u004d: require('./assets/sounds/letters/u004d.mp3'),
  u004e: require('./assets/sounds/letters/u004e.mp3'),
  u004f: require('./assets/sounds/letters/u004f.mp3'),
  u00d4: require('./assets/sounds/letters/u00d4.mp3'),
  u01a0: require('./assets/sounds/letters/u01a0.mp3'),
  u0050: require('./assets/sounds/letters/u0050.mp3'),
  u0051: require('./assets/sounds/letters/u0051.mp3'),
  u0052: require('./assets/sounds/letters/u0052.mp3'),
  u0053: require('./assets/sounds/letters/u0053.mp3'),
  u0054: require('./assets/sounds/letters/u0054.mp3'),
  u0055: require('./assets/sounds/letters/u0055.mp3'),
  u01af: require('./assets/sounds/letters/u01af.mp3'),
  u0056: require('./assets/sounds/letters/u0056.mp3'),
  u0058: require('./assets/sounds/letters/u0058.mp3'),
  u0059: require('./assets/sounds/letters/u0059.mp3'),
};

// ============ AUDIO MANAGER ============
class SoundManager {
  constructor() {
    this.sounds = {};
    this.loaded = false;
    this.backgroundEnabled = true;
    this.externalSound = null;
    this.letterSounds = {};
    this.letterSoundsLoaded = false;
    this.letterSoundActive = null;
  }

  async loadSounds() {
    if (this.loaded) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: false,
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

  async loadLetterSounds() {
    if (this.letterSoundsLoaded) return;
    try {
      const entries = Object.entries(LETTER_SOUND_ASSETS);
      for (const [key, source] of entries) {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: false,
          isLooping: false,
          volume: 0.88,
        });
        this.letterSounds[key] = sound;
      }
      this.letterSoundsLoaded = true;
    } catch (error) {
      console.log('Error loading letter sounds:', error);
    }
  }

  async unloadLetterSounds() {
    await this.stopLetterSound();
    for (const sound of Object.values(this.letterSounds)) {
      try { await sound.unloadAsync(); } catch {}
    }
    this.letterSounds = {};
    this.letterSoundsLoaded = false;
  }

  async stopLetterSound() {
    if (!this.letterSoundActive) return;
    try {
      await this.letterSoundActive.stopAsync();
    } catch {}
    this.letterSoundActive = null;
  }

  async playLetterSound(letter) {
    const cp = letter.codePointAt(0);
    const key = `u${cp.toString(16).padStart(4, '0')}`;
    const sound = this.letterSounds[key];
    if (!sound) return;
    try {
      if (this.letterSoundActive && this.letterSoundActive !== sound) {
        try { await this.letterSoundActive.stopAsync(); } catch {}
      }
      this.letterSoundActive = sound;
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing letter sound:', error);
    }
  }

  async unloadSounds() {
    if (this.externalSound) {
      try { await this.externalSound.unloadAsync(); } catch {}
      this.externalSound = null;
    }
    await this.unloadLetterSounds();
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

  const bg = isMatched
    ? FARM.cardMatched
    : face === 'back' ? FARM.cardBack : FARM.cardFront;
  const borderCol = isMatched
    ? FARM.cardMatchedBorder
    : isHinted && face === 'back'
      ? FARM.cardHintBorder
      : face === 'back' ? FARM.cardBackBorder : FARM.cardFrontBorder;
  const shadow = isMatched ? SHADOWS.cardMatched : SHADOWS.card;
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
          borderColor: borderCol,
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
              <Text style={{ fontSize: cardSize * 0.52 }}>🐾</Text>
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

// ============ LETTER GAME DATA (29 chữ cái tiếng Việt, không gồm F J W Z) ============
// Minh hoạ: emoji → ảnh Twemoji. Phát âm: MP3 Piper (một lần tổng hợp "Chữ X." + nghỉ + từ ví dụ).
const VIETNAMESE_ALPHABET = [
  { letter: 'A',  emoji: '👕', word: 'Áo' },
  { letter: 'Ă',  emoji: '🍚', word: 'Ăn cơm' },
  { letter: 'Â',  emoji: '🎵', word: 'Âm nhạc' },
  { letter: 'B',  emoji: '🦋', word: 'Bướm' },
  { letter: 'C',  emoji: '🐟', word: 'Cá' },
  { letter: 'D',  emoji: '🍉', word: 'Dưa hấu' },
  { letter: 'Đ',  emoji: '💡', word: 'Đèn' },
  { letter: 'E',  emoji: '👶', word: 'Em bé' },
  { letter: 'Ê',  emoji: '🐸', word: 'Ếch' },
  { letter: 'G',  emoji: '🐔', word: 'Gà' },
  { letter: 'H',  emoji: '🌸', word: 'Hoa' },
  { letter: 'I',  emoji: '🤫', word: 'Im lặng' },
  { letter: 'K',  emoji: '🍬', word: 'Kẹo' },
  { letter: 'L',  emoji: '🍃', word: 'Lá' },
  { letter: 'M',  emoji: '🐱', word: 'Mèo' },
  { letter: 'N',  emoji: '🦌', word: 'Nai' },
  { letter: 'O',  emoji: '🐝', word: 'Ong' },
  { letter: 'Ô',  emoji: '🚗', word: 'Ô tô' },
  { letter: 'Ơ',  emoji: '🌶️', word: 'Ớt' },
  { letter: 'P',  emoji: '📌', word: 'Pin' },
  { letter: 'Q',  emoji: '🍊', word: 'Quả cam' },
  { letter: 'R',  emoji: '🐍', word: 'Rắn' },
  { letter: 'S',  emoji: '⭐', word: 'Sao' },
  { letter: 'T',  emoji: '🍎', word: 'Táo' },
  { letter: 'U',  emoji: '🥤', word: 'Uống nước' },
  { letter: 'Ư',  emoji: '💦', word: 'Ướt' },
  { letter: 'V',  emoji: '🦆', word: 'Vịt' },
  { letter: 'X',  emoji: '🥭', word: 'Xoài' },
  { letter: 'Y',  emoji: '❤️', word: 'Yêu thương' },
];

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
const RewardPopup = ({ visible, stars, levelNum, totalLevels, onContinue, onExit, playSound, fontsLoaded }) => {
  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
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
        <View style={styles.popupCardShell}>
          <View style={styles.popupCard}>
            <Text style={[styles.popupPraiseText, { fontFamily: F }]}>{praiseText}</Text>

          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
            {[0, 1, 2].map((i) => (
              <Animated.Text key={i} style={{ fontSize: 44, transform: [{ scale: starScales[i] }] }}>
                {i < stars ? '⭐' : '🌑'}
              </Animated.Text>
            ))}
          </View>

          <View style={styles.popupLevelBadge}>
            <Text style={[styles.popupLevelText, { fontFamily: F }]}>Màn {levelNum}/{totalLevels}</Text>
          </View>

          <AnimatedPressable
            onPress={() => { stopCelebration(); playSound('tap'); onContinue(); }}
            style={{ width: '100%', marginTop: 18 }}
          >
            <LinearGradient colors={FARM.playButtonGradient} style={[styles.winButton, SHADOWS.button]}>
              <Text style={[styles.winButtonText, { fontFamily: F }]}>{continueLabel}</Text>
            </LinearGradient>
          </AnimatedPressable>
          </View>
          {/* TouchableOpacity must own absolute position — AnimatedPressable puts style on an inner View */}
          <TouchableOpacity
            onPress={() => { stopCelebration(); playSound('tap'); onExit(); }}
            style={styles.popupCloseWrap}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          >
            <View style={styles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============================================
// GAME 1: MEMORY MATCH
// ============================================

// Theme card colours (background tint per theme)
const THEME_COLORS = {
  animals:  { bg: '#FFE8C4', accent: '#EA580C', border: '#FDBA74' },
  fruits:   { bg: '#FFD6F4', accent: '#DB2777', border: '#F472B6' },
  vehicles: { bg: '#D4ECFF', accent: '#0284C7', border: '#38BDF8' },
};

// Full-card gradients for the new theme row cards
const THEME_GRADIENTS = {
  animals:  ['#F97316', '#FACC15'],
  fruits:   ['#EC4899', '#A855F7'],
  vehicles: ['#0EA5E9', '#14F195'],
};

// Level visual config
const LEVEL_CONFIG = {
  easy: { color: '#059669', bg: '#D1FAE5', label: '⭐', desc: 'Khởi động nhẹ nhàng' },
  medium: { color: '#EA580C', bg: '#FFEDD5', label: '⭐⭐', desc: 'Tăng số lượng và nhịp độ' },
  hard: { color: '#E11D48', bg: '#FFE4E9', label: '⭐⭐⭐', desc: 'Nhiều thẻ và ít sai sót' },
  expert: { color: '#9333EA', bg: '#F3E8FF', label: '⭐⭐⭐⭐', desc: 'Mật độ cao, phản xạ nhanh' },
  master: { color: '#2563EB', bg: '#DBEAFE', label: '⭐⭐⭐⭐⭐', desc: 'Thử thách tối đa' },
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

const MemoryGame = ({ playSound, onExit, fontsLoaded }) => {
  const releasedLevels = useMemo(() => getReleasedLevelConfigs(MEMORY_LEVELS), []);
  const memoryThemeGradients = useMemo(() => ({
    animals: ['#FB923C', '#FBBF24'],
    fruits:  ['#F472B6', '#FB923C'],
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
      <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        {/* Header */}
        <View style={[styles.header, { marginTop: 10, paddingVertical: 0 }]}>
          <AnimatedPressable onPress={() => { playSound('tap'); onExit(); }}>
            <View style={styles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
          <Text style={styles.farmHeaderTitle}>🃏 Chủ đề</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={[styles.kidSelectScrollContent, styles.farmThemeSelectScrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.farmIntroCard}>
            <Text style={styles.farmIntroTitle}>Chọn bộ hình</Text>
            <Text style={styles.farmIntroSub}>10 màn · Flip & Match!</Text>
          </View>
          {THEME_ORDER.map((key) => {
            const theme = themes[key];
            if (!theme) return null;
            return (
              <AnimatedPressable key={key}
                onPress={() => { playSound('themeSelect'); startGame(key, 0); }}>
                <LinearGradient colors={memoryThemeGradients[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.farmThemeCard}>
                  <View style={styles.farmThemeEmojiWrap}>
                    <Text style={styles.kidThemeEmoji}>{theme.emoji}</Text>
                  </View>
                  <View style={styles.kidThemeTextWrap}>
                    <Text style={styles.farmThemeName}>{theme.name}</Text>
                    <Text style={styles.farmThemeSub}>CHƠI NGAY ▶</Text>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        {/* Grass decoration */}
        <View style={styles.farmGrassBar} />
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
    const cardSize  = Math.max(48, Math.min(cardFromW, cardFromH, sizeCap));

    const gridW = cols * cardSize + (cols - 1) * gap;

    return (
      <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        {/* Farm-style header */}
        <View style={[styles.farmPlayHeader, { marginTop: 10 }]}>
          <AnimatedPressable onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <View style={styles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
          <View style={styles.farmLevelBadge}>
            <Text style={styles.farmLevelText}>Màn {currentLevelIndex + 1}</Text>
          </View>
          <View style={styles.farmHeaderSpacer} />
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

        {/* Grass decoration */}
        <View style={styles.farmGrassBar} />

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

const AnimalSoundGame = ({ playSound, playAnimalSound, stopAnimalSound, onExit, fontsLoaded }) => {
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
      easy: ['#22D3EE', '#3B82F6'],
      medium: ['#06B6D4', '#6366F1'],
      hard: ['#0EA5E9', '#4F46E5'],
    };

    return (
      <LinearGradient colors={['#06B6D4', '#4F46E5']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Ionicons name="chevron-back" size={24} color="#6A66A8" />
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
      <LinearGradient colors={['#06B6D4', '#4F46E5']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Ionicons name="chevron-back" size={24} color="#6A66A8" />
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
            <LinearGradient colors={['#FFFFFF', '#D8F1FF']} style={styles.soundPlayButton}>
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
          fontsLoaded={fontsLoaded}
        />
      </LinearGradient>
    );
  }
  return null;
};

// ============================================
// GAME 3: GARDEN HARVEST (Plant → Grow → Harvest)
// Ripe crops: CC0 “CC0 Food Icons” (Open Clip Art Library subset) — assets/ui/garden/LICENSE-CC0-Food-OCAL.txt
// Soil / growth / tools: soft vector icons (MaterialCommunityIcons), not pixel art.
// ============================================
const GARDEN_PLOT_ICON = {
  empty: { name: 'terrain', color: FARM.playButtonShadow },
  planted: { name: 'sprout', color: FARM.grassDark },
  growing: { name: 'leaf', color: FARM.grassMid },
};
const GARDEN_CROPS = [
  { name: 'Cà rốt',     ripeArt: require('./assets/ui/garden/crop-carrot.png') },
  { name: 'Dâu',        ripeArt: require('./assets/ui/garden/crop-strawberry.png') },
  { name: 'Cà chua',    ripeArt: require('./assets/ui/garden/crop-tomato.png') },
  { name: 'Ngô',        ripeArt: require('./assets/ui/garden/crop-corn.png') },
  { name: 'Bông cải',   ripeArt: require('./assets/ui/garden/crop-broccoli.png') },
  { name: 'Cà tím',     ripeArt: require('./assets/ui/garden/crop-eggplant.png') },
  { name: 'Xà lách',    ripeArt: require('./assets/ui/garden/crop-lettuce.png') },
];
/** Large preview grid; only the first ACTIVE zone (2×3) accepts tools. */
const GARDEN_GRID_COLS = 7;
const GARDEN_GRID_ROWS = 5;
const GARDEN_GRID_TOTAL = GARDEN_GRID_COLS * GARDEN_GRID_ROWS;
const GARDEN_ACTIVE_COLS = 4;
const GARDEN_ACTIVE_ROWS = 3;
const GARDEN_ACTIVE_COUNT = GARDEN_ACTIVE_COLS * GARDEN_ACTIVE_ROWS;

const gardenPlotIsActive = (plotId) => {
  const col = plotId % GARDEN_GRID_COLS;
  const row = Math.floor(plotId / GARDEN_GRID_COLS);
  return row < GARDEN_ACTIVE_ROWS && col < GARDEN_ACTIVE_COLS;
};

const GROW_PHASE_DURATION = 1200;
const RIPE_PHASE_DURATION = 1200;
/** Extra hit padding around each plot while dragging tools (forgiving for small fingers). */
const GARDEN_PLOT_HIT_PAD = 16;

const GARDEN_TOOLS = [
  { id: 'hoe',     label: 'Cuốc đất',  validState: 'empty',    icon: 'shovel', color: FARM.subtitleColor },
  { id: 'water',   label: 'Tưới cây',   validState: 'planted', icon: 'watering-can', color: FARM.headerTitleColor },
  { id: 'harvest', label: 'Thu hoạch',  validState: 'ripe',    icon: 'basket', color: FARM.playButtonShadow },
];

const GardenHarvestGame = ({ playSound, onExit, fontsLoaded }) => {
  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;
  const { width: winW, height: winH } = useWindowDimensions();
  /** Garden is locked to landscape: always use the larger dimension as width. */
  const landscapeW = Math.max(winW, winH);
  const landscapeH = Math.min(winW, winH);

  const plotGap = 8;
  const gardenDockWidth = 112;
  const plotSize = useMemo(() => {
    const cols = GARDEN_GRID_COLS;
    const rows = GARDEN_GRID_ROWS;
    const fieldPadX = 12;
    const bottomPad = 8;
    const availW = landscapeW - gardenDockWidth - fieldPadX * 2;
    const availH = landscapeH - bottomPad;
    const wCell = (availW - plotGap * (cols - 1)) / cols;
    const hCell = (availH - plotGap * (rows - 1)) / rows;
    return Math.max(56, Math.min(88, Math.floor(Math.min(wCell, hCell))));
  }, [landscapeW, landscapeH, plotGap, gardenDockWidth]);

  // ── State ──
  const [plots, setPlots] = useState([]);
  const [totalHarvested, setTotalHarvested] = useState(0);
  const [flyOverlay, setFlyOverlay] = useState(null);
  const [dragTool, setDragTool] = useState(null);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [selectedToolId, setSelectedToolId] = useState('hoe');

  // ── Anim refs ──
  const plotAnimsRef = useRef({});
  const plotRefs = useRef({});
  const plotLayoutsRef = useRef({});
  const basketRef = useRef(null);
  const basketLayoutRef = useRef(null);
  const flyAnimX  = useRef(new Animated.Value(0)).current;
  const flyAnimY  = useRef(new Animated.Value(0)).current;
  const flyAnimOp = useRef(new Animated.Value(1)).current;
  const basketBounce = useRef(new Animated.Value(1)).current;
  const dragFloatX = useRef(new Animated.Value(-200)).current;
  const dragFloatY = useRef(new Animated.Value(-200)).current;
  const dragFloatScale = useRef(new Animated.Value(0)).current;

  // ── Stable refs for PanResponder closures ──
  const plotsRef = useRef([]);
  const hoveredPlotIdRef = useRef(null);
  const lastToolPlotRef = useRef({ hoe: null, water: null, harvest: null });
  const selectedToolIdRef = useRef('hoe');
  const handlersRef = useRef({});
  const dragFromFabRef = useRef(false);

  const initPlotAnim = useCallback((id) => {
    if (plotAnimsRef.current[id]) {
      if (!plotAnimsRef.current[id].toolFlash) {
        plotAnimsRef.current[id].toolFlash = new Animated.Value(1);
      }
      return;
    }
    plotAnimsRef.current[id] = {
      grow:   new Animated.Value(1),
      appear: new Animated.Value(1),
      toolFlash: new Animated.Value(1),
      timers: [],
    };
  }, []);

  const triggerPlotToolFeedback = useCallback((plotId) => {
    const anim = plotAnimsRef.current[plotId];
    if (!anim?.toolFlash) return;
    anim.toolFlash.stopAnimation();
    anim.toolFlash.setValue(1);
    Animated.sequence([
      Animated.spring(anim.toolFlash, { toValue: 1.1, useNativeDriver: true, bounciness: 12, speed: 16 }),
      Animated.spring(anim.toolFlash, { toValue: 1, useNativeDriver: true, bounciness: 10, speed: 14 }),
    ]).start();
  }, []);

  // ── Init plots (full grid visible; only first 2×3 cells are playable) ──
  useEffect(() => {
    const initial = Array.from({ length: GARDEN_GRID_TOTAL }, (_, i) => ({ id: i, state: 'empty', crop: null }));
    initial.forEach(p => initPlotAnim(p.id));
    setPlots(initial);
  }, [initPlotAnim]);

  // ── Keep plotsRef in sync with plots state ──
  useEffect(() => { plotsRef.current = plots; }, [plots]);
  useEffect(() => { selectedToolIdRef.current = selectedToolId; }, [selectedToolId]);

  // ── Landscape while in garden (native); web keeps responsive layout ──
  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {
        /* simulator / web */
      }
    })();
    return () => {
      (async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch { /* noop */ }
      })();
    };
  }, []);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      Object.values(plotAnimsRef.current).forEach(({ grow, appear, toolFlash, timers }) => {
        grow.stopAnimation();
        appear.stopAnimation();
        toolFlash?.stopAnimation();
        timers.forEach(clearTimeout);
      });
    };
  }, []);

  // ── Action handlers ──
  const handlePlant = useCallback((plotId) => {
    if (!gardenPlotIsActive(plotId)) return;
    const crop = GARDEN_CROPS[Math.floor(Math.random() * GARDEN_CROPS.length)];
    setPlots(prev => prev.map(p => p.id === plotId ? { ...p, state: 'planted', crop } : p));
    const anim = plotAnimsRef.current[plotId];
    if (anim) {
      Animated.sequence([
        Animated.spring(anim.grow, { toValue: 1.18, useNativeDriver: true, bounciness: 12, speed: 14 }),
        Animated.spring(anim.grow, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 14 }),
      ]).start();
    }
    playSound('tap');
  }, [playSound]);

  const pickPlotUnderFinger = useCallback((pageX, pageY, validState) => {
    const pad = GARDEN_PLOT_HIT_PAD;
    const layouts = plotLayoutsRef.current;
    let bestId = null;
    let bestDist = Infinity;
    for (const plot of plotsRef.current) {
      if (!gardenPlotIsActive(plot.id)) continue;
      if (plot.state !== validState) continue;
      const layout = layouts[plot.id];
      if (!layout?.width) continue;
      const { x, y, width, height } = layout;
      const cx = x + width / 2;
      const cy = y + height / 2;
      if (
        pageX >= x - pad && pageX <= x + width + pad &&
        pageY >= y - pad && pageY <= y + height + pad
      ) {
        const d = (pageX - cx) * (pageX - cx) + (pageY - cy) * (pageY - cy);
        if (d < bestDist) {
          bestDist = d;
          bestId = plot.id;
        }
      }
    }
    return bestId;
  }, []);

  const handleWater = useCallback((plotId) => {
    if (!gardenPlotIsActive(plotId)) return;
    setPlots(prev => {
      const plot = prev.find(p => p.id === plotId);
      if (!plot || plot.state !== 'planted') return prev;
      return prev.map(p => p.id === plotId ? { ...p, state: 'growing' } : p);
    });
    playSound('pick');

    const anim = plotAnimsRef.current[plotId];
    if (!anim) return;

    const t1 = setTimeout(() => {
      Animated.sequence([
        Animated.spring(anim.grow, { toValue: 1.15, useNativeDriver: true, bounciness: 10, speed: 14 }),
        Animated.spring(anim.grow, { toValue: 1, useNativeDriver: true, bounciness: 10, speed: 14 }),
      ]).start();
    }, GROW_PHASE_DURATION);

    const t2 = setTimeout(() => {
      setPlots(prev => {
        const plot = prev.find(p => p.id === plotId);
        if (!plot || plot.state !== 'growing') return prev;
        return prev.map(p => p.id === plotId ? { ...p, state: 'ripe' } : p);
      });
      playSound('match');
      Animated.sequence([
        Animated.spring(anim.grow, { toValue: 1.2, useNativeDriver: true, bounciness: 12, speed: 10 }),
        Animated.spring(anim.grow, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 10 }),
      ]).start();
    }, GROW_PHASE_DURATION + RIPE_PHASE_DURATION);

    anim.timers.push(t1, t2);
  }, [playSound]);

  const handleHarvest = useCallback((plot) => {
    if (!gardenPlotIsActive(plot.id)) return;
    const anim = plotAnimsRef.current[plot.id];
    if (anim) {
      anim.timers.forEach(clearTimeout);
      anim.timers = [];
    }

    const plotLayout = plotLayoutsRef.current[plot.id];
    const basketLayout = basketLayoutRef.current;

    if (plotLayout && basketLayout && plot.crop) {
      const startX = plotLayout.x + plotLayout.width / 2 - 24;
      const startY = plotLayout.y + plotLayout.height / 2 - 24;
      flyAnimX.setValue(0);
      flyAnimY.setValue(0);
      flyAnimOp.setValue(1);
      setFlyOverlay({ image: plot.crop.ripeArt, startX, startY });

      const targetX = basketLayout.x + basketLayout.width / 2 - 24 - startX;
      const targetY = basketLayout.y + basketLayout.height / 2 - 24 - startY;

      Animated.parallel([
        Animated.timing(flyAnimX, { toValue: targetX, duration: 520, useNativeDriver: true }),
        Animated.timing(flyAnimY, { toValue: targetY, duration: 520, useNativeDriver: true }),
        Animated.timing(flyAnimOp, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]).start(() => setFlyOverlay(null));
    }

    setPlots(prev => prev.map(p => p.id === plot.id ? { ...p, state: 'empty', crop: null } : p));

    setTotalHarvested(prev => prev + 1);

    playSound('match');
    Animated.sequence([
      Animated.spring(basketBounce, { toValue: 1.3, useNativeDriver: true, bounciness: 14, speed: 10 }),
      Animated.spring(basketBounce, { toValue: 1, useNativeDriver: true, bounciness: 14, speed: 10 }),
    ]).start();
  }, [basketBounce, flyAnimOp, flyAnimX, flyAnimY, playSound]);

  // ── Single main FAB: tap toggles radial menu; drag applies selected tool ──
  const cycleToolRef = useRef(() => {});
  const gardenMainFabPanRef = useRef(null);
  if (!gardenMainFabPanRef.current) {
    gardenMainFabPanRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
      onPanResponderGrant: (evt) => {
        dragFromFabRef.current = false;
        const { pageX, pageY } = evt.nativeEvent;
        dragFloatX.setValue(pageX - 40);
        dragFloatY.setValue(pageY - 40);
        dragFloatScale.setValue(0);
      },
      onPanResponderMove: (evt, g) => {
        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        const toolId = selectedToolIdRef.current;
        const validState = GARDEN_TOOLS.find(t => t.id === toolId)?.validState;
        if (dist > 10 && !dragFromFabRef.current) {
          dragFromFabRef.current = true;
          lastToolPlotRef.current[toolId] = null;
          setDragTool(toolId);
          Animated.spring(dragFloatScale, {
            toValue: 1.15, useNativeDriver: true, bounciness: 14, speed: 18,
          }).start();
          handlersRef.current.playSound('pick');
        }
        if (!dragFromFabRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        dragFloatX.setValue(pageX - 40);
        dragFloatY.setValue(pageY - 40);
        const newHovered = handlersRef.current.pickPlotUnderFinger(pageX, pageY, validState);
        if (newHovered !== hoveredPlotIdRef.current) {
          hoveredPlotIdRef.current = newHovered;
          setHoveredPlotId(newHovered);
        }
        if (newHovered == null) {
          lastToolPlotRef.current[toolId] = null;
          return;
        }
        if (lastToolPlotRef.current[toolId] === newHovered) return;
        lastToolPlotRef.current[toolId] = newHovered;
        handlersRef.current.triggerPlotToolFeedback(newHovered);
        if (toolId === 'hoe') handlersRef.current.handlePlant(newHovered);
        else if (toolId === 'water') handlersRef.current.handleWater(newHovered);
        else {
          const plot = plotsRef.current.find(p => p.id === newHovered);
          if (plot) handlersRef.current.handleHarvest(plot);
        }
      },
      onPanResponderRelease: () => {
        if (!dragFromFabRef.current) {
          cycleToolRef.current();
        } else {
          Animated.spring(dragFloatScale, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start(() => {
            setDragTool(null);
          });
          hoveredPlotIdRef.current = null;
          setHoveredPlotId(null);
          const toolId = selectedToolIdRef.current;
          lastToolPlotRef.current[toolId] = null;
        }
        dragFromFabRef.current = false;
      },
      onPanResponderTerminate: () => {
        dragFloatScale.setValue(0);
        setDragTool(null);
        hoveredPlotIdRef.current = null;
        setHoveredPlotId(null);
        dragFromFabRef.current = false;
      },
    });
  }

  const cycleTool = useCallback(() => {
    const currentIdx = GARDEN_TOOLS.findIndex(t => t.id === selectedToolIdRef.current);
    const nextIdx = (currentIdx + 1) % GARDEN_TOOLS.length;
    const nextId = GARDEN_TOOLS[nextIdx].id;
    setSelectedToolId(nextId);
    selectedToolIdRef.current = nextId;
    playSound('tap');
  }, [playSound]);

  // ── Tap on field: apply selected tool to plot under finger (active tiles only) ──
  const applyToolAt = useCallback((pageX, pageY) => {
    const toolId = selectedToolIdRef.current;
    const validState = GARDEN_TOOLS.find(t => t.id === toolId)?.validState;
    const plotId = handlersRef.current.pickPlotUnderFinger(pageX, pageY, validState);
    if (plotId == null) return;
    handlersRef.current.triggerPlotToolFeedback(plotId);
    if (toolId === 'hoe') handlersRef.current.handlePlant(plotId);
    else if (toolId === 'water') handlersRef.current.handleWater(plotId);
    else {
      const plot = plotsRef.current.find(p => p.id === plotId);
      if (plot) handlersRef.current.handleHarvest(plot);
    }
  }, []);

  cycleToolRef.current = cycleTool;

  handlersRef.current = {
    handlePlant,
    handleWater,
    handleHarvest,
    playSound,
    pickPlotUnderFinger,
    triggerPlotToolFeedback,
    applyToolAt,
  };

  const gardenFieldTapRef = useRef(null);
  if (!gardenFieldTapRef.current) {
    gardenFieldTapRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderRelease: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        handlersRef.current.applyToolAt?.(pageX, pageY);
      },
    });
  }

  // ── Helpers ──
  const getRipeCropArt = (plot) => (plot.state === 'ripe' ? plot.crop?.ripeArt : null);
  const plotVectorIconSize = Math.round(Math.min(plotSize - 16, 68));
  const cropArtSize = Math.round(Math.min(plotSize - 14, 76));

  const getPlotGradient = (plot) => {
    if (plot.state === 'empty') return [FARM.subtitleColor, FARM.playButtonShadow];
    if (plot.state === 'planted') return [FARM.cardFront, FARM.cardFrontBorder];
    if (plot.state === 'growing') return [FARM.cardMatched, FARM.grassLight];
    if (plot.state === 'ripe') return [FARM.cardMatched, FARM.hillColor];
    return [FARM.subtitleColor, FARM.playButtonShadow];
  };

  /** Appealing pastels for locked tiles — distinct from active zone without being dull. */
  const getPlotGradientLocked = (plot) => {
    if (plot.state === 'empty')   return ['#E8F5E9', '#C8E6C9'];  // soft sage green
    if (plot.state === 'planted') return ['#F3E5F5', '#E1BEE7'];  // soft lavender
    if (plot.state === 'growing') return ['#E3F2FD', '#BBDEFB'];  // soft sky blue
    if (plot.state === 'ripe')    return ['#FFF8E1', '#FFECB3'];  // warm golden
    return ['#E8F5E9', '#C8E6C9'];
  };

  const plotIconLockedColor = FARM.bodyText;

  const renderGardenCell = (plot, isLocked) => {
    const anim = plotAnimsRef.current[plot.id];
    const scaleTransform = anim
      ? [{ scale: anim.grow }, { scale: anim.toolFlash }]
      : [];
    const ripeArt = getRipeCropArt(plot);
    const isHovered = !isLocked && hoveredPlotId === plot.id;
    const gradient = isLocked ? getPlotGradientLocked(plot) : getPlotGradient(plot);
    const iconSz = Math.round(plotVectorIconSize * (isLocked ? 0.82 : 1));
    return (
      <Animated.View
        key={plot.id}
        style={[
          styles.gardenPlotWrap,
          isLocked && styles.gardenPlotWrapLocked,
          { transform: scaleTransform, width: plotSize, height: plotSize },
        ]}
      >
        <View
          ref={ref => { plotRefs.current[plot.id] = ref; }}
          onLayout={() => {
            if (plotRefs.current[plot.id]) {
              plotRefs.current[plot.id].measureInWindow((x, y, w, h) => {
                plotLayoutsRef.current[plot.id] = { x, y, width: w, height: h };
              });
            }
          }}
        >
          <LinearGradient
            colors={gradient}
            style={[
              styles.gardenPlot,
              { width: plotSize, height: plotSize },
              plot.state === 'empty' && (isLocked ? styles.gardenPlotEmptyLocked : styles.gardenPlotEmpty),
              isHovered && styles.gardenPlotHovered,
              isLocked && styles.gardenPlotLocked,
            ]}
          >
            {plot.state === 'empty' ? (
              <MaterialCommunityIcons
                name={GARDEN_PLOT_ICON.empty.name}
                size={iconSz}
                color={isLocked ? plotIconLockedColor : GARDEN_PLOT_ICON.empty.color}
              />
            ) : plot.state === 'planted' ? (
              <MaterialCommunityIcons
                name={GARDEN_PLOT_ICON.planted.name}
                size={iconSz}
                color={isLocked ? plotIconLockedColor : GARDEN_PLOT_ICON.planted.color}
              />
            ) : plot.state === 'growing' ? (
              <MaterialCommunityIcons
                name={GARDEN_PLOT_ICON.growing.name}
                size={iconSz}
                color={isLocked ? plotIconLockedColor : GARDEN_PLOT_ICON.growing.color}
              />
            ) : ripeArt ? (
              <Image
                source={ripeArt}
                style={[
                  styles.gardenPlotCropImage,
                  { width: cropArtSize, height: cropArtSize },
                  isLocked && styles.gardenPlotCropImageLocked,
                ]}
                resizeMode="contain"
              />
            ) : null}
            {!isLocked && plot.state === 'planted' && (
              <View style={styles.gardenNeedWaterBadge}>
                <Text style={styles.gardenNeedWaterBadgeText}>💧</Text>
              </View>
            )}
            {!isLocked && plot.state === 'ripe' && (
              <View style={styles.gardenRipeBadge}>
                <Text style={styles.gardenRipeBadgeText}>✓</Text>
              </View>
            )}
            {!isLocked && plot.state === 'growing' && (
              <View style={styles.gardenGrowingBadge}>
                <Text style={styles.gardenGrowingBadgeText}>✨</Text>
              </View>
            )}
            {isLocked && (
              <View style={styles.gardenLockedHint} pointerEvents="none">
                <MaterialCommunityIcons name="lock-outline" size={16} color={FARM.white} />
              </View>
            )}
          </LinearGradient>
        </View>
      </Animated.View>
    );
  };

  const gardenGridRows = useMemo(
    () => Array.from({ length: GARDEN_GRID_ROWS }, (_, row) =>
      plots.slice(row * GARDEN_GRID_COLS, (row + 1) * GARDEN_GRID_COLS)),
    [plots],
  );

  const gardenFieldBlock = (
    <View style={[styles.gardenFieldPatch, styles.gardenFieldPressable]} {...gardenFieldTapRef.current.panHandlers}>
      <View style={styles.gardenPlotGridColumn}>
        {gardenGridRows.map((rowPlots, rowIdx) => (
          <View key={`garden-row-${rowIdx}`} style={[styles.gardenGridRow, { gap: plotGap, marginBottom: plotGap }]}>
            {rowIdx < GARDEN_ACTIVE_ROWS ? (
              <>
                <View style={styles.gardenActiveCluster}>
                  {rowPlots.slice(0, GARDEN_ACTIVE_COLS).map(p => renderGardenCell(p, false))}
                </View>
                {rowPlots.slice(GARDEN_ACTIVE_COLS).map(p => renderGardenCell(p, true))}
              </>
            ) : (
              rowPlots.map(p => renderGardenCell(p, true))
            )}
          </View>
        ))}
      </View>
    </View>
  );

  const selectedToolDef = GARDEN_TOOLS.find(t => t.id === selectedToolId) ?? GARDEN_TOOLS[0];

  const gardenDockBlock = (
    <View style={[styles.gardenDockColumn, { width: gardenDockWidth }]}>
      <View
        style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
        {...gardenMainFabPanRef.current.panHandlers}
      >
        <LinearGradient colors={FARM.playButtonGradient} style={styles.gardenMainFab}>
          <MaterialCommunityIcons name={selectedToolDef.icon} size={40} color={selectedToolDef.color} />
        </LinearGradient>
        <Text style={[styles.gardenMainFabHint, { fontFamily: F8 }]} numberOfLines={1}>
          {selectedToolDef.label}
        </Text>
      </View>
    </View>
  );

  const gardenFlyAndDrag = (
    <>
      {flyOverlay && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.gardenFlyOverlay,
            {
              left: flyOverlay.startX,
              top: flyOverlay.startY,
              transform: [{ translateX: flyAnimX }, { translateY: flyAnimY }],
              opacity: flyAnimOp,
            },
          ]}
        >
          <Image
            source={flyOverlay.image}
            style={{ width: cropArtSize + 8, height: cropArtSize + 8 }}
            resizeMode="contain"
          />
        </Animated.View>
      )}
      {dragTool && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.gardenDragFloat,
            {
              transform: [
                { translateX: dragFloatX },
                { translateY: dragFloatY },
                { scale: dragFloatScale },
              ],
            },
          ]}
        >
          {GARDEN_TOOLS.filter(t => t.id === dragTool).map(t => (
            <MaterialCommunityIcons key={t.id} name={t.icon} size={52} color={t.color} />
          ))}
        </Animated.View>
      )}
    </>
  );

  const gardenGradientInner = (
    <View style={styles.gardenRootLandscape}>
      <StatusBar barStyle="dark-content" />

      {/* Floating X close button — top-left overlay */}
      <AnimatedPressable
        onPress={() => { playSound('tap'); onExit(); }}
        style={styles.gardenFloatingClose}
      >
        <View style={styles.farmCloseButton}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </View>
      </AnimatedPressable>

      {/* Floating basket counter — top-right overlay */}
      <Animated.View
        ref={basketRef}
        onLayout={() => {
          if (basketRef.current) {
            basketRef.current.measureInWindow((x, y, w, h) => {
              basketLayoutRef.current = { x, y, width: w, height: h };
            });
          }
        }}
        style={[styles.gardenFloatingBasket, { transform: [{ scale: basketBounce }] }]}
      >
        <MaterialCommunityIcons name="basket" size={26} color={FARM.playButtonShadow} />
        <Text style={[styles.gardenBasketCount, { fontFamily: F8 }]}>{totalHarvested}</Text>
      </Animated.View>

      <View style={styles.gardenLandscapeRow}>
        {gardenFieldBlock}
        {gardenDockBlock}
      </View>

      {gardenFlyAndDrag}
      <View style={styles.farmGrassBar} />
    </View>
  );

  return (
    <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
      {gardenGradientInner}
    </LinearGradient>
  );
};

// ============================================
// RESTORED GAME: COUNTING QUIZ
// ============================================
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
      <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={[styles.header, { marginTop: 10, paddingVertical: 0 }]}>
          <AnimatedPressable onPress={() => { playSound('tap'); onExit(); }}>
            <View style={styles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
          <Text style={[styles.farmHeaderTitle, { fontFamily: F }]}>🧮 Chủ đề</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          style={{ flex: 1, width: '100%' }}
          contentContainerStyle={[styles.kidSelectScrollContent, styles.farmThemeSelectScrollContent]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.farmIntroCard}>
            <Text style={[styles.farmIntroTitle, { fontFamily: F }]}>Đếm & chọn số</Text>
            <Text style={[styles.farmIntroSub, { fontFamily: F8 }]}>🎯 10 màn mở khóa</Text>
          </View>
          {THEME_ORDER.map((key) => {
            const theme = themes[key];
            if (!theme) return null;
            return (
              <AnimatedPressable key={key}
                onPress={() => { playSound('themeSelect'); startGame(key, 0); }}>
                <LinearGradient colors={puzzleThemeGradients[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.farmThemeCard}>
                  <View style={styles.farmThemeEmojiWrap}>
                    <Text style={styles.kidThemeEmoji}>{theme.emoji}</Text>
                  </View>
                  <View style={styles.kidThemeTextWrap}>
                    <Text style={[styles.farmThemeName, { fontFamily: F }]}>{theme.name}</Text>
                    <Text style={[styles.farmThemeSub, { fontFamily: F8 }]}>CHƠI NGAY ▶</Text>
                  </View>
                </LinearGradient>
              </AnimatedPressable>
            );
          })}
        </ScrollView>

        <View style={styles.farmGrassBar} />
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
        <View style={[styles.farmPlayHeader, { marginTop: 10 }]}>
          <AnimatedPressable onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <View style={styles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </AnimatedPressable>
          <View style={styles.farmLevelBadge}>
            <Text style={[styles.farmLevelText, { fontFamily: F }]}>Màn {currentLevelIndex + 1}</Text>
          </View>
          <View style={styles.farmHeaderSpacer} />
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
                          ]}
                          >
                            {option}
                          </Text>
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
        <View style={styles.farmGrassBar} />

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

// ============================================
// GAME 4: LEARN VIETNAMESE LETTERS (bảng chữ cái + minh hoạ + phát âm)
// ============================================

// Letter game — nav card accents (warm, sky-friendly; same family as theme cards)
const LETTER_NAV_GRADIENTS = [
  ['#FB923C', '#FBBF24'],
  ['#F472B6', '#FB923C'],
  ['#60A5FA', '#34D399'],
];

const LetterGame = ({ playSound, onExit, fontsLoaded }) => {
  const [index, setIndex] = useState(0);
  const total = VIETNAMESE_ALPHABET.length;
  const entry = VIETNAMESE_ALPHABET[index];
  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;
  const F7 = fontsLoaded ? 'Nunito_700Bold' : undefined;
  const prevGradient = LETTER_NAV_GRADIENTS[(index + 2) % LETTER_NAV_GRADIENTS.length];
  const nextGradient = LETTER_NAV_GRADIENTS[(index + 1) % LETTER_NAV_GRADIENTS.length];

  useEffect(() => () => { soundManager.unloadLetterSounds(); }, []);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = null;
    (async () => {
      await soundManager.loadLetterSounds();
      if (cancelled) return;
      timeoutId = setTimeout(() => { soundManager.playLetterSound(entry.letter); }, 320);
    })();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [entry]);

  const goPrev = () => {
    soundManager.stopLetterSound();
    playSound('tap');
    setIndex((i) => (i <= 0 ? total - 1 : i - 1));
  };

  const goNext = () => {
    soundManager.stopLetterSound();
    playSound('tap');
    setIndex((i) => (i >= total - 1 ? 0 : i + 1));
  };

  const replay = () => {
    soundManager.stopLetterSound();
    playSound('levelSelect');
    soundManager.playLetterSound(entry.letter);
  };

  return (
    <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.farmPlayHeader, { marginTop: 10 }]}>
        <AnimatedPressable onPress={() => { soundManager.stopLetterSound(); playSound('tap'); onExit(); }}>
          <View style={styles.farmCloseButton}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </View>
        </AnimatedPressable>
        <View style={styles.farmLevelBadge}>
          <Text style={[styles.farmLevelText, { fontFamily: F }]}>Chữ {index + 1}/{total}</Text>
        </View>
        <View style={styles.farmHeaderSpacer} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.letterLearnScroll}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.letterHeroCard}>
          <View style={styles.letterHeroIconRing}>
            <Icon value={entry.emoji} size={120} />
          </View>
          <Text style={[styles.letterHeroLetter, { fontFamily: F }]}>{entry.letter}</Text>
          <Text style={[styles.letterHeroHint, { fontFamily: F7 }]}>Ví dụ: {entry.word}</Text>
        </View>

        <AnimatedPressable onPress={replay} style={{ width: '100%', marginBottom: 14 }}>
          <LinearGradient
            colors={FARM.playButtonGradient}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.letterListenCard, SHADOWS.button]}
          >
            <View style={styles.letterListenIconWrap}>
              <Ionicons name="volume-high" size={34} color={FARM.playButtonText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.letterListenTitle, { fontFamily: F }]}>Nghe phát âm</Text>
              <Text style={[styles.letterListenSub, { fontFamily: F8 }]}>Chạm để nghe lại</Text>
            </View>
            <Text style={[styles.letterListenPlayCue, { fontFamily: F8 }]}>▶</Text>
          </LinearGradient>
        </AnimatedPressable>

        <View style={styles.letterNavRow}>
          <TouchableOpacity activeOpacity={0.92} onPress={goPrev} style={styles.letterNavHalf}>
            <LinearGradient
              colors={prevGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.letterNavCard, SHADOWS.button, styles.letterNavCardFill]}
            >
              <View style={styles.letterNavIconWrap}>
                <Ionicons name="play-back" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.letterNavTitleWrap}>
                <Text style={[styles.letterNavTitle, { fontFamily: F }]}>Chữ trước</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.92} onPress={goNext} style={styles.letterNavHalf}>
            <LinearGradient
              colors={nextGradient}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.letterNavCard, SHADOWS.button, styles.letterNavCardFill]}
            >
              <View style={styles.letterNavIconWrap}>
                <Ionicons name="play-forward" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.letterNavTitleWrap}>
                <Text style={[styles.letterNavTitle, { fontFamily: F }]}>Chữ sau</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.farmGrassBar} />
    </LinearGradient>
  );
};

// ============================================
// MAIN APP (HOME)
// ============================================
export default function App() {
  const [screen, setScreen]           = useState('home');
  const [currentGame, setCurrentGame] = useState(null);
  const [audioReady, setAudioReady]   = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const bubblePulseA = useRef(new Animated.Value(0)).current;
  const bubblePulseB = useRef(new Animated.Value(0)).current;
  const bubblePulseC = useRef(new Animated.Value(0)).current;

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
    if (__DEV__) return;
    if (!Updates.isEnabled) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (cancelled || !result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        if (!cancelled) await Updates.reloadAsync();
      } catch {
        // Offline or update server unreachable; keep running current bundle.
      }
    })();
    return () => {
      cancelled = true;
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

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubblePulseA, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(bubblePulseA, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubblePulseB, { toValue: 1, duration: 2300, useNativeDriver: true }),
        Animated.timing(bubblePulseB, { toValue: 0, duration: 2300, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubblePulseC, { toValue: 1, duration: 2800, useNativeDriver: true }),
        Animated.timing(bubblePulseC, { toValue: 0, duration: 2800, useNativeDriver: true }),
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

  const renderMusicToggle = (positionStyle) => (
    <TouchableOpacity onPress={toggleMusic} style={positionStyle} activeOpacity={0.9}>
      <View style={[styles.farmGearButton, !musicEnabled && styles.musicToggleDimmed]}>
        <Ionicons
          name={musicEnabled ? 'musical-notes' : 'volume-mute'}
          size={24}
          color={FARM.playButtonText}
        />
      </View>
    </TouchableOpacity>
  );

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
      <LinearGradient colors={FARM.skyGradient} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" />
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
    if (currentGame === 'letter')   gameScreen = <LetterGame         playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    return (
      <View style={{ flex: 1 }}>
        {gameScreen}
        {renderMusicToggle(styles.musicToggleGame)}
      </View>
    );
  }

  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F7 = fontsLoaded ? 'Nunito_700Bold' : undefined;

  return (
    <LinearGradient colors={FARM.skyGradient} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Decorative circles */}
      <Animated.View style={[
        styles.bgBubbleOne,
        {
          opacity: bubblePulseA.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.48] }),
          transform: [{ scale: bubblePulseA.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.09] }) }],
        },
      ]} />
      <Animated.View style={[
        styles.bgBubbleTwo,
        {
          opacity: bubblePulseB.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.42] }),
          transform: [{ scale: bubblePulseB.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }) }],
        },
      ]} />
      <Animated.View style={[
        styles.bgBubbleThree,
        {
          opacity: bubblePulseC.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] }),
          transform: [{ scale: bubblePulseC.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.14] }) }],
        },
      ]} />

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: FARM.headerContentGap, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.Text style={{ fontSize: 88, marginTop: 24, marginBottom: 4, transform: [{ translateY: floatAnim }] }}>
          🚜👨‍🌾
        </Animated.Text>
        <Text style={[styles.title, { fontFamily: F }]}>Bé Học Vui</Text>

        {/* Game buttons */}
        <View style={{ width: '100%', paddingHorizontal: 20, gap: 14, marginTop: 20 }}>
          <AnimatedPressable onPress={() => handleGameSelect('memory')}>
            <LinearGradient colors={['#FB923C', '#FBBF24']} style={styles.farmThemeCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.farmThemeEmojiWrap}>
                <Text style={styles.kidThemeEmoji}>{FARM.cardBackIcon}</Text>
              </View>
              <View style={styles.farmHomeGameTextWrap}>
                <Text style={[styles.farmThemeName, styles.farmHomeGameTitle, { fontFamily: F }]}>Tìm Cặp</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('puzzle')}>
            <LinearGradient colors={['#F472B6', '#FB923C']} style={styles.farmThemeCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.farmThemeEmojiWrap}>
                <Text style={styles.kidThemeEmoji}>🧩</Text>
              </View>
              <View style={styles.farmHomeGameTextWrap}>
                <Text style={[styles.farmThemeName, styles.farmHomeGameTitle, { fontFamily: F }]}>Đếm Hình</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('garden')}>
            <LinearGradient colors={['#FBBF24', '#FB923C']} style={styles.farmThemeCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.farmThemeEmojiWrap}>
                <Text style={styles.kidThemeEmoji}>🌾</Text>
              </View>
              <View style={styles.farmHomeGameTextWrap}>
                <Text style={[styles.farmThemeName, styles.farmHomeGameTitle, { fontFamily: F }]}>Vườn Thu Hoạch</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('letter')}>
            <LinearGradient colors={['#60A5FA', '#34D399']} style={styles.farmThemeCard} start={{x:0,y:0}} end={{x:1,y:1}}>
              <View style={styles.farmThemeEmojiWrap}>
                <Text style={styles.kidThemeEmoji}>📖</Text>
              </View>
              <View style={styles.farmHomeGameTextWrap}>
                <Text style={[styles.farmThemeName, styles.farmHomeGameTitle, { fontFamily: F }]}>Học Chữ Cái</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

        </View>

        {/* Footer credit */}
        <Text style={{ color: FARM.bodyText, fontSize: 11, marginTop: 28, fontFamily: F7, opacity: 0.55 }}>
          Music: Kevin MacLeod · Sounds: Kenney.nl (CC0)
        </Text>
      </ScrollView>
      {renderMusicToggle(styles.musicToggleHome)}
      <View style={styles.farmGrassBar} />
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
    backgroundColor: 'rgba(250,204,21,0.42)', top: -80, right: -80,
  },
  bgBubbleTwo: {
    position: 'absolute', width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(250,204,21,0.32)', bottom: 60, left: -70,
  },
  bgBubbleThree: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(56,189,248,0.45)', top: 220, left: 30,
  },
  title:    { fontSize: 42, fontWeight: '900', color: FARM.titleColor, textAlign: 'center',
              textShadowColor: 'rgba(0,0,0,0.12)', textShadowOffset: {width:0,height:2}, textShadowRadius: 4 },
  subtitle: { fontSize: 19, color: FARM.subtitleColor, marginTop: 6, textAlign: 'center' },
  audioLoadingText: {
    marginTop: 10,
    color: FARM.titleColor,
    fontSize: 18,
    fontWeight: '800',
  },
  musicToggleHome: {
    position: 'absolute',
    top: 58,
    right: 16,
    zIndex: 200,
    elevation: 24,
  },
  musicToggleGame: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 200,
    elevation: 24,
  },
  musicToggleDimmed: {
    opacity: 0.68,
  },
  // ── Big action button (win screen etc.) ──
  bigButton: {
    paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 30, width: '100%', alignItems: 'center',
    backgroundColor: '#EA580C',
    elevation: 5,
    shadowColor: '#9A3412', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 7,
  },
  bigButtonText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 0.4 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', paddingHorizontal: 16, paddingVertical: 10, marginBottom: FARM.headerContentGap, zIndex: 2,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#D6DCFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#4B3B89',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statsRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  statPill: {
    backgroundColor: 'rgba(255,255,255,0.98)', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, elevation: 3,
    borderWidth: 1,
    borderColor: '#FBBF24',
  },
  statPillText: { fontSize: 14, fontWeight: '800', color: '#C2410C' },
  headerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.28)', textShadowRadius: 4 },
  // ── Reward popup ──
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(27, 79, 139, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  popupCardShell: {
    width: '84%',
    maxWidth: 400,
    position: 'relative',
    alignItems: 'stretch',
    overflow: 'visible',
    zIndex: 1,
  },
  popupCard: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: 28,
    padding: 28,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
    ...SHADOWS.button,
    zIndex: 0,
    elevation: 8,
  },
  popupCloseWrap: {
    position: 'absolute',
    top: -16,
    right: -10,
    zIndex: 100,
    elevation: 24,
  },
  popupPraiseText: {
    fontSize: 26,
    fontWeight: '900',
    color: FARM.titleColor,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  popupLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderWidth: 2,
    borderColor: FARM.cardBackBorder,
    ...SHADOWS.header,
  },
  popupLevelText: {
    fontSize: 18,
    color: FARM.headerTitleColor,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // ── Win screen ──
  winCard: {
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 32, padding: 28,
    alignItems: 'center', width: '100%', maxWidth: 400,
    elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16,
  },
  winTitle:     { fontSize: 30, fontWeight: '900', color: '#EA580C', marginTop: 4, textAlign: 'center' },
  winSubtitle:  { fontSize: 16, color: '#475569', textAlign: 'center', fontWeight: '700' },
  winButton: {
    borderRadius: 28,
    minHeight: 56,
    width: '100%',
    paddingHorizontal: 22,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  winButtonText: {
    color: FARM.playButtonText,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.82)',
    elevation: 4,
    shadowColor: '#3E3C89',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
  },
  kidSelectIntroTitle: {
    color: '#1E3A8A',
    fontSize: 22,
    fontWeight: '900',
  },
  kidSelectIntroSub: {
    marginTop: 4,
    color: '#1D4ED8',
    fontSize: 18,
    fontWeight: '800',
  },
  kidSelectScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  /** Theme pick screens: vertically center intro + cards between header and grass. */
  farmThemeSelectScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.32)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  kidThemeSub: {
    marginTop: 3,
    color: '#FFFDEB',
    fontSize: 20,
    fontWeight: '900',
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
    textShadowColor: 'rgba(0,0,0,0.32)',
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
    backgroundColor: 'rgba(255,255,255,0.36)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
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
    backgroundColor: 'rgba(255,255,255,0.36)',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.62)',
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
    textShadowColor: 'rgba(0,0,0,0.32)',
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
    color: '#FFFDE9',
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
  themeName: { fontSize: 22, fontWeight: '800', color: '#475569' },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 25, padding: 24,
    width: '100%', maxWidth: 400,
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 5,
  },
  levelCardPurple: { borderLeftWidth: 4, borderLeftColor: '#C3A9EA' },
  levelCardGreen:  { borderLeftWidth: 4, borderLeftColor: '#9BD5A9' },
  levelName: { fontSize: 26, fontWeight: '800', color: '#EA580C' },
  levelDesc: { fontSize: 16, color: '#475569', marginTop: 5 },
  movesBox: {
    backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 15, minWidth: 126,
  },
  movesText: { fontSize: 16, fontWeight: '700', color: '#EA580C' },
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
    color: '#FFFBE8', fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center',
    textShadowColor: 'rgba(59,9,99,0.42)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 5,
  },
  gardenInstructionRow: {
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  gardenRootLandscape: {
    flex: 1,
    position: 'relative',
  },
  gardenHeaderLandscape: {
    paddingHorizontal: 4,
  },
  gardenInstructionRowLandscape: {
    alignSelf: 'stretch',
    marginHorizontal: 8,
    marginTop: 2,
    marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  gardenLandscapeRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: 4,
    paddingBottom: 4,
    minHeight: 0,
  },
  gardenDockColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 2,
  },
  gardenFabArena: {
    position: 'relative',
    alignSelf: 'center',
  },
  gardenRadialSatelliteWrap: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 4,
  },
  gardenRadialSatellite: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: FARM.playButtonShadow,
    ...SHADOWS.button,
  },
  gardenRadialLabel: {
    marginTop: 2,
    color: FARM.subtitleColor,
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: 72,
  },
  gardenMainFabAnchor: {
    position: 'absolute',
    zIndex: 5,
    alignItems: 'center',
  },
  gardenMainFab: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: FARM.cardHintBorder,
    ...SHADOWS.button,
  },
  gardenMainFabHint: {
    marginTop: 4,
    color: FARM.subtitleColor,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    maxWidth: 100,
  },
  gardenFieldPressable: {
    flex: 1,
    marginHorizontal: 4,
    minWidth: 0,
  },
  gardenInstructionText: {
    color: FARM.subtitleColor,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  gardenBasketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FARM.cardMatched,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: FARM.cardMatchedBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 62,
    height: 44,
    justifyContent: 'center',
    gap: 4,
    ...SHADOWS.header,
  },
  gardenBasketCount: {
    color: FARM.subtitleColor,
    fontSize: 18,
    fontWeight: '900',
  },
  gardenFieldPatch: {
    flex: 1,
    marginTop: 2,
    marginBottom: 2,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: FARM.grassDark,
    backgroundColor: FARM.grassMid,
    paddingHorizontal: 6,
    paddingVertical: 8,
    ...SHADOWS.card,
  },
  gardenPlotGridColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gardenGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  gardenActiveCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: FARM.cardHintBorder,
    borderRadius: 20,
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.35)',
    gap: 8,
    ...SHADOWS.header,
  },
  gardenPlotWrap: {
    borderRadius: 18,
    ...SHADOWS.card,
  },
  gardenPlotWrapLocked: {
    shadowOpacity: 0.12,
    elevation: 2,
  },
  gardenPlot: {
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
  },
  gardenPlotEmpty: {
    borderStyle: 'dashed',
    borderColor: FARM.grassLight,
    borderWidth: 2,
  },
  gardenPlotEmptyLocked: {
    borderStyle: 'dashed',
    borderColor: FARM.bodyText,
    borderWidth: 2,
    opacity: 0.85,
  },
  gardenPlotLocked: {
    opacity: 0.72,
  },
  gardenLockedHint: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(55,65,81,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gardenPlotCropImage: {
    marginTop: 2,
  },
  gardenPlotCropImageLocked: {
    opacity: 0.45,
  },
  gardenNeedWaterBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FARM.skyGradient[1],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FARM.cardHintBorder,
  },
  gardenNeedWaterBadgeText: {
    fontSize: 14,
  },
  gardenRipeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: FARM.grassDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: FARM.grassMid,
  },
  gardenRipeBadgeText: {
    color: FARM.white,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 16,
  },
  gardenGrowingBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  gardenGrowingBadgeText: {
    fontSize: 18,
  },
  gardenFlyOverlay: {
    position: 'absolute',
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  gardenPlotHovered: {
    borderWidth: 3,
    borderColor: FARM.cardHintBorder,
    shadowColor: FARM.cardHintBorder,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  gardenDragFloat: {
    position: 'absolute',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  gardenFloatingClose: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 10,
  },
  gardenFloatingBasket: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FARM.cardMatched,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: FARM.cardMatchedBorder,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 62,
    height: 44,
    justifyContent: 'center',
    gap: 4,
    ...SHADOWS.header,
  },
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
    color: '#1E40AF',
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
    color: '#334155',
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
    color: '#15AD66',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  puzzleGuideCard: {
    width: '100%', maxWidth: 500, backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 12,
  },
  puzzleGuideTitle: { fontSize: 16, fontWeight: '900', color: '#D45D00', textAlign: 'center' },
  puzzleGuideDesc:  { marginTop: 4, fontSize: 13, color: '#56606D', textAlign: 'center', lineHeight: 18 },
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
    borderWidth: 3, borderColor: '#18C66A',
  },

  // ── Letter game (bảng chữ cái) ──
  letterLearnScroll: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    paddingTop: 8,
  },
  letterHeroCard: {
    backgroundColor: FARM.cardFront,
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
    ...SHADOWS.card,
  },
  letterHeroIconRing: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: FARM.cardMatched,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: FARM.cardMatchedBorder,
    marginBottom: 14,
  },
  letterHeroLetter: {
    fontSize: 72,
    fontWeight: '900',
    color: FARM.headerTitleColor,
    letterSpacing: 2,
  },
  letterHeroHint: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '800',
    color: FARM.subtitleColor,
    textAlign: 'center',
  },
  letterListenCard: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: FARM.settingsBorderColor,
  },
  letterListenIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  letterListenTitle: {
    color: FARM.playButtonText,
    fontSize: 22,
    fontWeight: '900',
  },
  letterListenSub: {
    marginTop: 2,
    color: FARM.playButtonText,
    fontSize: 15,
    fontWeight: '800',
    opacity: 0.92,
  },
  letterListenPlayCue: {
    fontSize: 22,
    fontWeight: '800',
    color: FARM.playButtonText,
    opacity: 0.85,
  },
  letterNavRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  letterNavHalf: {
    flex: 1,
    minWidth: 0,
  },
  letterNavCardFill: {
    width: '100%',
  },
  letterNavTitleWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  letterNavCard: {
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  letterNavIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  letterNavTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ── Farm Theme (Tìm Cặp / Memory game) ──
  farmCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FARM.closeButtonBg,
    borderWidth: 2,
    borderColor: FARM.closeButtonBorder,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.header,
  },
  farmGearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: FARM.settingsButtonBg,
    borderWidth: 2,
    borderColor: FARM.settingsBorderColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.header,
  },
  farmHeaderSpacer: {
    width: 44,
    height: 44,
  },
  farmHeaderTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: FARM.headerTitleColor,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  farmPlayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 0,
    marginBottom: FARM.headerContentGap,
    zIndex: 2,
  },
  farmLevelBadge: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: FARM.cardBackBorder,
    ...SHADOWS.header,
  },
  farmLevelText: {
    fontSize: 18,
    fontWeight: '900',
    color: FARM.headerTitleColor,
  },
  farmIntroCard: {
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: FARM.cardFrontBorder,
    ...SHADOWS.header,
  },
  farmIntroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: FARM.titleColor,
  },
  farmIntroSub: {
    fontSize: 15,
    fontWeight: '700',
    color: FARM.subtitleColor,
    marginTop: 4,
  },
  farmThemeCard: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    ...SHADOWS.button,
  },
  /** Home minigame row: title only, vertically centered beside emoji */
  farmHomeGameTextWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  farmHomeGameTitle: {
    width: '100%',
    textAlign: 'left',
  },
  farmThemeEmojiWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  farmThemeName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  farmThemeSub: {
    fontSize: 13,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  farmGrassBar: {
    marginTop: FARM.contentGapAboveGrass,
    height: 40,
    backgroundColor: FARM.grassMid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 3,
    borderColor: FARM.grassDark,
  },
});
