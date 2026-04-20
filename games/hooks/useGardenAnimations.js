import { useRef, useCallback } from 'react';
import { Animated, Easing } from 'react-native';

export const useGardenAnimations = (GARDEN_GRID_TOTAL, plotLayoutsRef) => {
  const plotAnimsRef = useRef({});
  const plotLayoutsRef_local = useRef({});
  const gardenEffectsRef = useRef(null);

  const flyAnimX = useRef(new Animated.Value(0)).current;
  const flyAnimY = useRef(new Animated.Value(0)).current;
  const flyAnimOp = useRef(new Animated.Value(1)).current;
  const basketBounce = useRef(new Animated.Value(1)).current;
  const dragFloatX = useRef(new Animated.Value(-200)).current;
  const dragFloatY = useRef(new Animated.Value(-200)).current;
  const dragFloatScale = useRef(new Animated.Value(0)).current;

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
    const anim = plotAnimsRef.current[plotId];
    if (!anim?.toolFlash) return;
    anim.toolFlash.stopAnimation();
    anim.toolFlash.setValue(1);
    Animated.sequence([
      Animated.spring(anim.toolFlash, { toValue: 1.1, useNativeDriver: true, bounciness: 12, speed: 16 }),
      Animated.spring(anim.toolFlash, { toValue: 1,   useNativeDriver: true, bounciness: 10, speed: 14 }),
    ]).start();
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
      const l = plotLayoutsRef_local.current[pid];
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
      const l = plotLayoutsRef_local.current[pid];
      if (l) {
        setTimeout(
          () => gardenEffectsRef.current?.emitUnlock(l.x + l.width / 2, l.y + l.height / 2),
          idx * 45 + 280,
        );
      }
    });
  }, []);

  return {
    plotAnimsRef,
    plotLayoutsRef: plotLayoutsRef_local,
    gardenEffectsRef,
    flyAnimX, flyAnimY, flyAnimOp,
    basketBounce,
    dragFloatX, dragFloatY, dragFloatScale,
    initPlotAnim,
    triggerPlotToolFeedback,
    runComboBurst,
    runUnlockGlow,
  };
};
