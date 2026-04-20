import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FARM, SHADOWS } from '../theme';
import sharedStyles from '../shared/styles';
import { AnimatedPressable, Icon } from '../shared/components';
import { VIETNAMESE_ALPHABET, LETTER_NAV_GRADIENTS } from '../shared/constants';
import { soundManager } from '../shared/SoundManager';

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
      <View style={[sharedStyles.farmPlayHeader, { marginTop: 10 }]}>
        <AnimatedPressable onPress={() => { soundManager.stopLetterSound(); playSound('tap'); onExit(); }}>
          <View style={sharedStyles.farmCloseButton}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </View>
        </AnimatedPressable>
        <View style={sharedStyles.farmLevelBadge}>
          <Text style={[sharedStyles.farmLevelText, { fontFamily: F }]}>Chữ {index + 1}/{total}</Text>
        </View>
        <View style={sharedStyles.farmHeaderSpacer} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.letterLearnScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.letterHeroCard}>
          <View style={styles.letterHeroIconRing}>
            <Icon value={entry.assetKey} size={120} />
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

      <View style={sharedStyles.farmGrassBar} />
    </LinearGradient>
  );
};

export default LetterGame;

const styles = StyleSheet.create({
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
});
