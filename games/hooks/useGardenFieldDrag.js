import { useCallback } from 'react';

export const useGardenFieldDrag = (
  lastFieldPlotDragRef,
  fieldDragPendingRef,
  fieldDragRafRef,
  gardenFieldDragActiveRef,
) => {
  const applyToolAtLocal = useCallback((localX, localY, pickPlotFromLocalXY, applyToolForPlayablePlot) => {
    const plotId = pickPlotFromLocalXY(localX, localY);
    if (plotId == null) return;
    applyToolForPlayablePlot(plotId);
  }, []);

  const applyDragAtLocal = useCallback((localX, localY, pickPlotFromLocalXY, applyToolForPlayablePlot) => {
    const plotId = pickPlotFromLocalXY(localX, localY);
    if (plotId == null) { lastFieldPlotDragRef.current = null; return; }
    if (lastFieldPlotDragRef.current === plotId) return;
    lastFieldPlotDragRef.current = plotId;
    applyToolForPlayablePlot(plotId);
  }, [lastFieldPlotDragRef]);

  const flushFieldDragPendingMove = useCallback((applyDragAtLocal) => {
    const p = fieldDragPendingRef.current;
    if (p) { fieldDragPendingRef.current = null; applyDragAtLocal(p.x, p.y); }
  }, [fieldDragPendingRef]);

  const scheduleFieldDragMove = useCallback((localX, localY) => {
    fieldDragPendingRef.current = { x: localX, y: localY };
    if (fieldDragRafRef.current != null) return;
    fieldDragRafRef.current = requestAnimationFrame(() => {
      fieldDragRafRef.current = null;
      flushFieldDragPendingMove(() => applyDragAtLocal(localX, localY, null, null));
    });
  }, [fieldDragPendingRef, fieldDragRafRef, flushFieldDragPendingMove, applyDragAtLocal]);

  const resetFieldDrag = useCallback(() => { lastFieldPlotDragRef.current = null; }, [lastFieldPlotDragRef]);

  return {
    applyToolAtLocal,
    applyDragAtLocal,
    flushFieldDragPendingMove,
    scheduleFieldDragMove,
    resetFieldDrag,
  };
};
