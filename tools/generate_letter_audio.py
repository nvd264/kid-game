#!/usr/bin/env python3
"""Bundled letter MP3s: Piper vi_VN-vais1000-medium from Hugging Face rhasspy/piper-voices + ffmpeg gap."""
import json
import os
import subprocess
import tempfile

# Must match VIETNAMESE_ALPHABET in App.js (letter + word only)
ALPHABET = [
    {"letter": "A", "word": "Áo"},
    {"letter": "Ă", "word": "Ăn cơm"},
    {"letter": "Â", "word": "Âm nhạc"},
    {"letter": "B", "word": "Bướm"},
    {"letter": "C", "word": "Cá"},
    {"letter": "D", "word": "Dưa hấu"},
    {"letter": "Đ", "word": "Đèn"},
    {"letter": "E", "word": "Em bé"},
    {"letter": "Ê", "word": "Ếch"},
    {"letter": "G", "word": "Gà"},
    {"letter": "H", "word": "Hoa"},
    {"letter": "I", "word": "Im lặng"},
    {"letter": "K", "word": "Kẹo"},
    {"letter": "L", "word": "Lá"},
    {"letter": "M", "word": "Mèo"},
    {"letter": "N", "word": "Nai"},
    {"letter": "O", "word": "Ong"},
    {"letter": "Ô", "word": "Ô tô"},
    {"letter": "Ơ", "word": "Ớt"},
    {"letter": "P", "word": "Pin"},
    {"letter": "Q", "word": "Quả cam"},
    {"letter": "R", "word": "Rắn"},
    {"letter": "S", "word": "Sao"},
    {"letter": "T", "word": "Táo"},
    {"letter": "U", "word": "Uống nước"},
    {"letter": "Ư", "word": "Ướt"},
    {"letter": "V", "word": "Vịt"},
    {"letter": "X", "word": "Xoài"},
    {"letter": "Y", "word": "Yêu thương"},
]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, "tools", "piper-vi", "vi_VN-vais1000-medium.onnx")
CONFIG = os.path.join(ROOT, "tools", "piper-vi", "vi_VN-vais1000-medium.onnx.json")
OUT_DIR = os.path.join(ROOT, "assets", "sounds", "letters")
PIPER = os.path.expanduser("~/.local/bin/piper")

PAUSE_SEC = 0.55
LENGTH_SCALE = "1.06"


def run(cmd, **kwargs):
    subprocess.run(cmd, check=True, **kwargs)


def slug(letter: str) -> str:
    return f"u{ord(letter):04x}"


def piper_wav(text: str, out_wav: str) -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".txt") as f:
        f.write(text + "\n")
        txt_path = f.name
    try:
        run(
            [
                PIPER,
                "-m",
                MODEL,
                "-c",
                CONFIG,
                "-i",
                txt_path,
                "-f",
                out_wav,
                "--length-scale",
                LENGTH_SCALE,
            ]
        )
    finally:
        os.unlink(txt_path)


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for item in ALPHABET:
        letter = item["letter"]
        word = item["word"]
        part1 = f"Chữ {letter}."
        base = os.path.join(OUT_DIR, slug(letter))
        w1 = base + "_p1.wav"
        w2 = base + "_p2.wav"
        ws = base + "_gap.wav"
        merged = base + ".wav"
        mp3 = base + ".mp3"

        piper_wav(part1, w1)
        piper_wav(word, w2)
        run(
            [
                "ffmpeg",
                "-y",
                "-f",
                "lavfi",
                "-i",
                f"anullsrc=r=22050:cl=mono:d={PAUSE_SEC}",
                "-acodec",
                "pcm_s16le",
                ws,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                w1,
                "-i",
                ws,
                "-i",
                w2,
                "-filter_complex",
                "[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]",
                "-map",
                "[a]",
                merged,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                merged,
                "-codec:a",
                "libmp3lame",
                "-qscale:a",
                "4",
                mp3,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for p in (w1, w2, ws, merged):
            os.unlink(p)
        print("OK", letter, "->", os.path.basename(mp3))


if __name__ == "__main__":
    main()
