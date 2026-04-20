import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FARM, SHADOWS } from '../theme';
import { AnimatedPressable } from '../shared/components';

const GardenWinModal = ({
  visible,
  onExit,
  playSound,
  fontsLoaded,
}) => {
  const F = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.gardenWinBackdrop}>
        <LinearGradient colors={[FARM.cardFront, FARM.cardMatched]} style={styles.gardenWinCard}>
          <Text style={[styles.gardenWinTitle, { fontFamily: F }]}>🎉 Chiến thắng!</Text>
          <Text style={[styles.gardenWinSub, { fontFamily: F8 }]}>Bạn đã hoàn thành tất cả các vòng chơi. Tuyệt vời!</Text>
          <AnimatedPressable onPress={() => { playSound('tap'); onExit(); }}>
            <LinearGradient colors={FARM.playButtonGradient} style={styles.gardenWinBtn}>
              <Text style={[styles.gardenWinBtnText, { fontFamily: F8 }]}>Về menu</Text>
            </LinearGradient>
          </AnimatedPressable>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default GardenWinModal;

const styles = StyleSheet.create({
  gardenWinBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  gardenWinCard: {
    width: '100%', maxWidth: 340, borderRadius: 24, paddingVertical: 28, paddingHorizontal: 22,
    alignItems: 'center', borderWidth: 3, borderColor: FARM.cardMatchedBorder, ...SHADOWS.card,
  },
  gardenWinTitle: { fontSize: 26, color: FARM.headerTitleColor, textAlign: 'center', marginBottom: 10 },
  gardenWinSub:   { fontSize: 15, color: FARM.subtitleColor, textAlign: 'center', marginBottom: 22, lineHeight: 22 },
  gardenWinBtn:   { paddingVertical: 14, paddingHorizontal: 36, borderRadius: 18, borderWidth: 3, borderColor: FARM.playButtonShadow, ...SHADOWS.button },
  gardenWinBtnText: { fontSize: 17, color: FARM.playButtonText, fontWeight: '800' },
});
