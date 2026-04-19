import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Easing, Modal, PanResponder, StyleSheet, StatusBar, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { FARM, SHADOWS } from '../theme';
import sharedStyles from '../shared/styles';
import { AnimatedPressable } from '../shared/components';
import GardenEffectsCanvas from './effects/GardenEffectsCanvas';

// ── Tile images ──
const TILES = {
  grass:  require('../assets/ui/tiny-town/Tiles/tile_0000.png'),
  soil:   require('../assets/ui/tiny-town/Tiles/tile_0012.png'),
  soil2:  require('../assets/ui/tiny-town/Tiles/tile_0013.png'),
  soil3:  require('../assets/ui/tiny-town/Tiles/tile_0024.png'),
  soil4:  require('../assets/ui/tiny-town/Tiles/tile_0025.png'),
  stone:  require('../assets/ui/tiny-town/Tiles/tile_0049.png'),
  stone2: require('../assets/ui/tiny-town/Tiles/tile_0060.png'),
};

const PLOT_TILE = { empty: 'soil', planted: 'soil2', growing: 'soil3', ripe: 'soil4' };
const PLOT_OVERLAY = {
  planted: 'rgba(190,230,160,0.38)',
  growing: 'rgba(60,170,60,0.40)',
  ripe:    'rgba(255,200,30,0.42)',
};

// ── Garden constants ──
const GARDEN_PLOT_ICON = {
  empty:   { name: 'terrain', color: FARM.playButtonShadow },
  planted: { name: 'sprout',  color: FARM.grassDark },
  growing: { name: 'leaf',    color: FARM.grassMid },
};

const GARDEN_CROPS = [
  { name: 'Cà rốt',   ripeArt: require('../assets/ui/garden/crop-carrot.png') },
  { name: 'Dâu',      ripeArt: require('../assets/ui/garden/crop-strawberry.png') },
  { name: 'Cà chua',  ripeArt: require('../assets/ui/garden/crop-tomato.png') },
  { name: 'Ngô',      ripeArt: require('../assets/ui/garden/crop-corn.png') },
  { name: 'Bông cải', ripeArt: require('../assets/ui/garden/crop-broccoli.png') },
  { name: 'Cà tím',   ripeArt: require('../assets/ui/garden/crop-eggplant.png') },
  { name: 'Xà lách',  ripeArt: require('../assets/ui/garden/crop-lettuce.png') },
];

const GARDEN_GRID_COLS  = 7;
const GARDEN_GRID_ROWS  = 5;
const GARDEN_GRID_TOTAL = GARDEN_GRID_COLS * GARDEN_GRID_ROWS;
const GARDEN_CENTER_COL0 = 2;
const GARDEN_CENTER_ROW0 = 1;

const randomGardenCrop = () => GARDEN_CROPS[Math.floor(Math.random() * GARDEN_CROPS.length)];

const gardenPlotInStartZone = (plotId) => {
  const col = plotId % GARDEN_GRID_COLS;
  const row = Math.floor(plotId / GARDEN_GRID_COLS);
  return (
    col >= GARDEN_CENTER_COL0 && col < GARDEN_CENTER_COL0 + 3 &&
    row >= GARDEN_CENTER_ROW0 && row < GARDEN_CENTER_ROW0 + 3
  );
};

const gardenFullRowPlotIds = (row) =>
  Array.from({ length: GARDEN_GRID_COLS }, (_, c) => row * GARDEN_GRID_COLS + c);

const gardenFullColPlotIds = (col) =>
  Array.from({ length: GARDEN_GRID_ROWS }, (_, r) => r * GARDEN_GRID_COLS + col);

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

const GROW_PHASE_DURATION = 1200;
const RIPE_PHASE_DURATION = 1200;

const GARDEN_TOOLS = [
  { id: 'hoe',     label: 'Cuốc đất',  validState: 'empty',   color: FARM.subtitleColor },
  { id: 'water',   label: 'Tưới cây',  validState: 'planted', color: FARM.headerTitleColor },
  { id: 'harvest', label: 'Thu hoạch', validState: 'ripe',    color: FARM.playButtonShadow },
];

const TOOL_IMAGES = {
  hoe:     require('../assets/ui/garden/tool-hoe.png'),
  water:   require('../assets/ui/garden/tool-wateringcan.png'),
  harvest: require('../assets/ui/garden/tool-basket.png'),
};

// ── GardenHarvestGame ──
const GardenHarvestGame = ({ playSound, onExit, fontsLoaded, toggleMusic, musicEnabled }) => {
  const F  = fontsLoaded ? 'Nunito_900Black' : undefined;
  const F8 = fontsLoaded ? 'Nunito_800ExtraBold' : undefined;
  const { width: winW, height: winH } = useWindowDimensions();
  const portraitW = Math.min(winW, winH);
  const portraitH = Math.max(winW, winH);

  const plotGap = 2;
  const gardenDockRowMinH = 200;
  const plotSize = useMemo(() => {
    const cols = GARDEN_GRID_COLS; const rows = GARDEN_GRID_ROWS;
    const fieldPadX = 4; const fieldPadTop = 4; const fieldPadBottom = 4;
    const availW = portraitW - fieldPadX * 2;
    const availH = portraitH - gardenDockRowMinH - fieldPadTop - fieldPadBottom;
    const wCell = (availW - plotGap * (cols - 1)) / cols;
    const hCell = (availH - plotGap * (rows - 1)) / rows;
    return Math.max(44, Math.min(90, Math.floor(Math.min(wCell, hCell))));
  }, [portraitW, portraitH, plotGap, gardenDockRowMinH]);

  const [plots, setPlots] = useState([]);
  const [totalHarvested, setTotalHarvested] = useState(0);
  const [flyOverlay, setFlyOverlay] = useState(null);
  const [dragTool, setDragTool] = useState(null);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [selectedToolId, setSelectedToolId] = useState('hoe');
  const [gardenWinVisible, setGardenWinVisible] = useState(false);

  const plotAnimsRef = useRef({});
  const plotLayoutsRef = useRef({});
  const gardenGridHitRef = useRef(null);
  const gardenGridLayoutRef = useRef(null);
  const gardenFieldDragActiveRef = useRef(false);
  const fieldDragRafRef = useRef(null);
  const fieldDragPendingRef = useRef(null);
  const basketRef = useRef(null);
  const basketLayoutRef = useRef(null);
  const flyAnimX  = useRef(new Animated.Value(0)).current;
  const flyAnimY  = useRef(new Animated.Value(0)).current;
  const flyAnimOp = useRef(new Animated.Value(1)).current;
  const basketBounce  = useRef(new Animated.Value(1)).current;
  const dragFloatX    = useRef(new Animated.Value(-200)).current;
  const dragFloatY    = useRef(new Animated.Value(-200)).current;
  const dragFloatScale = useRef(new Animated.Value(0)).current;

  const plotsRef = useRef([]);
  const hoveredPlotIdRef = useRef(null);
  const lastFieldPlotDragRef = useRef(null);
  const lastDockPlotRef = useRef({ hoe: null, water: null, harvest: null });
  const selectedToolIdRef = useRef('hoe');
  const handlersRef = useRef({});
  const dragFromFabRef = useRef(false);
  const gardenDragFromDockRef = useRef(false);
  const gardenComboRewardedRef = useRef(new Set());
  const gardenEffectsRef = useRef(null);

  const gardenForgetComboSignaturesTouchingPlot = useCallback((plotId) => {
    const s = gardenComboRewardedRef.current;
    [...s].forEach((key) => {
      const tail = key.includes(':') ? key.split(':').slice(1).join(':') : key;
      if (!tail) return;
      if (tail.split(',').map(Number).includes(plotId)) s.delete(key);
    });
  }, []);

  const gardenPlotIsPlayable = useCallback((plotId) => {
    const p = plotsRef.current.find((x) => x.id === plotId);
    return !!p?.unlocked;
  }, []);

  const runComboBurst = useCallback((burstIds) => {
    burstIds.forEach((pid) => {
      const anim = plotAnimsRef.current[pid];
      if (!anim?.toolFlash) return;
      anim.toolFlash.stopAnimation();
      anim.toolFlash.setValue(1);
      Animated.sequence([
        Animated.timing(anim.toolFlash, { toValue: 1.38, duration: 100, useNativeDriver: true }),
        Animated.timing(anim.toolFlash, { toValue: 1,    duration: 180, useNativeDriver: true }),
      ]).start();
    });
    const centers = burstIds.map(pid => {
      const l = plotLayoutsRef.current[pid];
      return l ? { x: l.x + l.width / 2, y: l.y + l.height / 2 } : null;
    }).filter(Boolean);
    if (centers.length) gardenEffectsRef.current?.emitCombo(centers);
  }, []);

  const runUnlockGlow = useCallback((toOpen) => {
    toOpen.forEach((pid, idx) => {
      const anim = plotAnimsRef.current[pid];
      if (anim?.unlockPulse) {
        anim.unlockPulse.setValue(0);
        Animated.sequence([
          Animated.delay(idx * 45),
          Animated.timing(anim.unlockPulse, { toValue: 1, duration: 420, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start(() => { anim.unlockPulse.setValue(0); });
      }
      const l = plotLayoutsRef.current[pid];
      if (l) {
        setTimeout(
          () => gardenEffectsRef.current?.emitUnlock(l.x + l.width / 2, l.y + l.height / 2),
          idx * 45 + 280,
        );
      }
    });
  }, []);

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
  }, [playSound, runComboBurst, runUnlockGlow]);

  const initPlotAnim = useCallback((id) => {
    if (plotAnimsRef.current[id]) {
      if (!plotAnimsRef.current[id].toolFlash) plotAnimsRef.current[id].toolFlash = new Animated.Value(1);
      if (!plotAnimsRef.current[id].unlockPulse) plotAnimsRef.current[id].unlockPulse = new Animated.Value(0);
      return;
    }
    plotAnimsRef.current[id] = {
      grow: new Animated.Value(1), appear: new Animated.Value(1),
      toolFlash: new Animated.Value(1), unlockPulse: new Animated.Value(0), timers: [],
    };
  }, []);

  const triggerPlotToolFeedback = useCallback((plotId) => {
    if (gardenFieldDragActiveRef.current && !gardenDragFromDockRef.current) return;
    const anim = plotAnimsRef.current[plotId];
    if (!anim?.toolFlash) return;
    anim.toolFlash.stopAnimation();
    anim.toolFlash.setValue(1);
    Animated.sequence([
      Animated.spring(anim.toolFlash, { toValue: 1.1, useNativeDriver: true, bounciness: 12, speed: 16 }),
      Animated.spring(anim.toolFlash, { toValue: 1,   useNativeDriver: true, bounciness: 10, speed: 14 }),
    ]).start();
  }, []);

  useEffect(() => {
    gardenComboRewardedRef.current = new Set();
    const initial = Array.from({ length: GARDEN_GRID_TOTAL }, (_, id) => ({
      id, state: 'empty', crop: null,
      unlocked: gardenPlotInStartZone(id), previewCrop: randomGardenCrop(),
    }));
    initial.forEach(p => initPlotAnim(p.id));
    setPlots(initial);
  }, [initPlotAnim]);

  useEffect(() => { plotsRef.current = plots; }, [plots]);
  useEffect(() => { selectedToolIdRef.current = selectedToolId; }, [selectedToolId]);

  useEffect(() => {
    if (!plots.length || gardenWinVisible) return;
    const allUnlocked = plots.every(p => p.unlocked);
    const allPlayableEmpty = plots.every(p => !p.unlocked || p.state === 'empty');
    if (allUnlocked && allPlayableEmpty) { setGardenWinVisible(true); playSound('match'); }
  }, [plots, gardenWinVisible, playSound]);

  useEffect(() => {
    (async () => {
      try { await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP); } catch {}
    })();
    return () => {
      (async () => { try { await ScreenOrientation.unlockAsync(); } catch {} })();
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(plotAnimsRef.current).forEach(({ grow, appear, toolFlash, unlockPulse, timers }) => {
        grow.stopAnimation(); appear.stopAnimation();
        toolFlash?.stopAnimation(); unlockPulse?.stopAnimation();
        timers.forEach(clearTimeout);
      });
    };
  }, []);

  const handlePlant = useCallback((plotId) => {
    if (!gardenPlotIsPlayable(plotId)) return;
    const crop = randomGardenCrop();
    setPlots(prev => prev.map(p => p.id === plotId ? { ...p, state: 'planted', crop } : p));
    const anim = plotAnimsRef.current[plotId];
    const paintOnlyDrag = gardenFieldDragActiveRef.current && !gardenDragFromDockRef.current;
    if (anim && !paintOnlyDrag) {
      Animated.sequence([
        Animated.spring(anim.grow, { toValue: 1.18, useNativeDriver: true, bounciness: 12, speed: 14 }),
        Animated.spring(anim.grow, { toValue: 1,    useNativeDriver: true, bounciness: 12, speed: 14 }),
      ]).start();
    }
    if (!paintOnlyDrag) playSound('tap');
  }, [playSound]);

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
      const node = gardenGridHitRef.current;
      if (!node?.measureInWindow) return;
      node.measureInWindow((x, y, w, h) => {
        gardenGridLayoutRef.current = { x, y, width: w, height: h };
        const stride = plotSize + plotGap;
        for (let id = 0; id < GARDEN_GRID_TOTAL; id++) {
          const col = id % GARDEN_GRID_COLS;
          const row = Math.floor(id / GARDEN_GRID_COLS);
          plotLayoutsRef.current[id] = { x: x + col * stride, y: y + row * stride, width: plotSize, height: plotSize };
        }
      });
    });
  }, [plotSize, plotGap]);

  const handleWater = useCallback((plotId) => {
    if (!gardenPlotIsPlayable(plotId)) return;
    setPlots(prev => {
      const plot = prev.find(p => p.id === plotId);
      if (!plot || plot.state !== 'planted') return prev;
      return prev.map(p => p.id === plotId ? { ...p, state: 'growing' } : p);
    });
    const paintOnlyDrag = gardenFieldDragActiveRef.current && !gardenDragFromDockRef.current;
    if (!paintOnlyDrag) playSound('pick');

    const anim = plotAnimsRef.current[plotId];
    if (!anim) return;

    const t1 = setTimeout(() => {
      const p = gardenFieldDragActiveRef.current && !gardenDragFromDockRef.current;
      if (!p) {
        Animated.sequence([
          Animated.spring(anim.grow, { toValue: 1.15, useNativeDriver: true, bounciness: 10, speed: 14 }),
          Animated.spring(anim.grow, { toValue: 1,    useNativeDriver: true, bounciness: 10, speed: 14 }),
        ]).start();
      }
    }, GROW_PHASE_DURATION);

    const t2 = setTimeout(() => {
      setPlots(prev => {
        const plot = prev.find(p => p.id === plotId);
        if (!plot || plot.state !== 'growing') return prev;
        let next = prev.map(p => p.id === plotId ? { ...p, state: 'ripe' } : p);
        const combo = applyAllComboUnlocks(next);
        if (combo) next = combo;
        return next;
      });
      const p2 = gardenFieldDragActiveRef.current && !gardenDragFromDockRef.current;
      if (!p2) playSound('match');
      if (!p2) {
        Animated.sequence([
          Animated.spring(anim.grow, { toValue: 1.2, useNativeDriver: true, bounciness: 12, speed: 10 }),
          Animated.spring(anim.grow, { toValue: 1,   useNativeDriver: true, bounciness: 12, speed: 10 }),
        ]).start();
      }
    }, GROW_PHASE_DURATION + RIPE_PHASE_DURATION);

    anim.timers.push(t1, t2);
  }, [playSound, applyAllComboUnlocks]);

  const handleHarvest = useCallback((plot) => {
    if (!gardenPlotIsPlayable(plot.id)) return;
    const anim = plotAnimsRef.current[plot.id];
    if (anim) { anim.timers.forEach(clearTimeout); anim.timers = []; }
    gardenForgetComboSignaturesTouchingPlot(plot.id);

    const plotLayout   = plotLayoutsRef.current[plot.id];
    const basketLayout = basketLayoutRef.current;
    const paintOnlyDrag = gardenFieldDragActiveRef.current && !gardenDragFromDockRef.current;

    if (!paintOnlyDrag && plotLayout && basketLayout && plot.crop) {
      const startX = plotLayout.x + plotLayout.width / 2 - 24;
      const startY = plotLayout.y + plotLayout.height / 2 - 24;
      flyAnimX.setValue(0); flyAnimY.setValue(0); flyAnimOp.setValue(1);
      setFlyOverlay({ image: plot.crop.ripeArt, startX, startY });
      const targetX = basketLayout.x + basketLayout.width / 2 - 24 - startX;
      const targetY = basketLayout.y + basketLayout.height / 2 - 24 - startY;
      Animated.parallel([
        Animated.timing(flyAnimX, { toValue: targetX, duration: 520, useNativeDriver: true }),
        Animated.timing(flyAnimY, { toValue: targetY, duration: 520, useNativeDriver: true }),
        Animated.timing(flyAnimOp, { toValue: 0,       duration: 480, useNativeDriver: true }),
      ]).start(() => setFlyOverlay(null));
      gardenEffectsRef.current?.emitHarvest(
        plotLayout.x + plotLayout.width / 2,
        plotLayout.y + plotLayout.height / 2,
        plot.crop.name,
      );
    }

    setPlots(prev => prev.map(p => p.id === plot.id ? { ...p, state: 'empty', crop: null } : p));
    setTotalHarvested(prev => prev + 1);
    if (!paintOnlyDrag) playSound('match');
    if (!paintOnlyDrag) {
      Animated.sequence([
        Animated.spring(basketBounce, { toValue: 1.3, useNativeDriver: true, bounciness: 14, speed: 10 }),
        Animated.spring(basketBounce, { toValue: 1,   useNativeDriver: true, bounciness: 14, speed: 10 }),
      ]).start();
    }
  }, [basketBounce, flyAnimOp, flyAnimX, flyAnimY, playSound, gardenForgetComboSignaturesTouchingPlot]);

  const applyToolForPlayablePlot = useCallback((plotId) => {
    if (!gardenPlotIsPlayable(plotId)) return;
    const plot = plotsRef.current.find(p => p.id === plotId);
    if (!plot) return;
    handlersRef.current.triggerPlotToolFeedback(plotId);
    if (plot.state === 'empty') handlersRef.current.handlePlant(plotId);
    else if (plot.state === 'planted') handlersRef.current.handleWater(plotId);
    else if (plot.state === 'ripe') handlersRef.current.handleHarvest(plot);
  }, []);

  const applyDockToolToPlot = useCallback((plotId, toolId) => {
    if (!gardenPlotIsPlayable(plotId)) return;
    const plot = plotsRef.current.find(p => p.id === plotId);
    if (!plot) return;
    const validState = GARDEN_TOOLS.find(t => t.id === toolId)?.validState;
    if (plot.state !== validState) return;
    handlersRef.current.triggerPlotToolFeedback(plotId);
    if (toolId === 'hoe') handlersRef.current.handlePlant(plotId);
    else if (toolId === 'water') handlersRef.current.handleWater(plotId);
    else handlersRef.current.handleHarvest(plot);
  }, []);

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
          handlersRef.current.syncGardenPlotLayoutsFromGrid?.();
          setDragTool(toolId);
          Animated.spring(dragFloatScale, { toValue: 1.15, useNativeDriver: true, bounciness: 14, speed: 18 }).start();
          handlersRef.current.playSound('pick');
        }
        if (!dragFromFabRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        dragFloatX.setValue(pageX - 40);
        dragFloatY.setValue(pageY - 40);
        const newHovered = handlersRef.current.pickPlotUnderFinger(pageX, pageY, validState);
        if (newHovered !== hoveredPlotIdRef.current) {
          hoveredPlotIdRef.current = newHovered;
          setHoveredPlotId(newHovered);
        }
        if (newHovered == null) { lastDockPlotRef.current[toolId] = null; return; }
        if (lastDockPlotRef.current[toolId] === newHovered) return;
        lastDockPlotRef.current[toolId] = newHovered;
        handlersRef.current.applyDockToolToPlot?.(newHovered, toolId);
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

  const applyToolAtLocal = useCallback((localX, localY) => {
    const plotId = handlersRef.current.pickPlotFromLocalXY(localX, localY);
    if (plotId == null) return;
    handlersRef.current.applyToolForPlayablePlot?.(plotId);
  }, []);

  const applyDragAtLocal = useCallback((localX, localY) => {
    const plotId = handlersRef.current.pickPlotFromLocalXY(localX, localY);
    if (plotId == null) { lastFieldPlotDragRef.current = null; return; }
    if (lastFieldPlotDragRef.current === plotId) return;
    lastFieldPlotDragRef.current = plotId;
    handlersRef.current.applyToolForPlayablePlot?.(plotId);
  }, []);

  const flushFieldDragPendingMove = useCallback(() => {
    const p = fieldDragPendingRef.current;
    if (p) { fieldDragPendingRef.current = null; handlersRef.current.applyDragAtLocal?.(p.x, p.y); }
  }, []);

  const scheduleFieldDragMove = useCallback((localX, localY) => {
    fieldDragPendingRef.current = { x: localX, y: localY };
    if (fieldDragRafRef.current != null) return;
    fieldDragRafRef.current = requestAnimationFrame(() => {
      fieldDragRafRef.current = null;
      flushFieldDragPendingMove();
    });
  }, [flushFieldDragPendingMove]);

  const resetFieldDrag = useCallback(() => { lastFieldPlotDragRef.current = null; }, []);

  handlersRef.current = {
    handlePlant, handleWater, handleHarvest, playSound,
    pickPlotUnderFinger, pickPlotFromLocalXY, triggerPlotToolFeedback,
    applyToolForPlayablePlot, applyDockToolToPlot,
    applyToolAtLocal, applyDragAtLocal,
    scheduleFieldDragMove, flushFieldDragPendingMove, resetFieldDrag,
    syncGardenPlotLayoutsFromGrid,
  };

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
        fieldDragStartRef.x = locationX; fieldDragStartRef.y = locationY;
        handlersRef.current.resetFieldDrag?.();
        handlersRef.current.syncGardenPlotLayoutsFromGrid?.();
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        handlersRef.current.scheduleFieldDragMove?.(locationX, locationY);
      },
      onPanResponderRelease: (evt) => {
        if (fieldDragRafRef.current != null) { cancelAnimationFrame(fieldDragRafRef.current); fieldDragRafRef.current = null; }
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
        if (fieldDragRafRef.current != null) { cancelAnimationFrame(fieldDragRafRef.current); fieldDragRafRef.current = null; }
        handlersRef.current.flushFieldDragPendingMove?.();
        gardenFieldDragActiveRef.current = false;
        handlersRef.current.resetFieldDrag?.();
      },
    });
  }

  const getRipeCropArt = (plot) => (plot.state === 'ripe' ? plot.crop?.ripeArt : null);
  const plotVectorIconSize = Math.round(Math.min(plotSize - 16, 68));
  const cropArtSize = Math.round(Math.min(plotSize - 14, 76));

  const renderGardenCell = (plot) => {
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

    return (
      <Animated.View
        key={plot.id}
        style={[styles.gardenPlotWrap, isLocked && styles.gardenPlotWrapLocked, { transform: scaleTransform, width: plotSize, height: plotSize }]}
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

  const gardenGridRows = useMemo(
    () => Array.from({ length: GARDEN_GRID_ROWS }, (_, row) => plots.slice(row * GARDEN_GRID_COLS, (row + 1) * GARDEN_GRID_COLS)),
    [plots],
  );

  const gardenGridHitSize = useMemo(() => ({
    width: GARDEN_GRID_COLS * plotSize + (GARDEN_GRID_COLS - 1) * plotGap,
    height: GARDEN_GRID_ROWS * plotSize + (GARDEN_GRID_ROWS - 1) * plotGap,
  }), [plotSize, plotGap]);

  const gardenFieldBlock = (
    <View style={[styles.gardenFieldPatch, styles.gardenFieldPressablePortrait]}>
      <View style={styles.gardenPlotGridColumn}>
        <View
          ref={r => { gardenGridHitRef.current = r; }}
          onLayout={() => handlersRef.current.syncGardenPlotLayoutsFromGrid?.()}
          style={[styles.gardenGridHitArea, gardenGridHitSize]}
          {...gardenFieldTapRef.current.panHandlers}
        >
          {gardenGridRows.map((rowPlots, rowIdx) => (
            <View key={`garden-row-${rowIdx}`} style={[styles.gardenGridRow, { gap: plotGap, marginBottom: rowIdx < GARDEN_GRID_ROWS - 1 ? plotGap : 0 }]}>
              {rowPlots.map(p => renderGardenCell(p))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const gardenDockBlock = (
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
                  <Image source={TOOL_IMAGES[tool.id]} style={styles.gardenToolBtnImage} resizeMode="contain" />
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
          <Text style={[styles.gardenDockBasketCount, { fontFamily: F8 }]}>{totalHarvested}</Text>
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

  const gardenFlyAndDrag = (
    <View style={styles.gardenOverlayLayer} pointerEvents="box-none">
      {flyOverlay && (
        <Animated.View
          pointerEvents="none"
          style={[styles.gardenFlyOverlay, { left: flyOverlay.startX, top: flyOverlay.startY, transform: [{ translateX: flyAnimX }, { translateY: flyAnimY }], opacity: flyAnimOp }]}
        >
          <Image source={flyOverlay.image} style={{ width: cropArtSize + 8, height: cropArtSize + 8 }} resizeMode="contain" />
        </Animated.View>
      )}
      {dragTool && (
        <Animated.View
          pointerEvents="none"
          style={[styles.gardenDragFloat, { transform: [{ translateX: dragFloatX }, { translateY: dragFloatY }, { scale: dragFloatScale }] }]}
        >
          {GARDEN_TOOLS.filter(t => t.id === dragTool).map(t => (
            <Image key={t.id} source={TOOL_IMAGES[t.id]} style={{ width: 52, height: 52 }} resizeMode="contain" />
          ))}
        </Animated.View>
      )}
    </View>
  );

  return (
    <LinearGradient colors={FARM.skyGradient} style={{ flex: 1 }}>
      <View style={styles.gardenRootPortrait}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.gardenPortraitColumn}>
          {gardenFieldBlock}
          {gardenDockBlock}
        </View>
        {gardenFlyAndDrag}
        <GardenEffectsCanvas ref={gardenEffectsRef} />
      </View>
      <Modal visible={gardenWinVisible} transparent animationType="fade">
        <View style={styles.gardenWinBackdrop}>
          <LinearGradient colors={[FARM.cardFront, FARM.cardMatched]} style={styles.gardenWinCard}>
            <Text style={[styles.gardenWinTitle, { fontFamily: F }]}>🎉 Chiến thắng!</Text>
            <Text style={[styles.gardenWinSub, { fontFamily: F8 }]}>Bạn đã mở hết ruộng và thu hoạch xong. Tuyệt vời!</Text>
            <AnimatedPressable onPress={() => { playSound('tap'); onExit(); }}>
              <LinearGradient colors={FARM.playButtonGradient} style={styles.gardenWinBtn}>
                <Text style={[styles.gardenWinBtnText, { fontFamily: F8 }]}>Về menu</Text>
              </LinearGradient>
            </AnimatedPressable>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default GardenHarvestGame;

const styles = StyleSheet.create({
  gardenRootPortrait:       { flex: 1, position: 'relative' },
  gardenPortraitColumn:     { flex: 1, flexDirection: 'column', minHeight: 0 },
  gardenOverlayLayer:       { ...StyleSheet.absoluteFillObject, zIndex: 50 },
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
  gardenFieldPressablePortrait: { flex: 1, width: '100%', minHeight: 0 },
  gardenFieldPatch: {
    flex: 1, backgroundColor: '#4A7830',
  },
  gardenToolBtnImage: { width: 46, height: 46 },
  gardenPlotGridColumn: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gardenGridHitArea:    { alignSelf: 'center' },
  gardenGridRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' },
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
  gardenWinBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  gardenWinCard: {
    width: '100%', maxWidth: 340, borderRadius: 24, paddingVertical: 28, paddingHorizontal: 22,
    alignItems: 'center', borderWidth: 3, borderColor: FARM.cardMatchedBorder, ...SHADOWS.card,
  },
  gardenWinTitle: { fontSize: 26, color: FARM.headerTitleColor, textAlign: 'center', marginBottom: 10 },
  gardenWinSub:   { fontSize: 15, color: FARM.subtitleColor, textAlign: 'center', marginBottom: 22, lineHeight: 22 },
  gardenWinBtn:   { paddingVertical: 14, paddingHorizontal: 36, borderRadius: 18, borderWidth: 3, borderColor: FARM.playButtonShadow, ...SHADOWS.button },
  gardenWinBtnText: { fontSize: 17, color: FARM.playButtonText, fontWeight: '800' },
  gardenFlyOverlay: { position: 'absolute', minWidth: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center', zIndex: 99 },
  gardenDragFloat:  { position: 'absolute', width: 64, height: 64, alignItems: 'center', justifyContent: 'center', zIndex: 999 },
});
