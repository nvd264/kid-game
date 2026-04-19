import React, { useRef, useImperativeHandle, forwardRef, useState, useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';

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

const GRAVITY = 360; // px/s²
let _pid = 0;

function spawn(x, y, vx, vy, r, color, maxLife) {
  return { id: _pid++, x, y, vx, vy, r, color, maxLife, born: Date.now() };
}

const GardenEffectsCanvas = forwardRef((_, ref) => {
  const particlesRef = useRef([]);
  const rafRef = useRef(null);
  const [, setTick] = useState(0);

  const loop = useCallback(() => {
    const now = Date.now();
    particlesRef.current = particlesRef.current.filter(p => now - p.born < p.maxLife);
    setTick(n => n + 1);
    if (particlesRef.current.length > 0) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (!rafRef.current) rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  useImperativeHandle(ref, () => ({
    emitHarvest(cx, cy, cropName) {
      const palette = CROP_COLORS[cropName] ?? FALLBACK_COLORS;
      for (let i = 0; i < 22; i++) {
        const angle = (Math.PI * 2 * i) / 22 + (Math.random() - 0.5) * 0.35;
        const speed = 170 + Math.random() * 150;
        const r     = 3.5 + Math.random() * 4.5;
        const color = palette[Math.floor(Math.random() * palette.length)];
        const life  = 480 + Math.random() * 220;
        particlesRef.current.push(spawn(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, r, color, life));
      }
      startLoop();
    },

    emitCombo(centers) {
      centers.forEach((c, i) => {
        setTimeout(() => {
          if (!c) return;
          for (let j = 0; j < 9; j++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 70;
            const color = COMBO_COLORS[Math.floor(Math.random() * COMBO_COLORS.length)];
            particlesRef.current.push(spawn(
              c.x + (Math.random() - 0.5) * 14,
              c.y + (Math.random() - 0.5) * 14,
              Math.cos(angle) * speed,
              Math.sin(angle) * speed,
              2.5 + Math.random() * 2,
              color,
              260 + Math.random() * 100,
            ));
          }
          startLoop();
        }, i * 55);
      });
    },

    emitUnlock(cx, cy) {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const speed = 85 + Math.random() * 55;
        const color = UNLOCK_COLORS[i % 2];
        particlesRef.current.push(spawn(cx, cy, Math.cos(angle) * speed, Math.sin(angle) * speed, 3.5, color, 370 + Math.random() * 90));
      }
      startLoop();
    },
  }), [startLoop]);

  const now = Date.now();

  return (
    <Canvas style={styles.canvas} pointerEvents="none">
      {particlesRef.current.map(p => {
        const dt       = (now - p.born) / 1000;
        const progress = (now - p.born) / p.maxLife;
        const px       = p.x + p.vx * dt;
        const py       = p.y + p.vy * dt + 0.5 * GRAVITY * dt * dt;
        const r        = Math.max(0, p.r * (1 - progress));
        const alpha    = Math.max(0, 1 - progress);
        return (
          <Group key={p.id} opacity={alpha}>
            <Circle cx={px} cy={py} r={r} color={p.color} />
          </Group>
        );
      })}
    </Canvas>
  );
});

export default GardenEffectsCanvas;

const styles = StyleSheet.create({
  canvas: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
});
