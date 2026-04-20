import React, { useRef, useMemo } from 'react';
import { View, Text, PanResponder, StyleSheet } from 'react-native';
import GardenPlotCell from './GardenPlotCell';

const GardenGrid = ({
  plots,
  plotSize,
  plotGap,
  currentRound,
  maxRounds,
  roundTarget,
  handlersRef,
  gardenGridHitRef,
  gardenGridLayoutRef,
  gardenFieldDragActiveRef,
  gardenDragFromDockRef,
  lastFieldPlotDragRef,
  fieldDragRafRef,
  fieldDragPendingRef,
  hoveredPlotId,
  GARDEN_GRID_COLS,
  GARDEN_GRID_ROWS,
  GARDEN_GRID_TOTAL,
  plotAnimsRef,
  TILES,
  PLOT_TILE,
  PLOT_OVERLAY,
  GARDEN_PLOT_ICON,
  getRipeCropArt,
  fontsLoaded,
}) => {
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;
  const cropArtSize = Math.round(Math.min(plotSize - 14, 76));
  const plotVectorIconSize = Math.round(Math.min(plotSize - 16, 68));

  const gardenFieldTapRef = useRef(null);
  if (!gardenFieldTapRef.current) {
    const slop = 10;
    const moveSlop = (_, g) => Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6;
    const fieldDragStartRef = { x: 0, y: 0 };
    gardenFieldTapRef.current = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: moveSlop,
      onMoveShouldSetPanResponderCapture: moveSlop,
      onPanResponderGrant: (evt) => {
        gardenFieldDragActiveRef.current = true;
        gardenDragFromDockRef.current = false;
        const { locationX, locationY } = evt.nativeEvent;
        fieldDragStartRef.x = locationX;
        fieldDragStartRef.y = locationY;
        handlersRef.current.resetFieldDrag?.();
        handlersRef.current.syncGardenPlotLayoutsFromGrid?.();
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        handlersRef.current.scheduleFieldDragMove?.(locationX, locationY);
      },
      onPanResponderRelease: (evt) => {
        if (fieldDragRafRef.current != null) {
          cancelAnimationFrame(fieldDragRafRef.current);
          fieldDragRafRef.current = null;
        }
        handlersRef.current.flushFieldDragPendingMove?.();
        gardenFieldDragActiveRef.current = false;
        const { locationX, locationY } = evt.nativeEvent;
        const dx = locationX - fieldDragStartRef.x;
        const dy = locationY - fieldDragStartRef.y;
        if (dx * dx + dy * dy < slop * slop && lastFieldPlotDragRef.current == null) {
          handlersRef.current.applyToolAtLocal?.(locationX, locationY);
        }
        handlersRef.current.resetFieldDrag?.();
      },
      onPanResponderTerminate: () => {
        if (fieldDragRafRef.current != null) {
          cancelAnimationFrame(fieldDragRafRef.current);
          fieldDragRafRef.current = null;
        }
        handlersRef.current.flushFieldDragPendingMove?.();
        gardenFieldDragActiveRef.current = false;
        handlersRef.current.resetFieldDrag?.();
      },
    });
  }

  const gardenGridRows = useMemo(
    () => Array.from({ length: GARDEN_GRID_ROWS }, (_, row) => plots.slice(row * GARDEN_GRID_COLS, (row + 1) * GARDEN_GRID_COLS)),
    [plots, GARDEN_GRID_COLS, GARDEN_GRID_ROWS],
  );

  const gardenGridHitSize = useMemo(() => ({
    width: GARDEN_GRID_COLS * plotSize + (GARDEN_GRID_COLS - 1) * plotGap,
    height: GARDEN_GRID_ROWS * plotSize + (GARDEN_GRID_ROWS - 1) * plotGap,
  }), [plotSize, plotGap, GARDEN_GRID_COLS, GARDEN_GRID_ROWS]);

  return (
    <View style={[styles.gardenFieldPatch, styles.gardenFieldPressablePortrait]}>
      <Text style={[styles.gardenInstructionText, { fontFamily: F8, marginBottom: 8, paddingHorizontal: 4 }]} numberOfLines={5}>
        Vòng {currentRound}/{maxRounds}: Thu hoạch {roundTarget} quả để qua vòng tiếp theo! Tìm quả vàng 🌟 để nhận quà bất ngờ.
      </Text>
      <View style={styles.gardenPlotGridColumn}>
        <View
          ref={r => { gardenGridHitRef.current = r; }}
          onLayout={() => handlersRef.current.syncGardenPlotLayoutsFromGrid?.()}
          style={[styles.gardenGridHitArea, gardenGridHitSize]}
          {...gardenFieldTapRef.current.panHandlers}
        >
          {gardenGridRows.map((rowPlots, rowIdx) => (
            <View key={`garden-row-${rowIdx}`} style={[styles.gardenGridRow, { gap: plotGap, marginBottom: rowIdx < GARDEN_GRID_ROWS - 1 ? plotGap : 0 }]}>
              {rowPlots.map(p => (
                <GardenPlotCell
                  key={p.id}
                  plot={p}
                  plotSize={plotSize}
                  plotAnimsRef={plotAnimsRef}
                  hoveredPlotId={hoveredPlotId}
                  TILES={TILES}
                  PLOT_TILE={PLOT_TILE}
                  PLOT_OVERLAY={PLOT_OVERLAY}
                  GARDEN_PLOT_ICON={GARDEN_PLOT_ICON}
                  cropArtSize={cropArtSize}
                  plotVectorIconSize={plotVectorIconSize}
                  getRipeCropArt={getRipeCropArt}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default GardenGrid;

const styles = StyleSheet.create({
  gardenFieldPressablePortrait: { flex: 1, width: '100%', minHeight: 0, marginHorizontal: 0 },
  gardenInstructionText:  { color: '#D4EDAE', fontSize: 13, fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  gardenFieldPatch: {
    flex: 1, marginTop: 6, marginHorizontal: 8, marginBottom: 4,
    borderRadius: 16, borderWidth: 3, borderColor: '#2E5A1A',
    backgroundColor: '#4A7830', paddingHorizontal: 8, paddingVertical: 10,
  },
  gardenPlotGridColumn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gardenGridHitArea:    { alignSelf: 'center' },
  gardenGridRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' },
});
