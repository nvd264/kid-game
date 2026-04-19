import React, { useRef, useImperativeHandle, forwardRef, useCallback, useState } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

const CROP_COLORS = {
  'Cà rốt':   ['#FF8C00', '#FFB347', '#FFD700'],
  'Dâu':      ['#FF4E8C', '#FF6FAB', '#FF1493'],
  'Cà chua':  ['#FF3B30', '#FF6B6B', '#FFD700'],
  'Ngô':      ['#FFD700', '#FFA500', '#FFFACD'],
  'Bông cải': ['#4CAF50', '#81C784', '#A5D6A7'],
  'Cà tím':   ['#9C27B0', '#CE93D8', '#E040FB'],
  'Xà lách':  ['#66BB6A', '#AED581', '#DCEDC8'],
};
const FALLBACK_COLORS = ['#FFD700', '#FF8C00', '#FF4E8C', '#4CAF50', '#60A5FA'];
const COMBO_COLORS    = ['#FFD700', '#FFFFFF', '#FFF176', '#FFFDE7'];
const UNLOCK_COLORS   = ['#81C784', '#FFD700'];

let _pid = 0;

const GardenEffectsCanvas = forwardRef((_, ref) => {
  const [particles, setParticles] = useState([]);

  const spawnBurst = useCallback((cx, cy, colors, count, baseR, spreadRadius, duration) => {
    const newParticles = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const dist  = spreadRadius * (0.6 + Math.random() * 0.7);
      const tx    = Math.cos(angle) * dist;
      const ty    = Math.sin(angle) * dist + dist * 0.3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const r     = baseR + Math.random() * baseR;
      const id    = _pid++;
      const translateX = new Animated.Value(0);
      const translateY = new Animated.Value(0);
      const opacity    = new Animated.Value(1);
      const scale      = new Animated.Value(1);
      const life = duration + Math.random() * (duration * 0.4);

      Animated.parallel([
        Animated.timing(translateX, { toValue: tx,   duration: life, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: ty,   duration: life, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 0,     duration: life, useNativeDriver: true }),
        Animated.timing(scale,     { toValue: 0.1,   duration: life, useNativeDriver: true }),
      ]).start(() => setParticles(prev => prev.filter(p => p.id !== id)));

      return { id, cx, cy, r, color, translateX, translateY, opacity, scale };
    });

    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  useImperativeHandle(ref, () => ({
    emitHarvest(cx, cy, cropName) {
      const palette = CROP_COLORS[cropName] ?? FALLBACK_COLORS;
      spawnBurst(cx, cy, palette, 14, 4, 55, 480);
    },
    emitCombo(centers) {
      centers.forEach((c, i) => {
        if (!c) return;
        setTimeout(() => spawnBurst(c.x, c.y, COMBO_COLORS, 7, 3, 35, 300), i * 55);
      });
    },
    emitUnlock(cx, cy) {
      spawnBurst(cx, cy, UNLOCK_COLORS, 8, 3.5, 38, 400);
    },
  }), [spawnBurst]);

  return (
    <View style={styles.canvas} pointerEvents="none">
      {particles.map(p => (
        <Animated.View
          key={p.id}
          style={[
            styles.dot,
            {
              width: p.r * 2,
              height: p.r * 2,
              borderRadius: p.r,
              backgroundColor: p.color,
              left: p.cx - p.r,
              top: p.cy - p.r,
              opacity: p.opacity,
              transform: [
                { translateX: p.translateX },
                { translateY: p.translateY },
                { scale: p.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
});

export default GardenEffectsCanvas;

const styles = StyleSheet.create({
  canvas: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
  dot: { position: 'absolute' },
});
