# Kid Game — Project Rules for AI

## UI Theme

**Read `/THEME_RULES.md` before writing or editing any UI code.**
All screens, components, colors, shadows, and animations must follow the rules defined there.
The design token source of truth is `/theme.js` (`FARM` and `SHADOWS` exports).

## Project Structure

- `App.js` — home screen + routing only. Imports all game modules.
- `theme.js` — shared design tokens (`FARM`, `SHADOWS`). Import everywhere needed.
- `shared/constants.js` — all shared data constants (themes, sounds, levels, etc.)
- `shared/SoundManager.js` — `soundManager` singleton; export imported by App.js and LetterGame
- `shared/styles.js` — shared `sharedStyles` used across games
- `shared/components.js` — `Icon`, `AnimatedPressable`, `ConfettiParticle`, `RewardPopup`
- `games/` — one file per game; each has its own local `StyleSheet.create({})`
- `THEME_RULES.md` — mandatory UI rules for every AI working on this project.
- `assets/sounds/` — all audio files (background, SFX, animal sounds)
- `assets/ui/` — UI image assets (e.g. hand-pointer.png)

## Games

| Internal key | Vietnamese name | Component | File |
|---|---|---|---|
| `memory` | Tìm Cặp | `MemoryGame` | `games/MemoryGame.js` |
| `puzzle` | Đếm Hình | `PuzzleGame` | `games/PuzzleGame.js` |
| `garden` | Vườn Thu Hoạch | `GardenHarvestGame` | `games/GardenHarvestGame.js` |
| `letter` | Học Chữ Cái | `LetterGame` | `games/LetterGame.js` |
| `animal` | Nghe Tiếng Thú | `AnimalSoundGame` | `games/AnimalSoundGame.js` |

## Tech Stack

- React Native + Expo (managed workflow)
- `expo-linear-gradient` for gradients
- `expo-av` for audio
- `@expo-google-fonts/nunito` — Nunito_700Bold, 800ExtraBold, 900Black
- `@expo/vector-icons` Ionicons
- `react-native-gesture-handler` for drag interactions
- EAS for builds

## Code Rules

- Do not add new dependencies without asking the user.
- Game-specific styles go in each game's local `StyleSheet.create({})`. Shared styles go in `shared/styles.js`.
- Animation: always `useNativeDriver: true`. Buttons use `AnimatedPressable` (spring scale).
- Language: UI text is Vietnamese. Do not change display text to English.
