import React, { useRef, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FARM, SHADOWS } from '../theme';

const GardenPlotCell = ({
  plot,
  plotSize,
  plotAnimsRef,
  hoveredPlotId,
  TILES,
  PLOT_TILE,
  PLOT_OVERLAY,
  GARDEN_PLOT_ICON,
  cropArtSize,
  plotVectorIconSize,
  getRipeCropArt,
}) => {
  const isLocked = !plot.unlocked;
  const anim = plotAnimsRef.current[plot.id];
  const unlockGlow = anim?.unlockPulse
    ? anim.unlockPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.95] })
    : null;
  const scaleTransform = anim ? [{ scale: anim.grow }, { scale: anim.toolFlash }] : [];
  const ripeArt = getRipeCropArt(plot);
  const isHovered = !isLocked && hoveredPlotId === plot.id;
  const iconSz = Math.round(plotVectorIconSize * (isLocked ? 0.82 : 1));
  const previewArt = plot.previewCrop?.ripeArt;
  const tileKey = isLocked ? 'stone' : (PLOT_TILE[plot.state] ?? 'soil');
  const overlayColor = !isLocked ? PLOT_OVERLAY[plot.state] : null;

  // Golden crop styling
  const isGolden = plot.crop?.isGolden;
  const goldenGlow = isGolden ? [{ shadowColor: '#FFD700', shadowOpacity: 0.6, shadowRadius: 15, elevation: 10 }] : [];

  // Golden crop pulse animation
  const goldenPulseAnim = useRef(new Animated.Value(1)).current;
  const [pulseRef, setPulseRef] = React.useState(null);

  useEffect(() => {
    if (!isGolden || !anim) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(goldenPulseAnim, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(goldenPulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    setPulseRef(loop);
    return () => loop.stop();
  }, [isGolden, anim]);

  const pulseTransform = isGolden ? [{ scale: goldenPulseAnim }] : [];

  return (
    <Animated.View
      key={plot.id}
      style={[styles.gardenPlotWrap, isLocked && styles.gardenPlotWrapLocked, { transform: [...scaleTransform, ...pulseTransform], width: plotSize, height: plotSize }, ...goldenGlow]}
    >
      <View
        style={[
          styles.gardenPlot, { width: plotSize, height: plotSize },
          plot.state === 'empty' && !isLocked && styles.gardenPlotEmpty,
          isHovered && styles.gardenPlotHovered,
        ]}
      >
        {/* Tile texture background */}
        <Image source={TILES[tileKey]} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        {/* State color wash */}
        {overlayColor ? <View style={[StyleSheet.absoluteFillObject, { backgroundColor: overlayColor, borderRadius: 12 }]} pointerEvents="none" /> : null}
        {/* Locked dark veil + preview */}
        {isLocked ? (
          <>
            <View style={[StyleSheet.absoluteFillObject, styles.gardenLockedVeil]} pointerEvents="none" />
            {previewArt ? (
              <Image source={previewArt} style={[styles.gardenPlotCropImage, styles.gardenLockedPreviewImage, { width: cropArtSize, height: cropArtSize }]} resizeMode="contain" />
            ) : null}
            <View style={styles.gardenLockedIconWrap} pointerEvents="none">
              <Ionicons name="lock-closed" size={Math.round(plotSize * 0.3)} color="rgba(255,255,255,0.82)" />
            </View>
          </>
        ) : (
          <>
            {plot.state === 'empty' ? (
              <MaterialCommunityIcons name={GARDEN_PLOT_ICON.empty.name} size={iconSz} color="rgba(120,70,10,0.55)" />
            ) : plot.state === 'planted' ? (
              <MaterialCommunityIcons name={GARDEN_PLOT_ICON.planted.name} size={iconSz} color={GARDEN_PLOT_ICON.planted.color} />
            ) : plot.state === 'growing' ? (
              <MaterialCommunityIcons name={GARDEN_PLOT_ICON.growing.name} size={iconSz} color={GARDEN_PLOT_ICON.growing.color} />
            ) : ripeArt ? (
              <Image source={ripeArt} style={[styles.gardenPlotCropImage, { width: cropArtSize, height: cropArtSize }]} resizeMode="contain" />
            ) : null}
          </>
        )}
        {/* Golden border for ripe golden crops */}
        {isLocked ? null : plot.state === 'ripe' && isGolden ? (
          <View style={[StyleSheet.absoluteFillObject, { borderWidth: 3, borderColor: '#FBBF24', borderRadius: 12 }]} pointerEvents="none" />
        ) : null}
      </View>
      {unlockGlow != null && (
        <Animated.View
          pointerEvents="none"
          style={[styles.gardenUnlockGlow, { opacity: unlockGlow, borderColor: FARM.cardHintBorder, shadowColor: FARM.cardHintBorder }]}
        />
      )}
    </Animated.View>
  );
};

export default GardenPlotCell;

const styles = StyleSheet.create({
  gardenPlotWrap:       { borderRadius: 14, ...SHADOWS.card },
  gardenPlotWrapLocked: { shadowOpacity: 0.12, elevation: 2 },
  gardenPlot: {
    borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', borderWidth: 2, borderColor: '#C8A064',
  },
  gardenPlotEmpty:        { borderStyle: 'dashed', borderColor: '#A07840', borderWidth: 2 },
  gardenLockedPreviewImage: { opacity: 0.35, position: 'absolute' },
  gardenLockedVeil:       { backgroundColor: 'rgba(0,0,0,0.44)', borderRadius: 12 },
  gardenLockedIconWrap:   { position: 'absolute', alignItems: 'center', justifyContent: 'center', bottom: '14%' },
  gardenUnlockGlow: {
    ...StyleSheet.absoluteFillObject, margin: -3, borderRadius: 18, borderWidth: 3,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 12, elevation: 10,
  },
  gardenPlotHovered: {
    borderWidth: 3, borderColor: FARM.cardHintBorder,
    shadowColor: FARM.cardHintBorder, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 10, elevation: 8,
  },
  gardenPlotCropImage: { marginTop: 2 },
});
