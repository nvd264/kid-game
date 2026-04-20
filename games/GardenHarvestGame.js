import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Image, Animated, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FARM } from '../theme';
import GardenEffectsCanvas from './effects/GardenEffectsCanvas';
import GardenGrid from './GardenGrid';
import GardenDock from './GardenDock';
import GardenWinModal from './GardenWinModal';
import { useGardenState } from './hooks/useGardenState';
import { useGardenAnimations } from './hooks/useGardenAnimations';
import { useGardenDragState } from './hooks/useGardenDragState';
import { useGardenGridUtils } from './hooks/useGardenGridUtils';
import { useGardenComboLogic } from './hooks/useGardenComboLogic';
import { useGardenToolHandlers } from './hooks/useGardenToolHandlers';

const TILES = { grass: require('../assets/ui/tiny-town/Tiles/tile_0000.png'), soil: require('../assets/ui/tiny-town/Tiles/tile_0012.png'), soil2: require('../assets/ui/tiny-town/Tiles/tile_0013.png'), soil3: require('../assets/ui/tiny-town/Tiles/tile_0024.png'), soil4: require('../assets/ui/tiny-town/Tiles/tile_0025.png'), stone: require('../assets/ui/tiny-town/Tiles/tile_0049.png') };
const PLOT_TILE = { empty: 'soil', planted: 'soil2', growing: 'soil3', ripe: 'soil4' };
const PLOT_OVERLAY = { planted: 'rgba(190,230,160,0.38)', growing: 'rgba(60,170,60,0.40)', ripe: 'rgba(255,200,30,0.42)' };
const GARDEN_PLOT_ICON = { empty: { name: 'terrain', color: FARM.playButtonShadow }, planted: { name: 'sprout', color: FARM.grassDark }, growing: { name: 'leaf', color: FARM.grassMid } };
const GARDEN_GRID_COLS = 7;
const GARDEN_GRID_ROWS = 5;
const GARDEN_GRID_TOTAL = 35;
const GARDEN_TOOLS = [
  { id: 'hoe', label: 'Cuốc đất', validState: 'empty', icon: 'shovel', color: FARM.subtitleColor },
  { id: 'water', label: 'Tưới cây', validState: 'planted', icon: 'watering-can', color: FARM.headerTitleColor },
  { id: 'harvest', label: 'Thu hoạch', validState: 'ripe', icon: 'basket', color: FARM.playButtonShadow },
];

const GardenHarvestGame = ({ playSound, onExit, fontsLoaded, toggleMusic, musicEnabled }) => {
  const { width: winW, height: winH } = useWindowDimensions();
  const portraitW = Math.min(winW, winH);
  const portraitH = Math.max(winW, winH);
  const plotGap = 2;
  const plotSize = useMemo(() => {
    const availW = portraitW - 20;
    const availH = portraitH - 180;
    const wCell = (availW - plotGap * 6) / GARDEN_GRID_COLS;
    const hCell = (availH - plotGap * 4) / GARDEN_GRID_ROWS;
    return Math.max(44, Math.min(76, Math.floor(Math.min(wCell, hCell))));
  }, [portraitW, portraitH]);

  const state = useGardenState();
  const dragState = useGardenDragState();
  const animations = useGardenAnimations(GARDEN_GRID_TOTAL, dragState.plotLayoutsRef);
  const gridUtils = useGardenGridUtils(plotSize, plotGap, dragState.plotLayoutsRef, dragState.gardenGridLayoutRef, dragState.plotsRef);
  const { gardenForgetComboSignaturesTouchingPlot, applyAllComboUnlocks } = useGardenComboLogic(dragState.gardenComboRewardedRef, animations.runComboBurst, animations.runUnlockGlow, playSound, dragState.gardenFieldDragActiveRef, dragState.gardenDragFromDockRef);
  const { handlePlant, handleWater, handleHarvest } = useGardenToolHandlers(dragState.plotsRef, animations.plotAnimsRef, dragState.plotLayoutsRef, dragState.gardenFieldDragActiveRef, dragState.gardenDragFromDockRef, gardenForgetComboSignaturesTouchingPlot, gridUtils.gardenPlotIsPlayable, applyAllComboUnlocks, animations.flyAnimX, animations.flyAnimY, animations.flyAnimOp, animations.basketBounce, dragState.basketLayoutRef, state.setFlyOverlay, state.setPlots, state.setTotalHarvested, playSound, animations.gardenEffectsRef);

  useEffect(() => { dragState.plotsRef.current = state.plots; }, [state.plots]);
  useEffect(() => { dragState.selectedToolIdRef.current = state.selectedToolId; }, [state.selectedToolId]);
  useEffect(() => { (async () => { try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch {} })(); return () => { (async () => { try { await ScreenOrientation.unlockAsync(); } catch {} })(); }; }, []);

  useEffect(() => {
    dragState.gardenComboRewardedRef.current = new Set();
    const gardenPlotInStartZone = (plotId) => { const col = plotId % GARDEN_GRID_COLS; const row = Math.floor(plotId / GARDEN_GRID_COLS); return (col >= 2 && col < 5 && row >= 1 && row < 4); };
    const randomCrop = () => { const crops = [{ name: 'Cà rốt', ripeArt: require('../assets/ui/garden/crop-carrot.png') }, { name: 'Dâu', ripeArt: require('../assets/ui/garden/crop-strawberry.png') }, { name: 'Cà chua', ripeArt: require('../assets/ui/garden/crop-tomato.png') }, { name: 'Ngô', ripeArt: require('../assets/ui/garden/crop-corn.png') }, { name: 'Bông cải', ripeArt: require('../assets/ui/garden/crop-broccoli.png') }, { name: 'Cà tím', ripeArt: require('../assets/ui/garden/crop-eggplant.png') }, { name: 'Xà lách', ripeArt: require('../assets/ui/garden/crop-lettuce.png') }]; return crops[Math.floor(Math.random() * crops.length)]; };
    const initial = Array.from({ length: GARDEN_GRID_TOTAL }, (_, id) => ({ id, state: 'empty', crop: null, unlocked: gardenPlotInStartZone(id), previewCrop: randomCrop() }));
    initial.forEach(p => animations.initPlotAnim(p.id));
    state.setPlots(initial);
  }, [animations, state, dragState]);

  useEffect(() => { if (!state.plots.length || state.gardenWinVisible || state.roundCompleted) return; if (state.totalHarvested >= state.roundTarget) { state.setRoundCompleted(true); playSound('match'); setTimeout(() => { state.advanceRound(); }, 1500); } }, [state.totalHarvested, state.roundTarget, state.gardenWinVisible, state.roundCompleted, state, playSound]);
  useEffect(() => { return () => { Object.values(animations.plotAnimsRef.current).forEach(({ grow, appear, toolFlash, unlockPulse, timers }) => { grow.stopAnimation(); appear.stopAnimation(); toolFlash?.stopAnimation(); unlockPulse?.stopAnimation(); timers.forEach(clearTimeout); }); }; }, [animations]);

  const applyToolForPlayablePlot = useCallback((plotId) => { if (!gridUtils.gardenPlotIsPlayable(plotId)) return; const plot = dragState.plotsRef.current.find(p => p.id === plotId); if (!plot) return; animations.triggerPlotToolFeedback(plotId); if (plot.state === 'empty') handlePlant(plotId); else if (plot.state === 'planted') handleWater(plotId); else if (plot.state === 'ripe') handleHarvest(plot); }, [gridUtils, dragState, animations, handlePlant, handleWater, handleHarvest]);
  const applyDockToolToPlot = useCallback((plotId, toolId) => { if (!gridUtils.gardenPlotIsPlayable(plotId)) return; const plot = dragState.plotsRef.current.find(p => p.id === plotId); if (!plot) return; const validState = GARDEN_TOOLS.find(t => t.id === toolId)?.validState; if (plot.state !== validState) return; animations.triggerPlotToolFeedback(plotId); if (toolId === 'hoe') handlePlant(plotId); else if (toolId === 'water') handleWater(plotId); else handleHarvest(plot); }, [gridUtils, dragState, animations, handlePlant, handleWater, handleHarvest]);

  const handlersRef = useRef({});
  handlersRef.current = { handlePlant, handleWater, handleHarvest, playSound, pickPlotUnderFinger: gridUtils.pickPlotUnderFinger, pickPlotFromLocalXY: gridUtils.pickPlotFromLocalXY, triggerPlotToolFeedback: animations.triggerPlotToolFeedback, applyToolForPlayablePlot, applyDockToolToPlot, syncGardenPlotLayoutsFromGrid: gridUtils.syncGardenPlotLayoutsFromGrid };

  const cropArtSize = Math.round(Math.min(plotSize - 14, 76));
  const getRipeCropArt = (plot) => (plot.state === 'ripe' ? plot.crop?.ripeArt : null);

  return (
    <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
      <View style={styles.gardenRootPortrait}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.gardenPortraitColumn}>
          <GardenGrid {...state} {...dragState} {...animations} plotSize={plotSize} plotGap={plotGap} handlersRef={handlersRef} GARDEN_GRID_COLS={GARDEN_GRID_COLS} GARDEN_GRID_ROWS={GARDEN_GRID_ROWS} GARDEN_GRID_TOTAL={GARDEN_GRID_TOTAL} TILES={TILES} PLOT_TILE={PLOT_TILE} PLOT_OVERLAY={PLOT_OVERLAY} GARDEN_PLOT_ICON={GARDEN_PLOT_ICON} getRipeCropArt={getRipeCropArt} fontsLoaded={fontsLoaded} />
          <GardenDock {...state} {...dragState} {...animations} playSound={playSound} toggleMusic={toggleMusic} musicEnabled={musicEnabled} onExit={onExit} fontsLoaded={fontsLoaded} handlersRef={handlersRef} GARDEN_TOOLS={GARDEN_TOOLS} pickPlotUnderFinger={gridUtils.pickPlotUnderFinger} applyDockToolToPlot={applyDockToolToPlot} />
        </View>
        <View style={styles.gardenOverlayLayer} pointerEvents="box-none">
          {state.flyOverlay && (<Animated.View pointerEvents="none" style={[styles.gardenFlyOverlay, { left: state.flyOverlay.startX, top: state.flyOverlay.startY, transform: [{ translateX: animations.flyAnimX }, { translateY: animations.flyAnimY }], opacity: animations.flyAnimOp }]}><Image source={state.flyOverlay.image} style={{ width: cropArtSize + 8, height: cropArtSize + 8 }} resizeMode="contain" /></Animated.View>)}
          {state.dragTool && (<Animated.View pointerEvents="none" style={[styles.gardenDragFloat, { transform: [{ translateX: animations.dragFloatX }, { translateY: animations.dragFloatY }, { scale: animations.dragFloatScale }] }]}>{GARDEN_TOOLS.filter(t => t.id === state.dragTool).map(t => (<MaterialCommunityIcons key={t.id} name={t.icon} size={52} color={t.color} />))}</Animated.View>)}
        </View>
        <GardenEffectsCanvas ref={animations.gardenEffectsRef} />
      </View>
      <GardenWinModal visible={state.gardenWinVisible} onExit={onExit} playSound={playSound} fontsLoaded={fontsLoaded} />
    </LinearGradient>
  );
};

export default GardenHarvestGame;

const styles = StyleSheet.create({ gardenRootPortrait: { flex: 1, position: 'relative' }, gardenPortraitColumn: { flex: 1, flexDirection: 'column', minHeight: 0 }, gardenOverlayLayer: { ...StyleSheet.absoluteFillObject, zIndex: 50 }, gardenFlyOverlay: { position: 'absolute', minWidth: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center', zIndex: 99 }, gardenDragFloat: { position: 'absolute', width: 64, height: 64, alignItems: 'center', justifyContent: 'center', zIndex: 999 } });
