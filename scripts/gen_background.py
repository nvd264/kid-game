"""Generate cheerful kid-friendly background loop (seamless + crossfade)."""
import math
import struct
import wave
from pathlib import Path

sr = 44100
dur = 4.0
N = int(sr * dur)


def hz(k: int) -> float:
    return k / dur


# 16 steps per loop: bouncy pentatonic outline (C-E-G-E...)
notes_k = [
    2092, 2636, 3136, 3136, 2636, 2348, 2092, 2636,
    2092, 2348, 3136, 2636, 2348, 2092, 2636, 2092,
]
steps = len(notes_k)
step_len = dur / steps

pad_ks = [1046, 1316, 1568, 2092]
pad_amp = [0.055, 0.04, 0.035, 0.03]

samples = [0.0] * N

for i in range(N):
    t = i / sr
    s = 0.0
    for pk, pa in zip(pad_ks, pad_amp):
        s += pa * math.sin(2 * math.pi * hz(pk) * t)
    s *= 0.82 + 0.18 * math.sin(2 * math.pi * t / dur)
    samples[i] = s

for si in range(steps):
    f = hz(notes_k[si])
    t0 = si * step_len
    t1 = t0 + step_len
    for i in range(N):
        t = i / sr
        if t < t0 or t >= t1:
            continue
        u = (t - t0) / step_len
        env = math.sin(math.pi * u) ** 1.15
        samples[i] += 0.22 * env * math.sin(2 * math.pi * f * t)

for i in range(N):
    t = i / sr
    samples[i] += 0.028 * math.sin(2 * math.pi * hz(3520) * t) * (
        0.75 + 0.25 * math.sin(2 * math.pi * 8 * t / dur)
    )

for i in range(N):
    x = samples[i]
    samples[i] = x / (1.0 + abs(x) * 1.35)

peak = max(abs(x) for x in samples) or 1.0
samples = [x * 0.42 / peak for x in samples]

xf = 512
out_samples = samples[:]
for i in range(xf):
    w = i / (xf - 1) if xf > 1 else 1.0
    a = out_samples[i]
    b = out_samples[N - xf + i]
    out_samples[i] = a * w + b * (1 - w)
    out_samples[N - xf + i] = b * w + a * (1 - w)

root = Path(__file__).resolve().parents[1]
out_path = root / "assets" / "sounds" / "background.wav"
out_path.parent.mkdir(parents=True, exist_ok=True)

with wave.open(str(out_path), "wb") as wf:
    wf.setnchannels(1)
    wf.setsampwidth(2)
    wf.setframerate(sr)
    wf.writeframes(
        b"".join(
            struct.pack("<h", int(max(-32767, min(32767, s * 32767))))
            for s in out_samples
        )
    )

print("wrote", out_path, out_path.stat().st_size, "bytes")
