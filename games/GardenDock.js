import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FARM, SHADOWS } from '../theme';
import sharedStyles from '../shared/styles';
import { AnimatedPressable } from '../shared/components';

const GardenDock = ({
  selectedToolId,
  setSelectedToolId,
  totalHarvested,
  roundTarget,
  playSound,
  toggleMusic,
  musicEnabled,
  onExit,
  fontsLoaded,
  handlersRef,
  basketRef,
  basketLayoutRef,
  basketBounce,
  dragFloatX,
  dragFloatY,
  dragFloatScale,
  dragFromFabRef,
  gardenDragFromDockRef,
  GARDEN_TOOLS,
  pickPlotUnderFinger,
  applyDockToolToPlot,
  gardenFieldDragActiveRef,
  lastDockPlotRef,
  selectedToolIdRef,
  setDragTool,
  setHoveredPlotId,
  hoveredPlotIdRef,
  syncGardenPlotLayoutsFromGrid,
}) => {
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;

  const gardenDockToolPanRefs = useRef({});
  if (!gardenDockToolPanRefs.current.hoe) {
    const dragStartSlop = 10;
    const moveSlopDock = (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6;
    const makeDockPan = (toolId) => PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.sqrt(g.dx * g.dx + g.dy * g.dy) > dragStartSlop,
      onMoveShouldSetPanResponderCapture: moveSlopDock,
      onPanResponderGrant: (evt) => {
        dragFromFabRef.current = false;
        gardenDragFromDockRef.current = true;
        const { pageX, pageY } = evt.nativeEvent;
        dragFloatX.setValue(pageX - 40);
        dragFloatY.setValue(pageY - 40);
        dragFloatScale.setValue(0);
      },
      onPanResponderMove: (evt, g) => {
        const dist = Math.sqrt(g.dx * g.dx + g.dy * g.dy);
        const validState = GARDEN_TOOLS.find(t => t.id === toolId)?.validState;
        if (dist > dragStartSlop && !dragFromFabRef.current) {
          dragFromFabRef.current = true;
          lastDockPlotRef.current[toolId] = null;
          syncGardenPlotLayoutsFromGrid?.();
          setDragTool(toolId);
          Animated.spring(dragFloatScale, { toValue: 1.15, useNativeDriver: true, bounciness: 14, speed: 18 }).start();
          playSound('pick');
        }
        if (!dragFromFabRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        dragFloatX.setValue(pageX - 40);
        dragFloatY.setValue(pageY - 40);
        const newHovered = pickPlotUnderFinger(pageX, pageY, validState);
        if (newHovered !== hoveredPlotIdRef.current) {
          hoveredPlotIdRef.current = newHovered;
          setHoveredPlotId(newHovered);
        }
        if (newHovered == null) {
          lastDockPlotRef.current[toolId] = null;
          return;
        }
        if (lastDockPlotRef.current[toolId] === newHovered) return;
        lastDockPlotRef.current[toolId] = newHovered;
        applyDockToolToPlot?.(newHovered, toolId);
      },
      onPanResponderRelease: () => {
        if (dragFromFabRef.current) {
          Animated.spring(dragFloatScale, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start(() => { setDragTool(null); });
          hoveredPlotIdRef.current = null;
          setHoveredPlotId(null);
          lastDockPlotRef.current[toolId] = null;
        }
        dragFromFabRef.current = false;
        gardenDragFromDockRef.current = false;
      },
      onPanResponderTerminate: () => {
        dragFloatScale.setValue(0);
        setDragTool(null);
        hoveredPlotIdRef.current = null;
        setHoveredPlotId(null);
        dragFromFabRef.current = false;
        gardenDragFromDockRef.current = false;
        lastDockPlotRef.current[toolId] = null;
      },
    });
    GARDEN_TOOLS.forEach((t) => { gardenDockToolPanRefs.current[t.id] = makeDockPan(t.id); });
  }

  return (
    <View style={styles.gardenDockColumnPortrait}>
      <View style={styles.gardenDockTopBar}>
        <AnimatedPressable onPress={() => { playSound('tap'); onExit(); }}>
          <View style={sharedStyles.farmCloseButton}>
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </View>
        </AnimatedPressable>
      </View>

      <View style={styles.gardenDockToolsOneRow}>
        {GARDEN_TOOLS.map(tool => {
          const isSelected = tool.id === selectedToolId;
          const pan = gardenDockToolPanRefs.current[tool.id]?.panHandlers;
          return (
            <View key={tool.id} {...(pan || {})}>
              <AnimatedPressable
                onPress={() => { setSelectedToolId(tool.id); selectedToolIdRef.current = tool.id; playSound('tap'); }}
              >
                <LinearGradient
                  colors={isSelected ? FARM.playButtonGradient : ['#C8954A', '#8C5E20']}
                  style={[styles.gardenToolBtn, isSelected && styles.gardenToolBtnSelected]}
                >
                  <MaterialCommunityIcons name={tool.icon} size={42} color={isSelected ? FARM.playButtonText : '#F5E0B0'} />
                </LinearGradient>
                <Text style={[styles.gardenToolBtnLabel, { fontFamily: F8 }]} numberOfLines={1}>{tool.label}</Text>
              </AnimatedPressable>
            </View>
          );
        })}
      </View>

      <View style={styles.gardenDockBottomRow}>
        <Animated.View
          ref={basketRef}
          onLayout={() => {
            if (basketRef.current) {
              basketRef.current.measureInWindow((x, y, w, h) => { basketLayoutRef.current = { x, y, width: w, height: h }; });
            }
          }}
          style={[styles.gardenDockBasket, { transform: [{ scale: basketBounce }] }]}
        >
          <MaterialCommunityIcons name="basket" size={20} color={FARM.playButtonShadow} />
          <Text style={[styles.gardenDockBasketCount, { fontFamily: F8 }]}>{totalHarvested} / {roundTarget}</Text>
        </Animated.View>
        {toggleMusic != null && (
          <TouchableOpacity onPress={toggleMusic} activeOpacity={0.9}>
            <View style={[sharedStyles.farmGearButton, !musicEnabled && sharedStyles.musicToggleDimmed]}>
              <Ionicons name={musicEnabled ? 'musical-notes' : 'volume-mute'} size={20} color={FARM.playButtonText} />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default GardenDock;

const styles = StyleSheet.create({
  gardenDockColumnPortrait: { borderTopWidth: 3, borderTopColor: '#7A4A14', backgroundColor: 'rgba(112,64,16,0.88)', paddingBottom: 10, paddingTop: 4 },
  gardenDockTopBar:         { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 10, paddingBottom: 4 },
  gardenDockToolsOneRow:    { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 4, flexWrap: 'nowrap' },
  gardenDockBottomRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 6, paddingHorizontal: 12 },
  gardenDockBasket: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: FARM.cardMatched,
    borderRadius: 14, borderWidth: 2, borderColor: FARM.cardMatchedBorder,
    paddingHorizontal: 8, paddingVertical: 5, gap: 4, ...SHADOWS.header,
  },
  gardenDockBasketCount: { color: FARM.playButtonShadow, fontSize: 16, fontWeight: '900' },
  gardenToolBtn: {
    width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#7A4A14', ...SHADOWS.button,
  },
  gardenToolBtnSelected: { borderColor: FARM.cardHintBorder, borderWidth: 4 },
  gardenToolBtnLabel:    { color: '#F5DEB3', fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: 3 },
});
