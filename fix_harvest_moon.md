Here is Claude's plan:                                                                                                                                                                                                                                
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: GardenHarvestGame UI/UX Improvements                                                                                                                                                                                                            
                                                        
 Context

 The farming game (GardenHarvestGame in App.js) needs a kid-friendly overhaul:
 - Field is too small (only 6 active tiles)
 - Tool selection via radial FAB menu is complex for kids
 - Locked tiles look dull/ugly (gray-brown)
 - Screen is cluttered with header text and instruction bar
 - Goal: more tiles, simpler tool cycling, appealing locked colors, clean minimal screen

 Only file modified: /home/dong/Sites/kid-game/App.js

 ---
 Step 1 — Grid constants (lines 1411–1416)

 Replace 5×4 / 3×2 with 7×5 / 4×3:

 const GARDEN_GRID_COLS = 7;
 const GARDEN_GRID_ROWS = 5;
 const GARDEN_GRID_TOTAL = GARDEN_GRID_COLS * GARDEN_GRID_ROWS;   // 35
 const GARDEN_ACTIVE_COLS = 4;
 const GARDEN_ACTIVE_ROWS = 3;
 const GARDEN_ACTIVE_COUNT = GARDEN_ACTIVE_COLS * GARDEN_ACTIVE_ROWS;  // 12

 ---
 Step 2 — plotSize calculation (lines 1445–1457)

 Remove headerH + instructH from availH (they're being removed in Step 6). Lower min 64→56, cap 108→88.

 const plotSize = useMemo(() => {
   const cols = GARDEN_GRID_COLS;
   const rows = GARDEN_GRID_ROWS;
   const fieldPadX = 12;
   const bottomPad = 8;
   const availW = landscapeW - gardenDockWidth - fieldPadX * 2;
   const availH = landscapeH - bottomPad;
   const wCell = (availW - plotGap * (cols - 1)) / cols;
   const hCell = (availH - plotGap * (rows - 1)) / rows;
   return Math.max(56, Math.min(88, Math.floor(Math.min(wCell, hCell))));
 }, [landscapeW, landscapeH, plotGap, gardenDockWidth]);

 ---
 Step 3 — Remove radial-menu state and animation refs

 Lines 1466–1467 — delete both lines:
 const [actionMenuOpen, setActionMenuOpen] = useState(false);
 const actionMenuOpenRef = useRef(false);

 Lines 1489–1490 — delete both lines:
 const menuOpacity = useRef(new Animated.Value(0)).current;
 const menuScale = useRef(new Animated.Value(0.6)).current;

 ---
 Step 4 — Replace radial menu logic with tap-to-cycle

 4a. Line 1678 — rename menuFabUiRef to cycleToolRef

 // OLD:
 const menuFabUiRef = useRef({ closeActionMenu: () => {}, toggleActionMenuFromTap: () => {} });
 // NEW:
 const cycleToolRef = useRef(() => {});

 4b. Lines 1697–1700 — remove menu-closing from onPanResponderMove drag branch

 Delete these 4 lines (leave the rest of the if (dist > 10) block intact):
 actionMenuOpenRef.current = false;
 setActionMenuOpen(false);
 menuOpacity.setValue(0);
 menuScale.setValue(0.6);

 4c. Line 1733 — replace toggle call with cycle call

 // OLD: menuFabUiRef.current.toggleActionMenuFromTap();
 // NEW: cycleToolRef.current();

 4d. Lines 1755–1785 — delete all 4 menu functions

 Delete entirely: openActionMenu, closeActionMenu, toggleActionMenuFromTap, selectToolFromMenu

 4e. Insert cycleTool callback after line 1785 (after deleted block, before applyToolAt)

 const cycleTool = useCallback(() => {
   const currentIdx = GARDEN_TOOLS.findIndex(t => t.id === selectedToolIdRef.current);
   const nextIdx = (currentIdx + 1) % GARDEN_TOOLS.length;
   const nextId = GARDEN_TOOLS[nextIdx].id;
   setSelectedToolId(nextId);
   selectedToolIdRef.current = nextId;
   playSound('tap');
 }, [playSound]);

 4f. Line 1802 — update ref assignment

 // OLD: menuFabUiRef.current = { closeActionMenu, toggleActionMenuFromTap };
 // NEW: cycleToolRef.current = cycleTool;

 ---
 Step 5 — Locked tile pastel colors (lines 1839–1846)

 /** Appealing pastels for locked tiles — distinct from active zone without being dull. */
 const getPlotGradientLocked = (plot) => {
   if (plot.state === 'empty')   return ['#E8F5E9', '#C8E6C9'];  // soft sage green
   if (plot.state === 'planted') return ['#F3E5F5', '#E1BEE7'];  // soft lavender
   if (plot.state === 'growing') return ['#E3F2FD', '#BBDEFB'];  // soft sky blue
   if (plot.state === 'ripe')    return ['#FFF8E1', '#FFECB3'];  // warm golden
   return ['#E8F5E9', '#C8E6C9'];
 };

 Lock icon badge (lines 1932–1936) remains unchanged.

 ---
 Step 6 — Simplify gardenDockBlock and remove radial constants

 6a. Delete lines 1949–1955 (radial constants no longer needed)

 RADIAL_R, radialAngles, FAB_ARENA, FAB_MAIN, FAB_SAT, fabMainLeft, fabMainTop

 6b. Replace entire gardenDockBlock (lines 1980–2025) — remove satellite buttons, simplify FAB

 FAB hint text changes from "Chạm mở"/"Chọn" to selectedToolDef.label (e.g. "Cuốc đất"):

 const gardenDockBlock = (
   <View style={[styles.gardenDockColumn, { width: gardenDockWidth }]}>
     <View
       style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}
       {...gardenMainFabPanRef.current.panHandlers}
     >
       <LinearGradient colors={FARM.playButtonGradient} style={styles.gardenMainFab}>
         <MaterialCommunityIcons name={selectedToolDef.icon} size={40} color={selectedToolDef.color} />
       </LinearGradient>
       <Text style={[styles.gardenMainFabHint, { fontFamily: F8 }]} numberOfLines={1}>
         {selectedToolDef.label}
       </Text>
     </View>
   </View>
 );

 ---
 Step 7 — Restructure gardenGradientInner (lines 2071–2113)

 Remove header row + instruction row. Add floating X button and basket counter as absolute overlays:

 const gardenGradientInner = (
   <View style={styles.gardenRootLandscape}>
     <StatusBar barStyle="dark-content" />

     {/* Floating X close button — top-left */}
     <AnimatedPressable
       onPress={() => { playSound('tap'); onExit(); }}
       style={styles.gardenFloatingClose}
     >
       <View style={styles.farmCloseButton}>
         <Ionicons name="close" size={22} color="#FFFFFF" />
       </View>
     </AnimatedPressable>

     {/* Floating basket counter — top-right */}
     <Animated.View
       ref={basketRef}
       onLayout={() => {
         if (basketRef.current) {
           basketRef.current.measureInWindow((x, y, w, h) => {
             basketLayoutRef.current = { x, y, width: w, height: h };
           });
         }
       }}
       style={[styles.gardenFloatingBasket, { transform: [{ scale: basketBounce }] }]}
     >
       <MaterialCommunityIcons name="basket" size={26} color={FARM.playButtonShadow} />
       <Text style={[styles.gardenBasketCount, { fontFamily: F8 }]}>{totalHarvested}</Text>
     </Animated.View>

     {/* Main content */}
     <View style={styles.gardenLandscapeRow}>
       {gardenFieldBlock}
       {gardenDockBlock}
     </View>

     {gardenFlyAndDrag}
     <View style={styles.farmGrassBar} />
   </View>
 );

 Key: basketRef.measureInWindow remains window-relative, so fly-to-basket animation still works correctly.

 ---
 Step 8 — Add new styles to StyleSheet.create (after last garden style ~line 3629)

 gardenFloatingClose: {
   position: 'absolute',
   top: 8,
   left: 8,
   zIndex: 10,
 },
 gardenFloatingBasket: {
   position: 'absolute',
   top: 8,
   right: 8,
   zIndex: 10,
   flexDirection: 'row',
   alignItems: 'center',
   backgroundColor: FARM.cardMatched,
   borderRadius: 14,
   borderWidth: 2,
   borderColor: FARM.cardMatchedBorder,
   paddingHorizontal: 10,
   paddingVertical: 6,
   minWidth: 62,
   height: 44,
   justifyContent: 'center',
   gap: 4,
   ...SHADOWS.header,
 },

 Styles to leave in place (unused but harmless): gardenHeaderLandscape, gardenInstructionRowLandscape, gardenInstructionText, gardenRadialSatelliteWrap, gardenRadialSatellite, gardenRadialLabel, gardenFabArena, gardenBasketBadge.
 Do NOT touch: farmPlayHeader, farmCloseButton, farmLevelBadge — used by other games.

 ---
 Verification

 1. Grep for actionMenuOpen, menuOpacity, menuScale, menuFabUiRef, toggleActionMenuFromTap, openActionMenu, closeActionMenu, selectToolFromMenu, FAB_ARENA, radialAngles — all must be 0 occurrences after edits
 2. Expo start: open GardenHarvestGame — 35 tiles render in 7×5 grid, no overflow
 3. Active zone: top-left 12 tiles (4×3) respond to tools; rest show pastel locked colors with lock icon
 4. FAB tap: cycles hoe → water → harvest → hoe; hint below FAB shows Vietnamese tool name
 5. FAB drag: drag from FAB activates floating tool icon, applies to hovered plots
 6. Harvest: ripe crop flies to basket counter overlay (top-right), basketBounce fires
 7. X button: tapping exits game cleanly
 8. No header row or instruction text visible
 9. plotSize on tablet ~80-88px; on small phone landscape ~60-70px (both above 56px min)
