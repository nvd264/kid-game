import { useRef } from 'react';

export const useGardenDragState = () => {
  const gardenGridHitRef = useRef(null);
  const gardenGridLayoutRef = useRef(null);
  const gardenFieldDragActiveRef = useRef(false);
  const fieldDragRafRef = useRef(null);
  const fieldDragPendingRef = useRef(null);
  const basketRef = useRef(null);
  const basketLayoutRef = useRef(null);

  const plotsRef = useRef([]);
  const hoveredPlotIdRef = useRef(null);
  const lastFieldPlotDragRef = useRef(null);
  const lastDockPlotRef = useRef({ hoe: null, water: null, harvest: null });
  const selectedToolIdRef = useRef('hoe');
  const dragFromFabRef = useRef(false);
  const gardenDragFromDockRef = useRef(false);
  const gardenComboRewardedRef = useRef(new Set());

  return {
    gardenGridHitRef,
    gardenGridLayoutRef,
    gardenFieldDragActiveRef,
    fieldDragRafRef,
    fieldDragPendingRef,
    basketRef,
    basketLayoutRef,
    plotsRef,
    hoveredPlotIdRef,
    lastFieldPlotDragRef,
    lastDockPlotRef,
    selectedToolIdRef,
    dragFromFabRef,
    gardenDragFromDockRef,
    gardenComboRewardedRef,
  };
};
