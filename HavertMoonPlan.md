Ready to code?                                                                                                           
                                                                                                                          
 Here is Claude's plan:                                                                                                   
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: Redesign GardenHarvestGame — Plant → Grow → Harvest Cycle                                                          
                                                        
 Context

 The current Vườn Thu Hoạch (Garden Harvest) game reduces all three task types (harvest/feed/water) to the same mechanic:
  pick the correct emoji, avoid the wrong one. This is odd-one-out with farm decoration, not real gardening. There is no
 planting loop, no growth, and the time pressure + mistake budget frustrates preschool kids. The user wants a gentle,
 open-ended garden experience with no fail states and no level system.

 User decisions:
 - Concept: Plant → Water → Grow → Harvest cycle
 - Fail states: None (gentle, preschool-friendly)
 - Progression: Open-ended continuous garden (no tiers/levels)

 ---
 Critical Files

 - /home/dong/Sites/kid-game/App.js — only file; all changes here
   - Remove: lines 1391–1933 (old constants + GardenDraggableItem + GardenHarvestGame)
   - Insert: new constants at ~line 1463, new component replacing old one
   - Styles: remove all old garden* styles, add new ones before closing });
 - /home/dong/Sites/kid-game/theme.js — reference only; FARM and SHADOWS already imported

 ---
 New Game Design

 One continuous garden. No timer. No mistakes. Just grow things.

 Each plot cycles through states:
 1. Empty (🟫) → tap → Planted (🌱)
 2. Planted → tap → Growing (🌿) — grow timer starts
 3. Growing — after ~2.4s, auto-transitions → Ripe (crop emoji + ✓ badge)
 4. Ripe → tap → harvest (emoji flies to basket, plot resets to empty)

 Garden starts with 4 plots. After 8 total harvests → expands to 6. After 20 → expands to 9.

 ---
 Step-by-Step Implementation

 Step 1 — Remove old code

 Delete from App.js:
 - GARDEN_TASK_TYPE object
 - GARDEN_TASK_META object
 - GARDEN_LEVELS array
 - GardenDraggableItem component
 - Entire GardenHarvestGame body
 - Unused PanGestureHandler / State import (line 5)

 Step 2 — New constants (insert at ~line 1463)

 const GARDEN_CROPS = [
   { seed: '🌱', ripe: '🥕', name: 'Cà rốt' },
   { seed: '🌱', ripe: '🍓', name: 'Dâu' },
   { seed: '🌱', ripe: '🍅', name: 'Cà chua' },
   { seed: '🌱', ripe: '🌽', name: 'Ngô' },
   { seed: '🌱', ripe: '🥦', name: 'Bông cải' },
   { seed: '🌱', ripe: '🍆', name: 'Cà tím' },
   { seed: '🌱', ripe: '🥬', name: 'Xà lách' },
 ];
 const GARDEN_EXPAND_THRESHOLDS = [
   { at: 0,  plots: 4 },
   { at: 8,  plots: 6 },
   { at: 20, plots: 9 },
 ];
 const GROW_PHASE_DURATION = 1200; // ms planted → sprout
 const RIPE_PHASE_DURATION = 1200; // ms sprout → ripe

 Step 3 — Animation architecture (ref map, not state)

 Never store Animated.Value in React state. All animation values live in a ref map:

 const plotAnimsRef = useRef({});
 // Each entry: { grow, appear, timers[] }
 // grow: Animated.Value for scale bounce
 // appear: Animated.Value for pop-in (0 for new plots, 1 for initial)
 // timers: setTimeout ids to clear on unmount/harvest

 const initPlotAnim = (id, isNew = false) => {
   if (plotAnimsRef.current[id]) return;
   plotAnimsRef.current[id] = {
     grow:   new Animated.Value(1),
     appear: new Animated.Value(isNew ? 0 : 1),
     timers: [],
   };
 };

 Fly animation uses 3 top-level refs (not per-plot):
 const flyAnimX  = useRef(new Animated.Value(0)).current;
 const flyAnimY  = useRef(new Animated.Value(0)).current;
 const flyAnimOp = useRef(new Animated.Value(1)).current;
 const [flyOverlay, setFlyOverlay] = useState(null); // { emoji, startX, startY }

 Basket bounce:
 const basketBounce = useRef(new Animated.Value(1)).current;

 Step 4 — Component state

 const [plots, setPlots] = useState([]);         // { id, state, crop }
 const [totalHarvested, setTotalHarvested] = useState(0);
 const plotRefs = useRef({});                    // raw View refs for measureInWindow
 const plotLayoutsRef = useRef({});              // { [id]: { x, y, width, height } }
 const basketRef = useRef(null);
 const basketLayoutRef = useRef(null);

 Plot object shape: { id: number, state: 'empty'|'planted'|'growing'|'ripe', crop: null|{seed,ripe,name} }

 Step 5 — Initialization

 useEffect(() => {
   const count = GARDEN_EXPAND_THRESHOLDS[0].plots; // 4
   const initial = Array.from({ length: count }, (_, i) => ({ id: i, state: 'empty', crop: null }));
   initial.forEach(p => initPlotAnim(p.id, false));
   setPlots(initial);
 }, []);

 Cleanup on unmount:
 useEffect(() => {
   return () => {
     Object.values(plotAnimsRef.current).forEach(({ grow, appear, timers }) => {
       grow.stopAnimation(); appear.stopAnimation();
       timers.forEach(clearTimeout);
     });
   };
 }, []);

 Step 6 — Handlers (declare in this order to avoid circular deps)

 handleWater(plotId) — transitions planted → growing, sets 2 timers:
 - T1 (+1200ms): pulse animation (sprout visual)
 - T2 (+2400ms): setPlots state to 'ripe', play 'match' sound, ripe bounce

 handleHarvest(plot) — ripe → empty:
 1. Measure positions, set flyOverlay, run parallel fly animation (520ms)
 2. Immediately reset plot to empty, clear its timers
 3. setTotalHarvested(prev => { checkExpansion(prev+1); return prev+1; })
 4. Basket bounce animation

 handlePlotTap(plot) — routes by state:
 - 'empty' → pick random crop, set 'planted', bounce, play 'tap'
 - 'planted' → call handleWater
 - 'ripe' → call handleHarvest
 - 'growing' → ignore

 checkExpansion(newTotal) — adds plots when threshold crossed:
 const threshold = [...GARDEN_EXPAND_THRESHOLDS].reverse().find(t => newTotal >= t.at);
 setPlots(prev => {
   if (prev.length >= threshold.plots) return prev;
   // add new plots with isNew=true, stagger appear animation
 });
 playSound('combo');

 Step 7 — Render structure

 LinearGradient (FARM.skyGradient)
 ├── Header row
 │   ├── Close button (AnimatedPressable)
 │   ├── Title badge "🌾 Vườn của bé"
 │   └── Basket counter (Animated.View with basketBounce scale)
 ├── Instruction strip
 │   └── "Chạm ô trống để trồng · Chạm lại để tưới · Hái khi chín"
 ├── Plot grid (flexWrap, gap 14)
 │   └── {plots.map(plot => (
 │         Animated.View (appear × grow scale)
 │           View (ref + onLayout for measureInWindow)
 │             AnimatedPressable → handlePlotTap
 │               LinearGradient (soil/green/ripe gradient)
 │                 plot emoji (52px)
 │                 ripe ✓ badge (if ripe)
 │                 💧 badge (if growing)
 │       ))}
 ├── Fly overlay (position:absolute, pointerEvents:none)
 │   {flyOverlay && <Animated.View left/top + translateX/Y + opacity>}
 └── Grass bar

 Helper functions (inside component):
 getPlotEmoji(plot)     // 🟫 / 🌱 / 🌿 / crop.ripe
 getPlotGradient(plot)  // soil brown / cream / green / FARM.cardMatched

 Step 8 — New styles to add to StyleSheet.create

 ┌────────────────────────┬─────────────────────────────────────────────────────────┐
 │       Style name       │                         Purpose                         │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenInstructionRow   │ Semi-transparent pill with instruction text             │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenInstructionText  │ 13px brown text                                         │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenBasketBadge      │ Green pill, flex-row, 62×44, top-right header slot      │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenBasketEmoji      │ 20px                                                    │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenBasketCount      │ 18px bold                                               │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenPlotGrid         │ flexWrap row, centered, gap 14                          │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenPlotWrap         │ (empty — scale transform applied inline)                │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenPlot             │ 104×104, borderRadius 20, dashed border, SHADOWS.button │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenPlotEmoji        │ 52px centered                                           │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenRipeBadge        │ Green circle top-right corner                           │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenRipeBadgeText    │ White ✓                                                 │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenGrowingBadge     │ Bottom-right corner anchor                              │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenGrowingBadgeText │ 18px 💧                                                 │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenFlyOverlay       │ position:absolute, 48×48, zIndex 99                     │
 ├────────────────────────┼─────────────────────────────────────────────────────────┤
 │ gardenFlyEmoji         │ 40px                                                    │
 └────────────────────────┴─────────────────────────────────────────────────────────┘

 ---
 Key Gotchas

 ┌───────────────────────────────────────────────────────┬───────────────────────────────────────────────────────────┐
 │                         Risk                          │                        Mitigation                         │
 ├───────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Double-tap on planted plot fires two handleWater      │ Guard: check plot.state === 'planted' at top of handler   │
 │ calls                                                 │                                                           │
 ├───────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Grow timers fire after plot already harvested         │ handleHarvest clears anim.timers before resetting plot    │
 ├───────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ measureInWindow returns 0,0 on first render           │ Fly guarded by if (plotLayout && basketLayout) — harvest  │
 │                                                       │ still works                                               │
 ├───────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ Animated.multiply(appear, grow) — appear=0 makes plot │ Initial plots use appear = new Animated.Value(1); only    │
 │  invisible always                                     │ expansion plots start at 0                                │
 ├───────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ checkExpansion stale closure on plots.length          │ Reads prev.length inside setPlots(prev => ...) updater —  │
 │                                                       │ always fresh                                              │
 ├───────────────────────────────────────────────────────┼───────────────────────────────────────────────────────────┤
 │ 9-plot grid clips on 360px screens                    │ Responsive size: Math.min(104, floor((screenWidth - 32 -  │
 │                                                       │ 28) / 3))                                                 │
 └───────────────────────────────────────────────────────┴───────────────────────────────────────────────────────────┘

 ---
 Sound Mapping

 ┌──────────────────────────┬───────┐
 │          Action          │ Sound │
 ├──────────────────────────┼───────┤
 │ Tap empty plot (plant)   │ tap   │
 ├──────────────────────────┼───────┤
 │ Tap planted plot (water) │ pick  │
 ├──────────────────────────┼───────┤
 │ Crop becomes ripe        │ match │
 ├──────────────────────────┼───────┤
 │ Tap ripe crop (harvest)  │ match │
 ├──────────────────────────┼───────┤
 │ Garden expands           │ combo │
 └──────────────────────────┴───────┘

 ---
 Verification

 1. Run npx expo start, open on device/simulator
 2. Tap empty plot → see 🌱 appear with bounce
 3. Tap same plot → see 💧 badge, then 🌿, then ripe emoji after ~2.4s
 4. Tap ripe plot → emoji flies to basket, counter increments, plot resets
 5. Harvest 8 crops → 2 new plots pop in with spring animation
 6. Harvest 20 crops → 3 more plots pop in (total 9)
 7. Verify no timer / mistake state anywhere in the UI
 8. Press close → exits cleanly
