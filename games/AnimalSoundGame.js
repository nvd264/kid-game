import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FARM } from '../theme';
import sharedStyles from '../shared/styles';
import { AnimatedPressable, Icon, RewardPopup } from '../shared/components';
import { ANIMAL_SOUNDS, SCREEN_WIDTH, ANIMAL_ASSETS } from '../shared/constants';

const AnimalCard = ({ animal, isWrong, isCorrect, onPress, disabled }) => {
  const cardColors = isCorrect
    ? ['#ACDAAF', '#99CC9C']
    : isWrong
      ? ['#F6A2A0', '#F19492']
      : ['#FFFFFF', '#F8FAFF'];

  return (
    <AnimatedPressable onPress={onPress} disabled={disabled}>
      <LinearGradient colors={cardColors} style={styles.animalOptionCard}>
        <View style={styles.animalEmojiHeroWrap}>
          <Icon value={animal.assetKey} size={74} />
        </View>
        <Text style={[styles.animalOptionName, (isWrong || isCorrect) && { color: '#FFF' }]}>{animal.name}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
};

const AnimalSoundGame = ({ playSound, playAnimalSound, stopAnimalSound, onExit, fontsLoaded }) => {
  const levels = {
    easy:   { name: 'Dễ',  optionCount: 2, roundsToWin: 4 },
    medium: { name: 'Vừa', optionCount: 3, roundsToWin: 5 },
    hard:   { name: 'Khó', optionCount: 4, roundsToWin: 6 },
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
      if (repeat < 2) await new Promise((resolve) => setTimeout(resolve, 320));
    }
    if (roundPlaybackTokenRef.current === playbackToken) setIsRoundPreparing(false);
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
    const timeout = setTimeout(() => { playRoundSoundSequence(); }, 450);
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

  if (screen === 'level') {
    const LEVEL_UI = {
      easy:   { assetKey: 'a_egg', badge: '2 lựa chọn', rounds: '4 câu', meter: 1 },
      medium: { assetKey: 'a_corn', badge: '3 lựa chọn', rounds: '5 câu', meter: 2 },
      hard:   { assetKey: 'a_corn', badge: '4 lựa chọn', rounds: '6 câu', meter: 3 },
    };
    const LEVEL_GRADIENTS = {
      easy:   ['#22D3EE', '#3B82F6'],
      medium: ['#06B6D4', '#6366F1'],
      hard:   ['#0EA5E9', '#4F46E5'],
    };

    return (
      <LinearGradient colors={['#06B6D4', '#4F46E5']} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={[sharedStyles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={sharedStyles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Ionicons name="chevron-back" size={24} color="#6A66A8" />
          </AnimatedPressable>
          <Text style={sharedStyles.headerTitle}>🎵 Nghe tiếng thú</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={sharedStyles.kidSelectIntroCard}>
          <Text style={sharedStyles.kidSelectIntroTitle}>🎵 Chọn con đúng</Text>
          <Text style={sharedStyles.kidSelectIntroSub}>👂➡️🎵</Text>
        </View>

        <ScrollView style={{ width: '100%' }} contentContainerStyle={sharedStyles.kidSelectScrollContent} showsVerticalScrollIndicator={false}>
          {Object.entries(levels).map(([key, level]) => {
            const lv = LEVEL_UI[key];
            return (
              <AnimatedPressable key={key} onPress={() => { playSound('levelSelect'); startGame(key); }}>
                <LinearGradient colors={LEVEL_GRADIENTS[key]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={sharedStyles.kidLevelCard}>
                  <View style={sharedStyles.kidLevelTopRow}>
                    <Image source={ANIMAL_ASSETS[lv.assetKey]} style={{ width: 40, height: 40 }} resizeMode="contain" />
                    <View style={{ flex: 1 }}>
                      <Text style={sharedStyles.kidLevelName}>{level.name}</Text>
                    </View>
                    <Text style={sharedStyles.kidLevelArrow}>▶</Text>
                  </View>
                  <View style={sharedStyles.levelVisualRow}>
                    <View style={sharedStyles.levelMiniBadge}>
                      <Text style={sharedStyles.levelMiniBadgeText}>{lv.badge}</Text>
                    </View>
                    <View style={sharedStyles.levelMiniBadge}>
                      <Text style={sharedStyles.levelMiniBadgeText}>{lv.rounds}</Text>
                    </View>
                    <View style={sharedStyles.levelDotsRow}>
                      {[0, 1, 2].map((i) => (
                        <View key={i} style={[sharedStyles.levelDot, i < lv.meter && sharedStyles.levelDotActive]} />
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
        <View style={[sharedStyles.header, { marginTop: 44 }]}>
          <AnimatedPressable style={sharedStyles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Ionicons name="chevron-back" size={24} color="#6A66A8" />
          </AnimatedPressable>
          <View style={sharedStyles.statPill}>
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
              <Image source={ANIMAL_ASSETS[(isPlayingAnimalSound || isRoundPreparing) ? 'a_corn' : 'a_egg']} style={{ width: 48, height: 48 }} resizeMode="contain" />
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
              <Image source={ANIMAL_ASSETS.a_strawberry} style={{ width: 32, height: 32 }} resizeMode="contain" />
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

export default AnimalSoundGame;

const styles = StyleSheet.create({
  animalPlayContent: { flex: 1, alignItems: 'center', paddingHorizontal: 16, paddingBottom: 20 },
  animalInstructionTitle: { marginTop: 8, color: 'white', fontSize: 26, fontWeight: '900', textAlign: 'center' },
  animalInstructionSub: { marginTop: 4, color: 'rgba(255,255,255,0.94)', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  soundPlayButton: {
    marginTop: 14, width: 116, height: 116, borderRadius: 58,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.24, shadowRadius: 8,
  },
  soundPlayButtonIcon: { fontSize: 56 },
  animalRoundText: { color: '#1E40AF', fontSize: 16, fontWeight: '900' },
  animalOptionsGrid: { marginTop: 16, width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  animalOptionCard: {
    width: Math.min(166, Math.floor((SCREEN_WIDTH - 52) / 2)),
    borderRadius: 18, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10,
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6,
  },
  animalEmojiHeroWrap: { width: '100%', height: 98, borderRadius: 12, backgroundColor: '#F4F7FF', alignItems: 'center', justifyContent: 'center' },
  animalOptionName: { marginTop: 8, color: '#334155', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  correctToast: {
    marginTop: 14, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
    minWidth: 230, borderWidth: 2, borderColor: '#FFEBAC',
  },
  correctToastIcon: { fontSize: 28 },
  correctToastText: { marginTop: 2, color: '#15AD66', fontSize: 18, fontWeight: '900', textAlign: 'center' },
});
