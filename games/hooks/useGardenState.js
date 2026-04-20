import { useState, useCallback } from 'react';

export const useGardenState = () => {
  const [plots, setPlots] = useState([]);
  const [totalHarvested, setTotalHarvested] = useState(0);
  const [flyOverlay, setFlyOverlay] = useState(null);
  const [dragTool, setDragTool] = useState(null);
  const [hoveredPlotId, setHoveredPlotId] = useState(null);
  const [selectedToolId, setSelectedToolId] = useState('hoe');
  const [gardenWinVisible, setGardenWinVisible] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(3);
  const [roundTarget, setRoundTarget] = useState(5);
  const [roundCompleted, setRoundCompleted] = useState(false);

  const resetRound = useCallback(() => {
    setRoundCompleted(false);
    setRoundTarget(5 + (currentRound - 1) * 2);
    setPlots(prev => prev.map(p => ({
      ...p,
      state: 'empty',
      crop: null,
      harvested: false
    })));
    setTotalHarvested(0);
  }, [currentRound]);

  const advanceRound = useCallback(() => {
    if (currentRound < maxRounds) {
      setCurrentRound(prev => prev + 1);
      resetRound();
    } else {
      setGardenWinVisible(true);
    }
  }, [currentRound, maxRounds, resetRound]);

  return {
    plots, setPlots,
    totalHarvested, setTotalHarvested,
    flyOverlay, setFlyOverlay,
    dragTool, setDragTool,
    hoveredPlotId, setHoveredPlotId,
    selectedToolId, setSelectedToolId,
    gardenWinVisible, setGardenWinVisible,
    currentRound, setCurrentRound,
    maxRounds,
    roundTarget, setRoundTarget,
    roundCompleted, setRoundCompleted,
    resetRound,
    advanceRound,
  };
};
