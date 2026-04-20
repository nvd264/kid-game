import { Dimensions } from 'react-native';

export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Themes (memory + puzzle shared) ──
export const themes = {
  animals: {
    name: 'Con vật',
    assetKey: 'a_horse',
    items: ['a_chicken', 'a_cow', 'a_duck', 'a_horse', 'a_pig', 'a_sheep', 'a_sheep', 'a_horse', 'a_cow', 'a_duck'],
  },
  fruits: {
    name: 'Trái cây',
    assetKey: 'a_strawberry',
    items: ['a_strawberry', 'a_corn', 'a_strawberry', 'a_strawberry', 'a_carrot', 'a_strawberry', 'a_corn', 'a_strawberry', 'a_carrot', 'a_corn'],
  },
  vehicles: {
    name: 'Phương tiện',
    assetKey: 'a_horse',
    items: ['v_sedan', 'v_taxi', 'v_ambulance', 'v_police', 'v_firetruck', 'v_tractor', 'v_suv', 'v_race', 'v_garbage', 'v_hatchback'],
  },
};

export const ANIMAL_ASSETS = {
  a_chicken:   require('../assets/ui/farm/chicken-hen-farm-poultry-bird-001.png'),
  a_cow:       require('../assets/ui/farm/cow-cattle-dairy-farm-animal-008.png'),
  a_duck:      require('../assets/ui/farm/duck-farm-bird-pond-waterfowl-006.png'),
  a_horse:     require('../assets/ui/farm/farm_animals-horse-farm-animal-brown-stallion-005.png'),
  a_pig:       require('../assets/ui/farm/farm_animals-pig-farm-animal-pink-swine-003.png'),
  a_sheep:     require('../assets/ui/farm/farm_animals-sheep-wool-animal-fluffy-farm-004.png'),
  a_egg:       require('../assets/ui/farm/egg-item-chicken-product-farming-001.png'),
  a_corn:      require('../assets/ui/farm/corn-stalk-tall-yellow-maize-004.png'),
  a_strawberry: require('../assets/ui/farm/farm_crops_growing-strawberry-plant-red-berry-bush-007.png'),
  a_carrot:    require('../assets/ui/farm/carrot-crop-orange-vegetable-garden-002.png'),
  a_barn:      require('../assets/ui/farm/barn-building-red-farm-structure-001.png'),
  a_milk:      require('../assets/ui/farm/farm_animal_products-milk-bottle-dairy-product-farming-002.png'),
  a_wool:      require('../assets/ui/farm/farm_animal_products-wool-bundle-sheep-product-farming-003.png'),
  a_potato:    require('../assets/ui/farm/farm_crops_growing-potato-plant-brown-tuber-garden-005.png'),
  a_tomato:    require('../assets/ui/farm/farm_crops_growing-tomato-plant-red-fruit-vine-003.png'),
  a_pumpkin:   require('../assets/ui/farm/farm_crops_growing-pumpkin-crop-orange-gourd-vine-006.png'),
  a_cabbage:   require('../assets/ui/farm/cabbage-crop-green-leafy-vegetable-008.png'),
};

export const VEHICLE_ASSETS = {
  v_sedan:     require('../assets/ui/car/Previews/sedan.png'),
  v_taxi:      require('../assets/ui/car/Previews/taxi.png'),
  v_ambulance: require('../assets/ui/car/Previews/ambulance.png'),
  v_police:    require('../assets/ui/car/Previews/police.png'),
  v_firetruck: require('../assets/ui/car/Previews/firetruck.png'),
  v_tractor:   require('../assets/ui/car/Previews/tractor.png'),
  v_suv:       require('../assets/ui/car/Previews/suv.png'),
  v_race:      require('../assets/ui/car/Previews/race.png'),
  v_garbage:   require('../assets/ui/car/Previews/garbage-truck.png'),
  v_hatchback: require('../assets/ui/car/Previews/hatchback-sports.png'),
};

export const THEME_ORDER = ['animals', 'fruits', 'vehicles'];

// ── Sound assets ──
export const soundAssets = {
  background:  require('../assets/sounds/background.mp3'),
  tap:         require('../assets/sounds/tap.mp3'),
  flip:        require('../assets/sounds/flip.mp3'),
  match:       require('../assets/sounds/match.mp3'),
  wrong:       require('../assets/sounds/wrong.mp3'),
  pick:        require('../assets/sounds/pick.mp3'),
  place:       require('../assets/sounds/place.mp3'),
  win:         require('../assets/sounds/win-fantasy.wav'),
  navigate:    require('../assets/sounds/navigate.mp3'),
  themeSelect: require('../assets/sounds/themeSelect.mp3'),
  levelSelect: require('../assets/sounds/levelSelect.mp3'),
  star1:       require('../assets/sounds/star1.mp3'),
  star2:       require('../assets/sounds/star2.mp3'),
  star3:       require('../assets/sounds/star3.mp3'),
  combo:       require('../assets/sounds/combo.mp3'),
};

export const HAND_POINTER_ASSET = require('../assets/ui/hand-pointer.png');

export const ANIMAL_SOUNDS = [
  {
    id: 'sparrow',
    name: 'Chim sẻ',
    assetKey: 'a_chicken',
    imageUri: 'https://images.pexels.com/photos/355154/pexels-photo-355154.jpeg',
    soundAssets: [
      require('../assets/sounds/animals/sparrow-1.wav'),
      require('../assets/sounds/animals/sparrow-2.wav'),
      require('../assets/sounds/animals/sparrow-3.wav'),
    ],
  },
  {
    id: 'dove',
    name: 'Bồ câu',
    assetKey: 'a_duck',
    imageUri: 'https://images.pexels.com/photos/6508358/pexels-photo-6508358.jpeg',
    soundAssets: [
      require('../assets/sounds/animals/dove-1.wav'),
      require('../assets/sounds/animals/dove-2.wav'),
      require('../assets/sounds/animals/dove-3.wav'),
    ],
  },
  {
    id: 'canary',
    name: 'Chim hoang yến',
    assetKey: 'a_chicken',
    imageUri: 'https://images.pexels.com/photos/349758/hummingbird-bird-birds-349758.jpeg',
    soundAssets: [
      require('../assets/sounds/animals/canary-1.wav'),
      require('../assets/sounds/animals/canary-2.wav'),
      require('../assets/sounds/animals/canary-3.wav'),
    ],
  },
  {
    id: 'nightingale',
    name: 'Chim sơn ca',
    assetKey: 'a_chicken',
    imageUri: 'https://images.pexels.com/photos/326900/pexels-photo-326900.jpeg',
    soundAssets: [
      require('../assets/sounds/animals/nightingale-1.wav'),
      require('../assets/sounds/animals/nightingale-2.wav'),
      require('../assets/sounds/animals/nightingale-3.wav'),
    ],
  },
  {
    id: 'cicada',
    name: 'Ve sầu',
    assetKey: 'a_corn',
    imageUri: 'https://images.pexels.com/photos/2071882/pexels-photo-2071882.jpeg',
    soundAssets: [
      require('../assets/sounds/animals/cicada-1.wav'),
      require('../assets/sounds/animals/cicada-2.wav'),
      require('../assets/sounds/animals/cicada-3.wav'),
    ],
  },
  {
    id: 'bird',
    name: 'Chim non',
    assetKey: 'a_chicken',
    imageUri: 'https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg',
    soundAssets: [
      require('../assets/sounds/animals/bird-2.wav'),
      require('../assets/sounds/animals/bird-3.wav'),
      require('../assets/sounds/animals/bird.wav'),
    ],
  },
];

export const SOUND_VOLUMES = {
  background: 0.12,
  tap:        0.4,
  flip:       0.42,
  match:      0.5,
  wrong:      0.45,
  pick:       0.42,
  place:      0.5,
  win:        0.5,
  navigate:   0.38,
  themeSelect: 0.45,
  levelSelect: 0.48,
  star1:      0.35,
  star2:      0.38,
  star3:      0.42,
  combo:      0.6,
};

export const LETTER_SOUND_ASSETS = {
  u0041: require('../assets/sounds/letters/u0041.mp3'),
  u0102: require('../assets/sounds/letters/u0102.mp3'),
  u00c2: require('../assets/sounds/letters/u00c2.mp3'),
  u0042: require('../assets/sounds/letters/u0042.mp3'),
  u0043: require('../assets/sounds/letters/u0043.mp3'),
  u0044: require('../assets/sounds/letters/u0044.mp3'),
  u0110: require('../assets/sounds/letters/u0110.mp3'),
  u0045: require('../assets/sounds/letters/u0045.mp3'),
  u00ca: require('../assets/sounds/letters/u00ca.mp3'),
  u0047: require('../assets/sounds/letters/u0047.mp3'),
  u0048: require('../assets/sounds/letters/u0048.mp3'),
  u0049: require('../assets/sounds/letters/u0049.mp3'),
  u004b: require('../assets/sounds/letters/u004b.mp3'),
  u004c: require('../assets/sounds/letters/u004c.mp3'),
  u004d: require('../assets/sounds/letters/u004d.mp3'),
  u004e: require('../assets/sounds/letters/u004e.mp3'),
  u004f: require('../assets/sounds/letters/u004f.mp3'),
  u00d4: require('../assets/sounds/letters/u00d4.mp3'),
  u01a0: require('../assets/sounds/letters/u01a0.mp3'),
  u0050: require('../assets/sounds/letters/u0050.mp3'),
  u0051: require('../assets/sounds/letters/u0051.mp3'),
  u0052: require('../assets/sounds/letters/u0052.mp3'),
  u0053: require('../assets/sounds/letters/u0053.mp3'),
  u0054: require('../assets/sounds/letters/u0054.mp3'),
  u0055: require('../assets/sounds/letters/u0055.mp3'),
  u01af: require('../assets/sounds/letters/u01af.mp3'),
  u0056: require('../assets/sounds/letters/u0056.mp3'),
  u0058: require('../assets/sounds/letters/u0058.mp3'),
  u0059: require('../assets/sounds/letters/u0059.mp3'),
};

// ── Level system ──
export const CONFETTI_ASSETS = ['a_egg', 'a_egg', 'a_egg', 'a_strawberry', 'a_strawberry', 'a_strawberry', 'a_corn'];
export const LEVEL_TIERS = ['easy', 'medium', 'hard', 'expert', 'master'];
export const MAX_SUB_LEVELS = 3;
export const RELEASED_SUB_LEVELS = 2;

export const makeLevelKey = (tier, subLevel) => `${tier}-${subLevel}`;

export const getReleasedLevelConfigs = (configs) =>
  configs
    .filter((level) => LEVEL_TIERS.includes(level.tier))
    .filter((level) => level.subLevel >= 1 && level.subLevel <= MAX_SUB_LEVELS)
    .filter((level) => level.subLevel <= RELEASED_SUB_LEVELS)
    .sort((a, b) => LEVEL_TIERS.indexOf(a.tier) - LEVEL_TIERS.indexOf(b.tier) || a.subLevel - b.subLevel);

export const getTierLabel = (tier) => {
  switch (tier) {
    case 'easy':   return 'Dễ';
    case 'medium': return 'Vừa';
    case 'hard':   return 'Khó';
    case 'expert': return 'Chuyên gia';
    case 'master': return 'Bậc thầy';
    default:       return tier;
  }
};

// ── Vietnamese alphabet ──
export const VIETNAMESE_ALPHABET = [
  { letter: 'A',  assetKey: 'a_wool',  word: 'Áo' },
  { letter: 'Ă',  assetKey: 'a_corn',  word: 'Ăn cơm' },
  { letter: 'Â',  assetKey: 'a_corn',  word: 'Âm nhạc' },
  { letter: 'B',  assetKey: 'a_corn',  word: 'Bướm' },
  { letter: 'C',  assetKey: 'a_duck',  word: 'Cá' },
  { letter: 'D',  assetKey: 'a_strawberry',  word: 'Dưa hấu' },
  { letter: 'Đ',  assetKey: 'a_egg',  word: 'Đèn' },
  { letter: 'E',  assetKey: 'a_chicken',  word: 'Em bé' },
  { letter: 'Ê',  assetKey: 'a_duck',  word: 'Ếch' },
  { letter: 'G',  assetKey: 'a_chicken', word: 'Gà' },
  { letter: 'H',  assetKey: 'a_strawberry',  word: 'Hoa' },
  { letter: 'I',  assetKey: 'a_egg',  word: 'Im lặng' },
  { letter: 'K',  assetKey: 'a_strawberry',  word: 'Kẹo' },
  { letter: 'L',  assetKey: 'a_corn',  word: 'Lá' },
  { letter: 'M',  assetKey: 'a_sheep',  word: 'Mèo' },
  { letter: 'N',  assetKey: 'a_horse',  word: 'Nai' },
  { letter: 'O',  assetKey: 'a_corn',  word: 'Ong' },
  { letter: 'Ô',  assetKey: 'a_horse',  word: 'Ô tô' },
  { letter: 'Ơ',  assetKey: 'a_tomato', word: 'Ớt' },
  { letter: 'P',  assetKey: 'a_egg',  word: 'Pin' },
  { letter: 'Q',  assetKey: 'a_carrot',  word: 'Quả cam' },
  { letter: 'R',  assetKey: 'a_corn',  word: 'Rắn' },
  { letter: 'S',  assetKey: 'a_egg',  word: 'Sao' },
  { letter: 'T',  assetKey: 'a_strawberry',  word: 'Táo' },
  { letter: 'U',  assetKey: 'a_milk',  word: 'Uống nước' },
  { letter: 'Ư',  assetKey: 'a_milk',  word: 'Ướt' },
  { letter: 'V',  assetKey: 'a_duck', word: 'Vịt' },
  { letter: 'X',  assetKey: 'a_carrot',  word: 'Xoài' },
  { letter: 'Y',  assetKey: 'a_strawberry',  word: 'Yêu thương' },
];

// ── Theme/level colours ──
export const THEME_COLORS = {
  animals:  { bg: '#FFE8C4', accent: '#EA580C', border: '#FDBA74' },
  fruits:   { bg: '#FFD6F4', accent: '#DB2777', border: '#F472B6' },
  vehicles: { bg: '#D4ECFF', accent: '#0284C7', border: '#38BDF8' },
};

export const THEME_GRADIENTS = {
  animals:  ['#F97316', '#FACC15'],
  fruits:   ['#EC4899', '#A855F7'],
  vehicles: ['#0EA5E9', '#14F195'],
};

export const LEVEL_CONFIG = {
  easy:   { color: '#059669', bg: '#D1FAE5', starCount: 1, desc: 'Khởi động nhẹ nhàng' },
  medium: { color: '#EA580C', bg: '#FFEDD5', starCount: 2, desc: 'Tăng số lượng và nhịp độ' },
  hard:   { color: '#E11D48', bg: '#FFE4E9', starCount: 3, desc: 'Nhiều thẻ và ít sai sót' },
  expert: { color: '#9333EA', bg: '#F3E8FF', starCount: 4, desc: 'Mật độ cao, phản xạ nhanh' },
  master: { color: '#2563EB', bg: '#DBEAFE', starCount: 5, desc: 'Thử thách tối đa' },
};

export const MEMORY_LEVELS = [
  { key: makeLevelKey('easy', 1),   tier: 'easy',   subLevel: 1, pairs: 2,  cols: 2 },
  { key: makeLevelKey('easy', 2),   tier: 'easy',   subLevel: 2, pairs: 3,  cols: 3 },
  { key: makeLevelKey('easy', 3),   tier: 'easy',   subLevel: 3, pairs: 4,  cols: 3 },
  { key: makeLevelKey('medium', 1), tier: 'medium', subLevel: 1, pairs: 4,  cols: 3 },
  { key: makeLevelKey('medium', 2), tier: 'medium', subLevel: 2, pairs: 5,  cols: 4 },
  { key: makeLevelKey('medium', 3), tier: 'medium', subLevel: 3, pairs: 5,  cols: 4 },
  { key: makeLevelKey('hard', 1),   tier: 'hard',   subLevel: 1, pairs: 6,  cols: 4 },
  { key: makeLevelKey('hard', 2),   tier: 'hard',   subLevel: 2, pairs: 6,  cols: 4 },
  { key: makeLevelKey('hard', 3),   tier: 'hard',   subLevel: 3, pairs: 7,  cols: 4 },
  { key: makeLevelKey('expert', 1), tier: 'expert', subLevel: 1, pairs: 7,  cols: 4 },
  { key: makeLevelKey('expert', 2), tier: 'expert', subLevel: 2, pairs: 8,  cols: 4 },
  { key: makeLevelKey('expert', 3), tier: 'expert', subLevel: 3, pairs: 8,  cols: 4 },
  { key: makeLevelKey('master', 1), tier: 'master', subLevel: 1, pairs: 8,  cols: 4 },
  { key: makeLevelKey('master', 2), tier: 'master', subLevel: 2, pairs: 9,  cols: 4 },
  { key: makeLevelKey('master', 3), tier: 'master', subLevel: 3, pairs: 10, cols: 5 },
];

export const PUZZLE_LEVELS = [
  { key: makeLevelKey('easy', 1),   tier: 'easy',   subLevel: 1, maxCount: 3,  optionCount: 3, mistakeBudget: 6, star2MaxWrong: 2 },
  { key: makeLevelKey('easy', 2),   tier: 'easy',   subLevel: 2, maxCount: 4,  optionCount: 3, mistakeBudget: 5, star2MaxWrong: 2 },
  { key: makeLevelKey('easy', 3),   tier: 'easy',   subLevel: 3, maxCount: 4,  optionCount: 4, mistakeBudget: 5, star2MaxWrong: 1 },
  { key: makeLevelKey('medium', 1), tier: 'medium', subLevel: 1, maxCount: 5,  optionCount: 4, mistakeBudget: 4, star2MaxWrong: 1 },
  { key: makeLevelKey('medium', 2), tier: 'medium', subLevel: 2, maxCount: 6,  optionCount: 4, mistakeBudget: 4, star2MaxWrong: 1 },
  { key: makeLevelKey('medium', 3), tier: 'medium', subLevel: 3, maxCount: 6,  optionCount: 5, mistakeBudget: 4, star2MaxWrong: 1 },
  { key: makeLevelKey('hard', 1),   tier: 'hard',   subLevel: 1, maxCount: 7,  optionCount: 5, mistakeBudget: 3, star2MaxWrong: 1 },
  { key: makeLevelKey('hard', 2),   tier: 'hard',   subLevel: 2, maxCount: 8,  optionCount: 5, mistakeBudget: 3, star2MaxWrong: 1 },
  { key: makeLevelKey('hard', 3),   tier: 'hard',   subLevel: 3, maxCount: 8,  optionCount: 6, mistakeBudget: 3, star2MaxWrong: 0 },
  { key: makeLevelKey('expert', 1), tier: 'expert', subLevel: 1, maxCount: 9,  optionCount: 6, mistakeBudget: 3, star2MaxWrong: 0 },
  { key: makeLevelKey('expert', 2), tier: 'expert', subLevel: 2, maxCount: 10, optionCount: 6, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('expert', 3), tier: 'expert', subLevel: 3, maxCount: 10, optionCount: 7, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('master', 1), tier: 'master', subLevel: 1, maxCount: 11, optionCount: 7, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('master', 2), tier: 'master', subLevel: 2, maxCount: 12, optionCount: 7, mistakeBudget: 2, star2MaxWrong: 0 },
  { key: makeLevelKey('master', 3), tier: 'master', subLevel: 3, maxCount: 12, optionCount: 8, mistakeBudget: 2, star2MaxWrong: 0 },
];

// ── Emoji utilities ──
export const toCodePoint = (emoji) =>
  Array.from(emoji)
    .map((char) => char.codePointAt(0).toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');

export const getEmojiImageUri = (emoji) =>
  `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${toCodePoint(emoji)}.png`;

// ── Letter nav card gradients ──
export const LETTER_NAV_GRADIENTS = [
  ['#FB923C', '#FBBF24'],
  ['#F472B6', '#FB923C'],
  ['#60A5FA', '#34D399'],
];
