import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FARM, SHADOWS } from '../theme';
import sharedStyles from './styles';
import { ANIMAL_ASSETS, VEHICLE_ASSETS, CONFETTI_ASSETS, SCREEN_WIDTH, getEmojiImageUri } from './constants';

// ── Twemoji icon with native emoji fallback ──
export const Icon = ({ value, size }) => {
  const [loadFailed, setLoadFailed] = useState(false);
  if (ANIMAL_ASSETS[value]) {
    return (
      <Image
        source={ANIMAL_ASSETS[value]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
  if (VEHICLE_ASSETS[value]) {
    return (
      <Image
        source={VEHICLE_ASSETS[value]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }
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

// ── Button with scale-press animation ──
export const AnimatedPressable = ({ onPress, style, children, disabled }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
  const pressOut = () =>
    Animated.spring(scale, { toValue: 1.0, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  return (
    <TouchableOpacity onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled} activeOpacity={1}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ── Confetti particle ──
export const ConfettiParticle = ({ anim, x, assetKey, size }) => {
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -340] });
  const opacity    = anim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 0.9, 0] });
  const rotate     = anim.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.random() > 0.5 ? 1 : -1) * 360] });
  const source = ANIMAL_ASSETS[assetKey] || VEHICLE_ASSETS[assetKey];
  return (
    <Animated.View style={{
      position: 'absolute', bottom: 40, left: x, width: size, height: size,
      opacity, transform: [{ translateY }, { rotate }],
    }}>
      <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
    </Animated.View>
  );
};

// ── Reward popup — shown after each level win ──
export const RewardPopup = ({ visible, stars, levelNum, totalLevels, onContinue, onExit, playSound, fontsLoaded }) => {
  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const starScales = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const confettiAnims = useRef(Array.from({ length: 18 }, () => new Animated.Value(0))).current;
  const celebrationStoppedRef = useRef(false);
  const timeoutIdsRef = useRef([]);

  const confettiData = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: Math.floor(Math.random() * (SCREEN_WIDTH - 40)),
      assetKey: CONFETTI_ASSETS[i % CONFETTI_ASSETS.length],
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

  const praiseText = stars >= 3 ? 'Xuất sắc!' : stars >= 2 ? 'Giỏi lắm!' : 'Cố lên bé nhé!';
  const isLastLevel = levelNum >= totalLevels;
  const continueLabel = stars <= 1 ? 'Chơi lại' : isLastLevel ? 'Về chọn game' : 'Tiếp theo ▶';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={sharedStyles.popupOverlay}>
        {confettiAnims.map((anim, i) => (
          <ConfettiParticle key={i} anim={anim} x={confettiData[i].x} assetKey={confettiData[i].assetKey} size={confettiData[i].size} />
        ))}
        <View style={sharedStyles.popupCardShell}>
          <View style={sharedStyles.popupCard}>
            <Text style={[sharedStyles.popupPraiseText, { fontFamily: F }]}>{praiseText}</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 14 }}>
              {[0, 1, 2].map((i) => (
                <Animated.View key={i} style={{ width: 44, height: 44, transform: [{ scale: starScales[i] }] }}>
                  <Image
                    source={ANIMAL_ASSETS[i < stars ? 'a_egg' : 'a_potato']}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                </Animated.View>
              ))}
            </View>

            <View style={sharedStyles.popupLevelBadge}>
              <Text style={[sharedStyles.popupLevelText, { fontFamily: F }]}>Màn {levelNum}/{totalLevels}</Text>
            </View>

            <AnimatedPressable
              onPress={() => { stopCelebration(); playSound('tap'); onContinue(); }}
              style={{ width: '100%', marginTop: 18 }}
            >
              <LinearGradient colors={FARM.playButtonGradient} style={[sharedStyles.winButton, SHADOWS.button]}>
                <Text style={[sharedStyles.winButtonText, { fontFamily: F }]}>{continueLabel}</Text>
              </LinearGradient>
            </AnimatedPressable>
          </View>
          <TouchableOpacity
            onPress={() => { stopCelebration(); playSound('tap'); onExit(); }}
            style={sharedStyles.popupCloseWrap}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Đóng"
          >
            <View style={sharedStyles.farmCloseButton}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
