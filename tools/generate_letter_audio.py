#!/usr/bin/env python3
"""Bundled letter MP3s: Piper vi_VN-vais1000-medium (one synthesis per clip, sentence pause between parts)."""
import os
import subprocess
import tempfile

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

# Piper inserts this much silence after each sentence (between "Chữ X." and the example word).
SENTENCE_SILENCE_SEC = 0.48
LENGTH_SCALE = "1.06"


def run(cmd, **kwargs):
    subprocess.run(cmd, check=True, **kwargs)


def slug(letter: str) -> str:
    return f"u{ord(letter):04x}"


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for item in ALPHABET:
        letter = item["letter"]
        word = item["word"]
        line = f"Chữ {letter}. {word}."
        base = os.path.join(OUT_DIR, slug(letter))
        wav = base + ".wav"
        mp3 = base + ".mp3"

        with tempfile.NamedTemporaryFile("w", encoding="utf-8", delete=False, suffix=".txt") as f:
            f.write(line + "\n")
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
                    wav,
                    "--sentence-silence",
                    str(SENTENCE_SILENCE_SEC),
                    "--length-scale",
                    LENGTH_SCALE,
                ]
            )
        finally:
            os.unlink(txt_path)

        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                wav,
                "-codec:a",
                "libmp3lame",
                "-b:a",
                "112k",
                mp3,
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        os.unlink(wav)
        print("OK", letter, "->", os.path.basename(mp3))


if __name__ == "__main__":
    main()
