import React, { useState, useEffect, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Dimensions, StatusBar, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Audio } from 'expo-av';

// ============ SHARED DATA ============
const themes = {
  animals: {
    name: 'Con vật',
    emoji: '🐾',
    items: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸']
  },
  fruits: {
    name: 'Trái cây',
    emoji: '🍓',
    items: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🥝', '🍑', '🥭', '🍍']
  },
  vehicles: {
    name: 'Phương tiện',
    emoji: '🚗',
    items: ['🚗', '🚕', '🚌', '🚑', '🚒', '🚜', '🚲', '🛵', '✈️', '🚢']
  }
};

const soundAssets = {
  background: require('./assets/sounds/background.wav'),
  tap: require('./assets/sounds/tap.wav'),
  flip: require('./assets/sounds/flip.wav'),
  match: require('./assets/sounds/match.wav'),
  wrong: require('./assets/sounds/wrong.wav'),
  pick: require('./assets/sounds/pick.wav'),
  place: require('./assets/sounds/place.wav'),
  win: require('./assets/sounds/win.wav'),
};

const toCodePoint = (emoji) =>
  Array.from(emoji)
    .map((char) => char.codePointAt(0).toString(16))
    .filter((cp) => cp !== 'fe0f')
    .join('-');

const getEmojiImageUri = (emoji) =>
  `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${toCodePoint(emoji)}.png`;

// Render icon theo ảnh vui nhộn Twemoji, fallback về emoji nếu mạng lỗi
const Icon = ({ value, size }) => {
  const [loadFailed, setLoadFailed] = useState(false);
  if (!loadFailed && value) {
    return (
      <Image
        source={{ uri: getEmojiImageUri(value) }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setLoadFailed(true)}
      />
    );
  }
  return (
    <Text style={{ fontSize: size * 0.85 }}>{value}</Text>
  );
};

// ============ AUDIO MANAGER ============
// Sử dụng expo-av để phát âm thanh
// Sound effects có thể dùng file MP3 ngắn, hoặc tạm thời dùng beep đơn giản
class SoundManager {
  constructor() {
    this.sounds = {};
    this.loaded = false;
  }

  async loadSounds() {
    if (this.loaded) return;
    try {
      // Set audio mode cho iOS
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
      });

      const entries = Object.entries(soundAssets);
      for (const [type, source] of entries) {
        const { sound } = await Audio.Sound.createAsync(source, {
          shouldPlay: type === 'background',
          isLooping: type === 'background',
          volume: type === 'background' ? 0.1 : type === 'win' ? 0.55 : 0.4,
        });
        this.sounds[type] = sound;
      }

      this.loaded = true;
    } catch (error) {
      console.log('Error loading sounds:', error);
    }
  }

  async play(type) {
    const sound = this.sounds[type];
    if (!sound) return;
    try {
      await sound.replayAsync();
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  }

  async unloadSounds() {
    const all = Object.values(this.sounds);
    for (const sound of all) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.log('Error unloading sound:', error);
      }
    }
    this.sounds = {};
    this.loaded = false;
  }
}

const soundManager = new SoundManager();

// Lấy kích thước màn hình
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============================================
// GAME 1: MEMORY MATCH
// ============================================
const MemoryGame = ({ playSound, onExit }) => {
  const levels = {
    easy: { name: 'Dễ', pairs: 2, cols: 2 },
    medium: { name: 'Vừa', pairs: 3, cols: 3 },
    hard: { name: 'Khó', pairs: 4, cols: 4 }
  };

  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [stars, setStars] = useState(0);

  const startGame = (theme, level) => {
    const items = themes[theme].items.slice(0, levels[level].pairs);
    const deck = [...items, ...items]
      .map((item, i) => ({ id: i, value: item }))
      .sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]); setMatched([]); setMoves(0);
    setSelectedTheme(theme); setSelectedLevel(level); setScreen('play');
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2) return;
    if (flipped.includes(index) || matched.includes(index)) return;
    playSound('flip');
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      if (cards[first].value === cards[second].value) {
        setTimeout(() => {
          playSound('match');
          setMatched([...matched, first, second]);
          setFlipped([]);
        }, 600);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  useEffect(() => {
    if (cards.length > 0 && matched.length === cards.length) {
      const pairs = cards.length / 2;
      let s = 1;
      if (moves <= pairs * 1.5) s = 3;
      else if (moves <= pairs * 2) s = 2;
      setStars(s);
      setTimeout(() => { playSound('win'); setScreen('win'); }, 500);
    }
  }, [matched]);

  if (screen === 'theme') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn chủ đề</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.themeGrid}>
          {Object.entries(themes).map(([key, theme]) => (
            <TouchableOpacity key={key} style={styles.themeCard}
              onPress={() => { playSound('tap'); setSelectedTheme(key); setScreen('level'); }}>
              <Text style={{ fontSize: 60 }}>{theme.emoji}</Text>
              <Text style={styles.themeName}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'level') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn độ khó</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.levelList}>
          {Object.entries(levels).map(([key, level]) => (
            <TouchableOpacity key={key} style={styles.levelCard}
              onPress={() => { playSound('tap'); startGame(selectedTheme, key); }}>
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelDesc}>{level.pairs * 2} ô ({level.pairs} cặp thẻ)</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'play') {
    const cols = levels[selectedLevel].cols;
    const cardSize = (SCREEN_WIDTH - 40 - (cols - 1) * 14) / cols;
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <View style={styles.movesBox}>
            <Text style={styles.movesText}>Lượt: {moves}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>
        <Text style={styles.hintText}>Lật 2 thẻ giống nhau để ghi điểm</Text>
        <View style={[styles.gameGrid, { width: SCREEN_WIDTH - 40 }]}>
          {cards.map((card, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            const isMatched = matched.includes(i);
            return (
              <TouchableOpacity key={i}
                style={[
                  styles.card,
                  { width: cardSize, height: cardSize },
                  isFlipped && styles.cardFlipped,
                  isMatched && styles.cardMatched
                ]}
                onPress={() => handleCardClick(i)} disabled={isMatched}>
                {isFlipped ? <Icon value={card.value} size={cardSize * 0.7} /> : <Text style={{ fontSize: cardSize * 0.5 }}>❓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  if (screen === 'win') {
    return (
      <View style={styles.container}>
        <View style={styles.homeCard}>
          <Text style={{ fontSize: 80 }}>🎉</Text>
          <Text style={styles.title}>Giỏi quá!</Text>
          <Text style={{ fontSize: 50, marginVertical: 20 }}>
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </Text>
          <Text style={styles.subtitle}>Bé đã hoàn thành trong {moves} lượt</Text>
          <TouchableOpacity style={styles.bigButton} onPress={() => { playSound('tap'); startGame(selectedTheme, selectedLevel); }}>
            <Text style={styles.bigButtonText}>Chơi lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#64B5F6', marginTop: 10 }]} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.bigButtonText}>Về trang chính</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return null;
};

// ============================================
// GAME 2: FIND DIFFERENCE
// ============================================
const FindDifferenceGame = ({ playSound, onExit }) => {
  const levels = {
    easy: { name: 'Dễ', rows: 2, cols: 2, diffCount: 1 },
    medium: { name: 'Vừa', rows: 2, cols: 3, diffCount: 2 },
    hard: { name: 'Khó', rows: 3, cols: 3, diffCount: 3 }
  };

  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [leftGrid, setLeftGrid] = useState([]);
  const [rightGrid, setRightGrid] = useState([]);
  const [diffPositions, setDiffPositions] = useState([]);
  const [foundDiffs, setFoundDiffs] = useState([]);
  const [wrongTap, setWrongTap] = useState(null);

  const startGame = (theme, level) => {
    const themeItems = themes[theme].items;
    const { rows, cols, diffCount } = levels[level];
    const total = rows * cols;
    const left = Array.from({ length: total }, () =>
      themeItems[Math.floor(Math.random() * themeItems.length)]
    );
    const right = [...left];
    const diffIdxs = [];
    while (diffIdxs.length < diffCount) {
      const idx = Math.floor(Math.random() * total);
      if (!diffIdxs.includes(idx)) {
        let newEmoji;
        do {
          newEmoji = themeItems[Math.floor(Math.random() * themeItems.length)];
        } while (newEmoji === left[idx]);
        right[idx] = newEmoji;
        diffIdxs.push(idx);
      }
    }
    setLeftGrid(left); setRightGrid(right);
    setDiffPositions(diffIdxs); setFoundDiffs([]); setWrongTap(null);
    setSelectedTheme(theme); setSelectedLevel(level); setScreen('play');
  };

  const handleTap = (index) => {
    if (foundDiffs.includes(index)) return;
    if (diffPositions.includes(index)) {
      playSound('match');
      setFoundDiffs([...foundDiffs, index]);
    } else {
      playSound('wrong');
      setWrongTap(index);
      setTimeout(() => setWrongTap(null), 400);
    }
  };

  useEffect(() => {
    if (diffPositions.length > 0 && foundDiffs.length === diffPositions.length) {
      setTimeout(() => { playSound('win'); setScreen('win'); }, 500);
    }
  }, [foundDiffs]);

  if (screen === 'theme') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn chủ đề</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.themeGrid}>
          {Object.entries(themes).map(([key, theme]) => (
            <TouchableOpacity key={key} style={styles.themeCard}
              onPress={() => { playSound('tap'); setSelectedTheme(key); setScreen('level'); }}>
              <Text style={{ fontSize: 60 }}>{theme.emoji}</Text>
              <Text style={styles.themeName}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'level') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn độ khó</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.levelList}>
          {Object.entries(levels).map(([key, level]) => (
            <TouchableOpacity key={key} style={styles.levelCard}
              onPress={() => { playSound('tap'); startGame(selectedTheme, key); }}>
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelDesc}>{level.rows}×{level.cols} ({level.rows * level.cols} ô), tìm {level.diffCount} điểm khác</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'play') {
    const { cols, diffCount } = levels[selectedLevel];
    const remaining = diffCount - foundDiffs.length;
    const boardWidth = Math.min(SCREEN_WIDTH - 40, 360);
    const cellSize = (boardWidth - 16 - (cols - 1) * 4) / cols;

    const renderCell = (emoji, index, isClickable) => {
      const isFound = foundDiffs.includes(index);
      const isWrong = wrongTap === index;
      return (
        <TouchableOpacity key={index}
          onPress={() => isClickable && handleTap(index)}
          disabled={!isClickable}
          style={[
            styles.diffCell,
            { width: cellSize, height: cellSize },
            isFound && { backgroundColor: '#A5D6A7' },
            isWrong && { backgroundColor: '#EF9A9A' }
          ]}>
          <Icon value={emoji} size={cellSize * 0.75} />
          {isFound && <View style={[styles.foundBorder, { borderRadius: 8 }]} />}
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <View style={styles.movesBox}>
            <Text style={styles.movesText}>Còn {remaining} điểm</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>
        <Text style={styles.hintText}>Tìm các ô khác nhau bên dưới</Text>

        <ScrollView contentContainerStyle={{ alignItems: 'center', paddingBottom: 20 }}>
          <View style={{ alignItems: 'center', marginBottom: 15 }}>
            <Text style={styles.boardLabel}>BẢN GỐC</Text>
            <View style={[styles.boardGrid, { width: boardWidth }]}>
              {leftGrid.map((emoji, i) => renderCell(emoji, i, false))}
            </View>
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={styles.boardLabel}>TÌM KHÁC Ở ĐÂY</Text>
            <View style={[styles.boardGrid, { width: boardWidth }]}>
              {rightGrid.map((emoji, i) => renderCell(emoji, i, true))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (screen === 'win') {
    return (
      <View style={styles.container}>
        <View style={styles.homeCard}>
          <Text style={{ fontSize: 80 }}>🎉</Text>
          <Text style={styles.title}>Thông minh quá!</Text>
          <Text style={styles.subtitle}>Bé đã tìm hết các điểm khác</Text>
          <TouchableOpacity style={styles.bigButton} onPress={() => { playSound('tap'); startGame(selectedTheme, selectedLevel); }}>
            <Text style={styles.bigButtonText}>Chơi lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#64B5F6', marginTop: 10 }]} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.bigButtonText}>Về trang chính</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return null;
};

// --- Puzzle: tọa độ màn hình → ô (khớp padding + gap của bảng) ---
function puzzleScreenToSlot(absX, absY, g) {
  if (!g) return null;
  const { wx, wy, width, height, padding, gap, slotSize, rows, cols } = g;
  const lx = absX - wx - padding;
  const ly = absY - wy - padding;
  const innerW = width - 2 * padding;
  const innerH = height - 2 * padding;
  const margin = 48;
  if (lx < -margin || ly < -margin || lx > innerW + margin || ly > innerH + margin) {
    return null;
  }
  const cx = Math.max(0, Math.min(innerW - 1e-6, lx));
  const cy = Math.max(0, Math.min(innerH - 1e-6, ly));
  const col = Math.min(cols - 1, Math.floor(cx / (slotSize + gap)));
  const row = Math.min(rows - 1, Math.floor(cy / (slotSize + gap)));
  return row * cols + col;
}

const PuzzleDraggablePiece = React.memo(function PuzzleDraggablePiece({
  pieceIndex,
  trayPieceSize,
  renderPiece,
  isDragging,
  disabled,
  onDragStart,
  onDropAtScreen,
}) {
  const tx = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(0)).current;

  const onGestureEvent = useMemo(
    () =>
      Animated.event([{ nativeEvent: { translationX: tx, translationY: ty } }], {
        useNativeDriver: false,
      }),
    [tx, ty]
  );

  const handleStateChange = useCallback(
    (e) => {
      const { state, oldState, absoluteX, absoluteY } = e.nativeEvent;
      if (state === State.BEGAN) {
        onDragStart(pieceIndex);
      }
      if (oldState === State.ACTIVE && (state === State.END || state === State.CANCELLED)) {
        onDropAtScreen(pieceIndex, absoluteX, absoluteY);
        Animated.parallel([
          Animated.spring(tx, { toValue: 0, useNativeDriver: false, bounciness: 6, speed: 18 }),
          Animated.spring(ty, { toValue: 0, useNativeDriver: false, bounciness: 6, speed: 18 }),
        ]).start();
      }
    },
    [pieceIndex, onDragStart, onDropAtScreen, tx, ty]
  );

  return (
    <PanGestureHandler
      enabled={!disabled}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={handleStateChange}
    >
      <Animated.View
        style={[
          styles.puzzlePieceDraggableWrap,
          {
            transform: [{ translateX: tx }, { translateY: ty }],
            zIndex: isDragging ? 50 : 2,
            elevation: isDragging ? 14 : 3,
            opacity: disabled ? 0.65 : 1,
          },
        ]}>
        {renderPiece(pieceIndex, trayPieceSize, isDragging)}
      </Animated.View>
    </PanGestureHandler>
  );
});

// ============================================
// GAME 3: PUZZLE (react-native-gesture-handler + RN Animated)
// ============================================
const PuzzleGame = ({ playSound, onExit }) => {
  const levels = {
    easy: { name: 'Dễ', rows: 2, cols: 2 },
    medium: { name: 'Vừa', rows: 2, cols: 3 },
    hard: { name: 'Khó', rows: 3, cols: 3 }
  };

  const [screen, setScreen] = useState('theme');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedEmoji, setSelectedEmoji] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [placed, setPlaced] = useState({});
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [boardLaidOut, setBoardLaidOut] = useState(false);
  const boardViewRef = useRef(null);
  const boardGeomRef = useRef(null);
  const placedRef = useRef({});

  const startGame = (theme, level) => {
    const themeItems = themes[theme].items;
    const emoji = themeItems[Math.floor(Math.random() * themeItems.length)];
    const { rows, cols } = levels[level];
    const totalPieces = rows * cols;
    const shuffled = Array.from({ length: totalPieces }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    setSelectedEmoji(emoji); setPieces(shuffled); setPlaced({});
    setDraggingPiece(null);
    setBoardLaidOut(false);
    boardGeomRef.current = null;
    placedRef.current = {};
    setSelectedTheme(theme); setSelectedLevel(level); setScreen('play');
  };

  useEffect(() => {
    placedRef.current = placed;
  }, [placed]);

  const refreshBoardGeometry = useCallback(() => {
    if (screen !== 'play' || !selectedLevel) return;
    const { rows, cols } = levels[selectedLevel];
    const boardWidth = Math.min(SCREEN_WIDTH - 40, 320);
    const boardPadding = 8;
    const slotGap = 6;
    const slotSize = (boardWidth - boardPadding * 2 - slotGap * (cols - 1)) / cols;
    requestAnimationFrame(() => {
      boardViewRef.current?.measureInWindow((wx, wy, w, h) => {
        boardGeomRef.current = {
          wx,
          wy,
          width: w,
          height: h,
          padding: boardPadding,
          gap: slotGap,
          slotSize,
          rows,
          cols,
        };
        setBoardLaidOut(true);
      });
    });
  }, [screen, selectedLevel]);

  useLayoutEffect(() => {
    if (screen !== 'play') return;
    const id = requestAnimationFrame(() => refreshBoardGeometry());
    return () => cancelAnimationFrame(id);
  }, [screen, selectedLevel, pieces.length, placed, refreshBoardGeometry]);

  useEffect(() => {
    if (screen !== 'play') return;
    if (pieces.length === 0) setDraggingPiece(null);
  }, [pieces, screen]);

  const handlePuzzleDragStart = useCallback((pieceIndex) => {
    playSound('pick');
    setDraggingPiece(pieceIndex);
    refreshBoardGeometry();
  }, [playSound, refreshBoardGeometry]);

  const handlePuzzleDropAtScreen = useCallback((pieceIndex, absX, absY) => {
    setDraggingPiece(null);
    const slot = puzzleScreenToSlot(absX, absY, boardGeomRef.current);
    if (slot === null || placedRef.current[slot] !== undefined) {
      playSound('wrong');
      return;
    }
    if (slot === pieceIndex) {
      playSound('place');
      setPlaced((prev) => ({ ...prev, [slot]: pieceIndex }));
      setPieces((prev) => prev.filter((p) => p !== pieceIndex));
    } else {
      playSound('wrong');
    }
  }, [playSound]);

  const handleBoardLayout = () => {
    refreshBoardGeometry();
  };

  useEffect(() => {
    const total = selectedLevel ? levels[selectedLevel].rows * levels[selectedLevel].cols : 0;
    if (total > 0 && Object.keys(placed).length === total) {
      setTimeout(() => { playSound('win'); setScreen('win'); }, 500);
    }
  }, [placed]);

  if (screen === 'theme') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn chủ đề</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.themeGrid}>
          {Object.entries(themes).map(([key, theme]) => (
            <TouchableOpacity key={key} style={styles.themeCard}
              onPress={() => { playSound('tap'); setSelectedTheme(key); setScreen('level'); }}>
              <Text style={{ fontSize: 60 }}>{theme.emoji}</Text>
              <Text style={styles.themeName}>{theme.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'level') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); setScreen('theme'); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn độ khó</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView style={{ width: '100%' }} contentContainerStyle={styles.levelList}>
          {Object.entries(levels).map(([key, level]) => (
            <TouchableOpacity key={key} style={styles.levelCard}
              onPress={() => { playSound('tap'); startGame(selectedTheme, key); }}>
              <Text style={styles.levelName}>{level.name}</Text>
              <Text style={styles.levelDesc}>{level.rows}×{level.cols} = {level.rows * level.cols} mảnh</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (screen === 'play') {
    const { rows, cols } = levels[selectedLevel];
    const totalSlots = rows * cols;
    const boardWidth = Math.min(SCREEN_WIDTH - 40, 320);
    const boardPadding = 8;
    const slotGap = 6;
    const slotSize = (boardWidth - boardPadding * 2 - slotGap * (cols - 1)) / cols;
    const boardHeight = boardPadding * 2 + slotSize * rows + slotGap * (rows - 1);
    const trayPieceSize = Math.max(52, Math.min(66, slotSize * 0.76));

    const renderPiece = (correctIndex, size, isDragging) => {
      return (
        <View style={[
          styles.puzzlePiece,
          {
            width: size,
            height: size,
            borderColor: isDragging ? '#FFD54F' : '#D8E2EE',
            borderWidth: isDragging ? 4 : 2,
          }
        ]}>
          <Icon value={selectedEmoji} size={size * 0.62} />
          <View style={styles.puzzlePieceBadge}>
            <Text style={styles.puzzlePieceBadgeText}>{correctIndex + 1}</Text>
          </View>
        </View>
      );
    };

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => { playSound('tap'); setScreen('level'); }}>
            <Text style={styles.backButtonText}>← Về</Text>
          </TouchableOpacity>
          <View style={styles.movesBox}>
            <Text style={styles.movesText}>Còn: {pieces.length}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.puzzlePlayContent}>
          <View style={styles.puzzleGuideCard}>
            <Text style={styles.puzzleGuideTitle}>Kéo thả mảnh vào đúng số</Text>
            <Text style={styles.puzzleGuideDesc}>
              Bé giữ mảnh ở khay dưới, kéo lên ô cùng số trên bảng ghép
            </Text>
          </View>

          <View style={styles.puzzleBoardShell} onLayout={handleBoardLayout}>
            <View
              ref={boardViewRef}
              collapsable={false}
              style={[styles.puzzleBoard, { width: boardWidth, height: boardHeight, padding: boardPadding, gap: slotGap }]}>
              {Array.from({ length: totalSlots }).map((_, slotIndex) => {
                const pieceInSlot = placed[slotIndex];
                const hasPiece = pieceInSlot !== undefined;
                return (
                  <View
                    key={slotIndex}
                    style={[
                      styles.puzzleSlot,
                      {
                        width: slotSize,
                        height: slotSize,
                        backgroundColor: hasPiece ? 'transparent' : '#FFF8E8',
                      }
                    ]}>
                    {hasPiece ? (
                      <View style={[styles.puzzlePlacedPiece, { width: slotSize, height: slotSize }]}>
                        <Icon value={selectedEmoji} size={slotSize * 0.56} />
                        <View style={styles.puzzlePieceBadge}>
                          <Text style={styles.puzzlePieceBadgeText}>{pieceInSlot + 1}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.puzzleSlotHintText}>{slotIndex + 1}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.puzzleTray}>
            <Text style={styles.puzzleTrayTitle}>Kéo từ khay này</Text>
            <View style={styles.puzzleTrayGrid}>
              {pieces.map((correctIdx) => (
                <PuzzleDraggablePiece
                  key={correctIdx}
                  pieceIndex={correctIdx}
                  trayPieceSize={trayPieceSize}
                  renderPiece={renderPiece}
                  isDragging={draggingPiece === correctIdx}
                  disabled={!boardLaidOut}
                  onDragStart={handlePuzzleDragStart}
                  onDropAtScreen={handlePuzzleDropAtScreen}
                />
              ))}
            </View>
            {!boardLaidOut && (
              <Text style={styles.puzzleMeasureText}>Đang chuẩn bị vùng thả...</Text>
            )}
          </View>
        </View>
      </View>
    );
  }

  if (screen === 'win') {
    return (
      <View style={styles.container}>
        <View style={styles.homeCard}>
          <Text style={{ fontSize: 80 }}>🎉</Text>
          <Text style={styles.title}>Tuyệt vời!</Text>
          <Text style={{ fontSize: 100, marginVertical: 20 }}>{selectedEmoji}</Text>
          <Text style={styles.subtitle}>Bé đã ghép xong hình</Text>
          <TouchableOpacity style={styles.bigButton} onPress={() => { playSound('tap'); startGame(selectedTheme, selectedLevel); }}>
            <Text style={styles.bigButtonText}>Chơi lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#64B5F6', marginTop: 10 }]} onPress={() => { playSound('tap'); onExit(); }}>
            <Text style={styles.bigButtonText}>Về trang chính</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return null;
};

// ============================================
// MAIN APP (HOME)
// ============================================
export default function App() {
  const [screen, setScreen] = useState('home');
  const [currentGame, setCurrentGame] = useState(null);

  useEffect(() => {
    soundManager.loadSounds();
    return () => {
      soundManager.unloadSounds();
    };
  }, []);

  const playSound = (type) => {
    soundManager.play(type);
  };

  const handleGameSelect = (game) => {
    playSound('tap');
    setCurrentGame(game);
    setScreen('game');
  };

  const handleExit = () => {
    playSound('tap');
    setScreen('home');
  };

  if (screen === 'game') {
    if (currentGame === 'memory') return <MemoryGame playSound={playSound} onExit={handleExit} />;
    if (currentGame === 'puzzle') return <PuzzleGame playSound={playSound} onExit={handleExit} />;
    if (currentGame === 'finddiff') return <FindDifferenceGame playSound={playSound} onExit={handleExit} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.bgBubbleOne} />
      <View style={styles.bgBubbleTwo} />
      <View style={styles.bgBubbleThree} />
      <View style={styles.homeCard}>
        <Text style={{ fontSize: 80, marginBottom: 6 }}>🎮</Text>
        <Text style={styles.title}>Bé Học Vui</Text>
        <Text style={styles.subtitle}>3 mini game vui nhộn cho bé</Text>
        <View style={styles.tipBadge}>
          <Text style={styles.tipBadgeText}>Chạm vào trò bé muốn chơi</Text>
        </View>

        <TouchableOpacity style={styles.gameButton} onPress={() => handleGameSelect('memory')}>
          <Text style={{ fontSize: 48 }}>🃏</Text>
          <View>
            <Text style={styles.gameButtonText}>Tìm Cặp</Text>
            <Text style={styles.gameButtonSubText}>Rèn trí nhớ nhanh</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gameButton, { backgroundColor: '#45B25F' }]} onPress={() => handleGameSelect('puzzle')}>
          <Text style={{ fontSize: 48 }}>🧩</Text>
          <View>
            <Text style={styles.gameButtonText}>Ghép Hình</Text>
            <Text style={styles.gameButtonSubText}>Rèn tư duy logic</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.gameButton, { backgroundColor: '#9060D8' }]} onPress={() => handleGameSelect('finddiff')}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <View>
            <Text style={styles.gameButtonText}>Tìm Khác</Text>
            <Text style={styles.gameButtonSubText}>Rèn quan sát tinh mắt</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF996F',
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgBubbleOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.16)',
    top: -60,
    right: -60,
  },
  bgBubbleTwo: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.15)',
    bottom: 40,
    left: -60,
  },
  bgBubbleThree: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    top: 200,
    left: 20,
  },
  homeCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 32,
    padding: 30,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    marginTop: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  title: { fontSize: 36, fontWeight: '800', color: '#FF6B35', marginTop: 4 },
  subtitle: { fontSize: 18, color: '#555', marginTop: 10, marginBottom: 12, textAlign: 'center' },
  tipBadge: {
    backgroundColor: '#FFF4DF',
    borderColor: '#FFD38F',
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 6,
  },
  tipBadgeText: { color: '#B86A00', fontSize: 14, fontWeight: '700' },
  bigButton: {
    backgroundColor: '#FF6B35', paddingVertical: 16, paddingHorizontal: 32,
    borderRadius: 20, width: '100%', alignItems: 'center', elevation: 2,
  },
  bigButtonText: { color: 'white', fontSize: 20, fontWeight: '700' },
  gameButton: {
    backgroundColor: '#FF6B35', padding: 18, borderRadius: 20, width: '100%',
    marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 14,
  },
  gameButtonText: { color: 'white', fontSize: 22, fontWeight: '800' },
  gameButtonSubText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2, fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    width: '100%', maxWidth: 500, paddingVertical: 10, marginBottom: 10, zIndex: 2,
  },
  backButton: {
    backgroundColor: 'white', paddingVertical: 9, paddingHorizontal: 16, borderRadius: 15,
  },
  backButtonText: { color: '#FF6B35', fontSize: 16, fontWeight: '600' },
  headerTitle: {
    color: 'white', fontSize: 22, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 2,
  },
  themeGrid: {
    alignItems: 'center', paddingBottom: 20, gap: 15, width: '100%',
  },
  themeCard: {
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 25, padding: 26,
    alignItems: 'center', width: '100%', maxWidth: 400, gap: 10,
  },
  themeName: { fontSize: 22, fontWeight: '700', color: '#2F2F2F' },
  levelList: {
    alignItems: 'center', paddingBottom: 20, gap: 15, width: '100%',
  },
  levelCard: {
    backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 25, padding: 24,
    width: '100%', maxWidth: 400,
  },
  levelName: { fontSize: 26, fontWeight: '800', color: '#FF6B35' },
  levelDesc: { fontSize: 16, color: '#666', marginTop: 5 },
  movesBox: {
    backgroundColor: 'white', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 15, minWidth: 126,
  },
  movesText: { fontSize: 16, fontWeight: '700', color: '#FF6B35' },
  gameGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14,
    marginTop: 10, zIndex: 2,
  },
  card: {
    backgroundColor: 'white', borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', elevation: 2,
  },
  cardFlipped: { backgroundColor: '#FFF3E0' },
  cardMatched: { backgroundColor: '#C8E6C9', opacity: 0.85 },
  hintText: {
    color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 10, textAlign: 'center',
  },
  puzzleGuideCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  puzzleGuideTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
    textAlign: 'center',
  },
  puzzleGuideDesc: {
    marginTop: 4,
    fontSize: 13,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 18,
  },
  puzzlePlayContent: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 14,
    flex: 1,
  },
  puzzleBoardShell: {
    width: '100%',
    alignItems: 'center',
  },
  puzzleBoard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  puzzleSlot: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#FFD18B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzlePlacedPiece: {
    backgroundColor: '#DDF6DF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  puzzleSlotHintText: {
    color: '#B6B6B6',
    fontSize: 12,
    fontWeight: '700',
  },
  puzzleTray: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  puzzleTrayTitle: {
    textAlign: 'center',
    color: '#5A6470',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  puzzleTrayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    minHeight: 70,
  },
  puzzleMeasureText: {
    marginTop: 8,
    textAlign: 'center',
    color: '#8390A2',
    fontSize: 12,
    fontWeight: '600',
  },
  puzzlePieceDraggableWrap: {
    borderRadius: 12,
  },
  puzzlePiece: {
    borderRadius: 10,
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  puzzlePieceBadge: {
    position: 'absolute',
    top: 2,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  puzzlePieceBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  boardLabel: {
    color: 'white', fontSize: 14, fontWeight: '800', marginBottom: 5,
  },
  boardGrid: {
    flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(255,255,255,0.97)',
    padding: 8, borderRadius: 12, gap: 4,
  },
  diffCell: {
    backgroundColor: 'white', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', elevation: 1,
  },
  foundBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 3, borderColor: '#2E7D32',
  },
});