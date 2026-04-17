"""Generate all kid-friendly sound effects + improved background loop."""
import math
import struct
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOUNDS = ROOT / "assets" / "sounds"
SOUNDS.mkdir(parents=True, exist_ok=True)

SR = 44100


def write_wav(name, samples, sr=SR):
    path = SOUNDS / name
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(
            b"".join(
                struct.pack("<h", int(max(-32767, min(32767, s * 32767))))
                for s in samples
            )
        )
    print(f"wrote {path.name:24s} {path.stat().st_size:>7} bytes")


def sine(t, freq):
    return math.sin(2 * math.pi * freq * t)


def adsr(t, dur, attack=0.01, decay=0.05, sustain=0.7, release=0.15):
    """Return amplitude 0..1 for ADSR envelope."""
    if t < 0 or t > dur:
        return 0.0
    if t < attack:
        return t / attack
    t2 = t - attack
    if t2 < decay:
        return 1.0 - (1.0 - sustain) * (t2 / decay)
    t3 = t - attack - decay
    rel_start = dur - release
    if t >= rel_start:
        return sustain * max(0.0, (dur - t) / release)
    return sustain


def normalize(samples, target=0.85):
    peak = max(abs(s) for s in samples) or 1.0
    return [s * target / peak for s in samples]


def make_tone(freq, dur, amp=0.8, attack=0.01, decay=0.04, sustain=0.65, release=0.12, harmonics=None):
    """Single tone with ADSR envelope and optional harmonics."""
    N = int(SR * dur)
    out = [0.0] * N
    if harmonics is None:
        harmonics = [(1.0, 1.0), (0.4, 2.0), (0.15, 3.0), (0.05, 4.0)]
    for i in range(N):
        t = i / SR
        env = adsr(t, dur, attack, decay, sustain, release)
        s = sum(h_amp * sine(t, freq * h_mult) for h_amp, h_mult in harmonics)
        out[i] = amp * env * s / sum(a for a, _ in harmonics)
    return out


def mix(*tracks):
    length = max(len(t) for t in tracks)
    out = [0.0] * length
    for t in tracks:
        for i, s in enumerate(t):
            out[i] += s
    return out


def reverb(samples, delay_ms=60, decay=0.35, n_echoes=4):
    """Simple comb-filter reverb."""
    delay = int(SR * delay_ms / 1000)
    out = list(samples)
    for k in range(1, n_echoes + 1):
        d = delay * k
        amp = decay ** k
        for i in range(d, len(out)):
            out[i] += samples[i - d] * amp
    return out


# ─────────────────────────────────────────────
# BACKGROUND MUSIC (improved: bassline + vibrato)
# ─────────────────────────────────────────────
def gen_background():
    dur = 4.0
    N = int(SR * dur)

    def hz(k):
        return k / dur

    notes_k = [
        2092, 2636, 3136, 3136, 2636, 2348, 2092, 2636,
        2092, 2348, 3136, 2636, 2348, 2092, 2636, 2092,
    ]
    bass_k = [1046, 784, 1046, 784, 1046, 784, 1046, 784,
               1046, 784, 1046, 784, 1046, 784, 1046, 784]
    steps = len(notes_k)
    step_len = dur / steps
    pad_ks = [1046, 1316, 1568, 2092]
    pad_amp = [0.055, 0.04, 0.035, 0.03]

    samples = [0.0] * N

    # Harmonic pad
    for i in range(N):
        t = i / SR
        s = 0.0
        for pk, pa in zip(pad_ks, pad_amp):
            s += pa * sine(t, hz(pk))
        s *= 0.82 + 0.18 * sine(t, 1.0 / dur)
        samples[i] = s

    # Melody with vibrato
    for si in range(steps):
        f = hz(notes_k[si])
        t0 = si * step_len
        t1 = t0 + step_len
        for i in range(N):
            t = i / SR
            if t < t0 or t >= t1:
                continue
            u = (t - t0) / step_len
            env = math.sin(math.pi * u) ** 1.15
            vibrato = 1.0 + 0.012 * math.sin(2 * math.pi * 5.5 * t)
            samples[i] += 0.20 * env * sine(t, f * vibrato)
            samples[i] += 0.06 * env * sine(t, f * 2.0 * vibrato)

    # Bassline
    for si in range(steps):
        f = hz(bass_k[si]) * 0.5
        t0 = si * step_len
        t1 = t0 + step_len
        for i in range(N):
            t = i / SR
            if t < t0 or t >= t1:
                continue
            u = (t - t0) / step_len
            env = math.sin(math.pi * u) ** 0.8
            samples[i] += 0.07 * env * sine(t, f)

    # Sparkle layer
    for i in range(N):
        t = i / SR
        samples[i] += 0.022 * sine(t, hz(3520)) * (0.75 + 0.25 * sine(t, 8.0 / dur))

    # Soft clip
    for i in range(N):
        x = samples[i]
        samples[i] = x / (1.0 + abs(x) * 1.35)

    samples = normalize(samples, 0.38)

    # Crossfade loop
    xf = 512
    for i in range(xf):
        w = i / (xf - 1) if xf > 1 else 1.0
        a, b = samples[i], samples[N - xf + i]
        samples[i] = a * w + b * (1 - w)
        samples[N - xf + i] = b * w + a * (1 - w)

    write_wav("background.wav", samples)


# ─────────────────────────────────────────────
# FLIP (card turn) — soft swoosh with pitch rise
# ─────────────────────────────────────────────
def gen_flip():
    dur = 0.18
    N = int(SR * dur)
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        u = t / dur
        freq = 400 + 600 * u  # pitch rise 400→1000 Hz
        env = math.sin(math.pi * u) ** 0.7
        noise = ((__import__('random').random() * 2 - 1) * 0.15)
        out[i] = env * (0.55 * sine(t, freq) + noise)
    write_wav("flip.wav", normalize(out, 0.75))


# ─────────────────────────────────────────────
# TAP — crisp xylophone ding
# ─────────────────────────────────────────────
def gen_tap():
    t1 = make_tone(880, 0.14, harmonics=[(1.0, 1.0), (0.5, 2.0), (0.1, 3.0)],
                   attack=0.005, decay=0.04, sustain=0.3, release=0.08)
    write_wav("tap.wav", normalize(t1, 0.72))


# ─────────────────────────────────────────────
# MATCH — cheerful 3-note ascending chime
# ─────────────────────────────────────────────
def gen_match():
    freqs = [523.25, 659.25, 783.99]  # C5-E5-G5
    tracks = []
    for k, f in enumerate(freqs):
        delay = int(SR * k * 0.10)
        tone = make_tone(f, 0.30, attack=0.008, decay=0.05, sustain=0.5, release=0.15)
        padded = [0.0] * delay + tone
        tracks.append(padded)
    out = normalize(mix(*tracks), 0.82)
    write_wav("match.wav", out)


# ─────────────────────────────────────────────
# WRONG — descending "boing" buzz
# ─────────────────────────────────────────────
def gen_wrong():
    dur = 0.28
    N = int(SR * dur)
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        u = t / dur
        freq = 260 - 90 * u
        env = adsr(t, dur, 0.01, 0.05, 0.5, 0.12)
        out[i] = env * (0.6 * sine(t, freq) + 0.3 * sine(t, freq * 1.5) + 0.1 * sine(t, freq * 2.5))
    write_wav("wrong.wav", normalize(out, 0.78))


# ─────────────────────────────────────────────
# PICK — soft "pop" for grabbing puzzle piece
# ─────────────────────────────────────────────
def gen_pick():
    dur = 0.12
    N = int(SR * dur)
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        freq = 700 - 300 * (t / dur)
        env = adsr(t, dur, 0.005, 0.03, 0.4, 0.06)
        out[i] = env * (0.7 * sine(t, freq) + 0.2 * sine(t, freq * 2))
    write_wav("pick.wav", normalize(out, 0.68))


# ─────────────────────────────────────────────
# PLACE — satisfying "click-thud"
# ─────────────────────────────────────────────
def gen_place():
    dur = 0.22
    N = int(SR * dur)
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        freq = 320 + 180 * math.exp(-t * 12)
        env = adsr(t, dur, 0.005, 0.06, 0.4, 0.10)
        out[i] = env * (0.65 * sine(t, freq) + 0.25 * sine(t, freq * 1.5) + 0.1 * sine(t, freq * 3))
    write_wav("place.wav", normalize(out, 0.76))


# ─────────────────────────────────────────────
# WIN — triumphant 5-note fanfare with reverb
# ─────────────────────────────────────────────
def gen_win():
    melody = [
        (523.25, 0.0,  0.18),   # C5
        (659.25, 0.14, 0.18),   # E5
        (783.99, 0.28, 0.18),   # G5
        (1046.5, 0.42, 0.25),   # C6
        (1318.5, 0.60, 0.40),   # E6 long
    ]
    total = 1.2
    N = int(SR * total)
    out = [0.0] * N
    for freq, t_start, dur in melody:
        start = int(SR * t_start)
        tone = make_tone(freq, dur, amp=0.9, attack=0.01, decay=0.06, sustain=0.6, release=0.15,
                         harmonics=[(1.0, 1.0), (0.45, 2.0), (0.15, 3.0)])
        for i, s in enumerate(tone):
            if start + i < N:
                out[start + i] += s
    out = reverb(out, delay_ms=55, decay=0.28, n_echoes=5)
    write_wav("win.wav", normalize(out, 0.88))


# ─────────────────────────────────────────────
# NAVIGATE — soft whoosh for back button
# ─────────────────────────────────────────────
def gen_navigate():
    dur = 0.20
    N = int(SR * dur)
    import random
    rng = random.Random(42)
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        u = t / dur
        env = math.sin(math.pi * u) ** 0.6
        freq = 900 - 500 * u
        out[i] = env * (0.4 * sine(t, freq) + 0.35 * (rng.random() * 2 - 1) * 0.5)
    # Low-pass effect by smoothing
    for i in range(1, N):
        out[i] = out[i] * 0.55 + out[i - 1] * 0.45
    write_wav("navigate.wav", normalize(out, 0.65))


# ─────────────────────────────────────────────
# THEME SELECT — gentle chime ding
# ─────────────────────────────────────────────
def gen_theme_select():
    tone = make_tone(1046.5, 0.22, attack=0.008, decay=0.06, sustain=0.45, release=0.12,
                     harmonics=[(1.0, 1.0), (0.35, 2.0), (0.08, 3.0)])
    write_wav("theme_select.wav", normalize(tone, 0.70))


# ─────────────────────────────────────────────
# LEVEL SELECT — rising 2-note chime
# ─────────────────────────────────────────────
def gen_level_select():
    t1 = make_tone(783.99, 0.18, attack=0.008, decay=0.05, sustain=0.4, release=0.10)
    t2 = make_tone(1046.5, 0.22, attack=0.008, decay=0.05, sustain=0.5, release=0.12)
    delay = int(SR * 0.12)
    padded2 = [0.0] * delay + t2
    out = normalize(mix(t1 + [0.0] * delay, padded2), 0.72)
    write_wav("level_select.wav", out)


# ─────────────────────────────────────────────
# STAR 1/2/3 — sparkle ping (rising pitch)
# ─────────────────────────────────────────────
def gen_star(n):
    """n=1,2,3 → progressively higher sparkle."""
    base = [1046.5, 1318.5, 1567.98][n - 1]
    dur = 0.18
    N = int(SR * dur)
    out = [0.0] * N
    for i in range(N):
        t = i / SR
        u = t / dur
        env = (1.0 - u) ** 0.6 * math.sin(math.pi * u * 0.9) ** 0.5
        freq = base * (1.0 + 0.08 * math.sin(2 * math.pi * 18 * t))
        out[i] = env * (0.7 * sine(t, freq) + 0.2 * sine(t, freq * 2) + 0.1 * sine(t, freq * 3))
    write_wav(f"star{n}.wav", normalize(out, 0.76))


# ─────────────────────────────────────────────
# COMBO — happy ascending arpeggio (3+ correct)
# ─────────────────────────────────────────────
def gen_combo():
    freqs = [523.25, 659.25, 783.99, 1046.5]  # C5-E5-G5-C6
    tracks = []
    for k, f in enumerate(freqs):
        delay = int(SR * k * 0.09)
        tone = make_tone(f, 0.22, attack=0.006, decay=0.04, sustain=0.55, release=0.10,
                         harmonics=[(1.0, 1.0), (0.4, 2.0), (0.1, 3.0)])
        padded = [0.0] * delay + tone
        tracks.append(padded)
    out = normalize(mix(*tracks), 0.84)
    write_wav("combo.wav", out)


if __name__ == "__main__":
    gen_background()
    gen_flip()
    gen_tap()
    gen_match()
    gen_wrong()
    gen_pick()
    gen_place()
    gen_win()
    gen_navigate()
    gen_theme_select()
    gen_level_select()
    for n in (1, 2, 3):
        gen_star(n)
    gen_combo()
    print("All sounds generated.")
