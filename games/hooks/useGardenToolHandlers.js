import { useCallback } from 'react';
import { Animated } from 'react-native';

const GROW_PHASE_DURATION = 1200;
const RIPE_PHASE_DURATION = 1200;

export const useGardenToolHandlers = (
  plotsRef,
  plotAnimsRef,
  plotLayoutsRef,
  gardenFieldDragActiveRef,
  gardenDragFromDockRef,
  gardenForgetComboSignaturesTouchingPlot,
  gardenPlotIsPlayable,
  applyAllComboUnlocks,
  flyAnimX, flyAnimY, flyAnimOp,
  basketBounce,
  basketLayoutRef,
  setFlyOverlay,
  setPlots,
  setTotalHarvested,
  playSound,
  gardenEffectsRef,
) => {
  const handlePlant = useCallback((plotId) => {
    if (!gardenPlotIsPlayable(plotId)) return;
    const isGolden = Math.random() < 0.1;
    const randomCrop = () => {
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
    const crop = isGolden ? { ...randomCrop(), isGolden: true } : randomCrop();

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
  }, [gardenPlotIsPlayable, gardenFieldDragActiveRef, gardenDragFromDockRef, setPlots, playSound]);

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
  }, [gardenPlotIsPlayable, gardenFieldDragActiveRef, gardenDragFromDockRef, setPlots, playSound, applyAllComboUnlocks]);

  const handleHarvest = useCallback((plot) => {
    if (!gardenPlotIsPlayable(plot.id)) return;
    const anim = plotAnimsRef.current[plot.id];
    if (anim) { anim.timers.forEach(clearTimeout); anim.timers = []; }
    gardenForgetComboSignaturesTouchingPlot(plot.id);

    const plotLayout = plotLayoutsRef.current[plot.id];
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
    const pointsToAdd = plot.crop?.isGolden ? 2 : 1;
    setTotalHarvested(prev => prev + pointsToAdd);

    if (!paintOnlyDrag) playSound('match');
    if (!paintOnlyDrag) {
      Animated.sequence([
        Animated.spring(basketBounce, { toValue: 1.3, useNativeDriver: true, bounciness: 14, speed: 10 }),
        Animated.spring(basketBounce, { toValue: 1,   useNativeDriver: true, bounciness: 14, speed: 10 }),
      ]).start();
    }
  }, [gardenPlotIsPlayable, gardenFieldDragActiveRef, gardenDragFromDockRef, gardenForgetComboSignaturesTouchingPlot, plotLayoutsRef, basketLayoutRef, flyAnimX, flyAnimY, flyAnimOp, setFlyOverlay, setPlots, setTotalHarvested, playSound, basketBounce, gardenEffectsRef]);

  return { handlePlant, handleWater, handleHarvest };
};
