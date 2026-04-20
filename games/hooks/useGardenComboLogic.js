import { useCallback } from 'react';

const GARDEN_GRID_COLS = 7;
const GARDEN_GRID_ROWS = 5;

const randomGardenCrop = () => {
  const GARDEN_CROPS = [
    { name: 'Cà rốt',   ripeArt: require('../../assets/ui/garden/crop-carrot.png') },
    { name: 'Dâu',      ripeArt: require('../../assets/ui/garden/crop-strawberry.png') },
    { name: 'Cà chua',  ripeArt: require('../../assets/ui/garden/crop-tomato.png') },
    { name: 'Ngô',      ripeArt: require('../../assets/ui/garden/crop-corn.png') },
    { name: 'Bông cải', ripeArt: require('../../assets/ui/garden/crop-broccoli.png') },
    { name: 'Cà tím',   ripeArt: require('../../assets/ui/garden/crop-eggplant.png') },
    { name: 'Xà lách',  ripeArt: require('../../assets/ui/garden/crop-lettuce.png') },
  ];
  return GARDEN_CROPS[Math.floor(Math.random() * GARDEN_CROPS.length)];
};

const gardenPlotNeighbors4 = (plotId) => {
  const col = plotId % GARDEN_GRID_COLS;
  const row = Math.floor(plotId / GARDEN_GRID_COLS);
  const out = [];
  if (row > 0) out.push((row - 1) * GARDEN_GRID_COLS + col);
  if (row < GARDEN_GRID_ROWS - 1) out.push((row + 1) * GARDEN_GRID_COLS + col);
  if (col > 0) out.push(row * GARDEN_GRID_COLS + (col - 1));
  if (col < GARDEN_GRID_COLS - 1) out.push(row * GARDEN_GRID_COLS + (col + 1));
  return out;
};

const gardenFullRowPlotIds = (row) =>
  Array.from({ length: GARDEN_GRID_COLS }, (_, c) => row * GARDEN_GRID_COLS + c);

const gardenFullColPlotIds = (col) =>
  Array.from({ length: GARDEN_GRID_ROWS }, (_, r) => r * GARDEN_GRID_COLS + col);

const gardenFindTripleRipeLineEvents = (plots) => {
  const byId = new Map(plots.map(p => [p.id, p]));
  const ripeTriple = (a, b, c) => {
    const pa = byId.get(a); const pb = byId.get(b); const pc = byId.get(c);
    if (!pa?.unlocked || !pb?.unlocked || !pc?.unlocked) return false;
    if (pa.state !== 'ripe' || pb.state !== 'ripe' || pc.state !== 'ripe') return false;
    const na = pa.crop?.name; const nb = pb.crop?.name; const nc = pc.crop?.name;
    return na && na === nb && nb === nc;
  };
  const events = [];
  for (let row = 0; row < GARDEN_GRID_ROWS; row++) {
    for (let c = 0; c <= GARDEN_GRID_COLS - 3; c++) {
      const base = row * GARDEN_GRID_COLS + c;
      const triple = [base, base + 1, base + 2];
      if (ripeTriple(...triple)) {
        events.push({ sig: `triple:${[...triple].sort((x, y) => x - y).join(',')}`, burstIds: triple, unlockIds: gardenFullRowPlotIds(row) });
      }
    }
  }
  for (let col = 0; col < GARDEN_GRID_COLS; col++) {
    for (let r = 0; r <= GARDEN_GRID_ROWS - 3; r++) {
      const triple = [r * GARDEN_GRID_COLS + col, (r + 1) * GARDEN_GRID_COLS + col, (r + 2) * GARDEN_GRID_COLS + col];
      if (ripeTriple(...triple)) {
        events.push({ sig: `triple:${[...triple].sort((x, y) => x - y).join(',')}`, burstIds: triple, unlockIds: gardenFullColPlotIds(col) });
      }
    }
  }
  return events;
};

const gardenFindAdjacentRipePairs = (plots) => {
  const byId = new Map(plots.map(p => [p.id, p]));
  const ripePair = (a, b) => {
    const pa = byId.get(a); const pb = byId.get(b);
    if (!pa?.unlocked || !pb?.unlocked) return false;
    if (pa.state !== 'ripe' || pb.state !== 'ripe') return false;
    const na = pa.crop?.name; const nb = pb.crop?.name;
    return na && na === nb;
  };
  const pairs = [];
  for (let row = 0; row < GARDEN_GRID_ROWS; row++) {
    for (let c = 0; c <= GARDEN_GRID_COLS - 2; c++) {
      const base = row * GARDEN_GRID_COLS + c;
      if (ripePair(base, base + 1)) pairs.push([base, base + 1]);
    }
  }
  for (let col = 0; col < GARDEN_GRID_COLS; col++) {
    for (let r = 0; r <= GARDEN_GRID_ROWS - 2; r++) {
      const a = r * GARDEN_GRID_COLS + col;
      const b = (r + 1) * GARDEN_GRID_COLS + col;
      if (ripePair(a, b)) pairs.push([a, b]);
    }
  }
  return pairs;
};

const gardenPickLockedNeighborOfPair = (pairIds, plots) => {
  const [a, b] = pairIds;
  const cand = new Set();
  gardenPlotNeighbors4(a).forEach((id) => cand.add(id));
  gardenPlotNeighbors4(b).forEach((id) => cand.add(id));
  const locked = [...cand].filter((id) => {
    const p = plots.find((x) => x.id === id);
    return p && !p.unlocked;
  });
  if (locked.length === 0) return null;
  return locked[Math.floor(Math.random() * locked.length)];
};

export const useGardenComboLogic = (gardenComboRewardedRef, runComboBurst, runUnlockGlow, playSound, gardenFieldDragActiveRef, gardenDragFromDockRef) => {
  const gardenForgetComboSignaturesTouchingPlot = useCallback((plotId) => {
    const s = gardenComboRewardedRef.current;
    [...s].forEach((key) => {
      const tail = key.includes(':') ? key.split(':').slice(1).join(':') : key;
      if (!tail) return;
      if (tail.split(',').map(Number).includes(plotId)) s.delete(key);
    });
  }, [gardenComboRewardedRef]);

  const applyAllComboUnlocks = useCallback((plotsIn) => {
    let out = plotsIn; let changed = false;
    const tripleEvents = gardenFindTripleRipeLineEvents(out);
    for (let i = 0; i < tripleEvents.length; i++) {
      const { sig, burstIds, unlockIds } = tripleEvents[i];
      if (gardenComboRewardedRef.current.has(sig)) continue;
      const toOpen = unlockIds.filter((id) => !out.find((p) => p.id === id)?.unlocked);
      if (toOpen.length === 0) { gardenComboRewardedRef.current.add(sig); continue; }
      gardenComboRewardedRef.current.add(sig);
      runComboBurst(burstIds);
      runUnlockGlow(toOpen);
      if (!gardenFieldDragActiveRef.current) playSound('match');
      out = out.map((p) => toOpen.includes(p.id) ? { ...p, unlocked: true, previewCrop: p.previewCrop ?? randomGardenCrop() } : p);
      changed = true;
    }
    const pairs = gardenFindAdjacentRipePairs(out);
    for (let i = 0; i < pairs.length; i++) {
      const ids = pairs[i];
      const sig = `p:${ids[0]},${ids[1]}`;
      if (gardenComboRewardedRef.current.has(sig)) continue;
      const pick = gardenPickLockedNeighborOfPair(ids, out);
      if (pick == null) { gardenComboRewardedRef.current.add(sig); continue; }
      gardenComboRewardedRef.current.add(sig);
      runComboBurst(ids);
      runUnlockGlow([pick]);
      if (!gardenFieldDragActiveRef.current) playSound('match');
      out = out.map((p) => p.id === pick ? { ...p, unlocked: true, previewCrop: p.previewCrop ?? randomGardenCrop() } : p);
      changed = true;
    }
    return changed ? out : null;
  }, [gardenComboRewardedRef, runComboBurst, runUnlockGlow, playSound, gardenFieldDragActiveRef]);

  return { gardenForgetComboSignaturesTouchingPlot, applyAllComboUnlocks };
};
