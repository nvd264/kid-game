╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 Plan: Make Garden Harvest Game More Engaging for Kids                                                                                              
                                                                                                                                                
Context                                                                                                     

ThecurrentVườnThuHoạchgameisanopen-endedsandboxwithnocleargoals,notimepressure,andnofailurestate.Kidscanplayindefinitely
withnosenseofaccomplishment.Thewincondition(unlockall35plotsANDemptythem)istoolongandabstractforages3–7.Thisplanaddsa
round-basedgoalsystem,goldencropsforsurprise/delight,andmilestonecelebrationstocreatesatisfyingshort-sessionarcs.

---
CriticalFile

/home/dong/Sites/kid-game/games/GardenHarvestGame.js—allchangesarehere.

Reference-only(noedits):
-/home/dong/Sites/kid-game/shared/components.js—ConfettiParticlepatterntoclone
-/home/dong/Sites/kid-game/shared/constants.js—CONFETTI_EMOJISarray
-/home/dong/Sites/kid-game/theme.js—FARM.cardBack(#FBBF24)forgoldenborder

---
WhattoSkip

Pestvisitors—requiressplittingtheoverlayPanResponderlayer,highest-riskchangeformodestengagementgain.Defer.

---
ImplementationSteps

Step1—Removestalewincondition

DeletetheuseEffectatlines~304–309thatfireswhenall35plotsareunlockedandempty.Thisfiresincorrectlyalongsidethenewroundsystem.

Step2—Round/Goalsystem

Newstate:
const[round,setRound]=useState(1);
const[roundGoal,setRoundGoal]=useState(3);//startsat3,max10
const[roundHarvested,setRoundHarvested]=useState(0);
const[roundWinVisible,setRoundWinVisible]=useState(false);
constgoalBarAnim=useRef(newAnimated.Value(0)).current;

Goalcurve:Math.min(3+round,10)—Day1=3harvests,Day7+=10harvests.

InhandleHarvest:AfterincrementingtotalHarvested,alsoincrementroundHarvested.WhenroundHarvested+1>=roundGoal,callplaySound('win')
andsetRoundWinVisible(true).

Progressbarindock:Replacethebasketcounterwithagoalrow:
-Left:🌾Ngày{round}
-Center:animatedfillbar(goalBarAnimdrivenbyuseEffectonroundHarvested/roundGoal—useNativeDriver:falserequiredforwidth)
-Right:🧺{roundHarvested}/{roundGoal}

Round-completemodal:MirrortheexistinggardenWinModalpattern.On"Ngàymới!▶"press:
-setRound(r=>r+1)
-setRoundGoal(Math.min(3+round+1,10))
-setRoundHarvested(0)
-ResetallplotstoemptyviasetPlots(...)
-setRoundWinVisible(false)

IncludeconfettiburstusingConfettiParticle(alreadyimportedinshared/components.js—importdirectlyorclonetheanimationpatternwith12
Animated.Values).

Step3—GoldenCrops

InhandlePlant:AftercallingrandomGardenCrop(),tag:isGolden:Math.random()<0.125(≈1in8crops).

InrenderGardenCell:Whenplot.state==='ripe'&&plot.crop?.isGolden:
-Addgoldenborder:borderColor:'#FBBF24',borderWidth:3
-Driveaslowpulseloopontheplot'sexistingtoolFlashAnimated.Value:
Animated.loop(Animated.sequence([
Animated.timing(anim.toolFlash,{toValue:1.12,duration:600,useNativeDriver:true}),
Animated.timing(anim.toolFlash,{toValue:1.0,duration:600,useNativeDriver:true}),
])).start();

InhandleHarvest:Checkplot.crop?.isGolden:
-Playcombosoundinsteadofmatch
-Add+2toroundHarvestedinsteadof+1
-Showafloating+2textoverlay:oneAnimated.Value(opacity+translateY)viaAnimated.parallelover800ms,positionedabovethebasket

Step4—MilestoneCelebrations

Constants:
constHARVEST_MILESTONES=[5,10,20,35,50];

Newstate/refs:
const[milestoneVisible,setMilestoneVisible]=useState(false);
const[activeMilestone,setActiveMilestone]=useState(null);
constmilestonesSeenRef=useRef(newSet());

InhandleHarvest:AfterupdatingtotalHarvested,checkifnewtotalisinHARVEST_MILESTONESandnotyetseen→markseen,setactiveMilestone,
setMilestoneVisible(true),playstar1/star2/star3staggered.

Milestonemodal:Localmini-modal(notRewardPopup)with:
-Confettiparticles(clonepatternfromConfettiParticleinshared/components.js,12particles)
-3starscales(springanimations,staggered150msapart)
-Text:"Béthuhoạch{activeMilestone}quảrồi!🌟"
-Button:"Tiếptục"→setMilestoneVisible(false)

---
NewStateSummary

┌──────────────────┬────────────────┬───────────────────────────────────┐
│State│Type│Purpose│
├──────────────────┼────────────────┼───────────────────────────────────┤
│round│number│Currentdaynumber│
├──────────────────┼────────────────┼───────────────────────────────────┤
│roundGoal│number│Harvestsneeded(3+round,max10)│
├──────────────────┼────────────────┼───────────────────────────────────┤
│roundHarvested│number│Harveststhisround│
├──────────────────┼────────────────┼───────────────────────────────────┤
│roundWinVisible│bool│Round-completemodal│
├──────────────────┼────────────────┼───────────────────────────────────┤
│milestoneVisible│bool│Milestonecelebrationmodal│
├──────────────────┼────────────────┼───────────────────────────────────┤
│activeMilestone│number|null│Whichmilestonefired│
├──────────────────┼────────────────┼───────────────────────────────────┤
│goalBarAnim│Animated.Value│Progressbarfillwidth│
└──────────────────┴────────────────┴───────────────────────────────────┘

---
Verification

1.Startthegame—dockshouldshow🌾Ngày1and🧺0/3
2.Harvest3crops→round-completemodalfireswithconfetti,winsound
3.Press"Ngàymới!"→Day2starts,goalresetsto0/4
4.Plantuntilagoldencropappears(≈1in8)→sparklepulsewhenripe
5.Harvestthegoldencrop→combosound,+2floattext,progressbarjumps2
6.Harvest5totalcrops→milestonemodalfires:"Béthuhoạch5quảrồi!🌟"
7.Checkthattheold"all35plotsunlocked+empty"winconditiondoesNOTfire
