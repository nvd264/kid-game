import { useCallback, useRef, useEffect } from 'react';

const GARDEN_GRID_COLS = 7;
const GARDEN_GRID_ROWS = 5;

export const useGardenGridUtils = (plotSize, plotGap, plotLayoutsRef, gardenGridLayoutRef, plotsRef) => {
  const gardenPlotIsPlayable = useCallback((plotId) => {
    const p = plotsRef.current.find((x) => x.id === plotId);
    return !!p?.unlocked;
  }, []);

  const pickPlotFromLocalXY = useCallback((localX, localY, validState) => {
    const stride = plotSize + plotGap;
    if (stride <= 0) return null;
    if (localX < 0 || localY < 0) return null;
    const col = Math.floor(localX / stride);
    const row = Math.floor(localY / stride);
    if (col < 0 || col >= GARDEN_GRID_COLS || row < 0 || row >= GARDEN_GRID_ROWS) return null;
    const inCellX = localX - col * stride;
    const inCellY = localY - row * stride;
    if (inCellX > plotSize || inCellY > plotSize) return null;
    const plotId = row * GARDEN_GRID_COLS + col;
    if (!gardenPlotIsPlayable(plotId)) return null;
    const plot = plotsRef.current.find(p => p.id === plotId);
    if (!plot) return null;
    if (validState != null && plot.state !== validState) return null;
    return plotId;
  }, [plotSize, plotGap, gardenPlotIsPlayable]);

  const pickPlotUnderFinger = useCallback((pageX, pageY, validState) => {
    const g = gardenGridLayoutRef.current;
    if (g == null || g.width == null) return null;
    return pickPlotFromLocalXY(pageX - g.x, pageY - g.y, validState);
  }, [pickPlotFromLocalXY]);

  const syncGardenPlotLayoutsFromGrid = useCallback(() => {
    requestAnimationFrame(() => {
      const node = gardenGridLayoutRef.current;
      if (!node?.measureInWindow) return;
      node.measureInWindow((x, y, w, h) => {
        gardenGridLayoutRef.current = { x, y, width: w, height: h };
        const stride = plotSize + plotGap;
        for (let id = 0; id < GARDEN_GRID_COLS * GARDEN_GRID_ROWS; id++) {
          const col = id % GARDEN_GRID_COLS;
          const row = Math.floor(id / GARDEN_GRID_COLS);
          plotLayoutsRef.current[id] = { x: x + col * stride, y: y + row * stride, width: plotSize, height: plotSize };
        }
      });
    });
  }, [plotSize, plotGap]);

  return {
    gardenPlotIsPlayable,
    pickPlotFromLocalXY,
    pickPlotUnderFinger,
    syncGardenPlotLayoutsFromGrid,
  };
};
