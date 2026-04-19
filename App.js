import React, { useState, useEffect, useRef } from 'react';
import { FARM, SHADOWS } from './theme';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, StatusBar, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Updates from 'expo-updates';
import { useFonts, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';

import { soundManager } from './shared/SoundManager';
import { AnimatedPressable } from './shared/components';
import sharedStyles from './shared/styles';

import MemoryGame from './games/MemoryGame';
import AnimalSoundGame from './games/AnimalSoundGame';
import GardenHarvestGame from './games/GardenHarvestGame';
import PuzzleGame from './games/PuzzleGame';
import LetterGame from './games/LetterGame';

export default function App() {
  const [screen, setScreen]             = useState('home');
  const [currentGame, setCurrentGame]   = useState(null);
  const [audioReady, setAudioReady]     = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const floatAnim    = useRef(new Animated.Value(0)).current;
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
    return () => { cancelled = true; };
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
      <View style={[sharedStyles.farmGearButton, !musicEnabled && sharedStyles.musicToggleDimmed]}>
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

  const handleExit = () => { setScreen('home'); };

  if (!audioReady) {
    return (
      <LinearGradient colors={FARM.skyGradient} style={[sharedStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" />
        <Text style={{ fontSize: 72 }}>🎵</Text>
        <Text style={sharedStyles.audioLoadingText}>Đang chuẩn bị nhạc nền...</Text>
      </LinearGradient>
    );
  }

  if (screen === 'game') {
    let gameScreen = null;
    if (currentGame === 'memory') {
      gameScreen = <MemoryGame playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    }
    if (currentGame === 'puzzle') {
      gameScreen = <PuzzleGame playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    }
    if (currentGame === 'garden') {
      gameScreen = <GardenHarvestGame playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} toggleMusic={toggleMusic} musicEnabled={musicEnabled} />;
    }
    if (currentGame === 'letter') {
      gameScreen = <LetterGame playSound={playSound} onExit={handleExit} fontsLoaded={fontsLoaded} />;
    }
    if (currentGame === 'animal') {
      gameScreen = (
        <AnimalSoundGame
          playSound={playSound}
          playAnimalSound={(source, options) => soundManager.playClip(source, 0.42, options)}
          stopAnimalSound={() => soundManager.stopClip()}
          onExit={handleExit}
          fontsLoaded={fontsLoaded}
        />
      );
    }
    return (
      <View style={{ flex: 1 }}>
        {gameScreen}
        {currentGame !== 'garden' && renderMusicToggle(sharedStyles.musicToggleGame)}
      </View>
    );
  }

  const F  = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F7 = fontsLoaded ? 'Nunito_700Bold'  : undefined;

  return (
    <LinearGradient colors={FARM.skyGradient} style={sharedStyles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View style={[
        sharedStyles.bgBubbleOne,
        {
          opacity: bubblePulseA.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.48] }),
          transform: [{ scale: bubblePulseA.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.09] }) }],
        },
      ]} />
      <Animated.View style={[
        sharedStyles.bgBubbleTwo,
        {
          opacity: bubblePulseB.interpolate({ inputRange: [0, 1], outputRange: [0.24, 0.42] }),
          transform: [{ scale: bubblePulseB.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] }) }],
        },
      ]} />
      <Animated.View style={[
        sharedStyles.bgBubbleThree,
        {
          opacity: bubblePulseC.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.55] }),
          transform: [{ scale: bubblePulseC.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.14] }) }],
        },
      ]} />

      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingTop: FARM.headerContentGap, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Animated.Text style={{ fontSize: 88, marginTop: 24, marginBottom: 4, transform: [{ translateY: floatAnim }] }}>
          🚜👨‍🌾
        </Animated.Text>
        <Text style={[sharedStyles.title, { fontFamily: F }]}>Bé Học Vui</Text>

        <View style={{ width: '100%', paddingHorizontal: 20, gap: 14, marginTop: 20 }}>
          <AnimatedPressable onPress={() => handleGameSelect('memory')}>
            <LinearGradient colors={['#FB923C', '#FBBF24']} style={sharedStyles.farmThemeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={sharedStyles.farmThemeEmojiWrap}>
                <Text style={sharedStyles.kidThemeEmoji}>{FARM.cardBackIcon}</Text>
              </View>
              <View style={sharedStyles.farmHomeGameTextWrap}>
                <Text style={[sharedStyles.farmThemeName, sharedStyles.farmHomeGameTitle, { fontFamily: F }]}>Tìm Cặp</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('puzzle')}>
            <LinearGradient colors={['#F472B6', '#FB923C']} style={sharedStyles.farmThemeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={sharedStyles.farmThemeEmojiWrap}>
                <Text style={sharedStyles.kidThemeEmoji}>🧩</Text>
              </View>
              <View style={sharedStyles.farmHomeGameTextWrap}>
                <Text style={[sharedStyles.farmThemeName, sharedStyles.farmHomeGameTitle, { fontFamily: F }]}>Đếm Hình</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('garden')}>
            <LinearGradient colors={['#FBBF24', '#FB923C']} style={sharedStyles.farmThemeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={sharedStyles.farmThemeEmojiWrap}>
                <Text style={sharedStyles.kidThemeEmoji}>🌾</Text>
              </View>
              <View style={sharedStyles.farmHomeGameTextWrap}>
                <Text style={[sharedStyles.farmThemeName, sharedStyles.farmHomeGameTitle, { fontFamily: F }]}>Vườn Thu Hoạch</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('letter')}>
            <LinearGradient colors={['#60A5FA', '#34D399']} style={sharedStyles.farmThemeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={sharedStyles.farmThemeEmojiWrap}>
                <Text style={sharedStyles.kidThemeEmoji}>📖</Text>
              </View>
              <View style={sharedStyles.farmHomeGameTextWrap}>
                <Text style={[sharedStyles.farmThemeName, sharedStyles.farmHomeGameTitle, { fontFamily: F }]}>Học Chữ Cái</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>

          <AnimatedPressable onPress={() => handleGameSelect('animal')}>
            <LinearGradient colors={['#06B6D4', '#4F46E5']} style={sharedStyles.farmThemeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={sharedStyles.farmThemeEmojiWrap}>
                <Text style={sharedStyles.kidThemeEmoji}>🐾</Text>
              </View>
              <View style={sharedStyles.farmHomeGameTextWrap}>
                <Text style={[sharedStyles.farmThemeName, sharedStyles.farmHomeGameTitle, { fontFamily: F }]}>Nghe Tiếng Thú</Text>
              </View>
            </LinearGradient>
          </AnimatedPressable>
        </View>

        <Text style={{ color: FARM.bodyText, fontSize: 11, marginTop: 28, fontFamily: F7, opacity: 0.55 }}>
          Music: Kevin MacLeod · Sounds: Kenney.nl (CC0)
        </Text>
      </ScrollView>
      {renderMusicToggle(sharedStyles.musicToggleHome)}
      <View style={sharedStyles.farmGrassBar} />
    </LinearGradient>
  );
}
