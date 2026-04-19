# Plan: Make Garden Harvest Game More Engaging for Kids

## Context

The current **Vườn Thu Hoạch** game is an open-ended sandbox with:

* no clear goals
* no time pressure
* no failure state

Kids can play indefinitely without a sense of accomplishment.

The current win condition:

> Unlock all 35 plots AND empty them

→ quá dài và trừu tượng cho trẻ 3–7 tuổi.

### Mục tiêu cải tiến

* Thêm **round-based goals**
* Thêm **golden crops (yếu tố bất ngờ)**
* Thêm **milestone celebration**

→ tạo loop chơi ngắn, rõ ràng, gây “đã” hơn.

---

## Critical File

/home/dong/Sites/kid-game/games/GardenHarvestGame.js

👉 Tất cả thay đổi nằm ở đây

### Reference (không sửa)

/home/dong/Sites/kid-game/shared/components.js   (ConfettiParticle)
/home/dong/Sites/kid-game/shared/constants.js    (CONFETTI_EMOJIS)
/home/dong/Sites/kid-game/theme.js               (FARM.cardBack #FBBF24)

---

## What to Skip

**Pest visitors**
→ cần refactor PanResponder overlay
→ risk cao, gain thấp

👉 **Bỏ qua**

---

## Implementation Steps

### Step 1 — Remove old win condition

Xóa useEffect (~line 304–309) xử lý:
"all 35 plots unlocked + empty"

👉 vì sẽ conflict với round system mới

---

### Step 2 — Round / Goal System

#### State

const [round, setRound] = useState(1);
const [roundGoal, setRoundGoal] = useState(3);
const [roundHarvested, setRoundHarvested] = useState(0);
const [roundWinVisible, setRoundWinVisible] = useState(false);
const goalBarAnim = useRef(new Animated.Value(0)).current;

#### Goal scaling

Math.min(3 + round, 10)

* Day 1 → 3
* Day 7+ → max 10

---

#### Update trong handleHarvest

setRoundHarvested(prev => prev + 1);

if (roundHarvested + 1 >= roundGoal) {
playSound('win');
setRoundWinVisible(true);
}

---

#### Progress bar (dock UI)

* Left: 🌾 Ngày {round}
* Center: progress bar (Animated)
* Right: 🧺 {roundHarvested}/{roundGoal}

Animated.timing(goalBarAnim, {
toValue: roundHarvested / roundGoal,
useNativeDriver: false
});

---

#### Round Complete Modal

Button: "Ngày mới! ▶"

setRound(r => r + 1);
setRoundGoal(Math.min(3 + round + 1, 10));
setRoundHarvested(0);
setPlots(resetAllPlots());
setRoundWinVisible(false);

* thêm confetti (clone ConfettiParticle)

---

### Step 3 — Golden Crops

#### Khi plant

isGolden: Math.random() < 0.125  // ~1/8

---

#### Khi render (ripe)

borderColor: '#FBBF24'
borderWidth: 3

Animation:

Animated.loop(
Animated.sequence([
Animated.timing(anim.toolFlash, { toValue: 1.12, duration: 600, useNativeDriver: true }),
Animated.timing(anim.toolFlash, { toValue: 1.0, duration: 600, useNativeDriver: true }),
])
).start();

---

#### Khi harvest golden

* +2 thay vì +1
* sound combo
* floating text "+2"

Animated.parallel([
Animated.timing(opacity, { toValue: 1 }),
Animated.timing(translateY, { toValue: -20 })
]);

---

### Step 4 — Milestone Celebrations

#### Constants

const HARVEST_MILESTONES = [5, 10, 20, 35, 50];

---

#### State

const [milestoneVisible, setMilestoneVisible] = useState(false);
const [activeMilestone, setActiveMilestone] = useState(null);
const milestonesSeenRef = useRef(new Set());

---

#### Trigger

if (
HARVEST_MILESTONES.includes(totalHarvested) &&
!milestonesSeenRef.current.has(totalHarvested)
) {
milestonesSeenRef.current.add(totalHarvested);
setActiveMilestone(totalHarvested);
setMilestoneVisible(true);
}

---

#### Milestone Modal

* Confetti (12 particles)
* 3 stars (stagger 150ms)
* Text: Bé thu hoạch {activeMilestone} quả rồi! 🌟
* Button: "Tiếp tục"

---

## State Summary

| State            | Type           | Purpose              |
| ---------------- | -------------- | -------------------- |
| round            | number         | Current day          |
| roundGoal        | number         | Target harvests      |
| roundHarvested   | number         | Current progress     |
| roundWinVisible  | boolean        | Show round complete  |
| milestoneVisible | boolean        | Show milestone modal |
| activeMilestone  | number | null  | Current milestone    |
| goalBarAnim      | Animated.Value | Progress animation   |

---

## Verification Checklist

1. Start game → 🌾 Ngày 1, 🧺 0/3
2. Harvest 3 → modal + confetti + sound
3. Next day → Ngày 2, 0/4
4. Golden crop (~1/8) → có pulse
5. Harvest golden → +2 + animation
6. Harvest total = 5 → milestone modal
7. Old win condition không còn trigger

---

## Notes (Fix encoding nếu cần)

cat file.txt | tr -d '\000-\031' > clean.md

hoặc

iconv -f utf-8 -t utf-8 -c input.txt > output.md
